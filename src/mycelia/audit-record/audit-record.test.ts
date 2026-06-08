import { describe, expect, it } from "vitest";

import {
  assertAuditRecordRecorded,
  createAuditRecordDenial,
  failClosedAuditRecord,
  isAuditRecordRecorded,
  isAuditRecordRejected,
  validateAuditActorRef,
  validateAuditEvidenceRef,
  validateAuditRecord,
  validateAuditRecordKind,
  validateAuditSubjectRef,
} from ".";
import type { AuditRecordInput } from "./audit-record";

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

function validAuditRecord(
  overrides: Partial<AuditRecordInput> = {},
): AuditRecordInput {
  return {
    audit_record_id: "audit_record_001",
    tenant_id: "tenant_001",
    kind: "POLICY_DECISION",
    actor_ref: validActorRef(),
    subject_ref: validSubjectRef(),
    evidence_ref: validEvidenceRef(),
    outcome: "RECORDED",
    reason_code: "AUDIT_RECORDED",
    message: "The audit descriptor is recorded.",
    data_classification: "INTERNAL",
    recorded_at: "2026-06-01T00:00:02.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      phase: "one_l",
    },
    ...overrides,
  };
}

describe("AuditRecord", () => {
  it("accepts a valid audit record for POLICY_DECISION", () => {
    const record = validAuditRecord();
    const result = validateAuditRecord(record);

    expect(result.ok).toBe(true);
    expect(isAuditRecordRecorded(record)).toBe(true);
    expect(assertAuditRecordRecorded(record).ok).toBe(true);
  });

  it("accepts a valid audit record for STATE_TRANSITION_COORDINATION", () => {
    const result = validateAuditRecord(
      validAuditRecord({
        audit_record_id: "audit_record_coordination_001",
        kind: "STATE_TRANSITION_COORDINATION",
        subject_ref: validSubjectRef("STATE_TRANSITION_COORDINATION"),
        evidence_ref: validEvidenceRef("COORDINATION_RESULT"),
        reason_code: "COORDINATION_AUDIT_RECORDED",
        message: "The coordination descriptor is recorded.",
      }),
    );

    expect(result.ok).toBe(true);
  });

  it("rejects missing tenant_id", () => {
    const record = validAuditRecord() as Record<string, unknown>;
    delete record.tenant_id;
    record.metadata = {
      display: "alice@example.com",
    };

    const result = validateAuditRecord(record);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects invalid kind", () => {
    expect(validateAuditRecordKind("NOT_A_KIND").ok).toBe(false);

    const result = validateAuditRecord({
      ...validAuditRecord(),
      kind: "NOT_A_KIND",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_RECORD_KIND_INVALID");
    }
  });

  it("rejects invalid actor_ref", () => {
    const actor = validateAuditActorRef({
      actor_type: "HUMAN_ACTOR",
      actor_ref_id: "alice@example.com",
    });
    const result = validateAuditRecord({
      ...validAuditRecord(),
      actor_ref: {
        actor_type: "HUMAN_ACTOR",
        actor_ref_id: "alice@example.com",
      },
    });

    expect(actor.ok).toBe(false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_ACTOR_REF_INVALID");
    }
  });

  it("rejects invalid subject_ref", () => {
    const subject = validateAuditSubjectRef({
      subject_type: "REQUEST",
      subject_ref_id: "https://example.test/request",
      tenant_id: "tenant_001",
    });
    const result = validateAuditRecord({
      ...validAuditRecord(),
      subject_ref: {
        subject_type: "REQUEST",
        subject_ref_id: "https://example.test/request",
        tenant_id: "tenant_001",
      },
    });

    expect(subject.ok).toBe(false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_SUBJECT_REF_INVALID");
    }
  });

  it("rejects invalid evidence_ref", () => {
    const evidence = validateAuditEvidenceRef({
      evidence_ref_id: "evidence_ref_001",
      tenant_id: "tenant_001",
      evidence_kind: "SEALED_EVIDENCE",
      created_at: "2026-06-01T00:00:01.000Z",
      data_classification: "INTERNAL",
    });
    const result = validateAuditRecord({
      ...validAuditRecord(),
      evidence_ref: {
        evidence_ref_id: "evidence_ref_001",
        tenant_id: "tenant_001",
        evidence_kind: "SEALED_EVIDENCE",
        created_at: "2026-06-01T00:00:01.000Z",
        data_classification: "INTERNAL",
      },
    });

    expect(evidence.ok).toBe(false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_EVIDENCE_REF_INVALID");
    }
  });

  it("rejects subject_ref tenant mismatch", () => {
    const result = validateAuditRecord(
      validAuditRecord({
        subject_ref: validSubjectRef("POLICY_DECISION", "tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_RECORD_TENANT_MISMATCH");
    }
  });

  it("rejects evidence_ref tenant mismatch", () => {
    const result = validateAuditRecord(
      validAuditRecord({
        evidence_ref: validEvidenceRef("DECISION_RESULT", "tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_RECORD_TENANT_MISMATCH");
    }
  });

  it("rejects invalid recorded_at", () => {
    const result = validateAuditRecord(
      validAuditRecord({
        recorded_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_AUDIT_TIMESTAMP");
    }
  });

  it("rejects unsafe reason_code", () => {
    const result = validateAuditRecord(
      validAuditRecord({
        reason_code: "unsafe reason",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_AUDIT_REASON_CODE");
    }
  });

  it("rejects unsafe message", () => {
    const result = validateAuditRecord(
      validAuditRecord({
        message: "The audit includes tenant_name and secret details.",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_AUDIT_MESSAGE");
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateAuditRecord(
      validAuditRecord({
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
    const record = validAuditRecord() as Record<string, unknown>;
    delete record.tenant_id;
    record.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateAuditRecord(record);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("keeps evidence refs as descriptors only", () => {
    const evidence = validateAuditEvidenceRef(validEvidenceRef());

    expect(evidence.ok).toBe(true);
    if (evidence.ok) {
      expect(evidence.value.evidence_kind).toBe("DECISION_RESULT");
      expect(evidence.value).not.toHaveProperty("sealed_at");
      expect(evidence.value).not.toHaveProperty("signature");
      expect(evidence.value).not.toHaveProperty("hash_chain");
      expect(evidence.value).not.toHaveProperty("persisted_at");
    }
  });

  it("handles REJECTED and fail-closed behavior", () => {
    const rejected = validAuditRecord({
      outcome: "REJECTED",
      reason_code: "AUDIT_REJECTED",
      message: "The audit descriptor is rejected.",
    });
    const assertion = assertAuditRecordRecorded(rejected);
    const failClosed = failClosedAuditRecord();

    expect(isAuditRecordRejected(rejected)).toBe(true);
    expect(assertion.ok).toBe(false);
    if (!assertion.ok) {
      expect(assertion.error.code).toBe("AUDIT_RECORD_NOT_RECORDED");
    }
    expect(failClosed.code).toBe("AUDIT_RECORD_NOT_RECORDED");
  });

  it("fails closed for missing or malformed audit records", () => {
    expect(isAuditRecordRejected(undefined)).toBe(true);

    const malformed = validateAuditRecord({
      audit_record_id: "audit_record_001",
    });

    expect(malformed.ok).toBe(false);
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createAuditRecordDenial({
      code: "AUDIT_RECORD_TENANT_MISMATCH",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("evidence_internals");
    expect(serialized).not.toContain("security_boundary_internals");
    expect(serialized).not.toContain("secret-token");
  });
});
