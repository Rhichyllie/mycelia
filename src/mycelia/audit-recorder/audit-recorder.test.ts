import { describe, expect, it } from "vitest";

import {
  assertAuditRecordingRecorded,
  createAuditRecorderDenial,
  isAuditRecordingRecorded,
  isAuditRecordingRejected,
  recordAuditDescriptor,
  validateAuditRecordingRequest,
} from ".";
import type { AuditRecordingRequestInput } from "./audit-recording-request";

function validActorRef() {
  return {
    actor_type: "RUNTIME_ACTOR",
    actor_ref_id: "runtime_actor_ref_001",
    tenant_id: "tenant_001",
    actor_id: "actor_001",
    runtime_identity_id: "runtime_identity_001",
    correlation_id: "correlation_001",
    metadata: {
      source: "runtime",
    },
  } as const;
}

function validSubjectRef(
  subject_type:
    | "POLICY_DECISION"
    | "STATE_TRANSITION_COORDINATION" = "POLICY_DECISION",
  tenant_id = "tenant_001",
) {
  return {
    subject_type,
    subject_ref_id:
      subject_type === "POLICY_DECISION"
        ? "policy_decision_ref_001"
        : "state_transition_coordination_ref_001",
    tenant_id,
    workspace_id: "workspace_001",
    project_id: "project_001",
    run_id: "run_001",
    request_id: "request_001",
    event_id: "event_001",
    correlation_id: "correlation_001",
    metadata: {
      source: "descriptor",
    },
  } as const;
}

function validEvidenceRef(
  evidence_kind:
    | "DECISION_RESULT"
    | "COORDINATION_RESULT" = "DECISION_RESULT",
  tenant_id = "tenant_001",
) {
  return {
    evidence_ref_id:
      evidence_kind === "DECISION_RESULT"
        ? "policy_decision_evidence_ref_001"
        : "coordination_evidence_ref_001",
    tenant_id,
    evidence_kind,
    created_at: "2026-06-01T00:00:01.000Z",
    data_classification: "INTERNAL",
    correlation_id: "correlation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
  } as const;
}

function validAuditRecordingRequest(
  overrides: Partial<AuditRecordingRequestInput> = {},
): AuditRecordingRequestInput {
  return {
    audit_recording_request_id: "audit_recording_request_001",
    tenant_id: "tenant_001",
    kind: "POLICY_DECISION",
    actor_ref: validActorRef(),
    subject_ref: validSubjectRef(),
    evidence_ref: validEvidenceRef(),
    outcome: "RECORDED",
    reason_code: "AUDIT_RECORDING_REQUESTED",
    message: "The audit descriptor is requested.",
    data_classification: "INTERNAL",
    requested_at: "2026-06-01T00:00:02.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      phase: "one_m",
    },
    ...overrides,
  };
}

