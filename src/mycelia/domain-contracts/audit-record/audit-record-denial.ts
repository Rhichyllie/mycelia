import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../../foundation/shared-kernel";

export const AuditRecordDenialCodes = [
  "AUDIT_RECORD_REQUIRED",
  "AUDIT_RECORD_INVALID",
  "AUDIT_RECORD_ID_REQUIRED",
  "AUDIT_RECORD_KIND_INVALID",
  "AUDIT_ACTOR_REF_REQUIRED",
  "AUDIT_ACTOR_REF_INVALID",
  "AUDIT_SUBJECT_REF_REQUIRED",
  "AUDIT_SUBJECT_REF_INVALID",
  "AUDIT_EVIDENCE_REF_REQUIRED",
  "AUDIT_EVIDENCE_REF_INVALID",
  "AUDIT_RECORD_NOT_RECORDED",
  "TENANT_ID_REQUIRED",
  "AUDIT_RECORD_TENANT_MISMATCH",
  "INVALID_AUDIT_TIMESTAMP",
  "UNSAFE_AUDIT_REASON_CODE",
  "UNSAFE_AUDIT_MESSAGE",
  "UNSAFE_AUDIT_METADATA",
] as const;

export type AuditRecordDenialCode =
  (typeof AuditRecordDenialCodes)[number];

export const AuditRecordDenialCodeSchema = z.enum(AuditRecordDenialCodes);

export type AuditRecordDenial = {
  readonly code: AuditRecordDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateAuditRecordDenialInput = {
  readonly code: AuditRecordDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_AUDIT_RECORD_DENIAL_MESSAGES: Record<AuditRecordDenialCode, string> =
  {
    AUDIT_RECORD_REQUIRED: "An audit record descriptor is required.",
    AUDIT_RECORD_INVALID: "The audit record descriptor is invalid.",
    AUDIT_RECORD_ID_REQUIRED: "An audit record identity is required.",
    AUDIT_RECORD_KIND_INVALID: "The audit record kind is invalid.",
    AUDIT_ACTOR_REF_REQUIRED: "An audit actor reference is required.",
    AUDIT_ACTOR_REF_INVALID: "The audit actor reference is invalid.",
    AUDIT_SUBJECT_REF_REQUIRED: "An audit subject reference is required.",
    AUDIT_SUBJECT_REF_INVALID: "The audit subject reference is invalid.",
    AUDIT_EVIDENCE_REF_REQUIRED: "An audit evidence reference is required.",
    AUDIT_EVIDENCE_REF_INVALID: "The audit evidence reference is invalid.",
    AUDIT_RECORD_NOT_RECORDED: "The audit record is not recorded.",
    TENANT_ID_REQUIRED: "A tenant identity is required.",
    AUDIT_RECORD_TENANT_MISMATCH:
      "The audit record tenant scope is invalid.",
    INVALID_AUDIT_TIMESTAMP: "The audit record timestamp is invalid.",
    UNSAFE_AUDIT_REASON_CODE: "The audit record reason code is unsafe.",
    UNSAFE_AUDIT_MESSAGE: "The audit record message is unsafe.",
    UNSAFE_AUDIT_METADATA: "The audit record metadata is unsafe.",
  };

export const AuditRecordDenialSchema = z
  .object({
    code: AuditRecordDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createAuditRecordDenial(
  input: CreateAuditRecordDenialInput,
): AuditRecordDenial {
  return {
    code: input.code,
    message: SAFE_AUDIT_RECORD_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
