import { z } from "zod";

import {
  CorrelationIdSchema,
  RunIdSchema,
  TenantIdSchema,
} from "../shared-kernel";
import {
  SafeStateTransitionMetadataSchema,
  StateTransitionReasonCodeSchema,
  StateTransitionResultSchema,
  StateTransitionSchema,
  isStateTransitionIsoDateTime,
} from "../state-transition";

import {
  StateTransitionCoordinationDenialSchema,
} from "./state-transition-coordination-denial";
import {
  StateTransitionCoordinationRequestIdSchema,
} from "./state-transition-coordination-request";

export const StateTransitionCoordinationOutcomes = [
  "READY",
  "REJECTED",
] as const;

export type StateTransitionCoordinationOutcome =
  (typeof StateTransitionCoordinationOutcomes)[number];

export const StateTransitionCoordinationOutcomeSchema = z.enum(
  StateTransitionCoordinationOutcomes,
);

export const StateTransitionCoordinationResultIdSchema =
  StateTransitionCoordinationRequestIdSchema;

const UNSAFE_COORDINATION_RESULT_MESSAGE_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|checkpoint[_-]?internals|credential|display[_-]?name|event[_-]?internals|external[_-]?id|password|permission|policy[_-]?internals|private[_-]?key|raw|run[_-]?internals|secret|state[_-]?internals|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name)/i;

export const StateTransitionCoordinationMessageSchema = z
  .string()
  .min(1, "message is required.")
  .max(240, "message must not exceed 240 characters.")
  .refine(
    (value) => !UNSAFE_COORDINATION_RESULT_MESSAGE_PATTERN.test(value),
    "message must be safe and non-enumerating.",
  );

export const StateTransitionCoordinationResultSchema = z
  .object({
    coordination_result_id: StateTransitionCoordinationResultIdSchema,
    coordination_request_id: StateTransitionCoordinationRequestIdSchema,
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema,
    outcome: StateTransitionCoordinationOutcomeSchema,
    reason_code: StateTransitionReasonCodeSchema,
    message: StateTransitionCoordinationMessageSchema,
    decided_at: z.string().refine(
      isStateTransitionIsoDateTime,
      "decided_at must be an ISO datetime string.",
    ),
    correlation_id: CorrelationIdSchema,
    transition: StateTransitionSchema.optional(),
    transition_result: StateTransitionResultSchema.optional(),
    denial: StateTransitionCoordinationDenialSchema.optional(),
    metadata: SafeStateTransitionMetadataSchema.optional(),
  })
  .strict()
  .superRefine((result, context) => {
    if (result.outcome === "READY") {
      if (result.transition === undefined) {
        context.addIssue({
          code: "custom",
          message: "READY result requires a transition descriptor.",
          path: ["transition"],
        });
      }

      if (result.transition_result?.outcome !== "ACCEPTED") {
        context.addIssue({
          code: "custom",
          message:
            "READY result requires an accepted transition result descriptor.",
          path: ["transition_result"],
        });
      }
    }

    if (
      result.transition !== undefined &&
      result.transition.tenant_id !== result.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "transition tenant_id must match coordination result.",
        path: ["transition", "tenant_id"],
      });
    }

    if (
      result.transition !== undefined &&
      result.transition.run_id !== result.run_id
    ) {
      context.addIssue({
        code: "custom",
        message: "transition run_id must match coordination result.",
        path: ["transition", "run_id"],
      });
    }

    if (
      result.transition_result !== undefined &&
      result.transition_result.tenant_id !== result.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message:
          "transition_result tenant_id must match coordination result.",
        path: ["transition_result", "tenant_id"],
      });
    }

    if (
      result.transition_result !== undefined &&
      result.transition_result.run_id !== result.run_id
    ) {
      context.addIssue({
        code: "custom",
        message: "transition_result run_id must match coordination result.",
        path: ["transition_result", "run_id"],
      });
    }
  });

export type StateTransitionCoordinationResult = z.infer<
  typeof StateTransitionCoordinationResultSchema
>;
export type StateTransitionCoordinationResultInput = z.input<
  typeof StateTransitionCoordinationResultSchema
>;