describe("AuditRecorder", () => {
  it("records a valid POLICY_DECISION audit descriptor", () => {
    const result = recordAuditDescriptor(validAuditRecordingRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("RECORDED");
      expect(result.value.audit_record?.kind).toBe("POLICY_DECISION");
      expect(result.value.audit_record?.tenant_id).toBe("tenant_001");
      expect(isAuditRecordingRecorded(result.value)).toBe(true);
      expect(assertAuditRecordingRecorded(result.value).ok).toBe(true);
    }
  });

  it("records a valid STATE_TRANSITION_COORDINATION audit descriptor", () => {
    const result = recordAuditDescriptor(
      validAuditRecordingRequest({
        audit_recording_request_id:
          "audit_recording_request_coordination_001",
        kind: "STATE_TRANSITION_COORDINATION",
        subject_ref: validSubjectRef("STATE_TRANSITION_COORDINATION"),
        evidence_ref: validEvidenceRef("COORDINATION_RESULT"),
        reason_code: "COORDINATION_AUDIT_REQUESTED",
        message: "The coordination descriptor is requested.",
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("RECORDED");
      expect(result.value.audit_record?.kind).toBe(
        "STATE_TRANSITION_COORDINATION",
      );
    }
  });

  it("rejects missing tenant_id", () => {
    const request = validAuditRecordingRequest() as Record<string, unknown>;
    delete request.tenant_id;
    request.metadata = {
      display: "alice@example.com",
    };

    const result = validateAuditRecordingRequest(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects invalid kind", () => {
    const result = validateAuditRecordingRequest({
      ...validAuditRecordingRequest(),
      kind: "NOT_A_KIND",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_RECORD_KIND_INVALID");
    }
  });

  it("rejects invalid actor_ref", () => {
    const result = validateAuditRecordingRequest({
      ...validAuditRecordingRequest(),
      actor_ref: {
        actor_type: "HUMAN_ACTOR",
        actor_ref_id: "alice@example.com",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_ACTOR_REF_INVALID");
    }
  });

  it("rejects invalid subject_ref", () => {
    const result = validateAuditRecordingRequest({
      ...validAuditRecordingRequest(),
      subject_ref: {
        subject_type: "REQUEST",
        subject_ref_id: "https://example.test/request",
        tenant_id: "tenant_001",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_SUBJECT_REF_INVALID");
    }
  });

  it("rejects invalid evidence_ref", () => {
    const result = validateAuditRecordingRequest({
      ...validAuditRecordingRequest(),
      evidence_ref: {
        evidence_ref_id: "evidence_ref_001",
        tenant_id: "tenant_001",
        evidence_kind: "SEALED_EVIDENCE",
        created_at: "2026-06-01T00:00:01.000Z",
        data_classification: "INTERNAL",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_EVIDENCE_REF_INVALID");
    }
  });

  it("rejects subject_ref tenant mismatch", () => {
    const result = validateAuditRecordingRequest(
      validAuditRecordingRequest({
        subject_ref: validSubjectRef("POLICY_DECISION", "tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_RECORDING_TENANT_MISMATCH");
    }
  });

  it("rejects evidence_ref tenant mismatch", () => {
    const result = validateAuditRecordingRequest(
      validAuditRecordingRequest({
        evidence_ref: validEvidenceRef("DECISION_RESULT", "tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_RECORDING_TENANT_MISMATCH");
    }
  });

  it("rejects invalid requested_at", () => {
    const result = validateAuditRecordingRequest(
      validAuditRecordingRequest({
        requested_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_AUDIT_RECORDING_TIMESTAMP");
    }
  });

  it("rejects unsafe reason_code", () => {
    const result = validateAuditRecordingRequest(
      validAuditRecordingRequest({
        reason_code: "unsafe reason",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_AUDIT_REASON_CODE");
    }
  });

  it("rejects unsafe message", () => {
    const result = validateAuditRecordingRequest(
      validAuditRecordingRequest({
        message: "The audit includes tenant_name and secret details.",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_AUDIT_MESSAGE");
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateAuditRecordingRequest(
      validAuditRecordingRequest({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_AUDIT_METADATA");
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const request = validAuditRecordingRequest() as Record<string, unknown>;
    delete request.tenant_id;
    request.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateAuditRecordingRequest(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("does not imply persistence, event emission, sealing, signing, or hash chaining", () => {
    const result = recordAuditDescriptor(validAuditRecordingRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("RECORDED");
      expect(result.value.audit_record).toBeDefined();
      expect(result.value).not.toHaveProperty("persisted_at");
      expect(result.value).not.toHaveProperty("emitted_event_id");
      expect(result.value).not.toHaveProperty("sealed_at");
      expect(result.value).not.toHaveProperty("signature");
      expect(result.value).not.toHaveProperty("hash_chain");
      expect(result.value.audit_record).not.toHaveProperty("persisted_at");
      expect(result.value.audit_record).not.toHaveProperty("emitted_event_id");
      expect(result.value.audit_record).not.toHaveProperty("sealed_at");
      expect(result.value.audit_record).not.toHaveProperty("signature");
      expect(result.value.audit_record).not.toHaveProperty("hash_chain");
    }
  });

  it("fails closed for malformed or missing requests", () => {
    const missing = recordAuditDescriptor(undefined);
    const malformed = recordAuditDescriptor({
      audit_recording_request_id: "audit_recording_request_001",
    });

    expect(missing.ok).toBe(true);
    if (missing.ok) {
      expect(missing.value.outcome).toBe("REJECTED");
      expect(missing.value.audit_record).toBeUndefined();
      expect(isAuditRecordingRejected(missing.value)).toBe(true);
    }

    expect(malformed.ok).toBe(true);
    if (malformed.ok) {
      expect(malformed.value.outcome).toBe("REJECTED");
    }
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createAuditRecorderDenial({
      code: "AUDIT_RECORDING_TENANT_MISMATCH",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("policy_internals");
    expect(serialized).not.toContain("security_boundary_internals");
    expect(serialized).not.toContain("secret-token");
  });
});
