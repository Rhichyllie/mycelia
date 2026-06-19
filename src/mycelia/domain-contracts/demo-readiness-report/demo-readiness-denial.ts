import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../../foundation/shared-kernel";

export const DemoReadinessDenialCodes = [
  "DEMO_READINESS_REPORT_REQUIRED",
  "DEMO_READINESS_REPORT_INVALID",
  "DEMO_READINESS_REPORT_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "DEMO_READINESS_REPORT_SCOPE_INVALID",
  "DEMO_READINESS_STATUS_INVALID",
  "DEMO_READINESS_SUBJECT_KIND_INVALID",
  "DEMO_READINESS_SUBJECT_REQUIRED",
  "DEMO_READINESS_SUBJECT_REF_INVALID",
  "DEMO_READINESS_FIXTURE_INVALID",
  "DEMO_READINESS_FIXTURE_TENANT_MISMATCH",
  "DEMO_READINESS_MANIFEST_INVALID",
  "DEMO_READINESS_MANIFEST_TENANT_MISMATCH",
  "DEMO_READINESS_FINDING_REQUIRED",
  "DEMO_READINESS_FINDING_INVALID",
  "DEMO_READINESS_FINDING_SEVERITY_INVALID",
  "DEMO_READINESS_FINDING_TENANT_MISMATCH",
  "UNSAFE_DEMO_READINESS_FINDING_CODE",
  "UNSAFE_DEMO_READINESS_FINDING_MESSAGE",
  "DEMO_READINESS_FINDING_REF_INVALID",
  "DEMO_READINESS_STATUS_CONFLICT",
  "INVALID_DEMO_READINESS_TIMESTAMP",
  "UNSAFE_DEMO_READINESS_METADATA",
  "DEMO_READINESS_NOT_READY",
] as const;

export type DemoReadinessDenialCode =
  (typeof DemoReadinessDenialCodes)[number];

export const DemoReadinessDenialCodeSchema = z.enum(
  DemoReadinessDenialCodes,
);

export type DemoReadinessDenial = {
  readonly code: DemoReadinessDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateDemoReadinessDenialInput = {
  readonly code: DemoReadinessDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_DEMO_READINESS_DENIAL_MESSAGES: Record<
  DemoReadinessDenialCode,
  string
> = {
  DEMO_READINESS_REPORT_REQUIRED:
    "A demo readiness report descriptor is required.",
  DEMO_READINESS_REPORT_INVALID:
    "The demo readiness report descriptor is invalid.",
  DEMO_READINESS_REPORT_ID_REQUIRED:
    "A demo readiness report identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  DEMO_READINESS_REPORT_SCOPE_INVALID:
    "The demo readiness report scope is invalid.",
  DEMO_READINESS_STATUS_INVALID:
    "The demo readiness status is invalid.",
  DEMO_READINESS_SUBJECT_KIND_INVALID:
    "The demo readiness subject kind is invalid.",
  DEMO_READINESS_SUBJECT_REQUIRED:
    "A demo readiness subject descriptor is required.",
  DEMO_READINESS_SUBJECT_REF_INVALID:
    "The demo readiness subject reference is invalid.",
  DEMO_READINESS_FIXTURE_INVALID:
    "The demo readiness fixture descriptor is invalid.",
  DEMO_READINESS_FIXTURE_TENANT_MISMATCH:
    "The demo readiness fixture scope is invalid.",
  DEMO_READINESS_MANIFEST_INVALID:
    "The demo readiness manifest descriptor is invalid.",
  DEMO_READINESS_MANIFEST_TENANT_MISMATCH:
    "The demo readiness manifest scope is invalid.",
  DEMO_READINESS_FINDING_REQUIRED:
    "A demo readiness finding descriptor is required.",
  DEMO_READINESS_FINDING_INVALID:
    "The demo readiness finding descriptor is invalid.",
  DEMO_READINESS_FINDING_SEVERITY_INVALID:
    "The demo readiness finding severity is invalid.",
  DEMO_READINESS_FINDING_TENANT_MISMATCH:
    "The demo readiness finding scope is invalid.",
  UNSAFE_DEMO_READINESS_FINDING_CODE:
    "The demo readiness finding code is unsafe.",
  UNSAFE_DEMO_READINESS_FINDING_MESSAGE:
    "The demo readiness finding message is unsafe.",
  DEMO_READINESS_FINDING_REF_INVALID:
    "The demo readiness finding reference is invalid.",
  DEMO_READINESS_STATUS_CONFLICT:
    "The demo readiness status conflicts with findings.",
  INVALID_DEMO_READINESS_TIMESTAMP:
    "The demo readiness timestamp is invalid.",
  UNSAFE_DEMO_READINESS_METADATA:
    "The demo readiness metadata is unsafe.",
  DEMO_READINESS_NOT_READY:
    "The demo readiness report is not ready.",
};

export const DemoReadinessDenialSchema = z
  .object({
    code: DemoReadinessDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createDemoReadinessDenial(
  input: CreateDemoReadinessDenialInput,
): DemoReadinessDenial {
  return {
    code: input.code,
    message: SAFE_DEMO_READINESS_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
