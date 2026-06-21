export type ServerEnv = {
  NODE_ENV: "development" | "test" | "production";
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  AUTH_MODE?: "development" | "development_credentials" | "oidc";
  AUTH_OIDC_ISSUER_URL?: string;
  AUTH_OIDC_CLIENT_ID?: string;
  AUTH_OIDC_CLIENT_SECRET?: string;
  AUTH_OIDC_SCOPE: string;
  AUTH_OIDC_PROVIDER_NAME: string;
  DEV_LOGIN_EMAIL: string;
  DEV_LOGIN_PASSWORD: string;
};

function normalizeNodeEnv(value: string | undefined): ServerEnv["NODE_ENV"] {
  if (value === "production" || value === "test") {
    return value;
  }

  return "development";
}

function textEnv(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: string,
): string {
  const value = env[name]?.trim();

  return value === undefined || value.length === 0 ? fallback : value;
}

function optionalTextEnv(
  env: NodeJS.ProcessEnv,
  name: string,
): string | undefined {
  const value = env[name]?.trim();

  return value === undefined || value.length === 0 ? undefined : value;
}

function authModeEnv(
  env: NodeJS.ProcessEnv,
): ServerEnv["AUTH_MODE"] {
  const value = optionalTextEnv(env, "AUTH_MODE");

  if (
    value === "development" ||
    value === "development_credentials" ||
    value === "oidc"
  ) {
    return value;
  }

  return undefined;
}

export function getServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  return {
    NODE_ENV: normalizeNodeEnv(env.NODE_ENV),
    NEXTAUTH_URL: textEnv(env, "NEXTAUTH_URL", "http://localhost:3000"),
    NEXTAUTH_SECRET: textEnv(
      env,
      "NEXTAUTH_SECRET",
      "dev-only-nextauth-secret",
    ),
    AUTH_MODE: authModeEnv(env),
    AUTH_OIDC_ISSUER_URL: optionalTextEnv(env, "AUTH_OIDC_ISSUER_URL"),
    AUTH_OIDC_CLIENT_ID: optionalTextEnv(env, "AUTH_OIDC_CLIENT_ID"),
    AUTH_OIDC_CLIENT_SECRET: optionalTextEnv(env, "AUTH_OIDC_CLIENT_SECRET"),
    AUTH_OIDC_SCOPE: textEnv(env, "AUTH_OIDC_SCOPE", "openid email profile"),
    AUTH_OIDC_PROVIDER_NAME: textEnv(env, "AUTH_OIDC_PROVIDER_NAME", "OIDC"),
    DEV_LOGIN_EMAIL: textEnv(env, "DEV_LOGIN_EMAIL", "admin@mycelia.local"),
    DEV_LOGIN_PASSWORD: textEnv(env, "DEV_LOGIN_PASSWORD", "admin"),
  };
}
