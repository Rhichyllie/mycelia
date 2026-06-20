import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../../foundation/shared-kernel";

export const AuditRecorderDenialCodes = [
  "AUDIT_RECORDING_REQUEST_REQUIRED",
  "AUDIT_RECORDING_REQUEST_INVALID",
  "AUDIT_RECORDING_RESULT_REQUIRED",
  "AUDIT_RECORDING_RESULT_INVALID",
  "AUDIT_RECORDING_NOT_RECORDED",
  "AUDIT_RECORDING_REQUEST_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "AUDIT_RECORD_KIND_INVALID",
  "AUDIT_ACTOR_REF_REQUIRED",
  "AUDIT_ACTOR_REF_INVALID",
  "AUDIT_SUBJECT_REF_REQUIRED",
  "AUDIT_SUBJECT_REF_INVALID",
  "AUDIT_EVIDENCE_REF_REQUIRED",
  "AUDIT_EVIDENCE_REF_INVALID",
  "AUDIT_RECORDING_TENANT_MISMATCH",
  "INVALID_AUDIT_RECORDING_TIMESTAMP",
  "UNSAFE_AUDIT_REASON_CODE",
  "UNSAFE_AUDIT_MESSAGE",
  "UNSAFE_AUDIT_METADATA",
  "AUDIT_RECORD_CONSTRUCTION_INVALID",
] as const;

export type AuditRecorderDenialCode =
  (typeof AuditRecorderDenialCodes)[number];

export const AuditRecorderDenialCodeSchema = z.enum(
  AuditRecorderDenialCodes,
);

export type AuditRecorderDenial = {
  readonly code: AuditRecorderDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateAuditRecorderDenialInput = {
  readonly code: AuditRecorderDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_AUDIT_RECORDER_DENIAL_MESSAGES: Record<
  AuditRecorderDenialCode,
  string
> = {
  AUDIT_RECORDING_REQUEST_REQUIRED:
    "An audit recording request is required.",
  AUDIT_RECORDING_REQUEST_INVALID:
    "The audit recording request is invalid.",
  AUDIT_RECORDING_RESULT_REQUIRED:
    "An audit recording result is required.",
  AUDIT_RECORDING_RESULT_INVALID:
    "The audit recording result is invalid.",
  AUDIT_RECORDING_NOT_RECORDED:
    "The audit recording request is rejected.",
  AUDIT_RECORDING_REQUEST_ID_REQUIRED:
    "An audit recording request identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  AUDIT_RECORD_KIND_INVALID: "The audit record kind is invalid.",
  AUDIT_ACTOR_REF_REQUIRED: "An audit actor reference is required.",
  AUDIT_ACTOR_REF_INVALID: "The audit actor reference is invalid.",
  AUDIT_SUBJECT_REF_REQUIRED: "An audit subject reference is required.",
  AUDIT_SUBJECT_REF_INVALID: "The audit subject reference is invalid.",
  AUDIT_EVIDENCE_REF_REQUIRED: "An audit evidence reference is required.",
  AUDIT_EVIDENCE_REF_INVALID: "The audit evidence reference is invalid.",
  AUDIT_RECORDING_TENANT_MISMATCH:
    "The audit recording tenant scope is invalid.",
  INVALID_AUDIT_RECORDING_TIMESTAMP:
    "The audit recording timestamp is invalid.",
  UNSAFE_AUDIT_REASON_CODE: "The audit recording reason code is unsafe.",
  UNSAFE_AUDIT_MESSAGE: "The audit recording message is unsafe.",
  UNSAFE_AUDIT_METADATA: "The audit recording metadata is unsafe.",
  AUDIT_RECORD_CONSTRUCTION_INVALID:
    "The audit record descriptor could not be constructed safely.",
};

export const AuditRecorderDenialSchema = z
  .object({
    code: AuditRecorderDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createAuditRecorderDenial(
  input: CreateAuditRecorderDenialInput,
): AuditRecorderDenial {
  return {
    code: input.code,
    message: SAFE_AUDIT_RECORDER_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
