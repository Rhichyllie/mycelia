import {
  err,
  ok,
  type Result,
} from "../shared-kernel";
import {
  CorrelationIdSchema,
  TenantIdSchema,
  type CorrelationId,
} from "../shared-kernel";
import {
  AuditMessageSchema,
  AuditReasonCodeSchema,
  AuditRecordKindSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
  validateAuditActorRef,
  validateAuditEvidenceRef,
  validateAuditRecord,
  validateAuditRecordKind,
  validateAuditSubjectRef,
} from "../audit-record";

import {
  createAuditRecordDescriptorInput,
} from "./audit-recorder";
import {
  createAuditRecorderDenial,
  type AuditRecorderDenial,
  type AuditRecorderDenialCode,
} from "./audit-recorder-denial";
import {
  AuditRecordingRequestIdSchema,
  AuditRecordingRequestSchema,
  type AuditRecordingRequest,
} from "./audit-recording-request";
import {
  AuditRecordingResultSchema,
  type AuditRecordingResult,
} from "./audit-recording-result";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function getSafeAuditRecordingRequestId(input: unknown): string {
  if (
    isRecord(input) &&
    AuditRecordingRequestIdSchema.safeParse(
      input.audit_recording_request_id,
    ).success
  ) {
    return input.audit_recording_request_id as string;
  }

  return "audit_recording_request_unknown";
}

function getSafeTenantId(input: unknown): string {
  if (isRecord(input) && TenantIdSchema.safeParse(input.tenant_id).success) {
    return input.tenant_id as string;
  }

  return "tenant_unknown";
}

function getSafeCorrelationId(input: unknown): CorrelationId {
  if (
    isRecord(input) &&
    CorrelationIdSchema.safeParse(input.correlation_id).success
  ) {
    return CorrelationIdSchema.parse(input.correlation_id);
  }

  return CorrelationIdSchema.parse("correlation_unknown");
}

function getSafeDecidedAt(input: unknown): string {
  if (
    isRecord(input) &&
    typeof input.requested_at === "string" &&
    isAuditIsoDateTime(input.requested_at)
  ) {
    return input.requested_at;
  }

  return "1970-01-01T00:00:00.000Z";
}

function hasUnsafeMetadata(input: Record<string, unknown>): boolean {
  return (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  );
}

