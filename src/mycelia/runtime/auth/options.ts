import type { Account, NextAuthOptions, Profile, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { OAuthConfig } from "next-auth/providers/oauth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { AppError } from "../../lib/app-error";

import { getServerEnv } from "./env";
import {
  buildOidcDiscoveryUrl,
  resolveAuthRuntimeConfig,
} from "./auth-runtime";
import { syncAuthenticatedActor } from "./auth-user-store";
import { toAuthCallbackError } from "./auth-callback-error";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const emailClaimSchema = z.string().email();
const userIdClaimSchema = z.string().uuid();
const authModeClaimSchema = z.enum(["development_credentials", "oidc"]);

type OidcProfile = Profile & {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  preferred_username?: string;
  picture?: string;
};

type AuthModeClaim = z.infer<typeof authModeClaimSchema>;

type UserWithAuthClaims = User & {
  authProvider?: string;
  authMode?: AuthModeClaim;
};

type SessionUserWithAuthClaims = NonNullable<Session["user"]> & {
  id?: string;
  authProvider?: string;
  authMode?: AuthModeClaim;
};

type JwtWithAuthClaims = JWT & {
  authProvider?: unknown;
  authMode?: unknown;
  myceliaSessionInvalid?: true;
  myceliaSessionErrorCode?: string;
};

type MyceliaInvalidJwt = JWT & {
  myceliaSessionInvalid: true;
  myceliaSessionErrorCode: string;
};

function normalizeEmailClaim(input?: string | null) {
  const normalized = input?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return emailClaimSchema.safeParse(normalized).success ? normalized : null;
}

function resolveOidcEmail(profile?: Profile, fallbackEmail?: string | null) {
  const oidcProfile = profile as OidcProfile | undefined;
  return (
    normalizeEmailClaim(oidcProfile?.email) ??
    normalizeEmailClaim(oidcProfile?.preferred_username) ??
    normalizeEmailClaim(fallbackEmail)
  );
}

function buildDevCredentialsProvider() {
  const env = getServerEnv();

  return CredentialsProvider({
    id: "credentials",
    name: "Development Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(rawCredentials) {
      const parsedCredentials = credentialsSchema.safeParse(rawCredentials);

      if (!parsedCredentials.success) {
        return null;
      }

      const { email, password } = parsedCredentials.data;
      const normalizedEmail = email.trim().toLowerCase();

      if (
        normalizedEmail !== env.DEV_LOGIN_EMAIL.trim().toLowerCase() ||
        password !== env.DEV_LOGIN_PASSWORD
      ) {
        return null;
      }

      return {
        id: normalizedEmail,
        email: normalizedEmail,
        name: "MYCELIA Development Admin",
      };
    },
  });
}

function buildOidcProvider(): OAuthConfig<OidcProfile> {
  const env = getServerEnv();
  const issuerUrl = env.AUTH_OIDC_ISSUER_URL;

  if (!issuerUrl) {
    throw new AppError("AUTH_OIDC_ISSUER_URL ausente para provider OIDC.", {
      code: "AUTH_CONFIGURATION_INVALID",
      status: 503,
    });
  }

  return {
    id: "oidc",
    name: env.AUTH_OIDC_PROVIDER_NAME,
    type: "oauth",
    wellKnown: buildOidcDiscoveryUrl(issuerUrl),
    authorization: {
      params: {
        scope: env.AUTH_OIDC_SCOPE,
      },
    },
    clientId: env.AUTH_OIDC_CLIENT_ID ?? "",
    clientSecret: env.AUTH_OIDC_CLIENT_SECRET ?? "",
    idToken: true,
    checks: ["pkce", "state", "nonce"],
    profile(profile: OidcProfile) {
      const normalizedEmail = resolveOidcEmail(profile);
      const subject = profile.sub?.trim();

      return {
        id: subject ?? normalizedEmail ?? "oidc-unresolved-subject",
        email: normalizedEmail,
        name:
          profile.name ??
          profile.preferred_username ??
          normalizedEmail ??
          subject ??
          "MYCELIA User",
        image: profile.picture,
      };
    },
  };
}

function resolveProviderType(account: Account) {
  if (account.provider === "credentials" || account.type === "credentials") {
    return "development_credentials" as const;
  }

  if (account.provider === "oidc") {
    return "oidc" as const;
  }

  return null;
}

function resolveProviderSubject(input: {
  account: Account;
  providerType: "development_credentials" | "oidc";
  profile?: Profile;
  email?: string | null;
}) {
  if (input.account.providerAccountId?.trim()) {
    return input.account.providerAccountId.trim();
  }

  if (input.providerType === "oidc") {
    const oidcProfile = input.profile as OidcProfile | undefined;
    if (oidcProfile?.sub?.trim()) {
      return oidcProfile.sub.trim();
    }

    return null;
  }

  return input.email?.trim() ?? null;
}

function isExplicitlyUnverifiedOidcEmail(profile?: Profile) {
  const oidcProfile = profile as OidcProfile | undefined;
  return oidcProfile?.email_verified === false;
}

function buildProviderList(
  runtime: ReturnType<typeof resolveAuthRuntimeConfig>,
) {
  if (runtime.mode === "development_credentials") {
    return [buildDevCredentialsProvider()];
  }

  if (runtime.mode === "oidc") {
    return [buildOidcProvider()];
  }

  return [];
}

