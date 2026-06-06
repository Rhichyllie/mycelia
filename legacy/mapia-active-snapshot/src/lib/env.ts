export type ServerEnv = {
  NODE_ENV: "development" | "test" | "production";
  DATABASE_URL?: string;
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET: string;
  AUTH_MODE?: "development" | "development_credentials" | "oidc";
  AUTH_OIDC_ISSUER_URL?: string;
  AUTH_OIDC_CLIENT_ID?: string;
  AUTH_OIDC_CLIENT_SECRET?: string;
  AUTH_OIDC_SCOPE: string;
  AUTH_OIDC_PROVIDER_NAME: string;
  DEV_LOGIN_EMAIL: string;
  DEV_LOGIN_PASSWORD: string;
  INTERNAL_OBSERVABILITY_ALLOWED_IDENTITIES: string;
  OTEL_RUNTIME_ENABLED?: string;
  OTEL_ENABLED?: string;
  OTEL_SERVICE_NAME?: string;
  OTEL_SERVICE_VERSION?: string;
  OTEL_DEPLOYMENT_ENVIRONMENT?: string;
  [key: string]: string | undefined;
};

function normalizeNodeEnv(value: string | undefined): ServerEnv["NODE_ENV"] {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

export function getServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  return {
    ...env,
    NODE_ENV: normalizeNodeEnv(env.NODE_ENV),
    DATABASE_URL: env.DATABASE_URL,
    NEXTAUTH_URL: env.NEXTAUTH_URL ?? "http://localhost:3000",
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET ?? "dev-only-nextauth-secret",
    AUTH_MODE: env.AUTH_MODE as ServerEnv["AUTH_MODE"],
    AUTH_OIDC_ISSUER_URL: env.AUTH_OIDC_ISSUER_URL,
    AUTH_OIDC_CLIENT_ID: env.AUTH_OIDC_CLIENT_ID,
    AUTH_OIDC_CLIENT_SECRET: env.AUTH_OIDC_CLIENT_SECRET,
    AUTH_OIDC_SCOPE: env.AUTH_OIDC_SCOPE ?? "openid email profile",
    AUTH_OIDC_PROVIDER_NAME: env.AUTH_OIDC_PROVIDER_NAME ?? "OIDC",
    DEV_LOGIN_EMAIL: env.DEV_LOGIN_EMAIL ?? "admin@mycelia.local",
    DEV_LOGIN_PASSWORD: env.DEV_LOGIN_PASSWORD ?? "admin",
    INTERNAL_OBSERVABILITY_ALLOWED_IDENTITIES:
      env.INTERNAL_OBSERVABILITY_ALLOWED_IDENTITIES ?? "",
  };
}
