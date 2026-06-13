import { z } from "zod";

import {
  CorrelationIdSchema,
  type CorrelationId,
} from "../shared-kernel";

export const StaticDemoTextRenderDenialCodes = [
  "STATIC_DEMO_TEXT_RENDER_REQUEST_REQUIRED",
  "TENANT_ID_REQUIRED",
  "STATIC_DEMO_TEXT_RENDER_ARTIFACT_REQUIRED",
  "STATIC_DEMO_TEXT_RENDER_ARTIFACT_INVALID",
  "STATIC_DEMO_TEXT_RENDER_TENANT_MISMATCH",
  "STATIC_DEMO_TEXT_RENDER_MAX_OUTPUT_INVALID",
  "UNSAFE_STATIC_DEMO_TEXT_RENDER_METADATA",
  "STATIC_DEMO_TEXT_RENDER_RESULT_INVALID",
  "UNSAFE_STATIC_DEMO_TEXT_RENDER_OUTPUT",
  "STATIC_DEMO_TEXT_RENDER_NOT_RENDERED",
] as const;

export type StaticDemoTextRenderDenialCode =
  (typeof StaticDemoTextRenderDenialCodes)[number];

export const StaticDemoTextRenderDenialCodeSchema = z.enum(
  StaticDemoTextRenderDenialCodes,
);

export type StaticDemoTextRenderDenial = {
  readonly code: StaticDemoTextRenderDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateStaticDemoTextRenderDenialInput = {
  readonly code: StaticDemoTextRenderDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_STATIC_DEMO_TEXT_RENDER_DENIAL_MESSAGES: Record<
  StaticDemoTextRenderDenialCode,
  string
> = {
  STATIC_DEMO_TEXT_RENDER_REQUEST_REQUIRED:
    "A static demo text render request is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  STATIC_DEMO_TEXT_RENDER_ARTIFACT_REQUIRED:
    "A static demo artifact descriptor is required.",
  STATIC_DEMO_TEXT_RENDER_ARTIFACT_INVALID:
    "The static demo artifact descriptor is invalid.",
  STATIC_DEMO_TEXT_RENDER_TENANT_MISMATCH:
    "The static demo text render scope is invalid.",
  STATIC_DEMO_TEXT_RENDER_MAX_OUTPUT_INVALID:
    "The static demo text render output limit is invalid.",
  UNSAFE_STATIC_DEMO_TEXT_RENDER_METADATA:
    "The static demo text render metadata is unsafe.",
  STATIC_DEMO_TEXT_RENDER_RESULT_INVALID:
    "The static demo text render result is invalid.",
  UNSAFE_STATIC_DEMO_TEXT_RENDER_OUTPUT:
    "The static demo text render output is unsafe.",
  STATIC_DEMO_TEXT_RENDER_NOT_RENDERED:
    "The static demo text render request was not rendered.",
};

export const StaticDemoTextRenderDenialSchema = z
  .object({
    code: StaticDemoTextRenderDenialCodeSchema,
    message: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export function createStaticDemoTextRenderDenial(
  input: CreateStaticDemoTextRenderDenialInput,
): StaticDemoTextRenderDenial {
  return {
    code: input.code,
    message: SAFE_STATIC_DEMO_TEXT_RENDER_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