function buildInvalidJwtToken(errorCode: string): MyceliaInvalidJwt {
  return {
    myceliaSessionInvalid: true,
    myceliaSessionErrorCode: errorCode,
  };
}

function isInvalidJwtToken(token: JWT): token is MyceliaInvalidJwt {
  return (token as JwtWithAuthClaims).myceliaSessionInvalid === true;
}

export function getAuthOptions(): NextAuthOptions {
  const env = getServerEnv();
  const runtime = resolveAuthRuntimeConfig(env);

  return {
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
    providers: buildProviderList(runtime),
    callbacks: {
      async signIn({ user, account, profile }) {
        if (!account || runtime.mode === "misconfigured") {
          return false;
        }

        const providerType = resolveProviderType(account);

        if (!providerType) {
          return false;
        }

        if (
          (runtime.mode === "oidc" && providerType !== "oidc") ||
          (runtime.mode === "development_credentials" &&
            providerType !== "development_credentials")
        ) {
          return false;
        }

        const normalizedEmail =
          providerType === "oidc"
            ? resolveOidcEmail(profile, user.email)
            : normalizeEmailClaim(user.email);

        if (!normalizedEmail) {
          return false;
        }

        if (
          providerType === "oidc" &&
          isExplicitlyUnverifiedOidcEmail(profile)
        ) {
          return false;
        }

        const subject = resolveProviderSubject({
          account,
          providerType,
          profile,
          email: normalizedEmail,
        });

        if (!subject) {
          return false;
        }

        let actor;

        try {
          actor = await syncAuthenticatedActor({
            providerId: account.provider,
            providerType,
            subject,
            email: normalizedEmail,
            displayName: user.name,
            authMode: runtime.mode,
          });
        } catch (error) {
          throw toAuthCallbackError(error);
        }

        const mutableUser = user as UserWithAuthClaims;
        mutableUser.id = actor.userId;
        mutableUser.email = actor.email;
        mutableUser.name = actor.displayName ?? user.name;
        mutableUser.authProvider = actor.providerId;
        mutableUser.authMode = actor.authMode;

        return true;
      },
      async jwt({ token, user }) {
        const mutableToken = token as JwtWithAuthClaims;

        if (user) {
          const claimedUser = user as UserWithAuthClaims;
          const userId = userIdClaimSchema.safeParse(claimedUser.id?.trim());
          const email = normalizeEmailClaim(claimedUser.email);
          const authProvider = claimedUser.authProvider?.trim();
          const authMode = authModeClaimSchema.safeParse(claimedUser.authMode);

          if (!userId.success || !email || !authProvider || !authMode.success) {
            throw new AppError(
              "Fluxo de autenticacao produziu claims de JWT incompletas.",
              {
                code: "AUTH_JWT_CLAIMS_MISSING",
                status: 401,
              },
            );
          }

          mutableToken.sub = userId.data;
          mutableToken.email = email;
          mutableToken.name = claimedUser.name;
          mutableToken.authProvider = authProvider;
          mutableToken.authMode = authMode.data;
          delete mutableToken.myceliaSessionInvalid;
          delete mutableToken.myceliaSessionErrorCode;
          return token;
        }

        const persistedUserId = userIdClaimSchema.safeParse(
          typeof token.sub === "string" ? token.sub.trim() : undefined,
        );
        const persistedEmail = normalizeEmailClaim(
          typeof token.email === "string" ? token.email : null,
        );
        const persistedAuthProvider =
          typeof mutableToken.authProvider === "string"
            ? mutableToken.authProvider.trim()
            : "";
        const persistedAuthMode = authModeClaimSchema.safeParse(
          mutableToken.authMode,
        );

        if (
          !persistedUserId.success ||
          !persistedEmail ||
          !persistedAuthProvider ||
          !persistedAuthMode.success
        ) {
          return buildInvalidJwtToken("AUTH_JWT_CLAIMS_MISSING");
        }

        return token;
      },
      async session({ session, token }) {
        const mutableToken = token as JwtWithAuthClaims;

        if (isInvalidJwtToken(token)) {
          return {} as never;
        }

        if (session.user) {
          const mutableSessionUser = session.user as SessionUserWithAuthClaims;
          const userId = userIdClaimSchema.safeParse(
            typeof token.sub === "string" ? token.sub.trim() : undefined,
          );
          const email = normalizeEmailClaim(
            typeof token.email === "string" ? token.email : null,
          );
          const authProvider =
            typeof mutableToken.authProvider === "string"
              ? mutableToken.authProvider.trim()
              : "";
          const authMode = authModeClaimSchema.safeParse(mutableToken.authMode);

          if (!userId.success || !email || !authProvider || !authMode.success) {
            return {} as never;
          }

          mutableSessionUser.id = userId.data;
          mutableSessionUser.email = email;
          mutableSessionUser.name =
            typeof token.name === "string" ? token.name : session.user.name;
          mutableSessionUser.authProvider = authProvider;
          mutableSessionUser.authMode = authMode.data;
        }

        return session;
      },
    },
    secret: env.NEXTAUTH_SECRET,
  };
}

