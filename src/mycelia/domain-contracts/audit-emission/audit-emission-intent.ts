import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";
import {
  AuditOpaqueReferenceSchema,
  AuditReasonCodeSchema,
  AuditRecordSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";

import { AuditEmissionTargetSchema } from "./audit-emission-target";

export const AuditEmissionIntentIdSchema = AuditOpaqueReferenceSchema;

export const AuditEmissionIntentSchema = z
  .object({
    audit_emission_intent_id: AuditEmissionIntentIdSchema,
    tenant_id: TenantIdSchema,
    audit_record: AuditRecordSchema.optional(),
    audit_record_ref: AuditOpaqueReferenceSchema.optional(),
    target: AuditEmissionTargetSchema,
    emission_reason_code: AuditReasonCodeSchema,
    data_classification: DataClassificationSchema,
    requested_at: z.string().refine(
      isAuditIsoDateTime,
      "requested_at must be an ISO datetime string.",
    ),
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((intent, context) => {
    if (
      intent.audit_record === undefined &&
      intent.audit_record_ref === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "audit_record or audit_record_ref is required.",
        path: ["audit_record"],
      });
    }

    if (
      intent.audit_record !== undefined &&
      intent.audit_record.tenant_id !== intent.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "audit_record tenant_id must match audit emission tenant_id.",
        path: ["audit_record", "tenant_id"],
      });
    }

    if (intent.target.tenant_id !== intent.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "target tenant_id must match audit emission tenant_id.",
        path: ["target", "tenant_id"],
      });
    }
  });

export type AuditEmissionIntent = z.infer<typeof AuditEmissionIntentSchema>;
export type AuditEmissionIntentInput = z.input<
  typeof AuditEmissionIntentSchema
>;
