import {
  err,
  ok,
  type Result,
} from "../../foundation/shared-kernel";

import {
  AuditActorRefSchema,
  type AuditActorRef,
} from "./audit-actor-ref";
import {
  AuditEvidenceRefSchema,
  AuditMessageSchema,
  AuditReasonCodeSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
  type AuditEvidenceRef,
} from "./audit-evidence-ref";
import {
  AuditRecordSchema,
  type AuditRecord,
} from "./audit-record";
import {
  createAuditRecordDenial,
  type AuditRecordDenial,
} from "./audit-record-denial";
import {
  AuditRecordKindSchema,
  type AuditRecordKind,
} from "./audit-record-kind";
import {
  AuditSubjectRefSchema,
  type AuditSubjectRef,
} from "./audit-subject-ref";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

export function validateAuditRecordKind(
  input: unknown,
): Result<AuditRecordKind, AuditRecordDenial> {
  const parsed = AuditRecordKindSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createAuditRecordDenial({ code: "AUDIT_RECORD_KIND_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function validateAuditActorRef(
  input: unknown,
): Result<AuditActorRef, AuditRecordDenial> {
  const parsed = AuditActorRefSchema.safeParse(input);

  if (!parsed.success) {
    return err(createAuditRecordDenial({ code: "AUDIT_ACTOR_REF_INVALID" }));
  }

  return ok(parsed.data);
}

export function validateAuditSubjectRef(
  input: unknown,
): Result<AuditSubjectRef, AuditRecordDenial> {
  const parsed = AuditSubjectRefSchema.safeParse(input);

  if (!parsed.success) {
    return err(createAuditRecordDenial({ code: "AUDIT_SUBJECT_REF_INVALID" }));
  }

  return ok(parsed.data);
}

export function validateAuditEvidenceRef(
  input: unknown,
): Result<AuditEvidenceRef, AuditRecordDenial> {
  const parsed = AuditEvidenceRefSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createAuditRecordDenial({ code: "AUDIT_EVIDENCE_REF_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function validateAuditRecord(
  input: unknown,
): Result<AuditRecord, AuditRecordDenial> {
  if (!isRecord(input)) {
    return err(createAuditRecordDenial({ code: "AUDIT_RECORD_REQUIRED" }));
  }

  if (input.audit_record_id === undefined) {
    return err(createAuditRecordDenial({ code: "AUDIT_RECORD_ID_REQUIRED" }));
  }

  if (input.tenant_id === undefined) {
    return err(createAuditRecordDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (!AuditRecordKindSchema.safeParse(input.kind).success) {
    return err(
      createAuditRecordDenial({ code: "AUDIT_RECORD_KIND_INVALID" }),
    );
  }

  if (input.actor_ref === undefined) {
    return err(createAuditRecordDenial({ code: "AUDIT_ACTOR_REF_REQUIRED" }));
  }

  const actorRef = validateAuditActorRef(input.actor_ref);

  if (!actorRef.ok) {
    return actorRef;
  }

  if (input.subject_ref === undefined) {
    return err(
      createAuditRecordDenial({ code: "AUDIT_SUBJECT_REF_REQUIRED" }),
    );
  }

  const subjectRef = validateAuditSubjectRef(input.subject_ref);

  if (!subjectRef.ok) {
    return subjectRef;
  }

  if (input.evidence_ref === undefined) {
    return err(
      createAuditRecordDenial({ code: "AUDIT_EVIDENCE_REF_REQUIRED" }),
    );
  }

  const evidenceRef = validateAuditEvidenceRef(input.evidence_ref);

  if (!evidenceRef.ok) {
    return evidenceRef;
  }

  if (
    typeof input.recorded_at !== "string" ||
    !isAuditIsoDateTime(input.recorded_at)
  ) {
    return err(createAuditRecordDenial({ code: "INVALID_AUDIT_TIMESTAMP" }));
  }

  if (!AuditReasonCodeSchema.safeParse(input.reason_code).success) {
    return err(createAuditRecordDenial({ code: "UNSAFE_AUDIT_REASON_CODE" }));
  }

  if (!AuditMessageSchema.safeParse(input.message).success) {
    return err(createAuditRecordDenial({ code: "UNSAFE_AUDIT_MESSAGE" }));
  }

  if (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  ) {
    return err(createAuditRecordDenial({ code: "UNSAFE_AUDIT_METADATA" }));
  }

  const parsed = AuditRecordSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (
      issuePath?.includes("tenant_id") ||
      issuePath?.startsWith("subject_ref") ||
      issuePath?.startsWith("evidence_ref") ||
      issuePath?.startsWith("actor_ref")
    ) {
      return err(
        createAuditRecordDenial({ code: "AUDIT_RECORD_TENANT_MISMATCH" }),
      );
    }

    return err(createAuditRecordDenial({ code: "AUDIT_RECORD_INVALID" }));
  }

  return ok(parsed.data);
}

export function isAuditRecordRecorded(input: unknown): boolean {
  const record = validateAuditRecord(input);

  return record.ok && record.value.outcome === "RECORDED";
}

export function isAuditRecordRejected(input: unknown): boolean {
  const record = validateAuditRecord(input);

  return !record.ok || record.value.outcome === "REJECTED";
}

export function assertAuditRecordRecorded(
  input: unknown,
): Result<AuditRecord, AuditRecordDenial> {
  const record = validateAuditRecord(input);

  if (!record.ok) {
    return record;
  }

  if (record.value.outcome !== "RECORDED") {
    return err(
      createAuditRecordDenial({
        code: "AUDIT_RECORD_NOT_RECORDED",
        correlation_id: record.value.correlation_id,
      }),
    );
  }

  return ok(record.value);
}

export function ensureAuditSubjectTenantMatchesRecord(
  record: AuditRecord,
): Result<true, AuditRecordDenial> {
  if (record.subject_ref.tenant_id !== record.tenant_id) {
    return err(
      createAuditRecordDenial({
        code: "AUDIT_RECORD_TENANT_MISMATCH",
        correlation_id: record.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureAuditEvidenceTenantMatchesRecord(
  record: AuditRecord,
): Result<true, AuditRecordDenial> {
  if (record.evidence_ref.tenant_id !== record.tenant_id) {
    return err(
      createAuditRecordDenial({
        code: "AUDIT_RECORD_TENANT_MISMATCH",
        correlation_id: record.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function failClosedAuditRecord(
  correlation_id?: AuditRecord["correlation_id"],
): AuditRecordDenial {
  return createAuditRecordDenial({
    code: "AUDIT_RECORD_NOT_RECORDED",
    correlation_id,
  });
}
