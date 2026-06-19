import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../../foundation/shared-kernel";

export const StateTransitionCoordinationDenialCodes = [
  "STATE_TRANSITION_COORDINATION_REQUEST_REQUIRED",
  "STATE_TRANSITION_COORDINATION_REQUEST_INVALID",
  "STATE_TRANSITION_COORDINATION_RESULT_REQUIRED",
  "STATE_TRANSITION_COORDINATION_RESULT_INVALID",
  "STATE_TRANSITION_COORDINATION_NOT_READY",
  "COORDINATION_REQUEST_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "RUN_ID_REQUIRED",
  "CURRENT_STATE_REQUIRED",
  "CURRENT_STATE_INVALID",
  "TRANSITION_INTENT_REQUIRED",
  "TRANSITION_INTENT_INVALID",
  "STATE_TRANSITION_COORDINATION_TENANT_MISMATCH",
  "STATE_TRANSITION_COORDINATION_RUN_MISMATCH",
  "STATE_TRANSITION_COORDINATION_KIND_MISMATCH",
  "STATE_TRANSITION_COORDINATION_VERSION_MISMATCH",
  "STATE_TRANSITION_RULE_DENIED",
  "STATE_TRANSITION_DESCRIPTOR_INVALID",
  "INVALID_STATE_TRANSITION_COORDINATION_TIMESTAMP",
  "UNSAFE_STATE_TRANSITION_COORDINATION_METADATA",
] as const;

export type StateTransitionCoordinationDenialCode =
  (typeof StateTransitionCoordinationDenialCodes)[number];

export const StateTransitionCoordinationDenialCodeSchema = z.enum(
  StateTransitionCoordinationDenialCodes,
);

export type StateTransitionCoordinationDenial = {
  readonly code: StateTransitionCoordinationDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateStateTransitionCoordinationDenialInput = {
  readonly code: StateTransitionCoordinationDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_STATE_TRANSITION_COORDINATION_DENIAL_MESSAGES: Record<
  StateTransitionCoordinationDenialCode,
  string
> = {
  STATE_TRANSITION_COORDINATION_REQUEST_REQUIRED:
    "A state transition coordination request is required.",
  STATE_TRANSITION_COORDINATION_REQUEST_INVALID:
    "The state transition coordination request is invalid.",
  STATE_TRANSITION_COORDINATION_RESULT_REQUIRED:
    "A state transition coordination result is required.",
  STATE_TRANSITION_COORDINATION_RESULT_INVALID:
    "The state transition coordination result is invalid.",
  STATE_TRANSITION_COORDINATION_NOT_READY:
    "The state transition coordination is not ready.",
  COORDINATION_REQUEST_ID_REQUIRED:
    "A coordination request identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  RUN_ID_REQUIRED: "A run identity is required.",
  CURRENT_STATE_REQUIRED: "A current runtime state is required.",
  CURRENT_STATE_INVALID: "The current runtime state is invalid.",
  TRANSITION_INTENT_REQUIRED: "A state transition intent is required.",
  TRANSITION_INTENT_INVALID: "The state transition intent is invalid.",
  STATE_TRANSITION_COORDINATION_TENANT_MISMATCH:
    "The coordination tenant scope is invalid.",
  STATE_TRANSITION_COORDINATION_RUN_MISMATCH:
    "The coordination run scope is invalid.",
  STATE_TRANSITION_COORDINATION_KIND_MISMATCH:
    "The coordination state kind is invalid.",
  STATE_TRANSITION_COORDINATION_VERSION_MISMATCH:
    "The coordination state version is invalid.",
  STATE_TRANSITION_RULE_DENIED:
    "The requested state transition is not allowed.",
  STATE_TRANSITION_DESCRIPTOR_INVALID:
    "The state transition descriptor is invalid.",
  INVALID_STATE_TRANSITION_COORDINATION_TIMESTAMP:
    "The state transition coordination timestamp is invalid.",
  UNSAFE_STATE_TRANSITION_COORDINATION_METADATA:
    "The state transition coordination metadata is unsafe.",
};

export const StateTransitionCoordinationDenialSchema = z
  .object({
    code: StateTransitionCoordinationDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createStateTransitionCoordinationDenial(
  input: CreateStateTransitionCoordinationDenialInput,
): StateTransitionCoordinationDenial {
  return {
    code: input.code,
    message: SAFE_STATE_TRANSITION_COORDINATION_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
