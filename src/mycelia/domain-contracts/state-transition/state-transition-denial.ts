import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../../foundation/shared-kernel";

export const StateTransitionDenialCodes = [
  "STATE_TRANSITION_INTENT_REQUIRED",
  "STATE_TRANSITION_INTENT_INVALID",
  "STATE_TRANSITION_REQUIRED",
  "STATE_TRANSITION_INVALID",
  "STATE_TRANSITION_RESULT_REQUIRED",
  "STATE_TRANSITION_RESULT_INVALID",
  "STATE_TRANSITION_NOT_ACCEPTED",
  "TRANSITION_ID_REQUIRED",
  "TRANSITION_INTENT_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "RUN_ID_REQUIRED",
  "FROM_STATE_ID_REQUIRED",
  "FROM_STATE_REQUIRED",
  "TO_STATE_REQUIRED",
  "EXPECTED_FROM_VERSION_INVALID",
  "STATE_TRANSITION_VERSION_INVALID",
  "STATE_TRANSITION_VERSION_MISMATCH",
  "STATE_TRANSITION_RULE_DENIED",
  "STATE_TRANSITION_TENANT_MISMATCH",
  "STATE_TRANSITION_RUN_MISMATCH",
  "STATE_TRANSITION_KIND_MISMATCH",
  "INVALID_STATE_TRANSITION_TIMESTAMP",
  "UNSAFE_STATE_TRANSITION_METADATA",
] as const;

export type StateTransitionDenialCode =
  (typeof StateTransitionDenialCodes)[number];

export const StateTransitionDenialCodeSchema = z.enum(
  StateTransitionDenialCodes,
);

export type StateTransitionDenial = {
  readonly code: StateTransitionDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateStateTransitionDenialInput = {
  readonly code: StateTransitionDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_STATE_TRANSITION_DENIAL_MESSAGES: Record<
  StateTransitionDenialCode,
  string
> = {
  STATE_TRANSITION_INTENT_REQUIRED:
    "A state transition intent is required.",
  STATE_TRANSITION_INTENT_INVALID:
    "The state transition intent is invalid.",
  STATE_TRANSITION_REQUIRED: "A state transition descriptor is required.",
  STATE_TRANSITION_INVALID: "The state transition descriptor is invalid.",
  STATE_TRANSITION_RESULT_REQUIRED:
    "A state transition result descriptor is required.",
  STATE_TRANSITION_RESULT_INVALID:
    "The state transition result descriptor is invalid.",
  STATE_TRANSITION_NOT_ACCEPTED:
    "The state transition contract was not accepted.",
  TRANSITION_ID_REQUIRED: "A transition identity is required.",
  TRANSITION_INTENT_ID_REQUIRED:
    "A transition intent identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  RUN_ID_REQUIRED: "A run identity is required.",
  FROM_STATE_ID_REQUIRED: "A source state identity is required.",
  FROM_STATE_REQUIRED: "A source state reference is required.",
  TO_STATE_REQUIRED: "A target state reference is required.",
  EXPECTED_FROM_VERSION_INVALID:
    "The expected source state version is invalid.",
  STATE_TRANSITION_VERSION_INVALID:
    "The state transition version must be a positive integer.",
  STATE_TRANSITION_VERSION_MISMATCH:
    "The state transition version contract is invalid.",
  STATE_TRANSITION_RULE_DENIED:
    "The requested state transition is not allowed.",
  STATE_TRANSITION_TENANT_MISMATCH:
    "The state transition tenant scope is invalid.",
  STATE_TRANSITION_RUN_MISMATCH:
    "The state transition run scope is invalid.",
  STATE_TRANSITION_KIND_MISMATCH:
    "The state transition kind contract is invalid.",
  INVALID_STATE_TRANSITION_TIMESTAMP:
    "The state transition timestamp is invalid.",
  UNSAFE_STATE_TRANSITION_METADATA:
    "The state transition metadata is unsafe.",
};

export const StateTransitionDenialSchema = z
  .object({
    code: StateTransitionDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createStateTransitionDenial(
  input: CreateStateTransitionDenialInput,
): StateTransitionDenial {
  return {
    code: input.code,
    message: SAFE_STATE_TRANSITION_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
