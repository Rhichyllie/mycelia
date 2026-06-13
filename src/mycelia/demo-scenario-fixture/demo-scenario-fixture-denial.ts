import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../shared-kernel";

export const DemoScenarioFixtureDenialCodes = [
  "DEMO_SCENARIO_FIXTURE_REQUIRED",
  "DEMO_SCENARIO_FIXTURE_INVALID",
  "DEMO_SCENARIO_FIXTURE_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "DEMO_SCENARIO_FIXTURE_SCOPE_INVALID",
  "DEMO_SCENARIO_FIXTURE_KIND_INVALID",
  "DEMO_SCENARIO_FIXTURE_SCENARIO_REQUIRED",
  "DEMO_SCENARIO_FIXTURE_SCENARIO_INVALID",
  "DEMO_SCENARIO_FIXTURE_SCENARIO_TENANT_MISMATCH",
  "DEMO_SCENARIO_FIXTURE_SCENARIO_KIND_MISMATCH",
  "DEMO_SCENARIO_FIXTURE_SCENARIO_REF_INVALID",
  "DEMO_SCENARIO_FIXTURE_EXPECTED_KIND_INVALID",
  "DEMO_SCENARIO_FIXTURE_MANIFEST_REQUIRED",
  "DEMO_SCENARIO_FIXTURE_MANIFEST_INVALID",
  "DEMO_SCENARIO_FIXTURE_MANIFEST_ID_REQUIRED",
  "DEMO_SCENARIO_FIXTURE_MANIFEST_FIXTURES_REQUIRED",
  "DEMO_SCENARIO_FIXTURE_MANIFEST_TENANT_MISMATCH",
  "DEMO_SCENARIO_FIXTURE_MANIFEST_VERSION_INVALID",
  "DEMO_SCENARIO_FIXTURE_DUPLICATE_ID",
  "INVALID_DEMO_SCENARIO_FIXTURE_TIMESTAMP",
  "UNSAFE_DEMO_SCENARIO_FIXTURE_TEXT",
  "UNSAFE_DEMO_SCENARIO_FIXTURE_METADATA",
  "DEMO_SCENARIO_FIXTURE_NOT_VALID",
] as const;

export type DemoScenarioFixtureDenialCode =
  (typeof DemoScenarioFixtureDenialCodes)[number];

export const DemoScenarioFixtureDenialCodeSchema = z.enum(
  DemoScenarioFixtureDenialCodes,
);

export type DemoScenarioFixtureDenial = {
  readonly code: DemoScenarioFixtureDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateDemoScenarioFixtureDenialInput = {
  readonly code: DemoScenarioFixtureDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_DEMO_SCENARIO_FIXTURE_DENIAL_MESSAGES: Record<
  DemoScenarioFixtureDenialCode,
  string
> = {
  DEMO_SCENARIO_FIXTURE_REQUIRED:
    "A demo scenario fixture descriptor is required.",
  DEMO_SCENARIO_FIXTURE_INVALID:
    "The demo scenario fixture descriptor is invalid.",
  DEMO_SCENARIO_FIXTURE_ID_REQUIRED:
    "A demo scenario fixture identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  DEMO_SCENARIO_FIXTURE_SCOPE_INVALID:
    "The demo scenario fixture scope is invalid.",
  DEMO_SCENARIO_FIXTURE_KIND_INVALID:
    "The demo scenario fixture kind is invalid.",
  DEMO_SCENARIO_FIXTURE_SCENARIO_REQUIRED:
    "A demo scenario descriptor reference is required.",
  DEMO_SCENARIO_FIXTURE_SCENARIO_INVALID:
    "The embedded demo scenario descriptor is invalid.",
  DEMO_SCENARIO_FIXTURE_SCENARIO_TENANT_MISMATCH:
    "The embedded demo scenario scope is invalid.",
  DEMO_SCENARIO_FIXTURE_SCENARIO_KIND_MISMATCH:
    "The embedded demo scenario kind is invalid.",
  DEMO_SCENARIO_FIXTURE_SCENARIO_REF_INVALID:
    "The demo scenario reference is invalid.",
  DEMO_SCENARIO_FIXTURE_EXPECTED_KIND_INVALID:
    "The expected demo scenario kind is invalid.",
  DEMO_SCENARIO_FIXTURE_MANIFEST_REQUIRED:
    "A demo scenario fixture manifest is required.",
  DEMO_SCENARIO_FIXTURE_MANIFEST_INVALID:
    "The demo scenario fixture manifest is invalid.",
  DEMO_SCENARIO_FIXTURE_MANIFEST_ID_REQUIRED:
    "A demo scenario fixture manifest identity is required.",
  DEMO_SCENARIO_FIXTURE_MANIFEST_FIXTURES_REQUIRED:
    "Demo scenario fixture manifest entries are required.",
  DEMO_SCENARIO_FIXTURE_MANIFEST_TENANT_MISMATCH:
    "The demo scenario fixture manifest scope is invalid.",
  DEMO_SCENARIO_FIXTURE_MANIFEST_VERSION_INVALID:
    "The demo scenario fixture manifest version is invalid.",
  DEMO_SCENARIO_FIXTURE_DUPLICATE_ID:
    "The demo scenario fixture manifest contains duplicate descriptors.",
  INVALID_DEMO_SCENARIO_FIXTURE_TIMESTAMP:
    "The demo scenario fixture timestamp is invalid.",
  UNSAFE_DEMO_SCENARIO_FIXTURE_TEXT:
    "The demo scenario fixture text is unsafe.",
  UNSAFE_DEMO_SCENARIO_FIXTURE_METADATA:
    "The demo scenario fixture metadata is unsafe.",
  DEMO_SCENARIO_FIXTURE_NOT_VALID:
    "The demo scenario fixture descriptor is not valid.",
};

export const DemoScenarioFixtureDenialSchema = z
  .object({
    code: DemoScenarioFixtureDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createDemoScenarioFixtureDenial(
  input: CreateDemoScenarioFixtureDenialInput,
): DemoScenarioFixtureDenial {
  return {
    code: input.code,
    message: SAFE_DEMO_SCENARIO_FIXTURE_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
