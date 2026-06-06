import { describe, expect, it } from "vitest";

import { CorrelationIdSchema, RequestIdSchema } from "../shared-kernel";

import { createIdentityDenial } from "./identity-denial";

describe("identity denial", () => {
  it("does not reveal tenant IDs, workspace IDs, project IDs, emails, names, or raw metadata", () => {
    const denial = createIdentityDenial({
      code: "INVALID_REQUEST_ENVELOPE",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant-01HZ000000000000000");
    expect(serialized).not.toContain("workspace-01HZ000000000000000");
    expect(serialized).not.toContain("project-01HZ000000000000000");
    expect(serialized).not.toContain("operator@example.com");
    expect(serialized).not.toContain("Acme");
    expect(serialized).not.toContain("raw metadata");
  });

  it("may include safe correlation_id and request_id", () => {
    const correlationId = CorrelationIdSchema.parse(
      "corr-01HZ000000000000000",
    );
    const requestId = RequestIdSchema.parse("request-01HZ000000000000000");
    const denial = createIdentityDenial({
      code: "ACTOR_ID_REQUIRED",
      correlation_id: correlationId,
      request_id: requestId,
    });

    expect(denial.correlation_id).toBe(correlationId);
    expect(denial.request_id).toBe(requestId);
    expect(JSON.stringify(denial)).not.toContain("password");
  });
});
