import { describe, expect, it } from "vitest";

import type { ServerEnv } from "./env";
import {
  assertAuthRuntimeReady,
  resolveAuthRuntimeConfig,
} from "./auth-runtime";

function buildEnv(overrides: Partial<ServerEnv> = {}): ServerEnv {
  return {
    NODE_ENV: "test",
    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "dev-only-nextauth-secret",
    AUTH_MODE: "development",
    AUTH_OIDC_ISSUER_URL: undefined,
    AUTH_OIDC_CLIENT_ID: undefined,
    AUTH_OIDC_CLIENT_SECRET: undefined,
    AUTH_OIDC_PROVIDER_NAME: "Single Sign-On",
    AUTH_OIDC_SCOPE: "openid profile email",
    DEV_LOGIN_EMAIL: "admin@mycelia.local",
    DEV_LOGIN_PASSWORD: "admin",
    ...overrides,
  };
}

describe("auth runtime", () => {
  it("keeps development credentials available outside production by default", () => {
    const runtime = resolveAuthRuntimeConfig(buildEnv());

    expect(runtime).toMatchObject({
      mode: "development_credentials",
      providerId: "credentials",
      productionCapable: false,
    });
  });

  it("fails closed in production when no OIDC environment is configured", () => {
    const runtime = resolveAuthRuntimeConfig(
      buildEnv({
        NODE_ENV: "production",
        AUTH_MODE: undefined,
      }),
    );

    expect(runtime).toMatchObject({
      mode: "misconfigured",
      providerId: null,
      reason: "oidc_env_missing",
    });
  });

  it("resolves oidc mode when production env is complete", () => {
    const runtime = resolveAuthRuntimeConfig(
      buildEnv({
        NODE_ENV: "production",
        AUTH_MODE: "oidc",
        NEXTAUTH_URL: "https://mycelia.example.com",
        NEXTAUTH_SECRET: "production-secret-not-default",
        AUTH_OIDC_ISSUER_URL: "https://idp.example.com",
        AUTH_OIDC_CLIENT_ID: "mycelia-web",
        AUTH_OIDC_CLIENT_SECRET: "super-secret",
        AUTH_OIDC_PROVIDER_NAME: "Example Identity",
      }),
    );

    expect(runtime).toMatchObject({
      mode: "oidc",
      providerId: "oidc",
      productionCapable: true,
      providerName: "Example Identity",
    });
  });

  it("fails closed in production when oidc is requested but env is incomplete", () => {
    const runtime = resolveAuthRuntimeConfig(
      buildEnv({
        NODE_ENV: "production",
        AUTH_MODE: "oidc",
        NEXTAUTH_URL: "https://mycelia.example.com",
        NEXTAUTH_SECRET: "production-secret-not-default",
        AUTH_OIDC_ISSUER_URL: "https://idp.example.com",
        AUTH_OIDC_CLIENT_ID: "mycelia-web",
        AUTH_OIDC_CLIENT_SECRET: undefined,
      }),
    );

    expect(runtime).toMatchObject({
      mode: "misconfigured",
      providerId: null,
      reason: "oidc_env_missing",
    });
    expect(runtime.requiredEnv).toContain("AUTH_OIDC_CLIENT_SECRET");
  });

  it("rejects development auth explicitly in production", () => {
    try {
      assertAuthRuntimeReady(
        buildEnv({
          NODE_ENV: "production",
          AUTH_MODE: "development",
        }),
      );
      throw new Error("Expected assertAuthRuntimeReady to throw.");
    } catch (error) {
      expect(error).toMatchObject({
        code: "AUTH_CONFIGURATION_INVALID",
        message: "Autenticacao de producao mal configurada para este ambiente.",
        status: 503,
      });
    }
  });
});