export function validateAuditRecordingRequest(
  input: unknown,
): Result<AuditRecordingRequest, AuditRecorderDenial> {
  if (!isRecord(input)) {
    return err(
      createAuditRecorderDenial({
        code: "AUDIT_RECORDING_REQUEST_REQUIRED",
      }),
    );
  }

  if (input.audit_recording_request_id === undefined) {
    return err(
      createAuditRecorderDenial({
        code: "AUDIT_RECORDING_REQUEST_ID_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createAuditRecorderDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (!AuditRecordKindSchema.safeParse(input.kind).success) {
    return err(
      createAuditRecorderDenial({ code: "AUDIT_RECORD_KIND_INVALID" }),
    );
  }

  if (input.actor_ref === undefined) {
    return err(
      createAuditRecorderDenial({ code: "AUDIT_ACTOR_REF_REQUIRED" }),
    );
  }

  const actorRef = validateAuditActorRef(input.actor_ref);

  if (!actorRef.ok) {
    return err(
      createAuditRecorderDenial({ code: "AUDIT_ACTOR_REF_INVALID" }),
    );
  }

  if (input.subject_ref === undefined) {
    return err(
      createAuditRecorderDenial({ code: "AUDIT_SUBJECT_REF_REQUIRED" }),
    );
  }

  const subjectRef = validateAuditSubjectRef(input.subject_ref);

  if (!subjectRef.ok) {
    return err(
      createAuditRecorderDenial({ code: "AUDIT_SUBJECT_REF_INVALID" }),
    );
  }

  if (input.evidence_ref === undefined) {
    return err(
      createAuditRecorderDenial({ code: "AUDIT_EVIDENCE_REF_REQUIRED" }),
    );
  }

  const evidenceRef = validateAuditEvidenceRef(input.evidence_ref);

  if (!evidenceRef.ok) {
    return err(
      createAuditRecorderDenial({ code: "AUDIT_EVIDENCE_REF_INVALID" }),
    );
  }

  if (
    typeof input.requested_at !== "string" ||
    !isAuditIsoDateTime(input.requested_at)
  ) {
    return err(
      createAuditRecorderDenial({
        code: "INVALID_AUDIT_RECORDING_TIMESTAMP",
      }),
    );
  }

  if (!AuditReasonCodeSchema.safeParse(input.reason_code).success) {
    return err(
      createAuditRecorderDenial({ code: "UNSAFE_AUDIT_REASON_CODE" }),
    );
  }

  if (!AuditMessageSchema.safeParse(input.message).success) {
    return err(
      createAuditRecorderDenial({ code: "UNSAFE_AUDIT_MESSAGE" }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createAuditRecorderDenial({ code: "UNSAFE_AUDIT_METADATA" }),
    );
  }

  const parsed = AuditRecordingRequestSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (
      issuePath?.includes("tenant_id") ||
      issuePath?.startsWith("subject_ref") ||
      issuePath?.startsWith("evidence_ref") ||
      issuePath?.startsWith("actor_ref")
    ) {
      return err(
        createAuditRecorderDenial({
          code: "AUDIT_RECORDING_TENANT_MISMATCH",
        }),
      );
    }

    return err(
      createAuditRecorderDenial({
        code: "AUDIT_RECORDING_REQUEST_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateAuditRecordingResult(
  input: unknown,
): Result<AuditRecordingResult, AuditRecorderDenial> {
  if (!isRecord(input)) {
    return err(
      createAuditRecorderDenial({
        code: "AUDIT_RECORDING_RESULT_REQUIRED",
      }),
    );
  }

  const parsed = AuditRecordingResultSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createAuditRecorderDenial({
        code: "AUDIT_RECORDING_RESULT_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function failClosedAuditRecordingResult(
  input: unknown,
  code: AuditRecorderDenialCode = "AUDIT_RECORDING_REQUEST_INVALID",
): AuditRecordingResult {
  const audit_recording_request_id = getSafeAuditRecordingRequestId(input);
  const correlation_id = getSafeCorrelationId(input);

  return AuditRecordingResultSchema.parse({
    audit_recording_result_id: `${audit_recording_request_id}.rejected`,
    audit_recording_request_id,
    tenant_id: getSafeTenantId(input),
    outcome: "REJECTED",
    reason_code: "AUDIT_RECORDING_REJECTED",
    message: "The audit recording request is rejected.",
    decided_at: getSafeDecidedAt(input),
    correlation_id,
    denial: createAuditRecorderDenial({
      code,
      correlation_id,
    }),
  });
}

export function ensureAuditRecordingSubjectTenantMatchesRequest(
  request: AuditRecordingRequest,
): Result<true, AuditRecorderDenial> {
  if (request.subject_ref.tenant_id !== request.tenant_id) {
    return err(
      createAuditRecorderDenial({
        code: "AUDIT_RECORDING_TENANT_MISMATCH",
        correlation_id: request.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureAuditRecordingEvidenceTenantMatchesRequest(
  request: AuditRecordingRequest,
): Result<true, AuditRecorderDenial> {
  if (request.evidence_ref.tenant_id !== request.tenant_id) {
    return err(
      createAuditRecorderDenial({
        code: "AUDIT_RECORDING_TENANT_MISMATCH",
        correlation_id: request.correlation_id,
      }),
    );
  }

  return ok(true);
}

function createRecordedAuditRecordingResult(
  request: AuditRecordingRequest,
  audit_record: AuditRecordingResult["audit_record"],
): AuditRecordingResult {
  return AuditRecordingResultSchema.parse({
    audit_recording_result_id:
      `${request.audit_recording_request_id}.recorded`,
    audit_recording_request_id: request.audit_recording_request_id,
    tenant_id: request.tenant_id,
    outcome: "RECORDED",
    reason_code: "AUDIT_RECORDING_RECORDED",
    message: "The audit descriptor is recorded.",
    decided_at: request.requested_at,
    correlation_id: request.correlation_id,
    audit_record,
    metadata: request.metadata,
  });
}

export function recordAuditDescriptor(
  input: unknown,
): Result<AuditRecordingResult, AuditRecorderDenial> {
  const request = validateAuditRecordingRequest(input);

  if (!request.ok) {
    return ok(failClosedAuditRecordingResult(input, request.error.code));
  }

  const subjectTenantMatch =
    ensureAuditRecordingSubjectTenantMatchesRequest(request.value);

  if (!subjectTenantMatch.ok) {
    return ok(
      failClosedAuditRecordingResult(
        request.value,
        subjectTenantMatch.error.code,
      ),
    );
  }

  const evidenceTenantMatch =
    ensureAuditRecordingEvidenceTenantMatchesRequest(request.value);

  if (!evidenceTenantMatch.ok) {
    return ok(
      failClosedAuditRecordingResult(
        request.value,
        evidenceTenantMatch.error.code,
      ),
    );
  }

  const auditRecord = validateAuditRecord(
    createAuditRecordDescriptorInput(request.value),
  );

  if (!auditRecord.ok) {
    return ok(
      failClosedAuditRecordingResult(
        request.value,
        "AUDIT_RECORD_CONSTRUCTION_INVALID",
      ),
    );
  }

  return ok(createRecordedAuditRecordingResult(request.value, auditRecord.value));
}

export function isAuditRecordingRecorded(input: unknown): boolean {
  const result = validateAuditRecordingResult(input);

  return result.ok && result.value.outcome === "RECORDED";
}

export function isAuditRecordingRejected(input: unknown): boolean {
  const result = validateAuditRecordingResult(input);

  return !result.ok || result.value.outcome === "REJECTED";
}

export function assertAuditRecordingRecorded(
  input: unknown,
): Result<AuditRecordingResult, AuditRecorderDenial> {
  const result = validateAuditRecordingResult(input);

  if (!result.ok) {
    return result;
  }

  if (result.value.outcome !== "RECORDED") {
    return err(
      createAuditRecorderDenial({
        code: "AUDIT_RECORDING_NOT_RECORDED",
        correlation_id: result.value.correlation_id,
      }),
    );
  }

  return ok(result.value);
}

export {
  validateAuditActorRef,
  validateAuditEvidenceRef,
  validateAuditRecordKind,
  validateAuditSubjectRef,
};
