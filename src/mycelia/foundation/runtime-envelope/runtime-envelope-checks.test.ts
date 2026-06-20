import { describe, expect, it } from "vitest";

import {
  assertRuntimeEnvelopeUsable,
  ensureRuntimeEnvelopeAllowsProductionSideEffects,
  ensureRuntimeEnvelopeTenantMatchesScope,
  failClosedRuntimeEnvelope,
  isNonProductionRuntimeEnvelope,
  isProductionRuntimeEnvelope,
  isReplayRuntimeEnvelope,
  validateRuntimeEnvelope,
} from "./runtime-envelope-checks";
import { RuntimeEnvelopeSchema } from "./runtime-envelope";
import { validRuntimeEnvelope } from "./runtime-envelope.test";

describe("runtime envelope checks", () => {
  it("validates runtime envelopes", () => {
    const result = validateRuntimeEnvelope(validRuntimeEnvelope());

    expect(result.ok).toBe(true);
  });

  it("fails closed for missing envelope", () => {
    const result = assertRuntimeEnvelopeUsable(undefined);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RUNTIME_ENVELOPE_REQUIRED");
    }
  });

  it("fails closed for malformed envelope", () => {
    const result = assertRuntimeEnvelopeUsable({
      mode: "PRODUCTION",
      metadata: {
        label: "Acme Corporation",
      },
    });

    expect(result.ok).toBe(false);
  });

  it("reports missing tenant_id before unsafe adjacent data", () => {
    const result = validateRuntimeEnvelope(
      validRuntimeEnvelope({
        tenant_id: undefined,
        metadata: {
          source: "tenant-acme-prefix",
          note: "external-reference-only",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("detects production and replay runtime envelopes", () => {
    const replayEnvelope = validRuntimeEnvelope({
      mode: "REPLAY",
      is_replay: true,
      replay_suppression_active: true,
    });

    expect(isProductionRuntimeEnvelope(validRuntimeEnvelope())).toBe(true);
    expect(isReplayRuntimeEnvelope(replayEnvelope)).toBe(true);
    expect(isProductionRuntimeEnvelope(replayEnvelope)).toBe(false);
    expect(isNonProductionRuntimeEnvelope(replayEnvelope)).toBe(true);
  });

  it("treats evaluation, test, and investigation as non-production", () => {
    const evaluation = validRuntimeEnvelope({ mode: "EVALUATION" });
    const test = validRuntimeEnvelope({ mode: "TEST" });
    const investigation = validRuntimeEnvelope({
      mode: "INVESTIGATION",
      is_investigation: true,
    });

    expect(isProductionRuntimeEnvelope(evaluation)).toBe(false);
    expect(isProductionRuntimeEnvelope(test)).toBe(false);
    expect(isProductionRuntimeEnvelope(investigation)).toBe(false);
    expect(isNonProductionRuntimeEnvelope(evaluation)).toBe(true);
    expect(isNonProductionRuntimeEnvelope(test)).toBe(true);
    expect(isNonProductionRuntimeEnvelope(investigation)).toBe(true);
  });

  it("allows production side effects only for valid production envelopes", () => {
    const productionResult = ensureRuntimeEnvelopeAllowsProductionSideEffects(
      validRuntimeEnvelope(),
    );
    const replayResult = ensureRuntimeEnvelopeAllowsProductionSideEffects(
      validRuntimeEnvelope({
        mode: "REPLAY",
        is_replay: true,
        replay_suppression_active: true,
      }),
    );

    expect(productionResult.ok).toBe(true);
    expect(replayResult.ok).toBe(false);
    if (!replayResult.ok) {
      expect(replayResult.error.code).toBe(
        "PRODUCTION_SIDE_EFFECTS_NOT_ALLOWED",
      );
    }
  });

  it("ensures tenant and scope match", () => {
    const envelope = RuntimeEnvelopeSchema.parse(validRuntimeEnvelope());

    expect(ensureRuntimeEnvelopeTenantMatchesScope(envelope).ok).toBe(true);
  });

  it("creates safe fail-closed denial", () => {
    const denial = failClosedRuntimeEnvelope();

    expect(denial.code).toBe("RUNTIME_ENVELOPE_INVALID");
    expect(denial.safe).toBe(true);
  });
});
