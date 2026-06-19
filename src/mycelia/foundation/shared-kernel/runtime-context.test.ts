import { describe, expect, it } from "vitest";

import { OrganizationalRuntimeContextSchema } from "./runtime-context";

const validContext = {
  tenant_id: "tenant-01HZ000000000000000",
  runtime_identity_id: "runtime-identity-01HZ000000000000000",
  correlation_id: "corr-01HZ000000000000000",
  data_classification: "CONFIDENTIAL",
  purpose: "phase-1a-shared-kernel-test",
} as const;

function withoutContextKey<Key extends keyof typeof validContext>(key: Key) {
  const context: Partial<typeof validContext> = { ...validContext };
  delete context[key];
  return context;
}

describe("OrganizationalRuntimeContext", () => {
  it("accepts the minimal required tenant-bound context", () => {
    expect(OrganizationalRuntimeContextSchema.safeParse(validContext).success).toBe(
      true,
    );
  });

  it("requires tenant_id", () => {
    expect(
      OrganizationalRuntimeContextSchema.safeParse(
        withoutContextKey("tenant_id"),
      ).success,
    ).toBe(false);
  });

  it("requires runtime_identity_id", () => {
    expect(
      OrganizationalRuntimeContextSchema.safeParse(
        withoutContextKey("runtime_identity_id"),
      ).success,
    ).toBe(false);
  });

  it("requires correlation_id", () => {
    expect(
      OrganizationalRuntimeContextSchema.safeParse(
        withoutContextKey("correlation_id"),
      ).success,
    ).toBe(false);
  });

  it("allows actor_id to be omitted for service-triggered operations", () => {
    expect(OrganizationalRuntimeContextSchema.parse(validContext).actor_id).toBe(
      undefined,
    );
  });
});
