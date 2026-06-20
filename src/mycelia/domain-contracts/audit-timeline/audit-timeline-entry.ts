import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  RunIdSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";
import {
  AuditOpaqueReferenceSchema,
  AuditRecordSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";
import { AuditEmissionResultSchema } from "../../domain-contracts/audit-emission";

export const AuditTimelineEntryKinds = [
  "AUDIT_RECORD",
  "AUDIT_RECORDING_RESULT",
  "AUDIT_EMISSION_INTENT",
  "AUDIT_EMISSION_RESULT",
  "RUNTIME_EVENT_REFERENCE",
  "STATE_TRANSITION_REFERENCE",
  "SYSTEM_VALIDATION_REFERENCE",
] as const;

export type AuditTimelineEntryKind =
  (typeof AuditTimelineEntryKinds)[number];

export const AuditTimelineEntryKindSchema = z.enum(
  AuditTimelineEntryKinds,
);

export const AuditTimelineEntryIdSchema = AuditOpaqueReferenceSchema;

export const AuditTimelineEntrySchema = z
  .object({
    audit_timeline_entry_id: AuditTimelineEntryIdSchema,
    tenant_id: TenantIdSchema,
    entry_kind: AuditTimelineEntryKindSchema,
    occurred_at: z.string().refine(
      isAuditIsoDateTime,
      "occurred_at must be an ISO datetime string.",
    ),
    sequence_number: z
      .number()
      .int("sequence_number must be an integer.")
      .positive("sequence_number must be positive."),
    data_classification: DataClassificationSchema,
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    run_id: RunIdSchema.optional(),
    audit_record: AuditRecordSchema.optional(),
    audit_record_ref: AuditOpaqueReferenceSchema.optional(),
    audit_emission_result: AuditEmissionResultSchema.optional(),
    audit_emission_result_ref: AuditOpaqueReferenceSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((entry, context) => {
    if (
      entry.audit_record !== undefined &&
      entry.audit_record.tenant_id !== entry.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "audit_record tenant_id must match timeline entry tenant_id.",
        path: ["audit_record", "tenant_id"],
      });
    }

    if (
      entry.audit_emission_result !== undefined &&
      entry.audit_emission_result.tenant_id !== entry.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message:
          "audit_emission_result tenant_id must match timeline entry tenant_id.",
        path: ["audit_emission_result", "tenant_id"],
      });
    }
  });

export type AuditTimelineEntry = z.infer<typeof AuditTimelineEntrySchema>;
export type AuditTimelineEntryInput = z.input<
  typeof AuditTimelineEntrySchema
>;
