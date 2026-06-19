import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../../foundation/shared-kernel";

export const AuditEmissionDenialCodes = [
  "AUDIT_EMISSION_INTENT_REQUIRED",
  "AUDIT_EMISSION_INTENT_INVALID",
  "AUDIT_EMISSION_RESULT_REQUIRED",
  "AUDIT_EMISSION_RESULT_INVALID",
  "AUDIT_EMISSION_NOT_READY",
  "AUDIT_EMISSION_INTENT_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "AUDIT_EMISSION_AUDIT_RECORD_REQUIRED",
  "AUDIT_EMISSION_AUDIT_RECORD_INVALID",
  "AUDIT_EMISSION_RECORD_TENANT_MISMATCH",
  "AUDIT_EMISSION_TARGET_REQUIRED",
  "AUDIT_EMISSION_TARGET_INVALID",
  "AUDIT_EMISSION_TARGET_TENANT_MISMATCH",
  "INVALID_AUDIT_EMISSION_TIMESTAMP",
  "UNSAFE_AUDIT_EMISSION_REASON_CODE",
  "UNSAFE_AUDIT_EMISSION_METADATA",
] as const;

export type AuditEmissionDenialCode =
  (typeof AuditEmissionDenialCodes)[number];

export const AuditEmissionDenialCodeSchema = z.enum(
  AuditEmissionDenialCodes,
);

export type AuditEmissionDenial = {
  readonly code: AuditEmissionDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateAuditEmissionDenialInput = {
  readonly code: AuditEmissionDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_AUDIT_EMISSION_DENIAL_MESSAGES: Record<
  AuditEmissionDenialCode,
  string
> = {
  AUDIT_EMISSION_INTENT_REQUIRED:
    "An audit emission intent is required.",
  AUDIT_EMISSION_INTENT_INVALID:
    "The audit emission intent is invalid.",
  AUDIT_EMISSION_RESULT_REQUIRED:
    "An audit emission result is required.",
  AUDIT_EMISSION_RESULT_INVALID:
    "The audit emission result is invalid.",
  AUDIT_EMISSION_NOT_READY: "The audit emission intent is not ready.",
  AUDIT_EMISSION_INTENT_ID_REQUIRED:
    "An audit emission intent identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  AUDIT_EMISSION_AUDIT_RECORD_REQUIRED:
    "An audit record descriptor or reference is required.",
  AUDIT_EMISSION_AUDIT_RECORD_INVALID:
    "The audit record descriptor is invalid.",
  AUDIT_EMISSION_RECORD_TENANT_MISMATCH:
    "The audit emission record scope is invalid.",
  AUDIT_EMISSION_TARGET_REQUIRED:
    "An audit emission target descriptor is required.",
  AUDIT_EMISSION_TARGET_INVALID:
    "The audit emission target descriptor is invalid.",
  AUDIT_EMISSION_TARGET_TENANT_MISMATCH:
    "The audit emission target scope is invalid.",
  INVALID_AUDIT_EMISSION_TIMESTAMP:
    "The audit emission timestamp is invalid.",
  UNSAFE_AUDIT_EMISSION_REASON_CODE:
    "The audit emission reason code is unsafe.",
  UNSAFE_AUDIT_EMISSION_METADATA:
    "The audit emission metadata is unsafe.",
};

export const AuditEmissionDenialSchema = z
  .object({
    code: AuditEmissionDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createAuditEmissionDenial(
  input: CreateAuditEmissionDenialInput,
): AuditEmissionDenial {
  return {
    code: input.code,
    message: SAFE_AUDIT_EMISSION_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
