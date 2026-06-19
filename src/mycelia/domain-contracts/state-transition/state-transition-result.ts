import { z } from "zod";

import {
  CorrelationIdSchema,
  RunIdSchema,
  TenantIdSchema,
} from "../../foundation/shared-kernel";

import {
  StateTransitionDenialSchema,
} from "./state-transition-denial";
import {
  StateTransitionIntentIdSchema,
  StateTransitionReasonCodeSchema,
  SafeStateTransitionMetadataSchema,
  isStateTransitionIsoDateTime,
} from "./state-transition-intent";
import { StateTransitionIdSchema } from "./state-transition";

export const StateTransitionResultOutcomes = [
  "ACCEPTED",
  "REJECTED",
] as const;

export type StateTransitionResultOutcome =
  (typeof StateTransitionResultOutcomes)[number];

export const StateTransitionResultOutcomeSchema = z.enum(
  StateTransitionResultOutcomes,
);

export const StateTransitionResultIdSchema =
  StateTransitionIntentIdSchema;

const UNSAFE_STATE_TRANSITION_RESULT_MESSAGE_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|checkpoint[_-]?internals|credential|display[_-]?name|event[_-]?internals|external[_-]?id|password|permission|policy[_-]?internals|private[_-]?key|raw|run[_-]?internals|secret|state[_-]?internals|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name)/i;

export const StateTransitionResultMessageSchema = z
  .string()
  .min(1, "message is required.")
  .max(240, "message must not exceed 240 characters.")
  .refine(
    (value) => !UNSAFE_STATE_TRANSITION_RESULT_MESSAGE_PATTERN.test(value),
    "message must be safe and non-enumerating.",
  );

export const StateTransitionResultSchema = z
  .object({
    transition_result_id: StateTransitionResultIdSchema,
    transition_id: StateTransitionIdSchema.optional(),
    transition_intent_id: StateTransitionIntentIdSchema.optional(),
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema,
    outcome: StateTransitionResultOutcomeSchema,
    reason_code: StateTransitionReasonCodeSchema,
    message: StateTransitionResultMessageSchema,
    decided_at: z.string().refine(
      isStateTransitionIsoDateTime,
      "decided_at must be an ISO datetime string.",
    ),
    correlation_id: CorrelationIdSchema,
    denial: StateTransitionDenialSchema.optional(),
    transition_ref: StateTransitionIdSchema.optional(),
    metadata: SafeStateTransitionMetadataSchema.optional(),
  })
  .strict()
  .refine(
    (result) =>
      result.transition_id !== undefined ||
      result.transition_intent_id !== undefined,
    "transition_id or transition_intent_id is required.",
  );

export type StateTransitionResult = z.infer<
  typeof StateTransitionResultSchema
>;
export type StateTransitionResultInput = z.input<
  typeof StateTransitionResultSchema
>;
