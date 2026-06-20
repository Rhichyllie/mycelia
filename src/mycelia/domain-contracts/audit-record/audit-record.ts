import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";

import { AuditActorRefSchema } from "./audit-actor-ref";
import {
  AuditEvidenceRefSchema,
  AuditMessageSchema,
  AuditOpaqueReferenceSchema,
  AuditReasonCodeSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "./audit-evidence-ref";
import { AuditRecordKindSchema } from "./audit-record-kind";
import { AuditSubjectRefSchema } from "./audit-subject-ref";

export const AuditRecordOutcomes = ["RECORDED", "REJECTED"] as const;

export type AuditRecordOutcome = (typeof AuditRecordOutcomes)[number];

export const AuditRecordOutcomeSchema = z.enum(AuditRecordOutcomes);

export const AuditRecordIdSchema = AuditOpaqueReferenceSchema;

export const AuditRecordSchema = z
  .object({
    audit_record_id: AuditRecordIdSchema,
    tenant_id: TenantIdSchema,
    kind: AuditRecordKindSchema,
    actor_ref: AuditActorRefSchema,
    subject_ref: AuditSubjectRefSchema,
    evidence_ref: AuditEvidenceRefSchema,
    outcome: AuditRecordOutcomeSchema,
    reason_code: AuditReasonCodeSchema,
    message: AuditMessageSchema,
    data_classification: DataClassificationSchema,
    recorded_at: z
      .string()
      .refine(
        isAuditIsoDateTime,
        "recorded_at must be an ISO datetime string.",
      ),
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((record, context) => {
    if (record.subject_ref.tenant_id !== record.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "subject_ref tenant_id must match audit record tenant_id.",
        path: ["subject_ref", "tenant_id"],
      });
    }

    if (record.evidence_ref.tenant_id !== record.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "evidence_ref tenant_id must match audit record tenant_id.",
        path: ["evidence_ref", "tenant_id"],
      });
    }

    if (
      record.actor_ref.tenant_id !== undefined &&
      record.actor_ref.tenant_id !== record.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "actor_ref tenant_id must match audit record tenant_id.",
        path: ["actor_ref", "tenant_id"],
      });
    }
  });

export type AuditRecord = z.infer<typeof AuditRecordSchema>;
export type AuditRecordInput = z.input<typeof AuditRecordSchema>;
