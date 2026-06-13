import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../shared-kernel";

export const ReplayPlanDenialCodes = [
  "REPLAY_PLAN_REQUIRED",
  "REPLAY_PLAN_INVALID",
  "REPLAY_PLAN_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "REPLAY_PLAN_SCOPE_REQUIRED",
  "REPLAY_PLAN_SCOPE_INVALID",
  "REPLAY_PLAN_SCOPE_TENANT_MISMATCH",
  "REPLAY_PLAN_STEPS_REQUIRED",
  "REPLAY_PLAN_STEP_REQUIRED",
  "REPLAY_PLAN_STEP_INVALID",
  "REPLAY_PLAN_STEP_KIND_INVALID",
  "REPLAY_PLAN_STEP_REF_INVALID",
  "REPLAY_PLAN_STEP_TENANT_MISMATCH",
  "REPLAY_PLAN_STEP_TIMESTAMP_INVALID",
  "REPLAY_PLAN_STEP_ORDER_INVALID",
  "REPLAY_PLAN_BUNDLE_INVALID",
  "REPLAY_PLAN_BUNDLE_TENANT_MISMATCH",
  "REPLAY_PLAN_BUNDLE_REF_INVALID",
  "INVALID_REPLAY_PLAN_TIMESTAMP",
  "UNSAFE_REPLAY_PLAN_METADATA",
  "REPLAY_PLAN_NOT_VALID",
] as const;

export type ReplayPlanDenialCode = (typeof ReplayPlanDenialCodes)[number];

export const ReplayPlanDenialCodeSchema = z.enum(ReplayPlanDenialCodes);

export type ReplayPlanDenial = {
  readonly code: ReplayPlanDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateReplayPlanDenialInput = {
  readonly code: ReplayPlanDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_REPLAY_PLAN_DENIAL_MESSAGES: Record<
  ReplayPlanDenialCode,
  string
> = {
  REPLAY_PLAN_REQUIRED: "A replay plan descriptor is required.",
  REPLAY_PLAN_INVALID: "The replay plan descriptor is invalid.",
  REPLAY_PLAN_ID_REQUIRED: "A replay plan identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  REPLAY_PLAN_SCOPE_REQUIRED: "A replay plan scope is required.",
  REPLAY_PLAN_SCOPE_INVALID: "The replay plan scope is invalid.",
  REPLAY_PLAN_SCOPE_TENANT_MISMATCH:
    "The replay plan scope is invalid.",
  REPLAY_PLAN_STEPS_REQUIRED: "Replay plan steps are required.",
  REPLAY_PLAN_STEP_REQUIRED: "A replay plan step descriptor is required.",
  REPLAY_PLAN_STEP_INVALID:
    "The replay plan step descriptor is invalid.",
  REPLAY_PLAN_STEP_KIND_INVALID:
    "The replay plan step kind is invalid.",
  REPLAY_PLAN_STEP_REF_INVALID:
    "The replay plan step reference is invalid.",
  REPLAY_PLAN_STEP_TENANT_MISMATCH:
    "The replay plan step scope is invalid.",
  REPLAY_PLAN_STEP_TIMESTAMP_INVALID:
    "The replay plan step timestamp is invalid.",
  REPLAY_PLAN_STEP_ORDER_INVALID:
    "The replay plan step order is invalid.",
  REPLAY_PLAN_BUNDLE_INVALID:
    "The replay plan investigation bundle descriptor is invalid.",
  REPLAY_PLAN_BUNDLE_TENANT_MISMATCH:
    "The replay plan investigation bundle scope is invalid.",
  REPLAY_PLAN_BUNDLE_REF_INVALID:
    "The replay plan investigation bundle reference is invalid.",
  INVALID_REPLAY_PLAN_TIMESTAMP: "The replay plan timestamp is invalid.",
  UNSAFE_REPLAY_PLAN_METADATA: "The replay plan metadata is unsafe.",
  REPLAY_PLAN_NOT_VALID: "The replay plan descriptor is not valid.",
};

export const ReplayPlanDenialSchema = z
  .object({
    code: ReplayPlanDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createReplayPlanDenial(
  input: CreateReplayPlanDenialInput,
): ReplayPlanDenial {
  return {
    code: input.code,
    message: SAFE_REPLAY_PLAN_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
