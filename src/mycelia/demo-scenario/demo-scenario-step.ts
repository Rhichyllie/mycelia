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

export const DemoScenarioStepKinds = [
  "REQUEST_RECEIVED",
  "IDENTITY_RESOLVED",
  "POLICY_DECIDED",
  "RUNTIME_ENVELOPE_PREPARED",
  "ADMISSION_DECIDED",
  "GOVERNED_RUN_REGISTERED",
  "RUNTIME_STATE_DESCRIBED",
  "STATE_TRANSITION_VALIDATED",
  "AUDIT_RECORD_PREPARED",
  "AUDIT_TIMELINE_DESCRIBED",
  "INVESTIGATION_BUNDLE_PREPARED",
  "REPLAY_PLAN_PREPARED",
] as const;

export type DemoScenarioStepKind = (typeof DemoScenarioStepKinds)[number];

export const DemoScenarioStepKindSchema = z.enum(DemoScenarioStepKinds);

const UNSAFE_DEMO_SCENARIO_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|connection|credential|database|descriptor[_-]?internals|display[_-]?name|event[_-]?internals|external[_-]?id|password|path|permission|policy[_-]?internals|private[_-]?key|query|raw|replay[_-]?internals|run[_-]?internals|secret|state[_-]?internals|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name)/i;

const UNSAFE_DEMO_SCENARIO_REF_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|connection|credential|database|endpoint|password|path|private[_-]?key|query|raw|secret|select\s|insert\s|update\s|delete\s|drop\s|shell|sql|token|\s)/i;

export const DemoScenarioReferenceSchema = AuditOpaqueReferenceSchema.refine(
  (value) => !UNSAFE_DEMO_SCENARIO_REF_PATTERN.test(value),
  "demo scenario reference must be opaque and safe.",
);

export const DemoScenarioTextSchema = z
  .string()
  .min(1, "text is required.")
  .max(360, "text must not exceed 360 characters.")
  .refine(
    (value) => !UNSAFE_DEMO_SCENARIO_TEXT_PATTERN.test(value),
    "text must be safe and non-enumerating.",
  );

export const DemoScenarioTitleSchema = z
  .string()
  .min(1, "title is required.")
  .max(120, "title must not exceed 120 characters.")
  .refine(
    (value) => !UNSAFE_DEMO_SCENARIO_TEXT_PATTERN.test(value),
    "title must be safe and non-enumerating.",
  );

export const DemoScenarioDescriptionSchema = DemoScenarioTextSchema;

export const DemoScenarioStepIdSchema = DemoScenarioReferenceSchema;

export const DemoScenarioStepSchema = z
  .object({
    demo_scenario_step_id: DemoScenarioStepIdSchema,
    tenant_id: TenantIdSchema,
    step_order: z
      .number()
      .int("step_order must be an integer.")
      .positive("step_order must be positive."),
    step_kind: DemoScenarioStepKindSchema,
    title: DemoScenarioTitleSchema,
    description: DemoScenarioDescriptionSchema,
    descriptor_ref: DemoScenarioReferenceSchema.optional(),
    data_classification: DataClassificationSchema,
    occurred_at: z
      .string()
      .refine(
        isAuditIsoDateTime,
        "occurred_at must be an ISO datetime string.",
      )
      .optional(),
    planned_at: z
      .string()
      .refine(
        isAuditIsoDateTime,
        "planned_at must be an ISO datetime string.",
      )
      .optional(),
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .refine(
    (step) => step.occurred_at !== undefined || step.planned_at !== undefined,
    "occurred_at or planned_at is required.",
  );

export type DemoScenarioStep = z.infer<typeof DemoScenarioStepSchema>;
export type DemoScenarioStepInput = z.input<typeof DemoScenarioStepSchema>;
