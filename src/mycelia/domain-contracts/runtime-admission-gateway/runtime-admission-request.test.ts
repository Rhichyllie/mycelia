import { describe, expect, it } from "vitest";

import {
  validateRuntimeAdmissionRequest,
} from "./runtime-admission-checks";
import type { RuntimeAdmissionRequestInput } from "./runtime-admission-request";

export function validRuntimeEnvelope() {
  return {
    envelope_id: "runtime_envelope_001",
    tenant_id: "tenant_001",
    scope: {
      tenant_id: "tenant_001",
      workspace_id: "workspace_001",
      project_id: "project_001",
    },
    request_id: "request_001",
    runtime_identity: {
      runtime_identity_id: "runtime_identity_001",
      actor_id: "actor_001",
      tenant_id: "tenant_001",
      workspace_id: "workspace_001",
      project_id: "project_001",
    },
    actor: {
      actor_id: "actor_001",
      tenant_id: "tenant_001",
      workspace_id: "workspace_001",
      project_id: "project_001",
    },
    actor_id: "actor_001",
    policy_context: {
      decision_request_id: "policy_decision_request_001",
      policy_decision_id: "policy_decision_001",
      policy_basis_ref: "policy_basis_001",
    },
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    declared_purpose: "run admission validation",
    data_classification: "INTERNAL",
    mode: "PRODUCTION",
    created_at: "2026-06-01T00:00:00.000Z",
    metadata: {
      channel: "phase1g",
    },
  } as const;
}

export function validPolicyDecision(outcome = "ALLOW") {
  return {
    decision_id: "policy_decision_001",
    decision_request_id: "policy_decision_request_001",
    tenant_id: "tenant_001",
    outcome,
    obligations: [
      {
        obligation_type: "EMIT_AUDIT",
        severity: "REQUIRED",
        reason_code: "AUDIT_REQUIRED",
      },
    ],
    policy_basis_ref: "policy_basis_001",
    decided_at: "2026-06-01T00:00:01.000Z",
    reason_code: "POLICY_ALLOWED",
    message: "The operation is allowed.",
  } as const;
}

export function validAdmissionRequest(
  overrides: Partial<RuntimeAdmissionRequestInput> = {},
): RuntimeAdmissionRequestInput {
  return {
    admission_request_id: "runtime_admission_request_001",
    tenant_id: "tenant_001",
    runtime_envelope: validRuntimeEnvelope(),
    request_id: "request_001",
    runtime_identity_id: "runtime_identity_001",
    policy_decision_id: "policy_decision_001",
    policy_decision: validPolicyDecision(),
    declared_purpose: "run admission validation",
    data_classification: "INTERNAL",
    created_at: "2026-06-01T00:00:02.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    metadata: {
      reason: "baseline",
    },
    ...overrides,
  };
}

describe("RuntimeAdmissionRequest", () => {
  it("accepts a valid admission request", () => {
    const result = validateRuntimeAdmissionRequest(validAdmissionRequest());

    expect(result.ok).toBe(true);
  });

  it("rejects missing tenant_id", () => {
    const request = validAdmissionRequest({
      tenant_id: undefined,
      metadata: {
        display_hint: "alice@example.com",
      },
    });

    const result = validateRuntimeAdmissionRequest(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects an invalid runtime envelope", () => {
    const request = validAdmissionRequest() as Record<string, unknown>;
    const runtimeEnvelope = {
      ...validRuntimeEnvelope(),
    } as Record<string, unknown>;
    delete runtimeEnvelope.envelope_id;
    request.runtime_envelope = runtimeEnvelope;

    const result = validateRuntimeAdmissionRequest(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_RUNTIME_ENVELOPE");
    }
  });

  it("rejects admission tenant mismatch with envelope", () => {
    const result = validateRuntimeAdmissionRequest(
      validAdmissionRequest({
        tenant_id: "tenant_002",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RUNTIME_ADMISSION_TENANT_MISMATCH");
    }
  });

  it("rejects runtime identity scope mismatch inside the envelope", () => {
    const result = validateRuntimeAdmissionRequest(
      validAdmissionRequest({
        runtime_envelope: {
          ...validRuntimeEnvelope(),
          runtime_identity: {
            ...validRuntimeEnvelope().runtime_identity,
            workspace_id: "workspace_002",
          },
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_RUNTIME_ENVELOPE");
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateRuntimeAdmissionRequest(
      validAdmissionRequest({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_RUNTIME_ADMISSION_METADATA");
    }
  });
});
