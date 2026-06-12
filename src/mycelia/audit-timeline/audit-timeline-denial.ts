import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../shared-kernel";

export const AuditTimelineDenialCodes = [
  "AUDIT_TIMELINE_REQUIRED",
  "AUDIT_TIMELINE_INVALID",
  "AUDIT_TIMELINE_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "AUDIT_TIMELINE_SCOPE_INVALID",
  "AUDIT_TIMELINE_ENTRIES_REQUIRED",
  "AUDIT_TIMELINE_ENTRY_REQUIRED",
  "AUDIT_TIMELINE_ENTRY_INVALID",
  "AUDIT_TIMELINE_ENTRY_KIND_INVALID",
  "AUDIT_TIMELINE_ENTRY_TENANT_MISMATCH",
  "AUDIT_TIMELINE_ENTRY_ORDER_INVALID",
  "AUDIT_TIMELINE_ENTRY_SEQUENCE_INVALID",
  "AUDIT_TIMELINE_AUDIT_RECORD_INVALID",
  "AUDIT_TIMELINE_AUDIT_RECORD_TENANT_MISMATCH",
  "AUDIT_TIMELINE_AUDIT_EMISSION_RESULT_INVALID",
  "AUDIT_TIMELINE_AUDIT_EMISSION_RESULT_TENANT_MISMATCH",
  "AUDIT_TIMELINE_CURSOR_REQUIRED",
  "AUDIT_TIMELINE_CURSOR_INVALID",
  "AUDIT_TIMELINE_CURSOR_TENANT_MISMATCH",
  "AUDIT_TIMELINE_CURSOR_TIMELINE_MISMATCH",
  "INVALID_AUDIT_TIMELINE_TIMESTAMP",
  "UNSAFE_AUDIT_TIMELINE_METADATA",
  "AUDIT_TIMELINE_NOT_VALID",
] as const;

export type AuditTimelineDenialCode =
  (typeof AuditTimelineDenialCodes)[number];

export const AuditTimelineDenialCodeSchema = z.enum(
  AuditTimelineDenialCodes,
);

export type AuditTimelineDenial = {
  readonly code: AuditTimelineDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateAuditTimelineDenialInput = {
  readonly code: AuditTimelineDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_AUDIT_TIMELINE_DENIAL_MESSAGES: Record<
  AuditTimelineDenialCode,
  string
> = {
  AUDIT_TIMELINE_REQUIRED: "An audit timeline descriptor is required.",
  AUDIT_TIMELINE_INVALID: "The audit timeline descriptor is invalid.",
  AUDIT_TIMELINE_ID_REQUIRED: "An audit timeline identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  AUDIT_TIMELINE_SCOPE_INVALID: "The audit timeline scope is invalid.",
  AUDIT_TIMELINE_ENTRIES_REQUIRED:
    "Audit timeline entries are required.",
  AUDIT_TIMELINE_ENTRY_REQUIRED:
    "An audit timeline entry descriptor is required.",
  AUDIT_TIMELINE_ENTRY_INVALID:
    "The audit timeline entry descriptor is invalid.",
  AUDIT_TIMELINE_ENTRY_KIND_INVALID:
    "The audit timeline entry kind is invalid.",
  AUDIT_TIMELINE_ENTRY_TENANT_MISMATCH:
    "The audit timeline entry tenant scope is invalid.",
  AUDIT_TIMELINE_ENTRY_ORDER_INVALID:
    "The audit timeline entry order is invalid.",
  AUDIT_TIMELINE_ENTRY_SEQUENCE_INVALID:
    "The audit timeline entry sequence is invalid.",
  AUDIT_TIMELINE_AUDIT_RECORD_INVALID:
    "The audit record descriptor is invalid.",
  AUDIT_TIMELINE_AUDIT_RECORD_TENANT_MISMATCH:
    "The audit record timeline scope is invalid.",
  AUDIT_TIMELINE_AUDIT_EMISSION_RESULT_INVALID:
    "The audit emission result descriptor is invalid.",
  AUDIT_TIMELINE_AUDIT_EMISSION_RESULT_TENANT_MISMATCH:
    "The audit emission result timeline scope is invalid.",
  AUDIT_TIMELINE_CURSOR_REQUIRED:
    "An audit timeline cursor descriptor is required.",
  AUDIT_TIMELINE_CURSOR_INVALID:
    "The audit timeline cursor descriptor is invalid.",
  AUDIT_TIMELINE_CURSOR_TENANT_MISMATCH:
    "The audit timeline cursor tenant scope is invalid.",
  AUDIT_TIMELINE_CURSOR_TIMELINE_MISMATCH:
    "The audit timeline cursor timeline scope is invalid.",
  INVALID_AUDIT_TIMELINE_TIMESTAMP:
    "The audit timeline timestamp is invalid.",
  UNSAFE_AUDIT_TIMELINE_METADATA:
    "The audit timeline metadata is unsafe.",
  AUDIT_TIMELINE_NOT_VALID: "The audit timeline descriptor is not valid.",
};

export const AuditTimelineDenialSchema = z
  .object({
    code: AuditTimelineDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createAuditTimelineDenial(
  input: CreateAuditTimelineDenialInput,
): AuditTimelineDenial {
  return {
    code: input.code,
    message: SAFE_AUDIT_TIMELINE_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
