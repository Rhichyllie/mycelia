import { describe, expect, it } from "vitest";

import {
  assertAuditEmissionReady,
  createAuditEmissionDenial,
  isAuditEmissionReady,
  isAuditEmissionRejected,
  prepareAuditEmission,
  validateAuditEmissionIntent,
  validateAuditEmissionTarget,
} from ".";
import type { AuditRecordInput } from "../../domain-contracts/audit-record";
import type { AuditEmissionIntentInput } from "./audit-emission-intent";
import type { AuditEmissionTargetInput } from "./audit-emission-target";

function validActorRef(tenant_id = "tenant_001") {
  return {
    actor_type: "RUNTIME_ACTOR",
    actor_ref_id: "runtime_actor_ref_001",
    tenant_id,
    actor_id: "actor_001",
    runtime_identity_id: "runtime_identity_001",
    correlation_id: "correlation_001",
    metadata: {
      source: "runtime",
    },
  } as const;
}

function validSubjectRef(tenant_id = "tenant_001") {
  return {
    subject_type: "POLICY_DECISION",
    subject_ref_id: "policy_decision_ref_001",
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

function validEvidenceRef(tenant_id = "tenant_001") {
  return {
    evidence_ref_id: "policy_decision_evidence_ref_001",
    tenant_id,
    evidence_kind: "DECISION_RESULT",
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
  tenant_id = "tenant_001",
): AuditRecordInput {
  return {
    audit_record_id: "audit_record_001",
    tenant_id,
    kind: "POLICY_DECISION",
    actor_ref: validActorRef(tenant_id),
    subject_ref: validSubjectRef(tenant_id),
    evidence_ref: validEvidenceRef(tenant_id),
    outcome: "RECORDED",
    reason_code: "AUDIT_RECORDED",
    message: "The audit descriptor is recorded.",
    data_classification: "INTERNAL",
    recorded_at: "2026-06-01T00:00:02.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      phase: "one_n",
    },
    ...overrides,
  };
}

function validTarget(
  overrides: Partial<AuditEmissionTargetInput> = {},
  tenant_id = "tenant_001",
): AuditEmissionTargetInput {
  return {
    target_type: "DESCRIPTOR_ONLY",
    tenant_id,
    target_ref: "audit_emission_target_ref_001",
    data_classification: "INTERNAL",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validAuditEmissionIntent(
  overrides: Partial<AuditEmissionIntentInput> = {},
): AuditEmissionIntentInput {
  return {
    audit_emission_intent_id: "audit_emission_intent_001",
    tenant_id: "tenant_001",
    audit_record: validAuditRecord(),
    target: validTarget(),
    emission_reason_code: "AUDIT_EMISSION_REQUESTED",
    data_classification: "INTERNAL",
    requested_at: "2026-06-01T00:00:03.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      phase: "one_n",
    },
    ...overrides,
  };
}

describe("AuditEmission", () => {
  it("prepares a valid descriptor-only audit emission intent as READY", () => {
    const result = prepareAuditEmission(validAuditEmissionIntent());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("READY");
      expect(result.value.target?.target_type).toBe("DESCRIPTOR_ONLY");
      expect(result.value.audit_record_ref).toBe("audit_record_001");
      expect(isAuditEmissionReady(result.value)).toBe(true);
      expect(assertAuditEmissionReady(result.value).ok).toBe(true);
    }
  });

  it("prepares an internal audit stream target descriptor without emission", () => {
    const result = prepareAuditEmission(
      validAuditEmissionIntent({
        audit_emission_intent_id: "audit_emission_intent_stream_001",
        target: validTarget({
          target_type: "INTERNAL_AUDIT_STREAM",
          target_ref: "internal_audit_target_ref_001",
        }),
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("READY");
      expect(result.value.target?.target_type).toBe("INTERNAL_AUDIT_STREAM");
      expect(result.value).not.toHaveProperty("emitted_at");
      expect(result.value).not.toHaveProperty("transport_ack");
    }
  });

  it("rejects missing tenant_id", () => {
    const intent = validAuditEmissionIntent() as Record<string, unknown>;
    delete intent.tenant_id;
    intent.metadata = {
      display: "alice@example.com",
    };

    const result = validateAuditEmissionIntent(intent);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects missing audit_record and audit_record_ref", () => {
    const intent = validAuditEmissionIntent() as Record<string, unknown>;
    delete intent.audit_record;
    delete intent.audit_record_ref;

    const result = validateAuditEmissionIntent(intent);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "AUDIT_EMISSION_AUDIT_RECORD_REQUIRED",
      );
    }
  });

  it("rejects invalid embedded audit_record", () => {
    const result = validateAuditEmissionIntent(
      validAuditEmissionIntent({
        audit_record: {
          audit_record_id: "audit_record_001",
        } as AuditRecordInput,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_EMISSION_AUDIT_RECORD_INVALID");
    }
  });

  it("rejects audit_record tenant mismatch", () => {
    const result = validateAuditEmissionIntent(
      validAuditEmissionIntent({
        audit_record: validAuditRecord({}, "tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "AUDIT_EMISSION_RECORD_TENANT_MISMATCH",
      );
    }
  });

  it("rejects invalid target descriptors", () => {
    const target = validateAuditEmissionTarget({
      target_type: "BROKER_TOPIC",
      tenant_id: "tenant_001",
    });
    const intent = validateAuditEmissionIntent(
      validAuditEmissionIntent({
        target: {
          target_type: "BROKER_TOPIC",
          tenant_id: "tenant_001",
        } as unknown as AuditEmissionIntentInput["target"],
      }),
    );

    expect(target.ok).toBe(false);
    expect(intent.ok).toBe(false);
    if (!intent.ok) {
      expect(intent.error.code).toBe("AUDIT_EMISSION_TARGET_INVALID");
    }
  });

  it("rejects target URL, path, token, credential and connection details", () => {
    const urlTarget = validateAuditEmissionTarget({
      ...validTarget(),
      target_ref: "https://audit.example.test/target",
    });
    const unsafeMetadataTarget = validateAuditEmissionTarget({
      ...validTarget(),
      metadata: {
        connection_string: "postgresql://audit.example.test/stream",
        credential_hint: "token",
      },
    });
    const extraConfigTarget = validateAuditEmissionTarget({
      ...validTarget(),
      endpoint_url: "https://audit.example.test",
      filesystem_path: "C:\\audit\\out",
    });

    expect(urlTarget.ok).toBe(false);
    expect(unsafeMetadataTarget.ok).toBe(false);
    expect(extraConfigTarget.ok).toBe(false);
  });

  it("rejects invalid requested_at", () => {
    const result = validateAuditEmissionIntent(
      validAuditEmissionIntent({
        requested_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_AUDIT_EMISSION_TIMESTAMP");
    }
  });

  it("rejects unsafe emission_reason_code", () => {
    const result = validateAuditEmissionIntent(
      validAuditEmissionIntent({
        emission_reason_code: "unsafe reason",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_AUDIT_EMISSION_REASON_CODE");
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateAuditEmissionIntent(
      validAuditEmissionIntent({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_AUDIT_EMISSION_METADATA");
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const intent = validAuditEmissionIntent() as Record<string, unknown>;
    delete intent.tenant_id;
    intent.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateAuditEmissionIntent(intent);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("READY does not imply emission, persistence, publishing, connection, file or queue behavior", () => {
    const result = prepareAuditEmission(validAuditEmissionIntent());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("READY");
      expect(result.value).not.toHaveProperty("emitted_at");
      expect(result.value).not.toHaveProperty("persisted_at");
      expect(result.value).not.toHaveProperty("published_at");
      expect(result.value).not.toHaveProperty("connection_id");
      expect(result.value).not.toHaveProperty("file_path");
      expect(result.value).not.toHaveProperty("queue_job_id");
    }
  });

  it("fails closed for malformed or missing intents", () => {
    const missing = prepareAuditEmission(undefined);
    const malformed = prepareAuditEmission({
      audit_emission_intent_id: "audit_emission_intent_001",
    });

    expect(missing.ok).toBe(true);
    if (missing.ok) {
      expect(missing.value.outcome).toBe("REJECTED");
      expect(isAuditEmissionRejected(missing.value)).toBe(true);
    }

    expect(malformed.ok).toBe(true);
    if (malformed.ok) {
      expect(malformed.value.outcome).toBe("REJECTED");
    }
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createAuditEmissionDenial({
      code: "AUDIT_EMISSION_TARGET_INVALID",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("pipeline_internals");
    expect(serialized).not.toContain("compliance_export_internals");
    expect(serialized).not.toContain("secret-token");
  });
});
