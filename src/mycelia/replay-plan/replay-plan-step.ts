import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  TenantIdSchema,
} from "../shared-kernel";
import {
  AuditOpaqueReferenceSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../audit-record";

export const ReplayPlanStepKinds = [
  "INSPECT_AUDIT_TIMELINE",
  "INSPECT_AUDIT_RECORD",
  "INSPECT_RUNTIME_STATE",
  "INSPECT_STATE_TRANSITION",
  "INSPECT_GOVERNED_RUN",
  "INSPECT_EVENT_REFERENCE",
  "COMPARE_DESCRIPTOR",
  "MARK_REPLAY_BOUNDARY",
  "MARK_UNAVAILABLE_CONTEXT",
] as const;

export type ReplayPlanStepKind = (typeof ReplayPlanStepKinds)[number];

export const ReplayPlanStepKindSchema = z.enum(ReplayPlanStepKinds);

const UNSAFE_REPLAY_PLAN_REF_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|connection|credential|database|endpoint|password|path|private[_-]?key|query|raw|secret|select\s|insert\s|update\s|delete\s|drop\s|shell|sql|token|\s)/i;

export const ReplayPlanReferenceSchema = AuditOpaqueReferenceSchema.refine(
  (value) => !UNSAFE_REPLAY_PLAN_REF_PATTERN.test(value),
  "replay plan reference must be opaque and safe.",
);

export const ReplayPlanStepIdSchema = ReplayPlanReferenceSchema;

export const ReplayPlanStepSchema = z
  .object({
    replay_plan_step_id: ReplayPlanStepIdSchema,
    tenant_id: TenantIdSchema,
    step_kind: ReplayPlanStepKindSchema,
    step_order: z
      .number()
      .int("step_order must be an integer.")
      .positive("step_order must be positive."),
    source_ref: ReplayPlanReferenceSchema,
    data_classification: DataClassificationSchema,
    planned_at: z.string().refine(
      isAuditIsoDateTime,
      "planned_at must be an ISO datetime string.",
    ),
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict();

export type ReplayPlanStep = z.infer<typeof ReplayPlanStepSchema>;
export type ReplayPlanStepInput = z.input<typeof ReplayPlanStepSchema>;
