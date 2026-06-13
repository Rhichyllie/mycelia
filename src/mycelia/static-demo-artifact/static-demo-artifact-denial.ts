import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../shared-kernel";

export const StaticDemoArtifactDenialCodes = [
  "STATIC_DEMO_ARTIFACT_REQUIRED",
  "STATIC_DEMO_ARTIFACT_INVALID",
  "STATIC_DEMO_ARTIFACT_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "STATIC_DEMO_ARTIFACT_SCOPE_INVALID",
  "STATIC_DEMO_ARTIFACT_KIND_INVALID",
  "STATIC_DEMO_ARTIFACT_EXPOSURE_INVALID",
  "STATIC_DEMO_ARTIFACT_SUBJECT_REQUIRED",
  "STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_REF_INVALID",
  "STATIC_DEMO_ARTIFACT_READINESS_REPORT_REF_INVALID",
  "STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_INVALID",
  "STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_TENANT_MISMATCH",
  "STATIC_DEMO_ARTIFACT_READINESS_REPORT_INVALID",
  "STATIC_DEMO_ARTIFACT_READINESS_REPORT_TENANT_MISMATCH",
  "STATIC_DEMO_ARTIFACT_SECTIONS_REQUIRED",
  "STATIC_DEMO_ARTIFACT_SECTION_REQUIRED",
  "STATIC_DEMO_ARTIFACT_SECTION_INVALID",
  "STATIC_DEMO_ARTIFACT_SECTION_KIND_INVALID",
  "STATIC_DEMO_ARTIFACT_SECTION_TENANT_MISMATCH",
  "STATIC_DEMO_ARTIFACT_SECTION_ORDER_INVALID",
  "STATIC_DEMO_ARTIFACT_SECTION_REF_INVALID",
  "UNSAFE_STATIC_DEMO_ARTIFACT_TEXT",
  "STATIC_DEMO_ARTIFACT_EXPOSURE_INCOMPATIBLE",
  "INVALID_STATIC_DEMO_ARTIFACT_TIMESTAMP",
  "UNSAFE_STATIC_DEMO_ARTIFACT_METADATA",
  "STATIC_DEMO_ARTIFACT_NOT_VALID",
] as const;

export type StaticDemoArtifactDenialCode =
  (typeof StaticDemoArtifactDenialCodes)[number];

export const StaticDemoArtifactDenialCodeSchema = z.enum(
  StaticDemoArtifactDenialCodes,
);

export type StaticDemoArtifactDenial = {
  readonly code: StaticDemoArtifactDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateStaticDemoArtifactDenialInput = {
  readonly code: StaticDemoArtifactDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_STATIC_DEMO_ARTIFACT_DENIAL_MESSAGES: Record<
  StaticDemoArtifactDenialCode,
  string
> = {
  STATIC_DEMO_ARTIFACT_REQUIRED:
    "A static demo artifact descriptor is required.",
  STATIC_DEMO_ARTIFACT_INVALID:
    "The static demo artifact descriptor is invalid.",
  STATIC_DEMO_ARTIFACT_ID_REQUIRED:
    "A static demo artifact identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  STATIC_DEMO_ARTIFACT_SCOPE_INVALID:
    "The static demo artifact scope is invalid.",
  STATIC_DEMO_ARTIFACT_KIND_INVALID:
    "The static demo artifact kind is invalid.",
  STATIC_DEMO_ARTIFACT_EXPOSURE_INVALID:
    "The static demo artifact exposure is invalid.",
  STATIC_DEMO_ARTIFACT_SUBJECT_REQUIRED:
    "A static demo artifact subject descriptor is required.",
  STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_REF_INVALID:
    "The static demo artifact fixture manifest reference is invalid.",
  STATIC_DEMO_ARTIFACT_READINESS_REPORT_REF_INVALID:
    "The static demo artifact readiness report reference is invalid.",
  STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_INVALID:
    "The embedded fixture manifest descriptor is invalid.",
  STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_TENANT_MISMATCH:
    "The embedded fixture manifest scope is invalid.",
  STATIC_DEMO_ARTIFACT_READINESS_REPORT_INVALID:
    "The embedded readiness report descriptor is invalid.",
  STATIC_DEMO_ARTIFACT_READINESS_REPORT_TENANT_MISMATCH:
    "The embedded readiness report scope is invalid.",
  STATIC_DEMO_ARTIFACT_SECTIONS_REQUIRED:
    "Static demo artifact sections are required.",
  STATIC_DEMO_ARTIFACT_SECTION_REQUIRED:
    "A static demo artifact section descriptor is required.",
  STATIC_DEMO_ARTIFACT_SECTION_INVALID:
    "The static demo artifact section descriptor is invalid.",
  STATIC_DEMO_ARTIFACT_SECTION_KIND_INVALID:
    "The static demo artifact section kind is invalid.",
  STATIC_DEMO_ARTIFACT_SECTION_TENANT_MISMATCH:
    "The static demo artifact section scope is invalid.",
  STATIC_DEMO_ARTIFACT_SECTION_ORDER_INVALID:
    "The static demo artifact section order is invalid.",
  STATIC_DEMO_ARTIFACT_SECTION_REF_INVALID:
    "The static demo artifact section reference is invalid.",
  UNSAFE_STATIC_DEMO_ARTIFACT_TEXT:
    "The static demo artifact text is unsafe.",
  STATIC_DEMO_ARTIFACT_EXPOSURE_INCOMPATIBLE:
    "The static demo artifact exposure is incompatible.",
  INVALID_STATIC_DEMO_ARTIFACT_TIMESTAMP:
    "The static demo artifact timestamp is invalid.",
  UNSAFE_STATIC_DEMO_ARTIFACT_METADATA:
    "The static demo artifact metadata is unsafe.",
  STATIC_DEMO_ARTIFACT_NOT_VALID:
    "The static demo artifact descriptor is not valid.",
};

export const StaticDemoArtifactDenialSchema = z
  .object({
    code: StaticDemoArtifactDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createStaticDemoArtifactDenial(
  input: CreateStaticDemoArtifactDenialInput,
): StaticDemoArtifactDenial {
  return {
    code: input.code,
    message: SAFE_STATIC_DEMO_ARTIFACT_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
