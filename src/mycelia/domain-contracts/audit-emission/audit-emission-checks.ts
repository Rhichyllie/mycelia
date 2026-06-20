import {
  err,
  ok,
  type Result,
} from "../../foundation/shared-kernel";
import {
  CorrelationIdSchema,
  TenantIdSchema,
  type CorrelationId,
} from "../../foundation/shared-kernel";
import {
  AuditOpaqueReferenceSchema,
  AuditReasonCodeSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
  validateAuditRecord,
} from "../../domain-contracts/audit-record";

import {
  createAuditEmissionDenial,
  type AuditEmissionDenial,
  type AuditEmissionDenialCode,
} from "./audit-emission-denial";
import {
  AuditEmissionIntentIdSchema,
  AuditEmissionIntentSchema,
  type AuditEmissionIntent,
} from "./audit-emission-intent";
import {
  AuditEmissionResultSchema,
  type AuditEmissionResult,
} from "./audit-emission-result";
import {
  AuditEmissionTargetSchema,
  type AuditEmissionTarget,
} from "./audit-emission-target";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function getSafeAuditEmissionIntentId(input: unknown): string {
  if (
    isRecord(input) &&
    AuditEmissionIntentIdSchema.safeParse(
      input.audit_emission_intent_id,
    ).success
  ) {
    return input.audit_emission_intent_id as string;
  }

  return "audit_emission_intent_unknown";
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

function getAuditRecordRef(intent: AuditEmissionIntent): string {
  if (intent.audit_record_ref !== undefined) {
    return intent.audit_record_ref;
  }

  return intent.audit_record?.audit_record_id ?? "audit_record_unknown";
}

export function validateAuditEmissionTarget(
  input: unknown,
): Result<AuditEmissionTarget, AuditEmissionDenial> {
  const parsed = AuditEmissionTargetSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createAuditEmissionDenial({ code: "AUDIT_EMISSION_TARGET_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function validateAuditEmissionIntent(
  input: unknown,
): Result<AuditEmissionIntent, AuditEmissionDenial> {
  if (!isRecord(input)) {
    return err(
      createAuditEmissionDenial({ code: "AUDIT_EMISSION_INTENT_REQUIRED" }),
    );
  }

  if (input.audit_emission_intent_id === undefined) {
    return err(
      createAuditEmissionDenial({
        code: "AUDIT_EMISSION_INTENT_ID_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createAuditEmissionDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (
    input.audit_record === undefined &&
    input.audit_record_ref === undefined
  ) {
    return err(
      createAuditEmissionDenial({
        code: "AUDIT_EMISSION_AUDIT_RECORD_REQUIRED",
      }),
    );
  }

  if (
    input.audit_record !== undefined &&
    !validateAuditRecord(input.audit_record).ok
  ) {
    return err(
      createAuditEmissionDenial({
        code: "AUDIT_EMISSION_AUDIT_RECORD_INVALID",
      }),
    );
  }

  if (
    input.audit_record_ref !== undefined &&
    !AuditOpaqueReferenceSchema.safeParse(input.audit_record_ref).success
  ) {
    return err(
      createAuditEmissionDenial({
        code: "AUDIT_EMISSION_AUDIT_RECORD_INVALID",
      }),
    );
  }

  if (input.target === undefined) {
    return err(
      createAuditEmissionDenial({ code: "AUDIT_EMISSION_TARGET_REQUIRED" }),
    );
  }

  const target = validateAuditEmissionTarget(input.target);

  if (!target.ok) {
    return target;
  }

  if (
    typeof input.requested_at !== "string" ||
    !isAuditIsoDateTime(input.requested_at)
  ) {
    return err(
      createAuditEmissionDenial({
        code: "INVALID_AUDIT_EMISSION_TIMESTAMP",
      }),
    );
  }

  if (!AuditReasonCodeSchema.safeParse(input.emission_reason_code).success) {
    return err(
      createAuditEmissionDenial({
        code: "UNSAFE_AUDIT_EMISSION_REASON_CODE",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createAuditEmissionDenial({
        code: "UNSAFE_AUDIT_EMISSION_METADATA",
      }),
    );
  }

  const parsed = AuditEmissionIntentSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (issuePath?.startsWith("audit_record")) {
      return err(
        createAuditEmissionDenial({
          code: "AUDIT_EMISSION_RECORD_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("target")) {
      return err(
        createAuditEmissionDenial({
          code: "AUDIT_EMISSION_TARGET_TENANT_MISMATCH",
        }),
      );
    }

    return err(
      createAuditEmissionDenial({ code: "AUDIT_EMISSION_INTENT_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function validateAuditEmissionResult(
  input: unknown,
): Result<AuditEmissionResult, AuditEmissionDenial> {
  if (!isRecord(input)) {
    return err(
      createAuditEmissionDenial({ code: "AUDIT_EMISSION_RESULT_REQUIRED" }),
    );
  }

  const parsed = AuditEmissionResultSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createAuditEmissionDenial({ code: "AUDIT_EMISSION_RESULT_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function failClosedAuditEmissionResult(
  input: unknown,
  code: AuditEmissionDenialCode = "AUDIT_EMISSION_INTENT_INVALID",
): AuditEmissionResult {
  const audit_emission_intent_id = getSafeAuditEmissionIntentId(input);
  const correlation_id = getSafeCorrelationId(input);

  return AuditEmissionResultSchema.parse({
    audit_emission_result_id: `${audit_emission_intent_id}.rejected`,
    audit_emission_intent_id,
    tenant_id: getSafeTenantId(input),
    outcome: "REJECTED",
    reason_code: "AUDIT_EMISSION_REJECTED",
    message: "The audit emission intent is rejected.",
    decided_at: getSafeDecidedAt(input),
    correlation_id,
    denial: createAuditEmissionDenial({
      code,
      correlation_id,
    }),
  });
}

export function ensureAuditEmissionRecordTenantMatchesIntent(
  intent: AuditEmissionIntent,
): Result<true, AuditEmissionDenial> {
  if (
    intent.audit_record !== undefined &&
    intent.audit_record.tenant_id !== intent.tenant_id
  ) {
    return err(
      createAuditEmissionDenial({
        code: "AUDIT_EMISSION_RECORD_TENANT_MISMATCH",
        correlation_id: intent.correlation_id,
      }),
    );
  }

  return ok(true);
}

function createReadyAuditEmissionResult(
  intent: AuditEmissionIntent,
): AuditEmissionResult {
  return AuditEmissionResultSchema.parse({
    audit_emission_result_id: `${intent.audit_emission_intent_id}.ready`,
    audit_emission_intent_id: intent.audit_emission_intent_id,
    tenant_id: intent.tenant_id,
    outcome: "READY",
    reason_code: "AUDIT_EMISSION_READY",
    message: "The audit emission intent is ready.",
    decided_at: intent.requested_at,
    correlation_id: intent.correlation_id,
    target: intent.target,
    audit_record_ref: getAuditRecordRef(intent),
    metadata: intent.metadata,
  });
}

export function prepareAuditEmission(
  input: unknown,
): Result<AuditEmissionResult, AuditEmissionDenial> {
  const intent = validateAuditEmissionIntent(input);

  if (!intent.ok) {
    return ok(failClosedAuditEmissionResult(input, intent.error.code));
  }

  const recordTenantMatch = ensureAuditEmissionRecordTenantMatchesIntent(
    intent.value,
  );

  if (!recordTenantMatch.ok) {
    return ok(
      failClosedAuditEmissionResult(
        intent.value,
        recordTenantMatch.error.code,
      ),
    );
  }

  return ok(createReadyAuditEmissionResult(intent.value));
}

export function isAuditEmissionReady(input: unknown): boolean {
  const result = validateAuditEmissionResult(input);

  return result.ok && result.value.outcome === "READY";
}

export function isAuditEmissionRejected(input: unknown): boolean {
  const result = validateAuditEmissionResult(input);

  return !result.ok || result.value.outcome === "REJECTED";
}

export function assertAuditEmissionReady(
  input: unknown,
): Result<AuditEmissionResult, AuditEmissionDenial> {
  const result = validateAuditEmissionResult(input);

  if (!result.ok) {
    return result;
  }

  if (result.value.outcome !== "READY") {
    return err(
      createAuditEmissionDenial({
        code: "AUDIT_EMISSION_NOT_READY",
        correlation_id: result.value.correlation_id,
      }),
    );
  }

  return ok(result.value);
}
