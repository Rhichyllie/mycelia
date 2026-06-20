import { describe, expect, it } from "vitest";

import {
  HumanActorIdentitySchema,
  RuntimeExecutionIdentitySchema,
  ServiceActorIdentitySchema,
} from "./runtime-identity";

describe("runtime identity schemas", () => {
  it("RuntimeExecutionIdentity requires runtime_identity_id", () => {
    expect(
      RuntimeExecutionIdentitySchema.safeParse({
        tenant_id: "tenant-01HZ000000000000000",
      }).success,
    ).toBe(false);
  });

  it("HumanActorIdentity requires actor_id", () => {
    expect(
      HumanActorIdentitySchema.safeParse({
        tenant_id: "tenant-01HZ000000000000000",
      }).success,
    ).toBe(false);
  });

  it("service-triggered identity may omit actor_id", () => {
    expect(
      ServiceActorIdentitySchema.safeParse({
        runtime_identity_id: "runtime-identity-01HZ000000000000000",
        tenant_id: "tenant-01HZ000000000000000",
      }).success,
    ).toBe(true);

    expect(
      RuntimeExecutionIdentitySchema.safeParse({
        runtime_identity_id: "runtime-identity-01HZ000000000000000",
        tenant_id: "tenant-01HZ000000000000000",
      }).success,
    ).toBe(true);
  });

  it("rejects project scope without workspace scope", () => {
    expect(
      RuntimeExecutionIdentitySchema.safeParse({
        runtime_identity_id: "runtime-identity-01HZ000000000000000",
        tenant_id: "tenant-01HZ000000000000000",
        project_id: "project-01HZ000000000000000",
      }).success,
    ).toBe(false);
  });

  it("rejects human-readable identity fields", () => {
    expect(
      HumanActorIdentitySchema.safeParse({
        actor_id: "actor-01HZ000000000000000",
        tenant_id: "tenant-01HZ000000000000000",
        email: "operator@example.com",
      }).success,
    ).toBe(false);
  });
});
