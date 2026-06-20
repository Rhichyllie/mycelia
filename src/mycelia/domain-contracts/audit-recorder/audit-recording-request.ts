import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";
import {
  AuditActorRefSchema,
  AuditEvidenceRefSchema,
  AuditMessageSchema,
  AuditOpaqueReferenceSchema,
  AuditReasonCodeSchema,
  AuditRecordKindSchema,
  AuditRecordOutcomeSchema,
  AuditSubjectRefSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";

export const AuditRecordingRequestIdSchema = AuditOpaqueReferenceSchema;

export const AuditRecordingRequestSchema = z
  .object({
    audit_recording_request_id: AuditRecordingRequestIdSchema,
    tenant_id: TenantIdSchema,
    kind: AuditRecordKindSchema,
    actor_ref: AuditActorRefSchema,
    subject_ref: AuditSubjectRefSchema,
    evidence_ref: AuditEvidenceRefSchema,
    outcome: AuditRecordOutcomeSchema,
    reason_code: AuditReasonCodeSchema,
    message: AuditMessageSchema,
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
  .superRefine((request, context) => {
    if (request.subject_ref.tenant_id !== request.tenant_id) {
      context.addIssue({
        code: "custom",
        message:
          "subject_ref tenant_id must match audit recording tenant_id.",
        path: ["subject_ref", "tenant_id"],
      });
    }

    if (request.evidence_ref.tenant_id !== request.tenant_id) {
      context.addIssue({
        code: "custom",
        message:
          "evidence_ref tenant_id must match audit recording tenant_id.",
        path: ["evidence_ref", "tenant_id"],
      });
    }

    if (
      request.actor_ref.tenant_id !== undefined &&
      request.actor_ref.tenant_id !== request.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "actor_ref tenant_id must match audit recording tenant_id.",
        path: ["actor_ref", "tenant_id"],
      });
    }
  });

export type AuditRecordingRequest = z.infer<
  typeof AuditRecordingRequestSchema
>;
export type AuditRecordingRequestInput = z.input<
  typeof AuditRecordingRequestSchema
>;
