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
  RuntimeStateSchema,
  RuntimeStateKindSchema,
  RuntimeStateOpaqueReferenceSchema,
} from "../../domain-contracts/runtime-state";

import {
  StateTransitionIntentSchema,
  StateTransitionOpaqueReferenceSchema,
  SafeStateTransitionMetadataSchema,
  isStateTransitionIsoDateTime,
} from "./state-transition-intent";
import { isAllowedStateTransitionRule } from "./state-transition-rule";

export const StateTransitionIdSchema =
  StateTransitionOpaqueReferenceSchema;

export type StateTransitionId = z.infer<typeof StateTransitionIdSchema>;

export const StateTransitionSchema = z
  .object({
    transition_id: StateTransitionIdSchema,
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema,
    from_state_ref: RuntimeStateOpaqueReferenceSchema.optional(),
    from_state: RuntimeStateSchema.optional(),
    to_state_ref: RuntimeStateOpaqueReferenceSchema.optional(),
    to_state: RuntimeStateSchema.optional(),
    intent_ref: StateTransitionOpaqueReferenceSchema.optional(),
    intent: StateTransitionIntentSchema.optional(),
    from_kind: RuntimeStateKindSchema,
    to_kind: RuntimeStateKindSchema,
    from_version: z
      .number()
      .int("from_version must be an integer.")
      .positive("from_version must be positive."),
    to_version: z
      .number()
      .int("to_version must be an integer.")
      .positive("to_version must be positive."),
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    data_classification: DataClassificationSchema,
    validated_at: z.string().refine(
      isStateTransitionIsoDateTime,
      "validated_at must be an ISO datetime string.",
    ),
    metadata: SafeStateTransitionMetadataSchema.optional(),
  })
  .strict()
  .superRefine((transition, context) => {
    if (
      transition.from_state_ref === undefined &&
      transition.from_state === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "from state reference is required.",
        path: ["from_state_ref"],
      });
    }

    if (
      transition.to_state_ref === undefined &&
      transition.to_state === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "to state reference is required.",
        path: ["to_state_ref"],
      });
    }

    if (transition.intent_ref === undefined && transition.intent === undefined) {
      context.addIssue({
        code: "custom",
        message: "transition intent reference is required.",
        path: ["intent_ref"],
      });
    }

    if (transition.to_version !== transition.from_version + 1) {
      context.addIssue({
        code: "custom",
        message: "to_version must equal from_version + 1.",
        path: ["to_version"],
      });
    }

    if (
      !isAllowedStateTransitionRule(transition.from_kind, transition.to_kind)
    ) {
      context.addIssue({
        code: "custom",
        message: "state transition rule is not allowed.",
        path: ["to_kind"],
      });
    }

    if (
      transition.from_state !== undefined &&
      transition.from_state.tenant_id !== transition.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "from_state tenant_id must match transition tenant_id.",
        path: ["from_state", "tenant_id"],
      });
    }

    if (
      transition.to_state !== undefined &&
      transition.to_state.tenant_id !== transition.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "to_state tenant_id must match transition tenant_id.",
        path: ["to_state", "tenant_id"],
      });
    }

    if (
      transition.from_state !== undefined &&
      transition.from_state.run_id !== transition.run_id
    ) {
      context.addIssue({
        code: "custom",
        message: "from_state run_id must match transition run_id.",
        path: ["from_state", "run_id"],
      });
    }

    if (
      transition.to_state !== undefined &&
      transition.to_state.run_id !== transition.run_id
    ) {
      context.addIssue({
        code: "custom",
        message: "to_state run_id must match transition run_id.",
        path: ["to_state", "run_id"],
      });
    }

    if (
      transition.from_state !== undefined &&
      transition.from_state.kind !== transition.from_kind
    ) {
      context.addIssue({
        code: "custom",
        message: "from_state kind must match transition from_kind.",
        path: ["from_state", "kind"],
      });
    }

    if (
      transition.to_state !== undefined &&
      transition.to_state.kind !== transition.to_kind
    ) {
      context.addIssue({
        code: "custom",
        message: "to_state kind must match transition to_kind.",
        path: ["to_state", "kind"],
      });
    }

    if (
      transition.from_state !== undefined &&
      transition.from_state.version !== transition.from_version
    ) {
      context.addIssue({
        code: "custom",
        message: "from_state version must match transition from_version.",
        path: ["from_state", "version"],
      });
    }

    if (
      transition.to_state !== undefined &&
      transition.to_state.version !== transition.to_version
    ) {
      context.addIssue({
        code: "custom",
        message: "to_state version must match transition to_version.",
        path: ["to_state", "version"],
      });
    }

    if (
      transition.intent !== undefined &&
      transition.intent.tenant_id !== transition.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "intent tenant_id must match transition tenant_id.",
        path: ["intent", "tenant_id"],
      });
    }

    if (
      transition.intent !== undefined &&
      transition.intent.run_id !== transition.run_id
    ) {
      context.addIssue({
        code: "custom",
        message: "intent run_id must match transition run_id.",
        path: ["intent", "run_id"],
      });
    }

    if (
      transition.intent !== undefined &&
      transition.intent.from_kind !== transition.from_kind
    ) {
      context.addIssue({
        code: "custom",
        message: "intent from_kind must match transition from_kind.",
        path: ["intent", "from_kind"],
      });
    }

    if (
      transition.intent !== undefined &&
      transition.intent.to_kind !== transition.to_kind
    ) {
      context.addIssue({
        code: "custom",
        message: "intent to_kind must match transition to_kind.",
        path: ["intent", "to_kind"],
      });
    }

    if (
      transition.intent !== undefined &&
      transition.intent.expected_from_version !== transition.from_version
    ) {
      context.addIssue({
        code: "custom",
        message:
          "intent expected_from_version must match transition from_version.",
        path: ["intent", "expected_from_version"],
      });
    }
  });

export type StateTransition = z.infer<typeof StateTransitionSchema>;
export type StateTransitionInput = z.input<typeof StateTransitionSchema>;
