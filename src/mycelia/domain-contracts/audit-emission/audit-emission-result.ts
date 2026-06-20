import { z } from "zod";

import {
  CorrelationIdSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";
import {
  AuditMessageSchema,
  AuditOpaqueReferenceSchema,
  AuditReasonCodeSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";

import { AuditEmissionDenialSchema } from "./audit-emission-denial";
import { AuditEmissionIntentIdSchema } from "./audit-emission-intent";
import { AuditEmissionTargetSchema } from "./audit-emission-target";

export const AuditEmissionOutcomes = ["READY", "REJECTED"] as const;

export type AuditEmissionOutcome = (typeof AuditEmissionOutcomes)[number];

export const AuditEmissionOutcomeSchema = z.enum(AuditEmissionOutcomes);

export const AuditEmissionResultIdSchema = AuditOpaqueReferenceSchema;

export const AuditEmissionResultSchema = z
  .object({
    audit_emission_result_id: AuditEmissionResultIdSchema,
    audit_emission_intent_id: AuditEmissionIntentIdSchema,
    tenant_id: TenantIdSchema,
    outcome: AuditEmissionOutcomeSchema,
    reason_code: AuditReasonCodeSchema,
    message: AuditMessageSchema,
    decided_at: z.string().refine(
      isAuditIsoDateTime,
      "decided_at must be an ISO datetime string.",
    ),
    correlation_id: CorrelationIdSchema,
    target: AuditEmissionTargetSchema.optional(),
    audit_record_ref: AuditOpaqueReferenceSchema.optional(),
    denial: AuditEmissionDenialSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((result, context) => {
    if (result.outcome === "READY") {
      if (result.target === undefined) {
        context.addIssue({
          code: "custom",
          message: "READY result requires a target descriptor.",
          path: ["target"],
        });
      }

      if (result.audit_record_ref === undefined) {
        context.addIssue({
          code: "custom",
          message: "READY result requires an audit record reference.",
          path: ["audit_record_ref"],
        });
      }
    }

    if (
      result.target !== undefined &&
      result.target.tenant_id !== result.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "target tenant_id must match audit emission result.",
        path: ["target", "tenant_id"],
      });
    }
  });

export type AuditEmissionResult = z.infer<typeof AuditEmissionResultSchema>;
export type AuditEmissionResultInput = z.input<
  typeof AuditEmissionResultSchema
>;
