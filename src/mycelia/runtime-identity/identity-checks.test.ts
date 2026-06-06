import { describe, expect, it } from "vitest";

import { isErr, isOk } from "../shared-kernel";

import {
  hasHumanActor,
  isProductionLikeOrigin,
  isReplayOrigin,
  isTestRunOrigin,
  requireHumanActor,
  requireRuntimeIdentity,
  requireTenantIdentity,
  validateRequestEnvelope,
} from "./identity-checks";
import { RequestEnvelopeSchema } from "./request-envelope";

const validEnvelope = {
  request_id: "request-01HZ000000000000000",
  tenant_id: "tenant-01HZ000000000000000",
  actor_id: "actor-01HZ000000000000000",
  runtime_identity_id: "runtime-identity-01HZ000000000000000",
  correlation_id: "corr-01HZ000000000000000",
  origin: "HUMAN_UI",
  purpose: "phase-1c-identity-checks-test",
  data_classification: "INTERNAL",
  received_at: "2026-06-06T14:30:00.000Z",
} as const;

describe("identity checks", () => {
  it("requireHumanActor fails closed when actor_id is missing", () => {
    const result = requireHumanActor({
      runtime_identity_id: "runtime-identity-01HZ000000000000000" as never,
      tenant_id: "tenant-01HZ000000000000000" as never,
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("ACTOR_ID_REQUIRED");
    }
  });

  it("requireRuntimeIdentity fails closed when runtime_identity_id is missing", () => {
    const result = requireRuntimeIdentity({
      actor_id: "actor-01HZ000000000000000" as never,
      tenant_id: "tenant-01HZ000000000000000" as never,
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("RUNTIME_IDENTITY_REQUIRED");
    }
  });

  it("requires tenant identity without inferring from adjacent strings", () => {
    const result = requireTenantIdentity({
      metadata: {
        email: "tenant@example.com",
        domain: "example.com",
        prefix: "tenant-",
      },
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("detects human actor presence only from actor_id", () => {
    const parsedEnvelope = RequestEnvelopeSchema.parse(validEnvelope);

    expect(hasHumanActor(parsedEnvelope)).toBe(true);
    expect(
      hasHumanActor({
        ...parsedEnvelope,
        actor_id: undefined,
        metadata: { email: "actor@example.com" },
      }),
    ).toBe(false);
  });

  it("isReplayOrigin returns true only for REPLAY", () => {
    expect(isReplayOrigin({ origin: "REPLAY" })).toBe(true);
    expect(isReplayOrigin({ origin: "TEST_RUN" })).toBe(false);
    expect(isReplayOrigin({ origin: "HUMAN_UI" })).toBe(false);
  });

  it("isTestRunOrigin returns true only for TEST_RUN", () => {
    expect(isTestRunOrigin({ origin: "TEST_RUN" })).toBe(true);
    expect(isTestRunOrigin({ origin: "REPLAY" })).toBe(false);
    expect(isTestRunOrigin({ origin: "HUMAN_UI" })).toBe(false);
  });

  it("isProductionLikeOrigin returns false for REPLAY and TEST_RUN", () => {
    expect(isProductionLikeOrigin({ origin: "REPLAY" })).toBe(false);
    expect(isProductionLikeOrigin({ origin: "TEST_RUN" })).toBe(false);
    expect(isProductionLikeOrigin({ origin: "HUMAN_UI" })).toBe(true);
    expect(isProductionLikeOrigin({ origin: "WEBHOOK" })).toBe(true);
  });

  it("does not infer identity from email, domain, or prefix-like strings", () => {
    const result = validateRequestEnvelope({
      ...validEnvelope,
      tenant_id: undefined,
      actor_id: undefined,
      metadata: {
        source: "example.com",
        note: "tenant prefix only",
      },
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("valid request envelope returns a parsed envelope", () => {
    const result = validateRequestEnvelope(validEnvelope);

    expect(isOk(result)).toBe(true);
  });
});
