import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../shared-kernel";

export const DemoScenarioDenialCodes = [
  "DEMO_SCENARIO_REQUIRED",
  "DEMO_SCENARIO_INVALID",
  "DEMO_SCENARIO_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "DEMO_SCENARIO_KIND_INVALID",
  "DEMO_SCENARIO_SCOPE_INVALID",
  "DEMO_SCENARIO_STEPS_REQUIRED",
  "DEMO_SCENARIO_STEP_REQUIRED",
  "DEMO_SCENARIO_STEP_INVALID",
  "DEMO_SCENARIO_STEP_KIND_INVALID",
  "DEMO_SCENARIO_STEP_REF_INVALID",
  "DEMO_SCENARIO_STEP_TENANT_MISMATCH",
  "DEMO_SCENARIO_STEP_ORDER_INVALID",
  "DEMO_SCENARIO_STEP_TIMESTAMP_INVALID",
  "UNSAFE_DEMO_SCENARIO_TEXT",
  "DEMO_SCENARIO_LINK_REQUIRED",
  "DEMO_SCENARIO_LINK_INVALID",
  "DEMO_SCENARIO_LINK_TENANT_MISMATCH",
  "DEMO_SCENARIO_LINK_STEP_REFERENCE_INVALID",
  "DEMO_SCENARIO_LINK_SELF_REFERENCE_INVALID",
  "UNSAFE_DEMO_SCENARIO_REASON_CODE",
  "INVALID_DEMO_SCENARIO_TIMESTAMP",
  "UNSAFE_DEMO_SCENARIO_METADATA",
  "DEMO_SCENARIO_NOT_VALID",
] as const;

export type DemoScenarioDenialCode =
  (typeof DemoScenarioDenialCodes)[number];

export const DemoScenarioDenialCodeSchema = z.enum(
  DemoScenarioDenialCodes,
);

export type DemoScenarioDenial = {
  readonly code: DemoScenarioDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateDemoScenarioDenialInput = {
  readonly code: DemoScenarioDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_DEMO_SCENARIO_DENIAL_MESSAGES: Record<
  DemoScenarioDenialCode,
  string
> = {
  DEMO_SCENARIO_REQUIRED: "A demo scenario descriptor is required.",
  DEMO_SCENARIO_INVALID: "The demo scenario descriptor is invalid.",
  DEMO_SCENARIO_ID_REQUIRED: "A demo scenario identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  DEMO_SCENARIO_KIND_INVALID: "The demo scenario kind is invalid.",
  DEMO_SCENARIO_SCOPE_INVALID: "The demo scenario scope is invalid.",
  DEMO_SCENARIO_STEPS_REQUIRED: "Demo scenario steps are required.",
  DEMO_SCENARIO_STEP_REQUIRED:
    "A demo scenario step descriptor is required.",
  DEMO_SCENARIO_STEP_INVALID:
    "The demo scenario step descriptor is invalid.",
  DEMO_SCENARIO_STEP_KIND_INVALID:
    "The demo scenario step kind is invalid.",
  DEMO_SCENARIO_STEP_REF_INVALID:
    "The demo scenario step reference is invalid.",
  DEMO_SCENARIO_STEP_TENANT_MISMATCH:
    "The demo scenario step scope is invalid.",
  DEMO_SCENARIO_STEP_ORDER_INVALID:
    "The demo scenario step order is invalid.",
  DEMO_SCENARIO_STEP_TIMESTAMP_INVALID:
    "The demo scenario step timestamp is invalid.",
  UNSAFE_DEMO_SCENARIO_TEXT: "The demo scenario text is unsafe.",
  DEMO_SCENARIO_LINK_REQUIRED:
    "A demo scenario link descriptor is required.",
  DEMO_SCENARIO_LINK_INVALID:
    "The demo scenario link descriptor is invalid.",
  DEMO_SCENARIO_LINK_TENANT_MISMATCH:
    "The demo scenario link scope is invalid.",
  DEMO_SCENARIO_LINK_STEP_REFERENCE_INVALID:
    "The demo scenario link step reference is invalid.",
  DEMO_SCENARIO_LINK_SELF_REFERENCE_INVALID:
    "The demo scenario link self-reference is invalid.",
  UNSAFE_DEMO_SCENARIO_REASON_CODE:
    "The demo scenario link reason code is unsafe.",
  INVALID_DEMO_SCENARIO_TIMESTAMP:
    "The demo scenario timestamp is invalid.",
  UNSAFE_DEMO_SCENARIO_METADATA:
    "The demo scenario metadata is unsafe.",
  DEMO_SCENARIO_NOT_VALID:
    "The demo scenario descriptor is not valid.",
};

export const DemoScenarioDenialSchema = z
  .object({
    code: DemoScenarioDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createDemoScenarioDenial(
  input: CreateDemoScenarioDenialInput,
): DemoScenarioDenial {
  return {
    code: input.code,
    message: SAFE_DEMO_SCENARIO_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
