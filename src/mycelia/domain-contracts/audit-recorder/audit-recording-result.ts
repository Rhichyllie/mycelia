import { z } from "zod";

import {
  CorrelationIdSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";
import {
  AuditMessageSchema,
  AuditOpaqueReferenceSchema,
  AuditReasonCodeSchema,
  AuditRecordSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";

import {
  AuditRecorderDenialSchema,
} from "./audit-recorder-denial";
import {
  AuditRecordingRequestIdSchema,
} from "./audit-recording-request";

export const AuditRecordingOutcomes = ["RECORDED", "REJECTED"] as const;

export type AuditRecordingOutcome = (typeof AuditRecordingOutcomes)[number];

export const AuditRecordingOutcomeSchema = z.enum(AuditRecordingOutcomes);

export const AuditRecordingResultIdSchema = AuditOpaqueReferenceSchema;

export const AuditRecordingResultSchema = z
  .object({
    audit_recording_result_id: AuditRecordingResultIdSchema,
    audit_recording_request_id: AuditRecordingRequestIdSchema,
    tenant_id: TenantIdSchema,
    outcome: AuditRecordingOutcomeSchema,
    reason_code: AuditReasonCodeSchema,
    message: AuditMessageSchema,
    decided_at: z.string().refine(
      isAuditIsoDateTime,
      "decided_at must be an ISO datetime string.",
    ),
    correlation_id: CorrelationIdSchema,
    audit_record: AuditRecordSchema.optional(),
    denial: AuditRecorderDenialSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((result, context) => {
    if (result.outcome === "RECORDED" && result.audit_record === undefined) {
      context.addIssue({
        code: "custom",
        message: "RECORDED result requires an audit record descriptor.",
        path: ["audit_record"],
      });
    }

    if (
      result.audit_record !== undefined &&
      result.audit_record.tenant_id !== result.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "audit_record tenant_id must match audit recording result.",
        path: ["audit_record", "tenant_id"],
      });
    }
  });

export type AuditRecordingResult = z.infer<
  typeof AuditRecordingResultSchema
>;
export type AuditRecordingResultInput = z.input<
  typeof AuditRecordingResultSchema
>;
