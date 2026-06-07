import type { CorrelationId } from "../shared-kernel";

export const RuntimeEnvelopeDenialCodes = [
  "RUNTIME_ENVELOPE_REQUIRED",
  "RUNTIME_ENVELOPE_INVALID",
  "TENANT_ID_REQUIRED",
  "SCOPE_REQUIRED",
  "INVALID_RUNTIME_ENVELOPE_SCOPE",
  "RUNTIME_IDENTITY_REQUIRED",
  "REQUEST_REFERENCE_REQUIRED",
  "POLICY_CONTEXT_REQUIRED",
  "CORRELATION_ID_REQUIRED",
  "PURPOSE_REQUIRED",
  "INVALID_RUNTIME_ENVELOPE_TIMESTAMP",
  "UNSAFE_RUNTIME_ENVELOPE_METADATA",
  "RUNTIME_ENVELOPE_MODE_CONFLICT",
  "PRODUCTION_SIDE_EFFECTS_NOT_ALLOWED",
] as const;

export type RuntimeEnvelopeDenialCode =
  (typeof RuntimeEnvelopeDenialCodes)[number];

export type RuntimeEnvelopeDenial = {
  readonly code: RuntimeEnvelopeDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateRuntimeEnvelopeDenialInput = {
  readonly code: RuntimeEnvelopeDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_RUNTIME_ENVELOPE_DENIAL_MESSAGES: Record<
  RuntimeEnvelopeDenialCode,
  string
> = {
  RUNTIME_ENVELOPE_REQUIRED: "A runtime envelope is required.",
  RUNTIME_ENVELOPE_INVALID: "The runtime envelope is invalid.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  SCOPE_REQUIRED: "A runtime envelope scope is required.",
  INVALID_RUNTIME_ENVELOPE_SCOPE: "The runtime envelope scope is invalid.",
  RUNTIME_IDENTITY_REQUIRED: "A runtime identity is required.",
  REQUEST_REFERENCE_REQUIRED: "A request reference is required.",
  POLICY_CONTEXT_REQUIRED: "A policy context reference is required.",
  CORRELATION_ID_REQUIRED: "A correlation identifier is required.",
  PURPOSE_REQUIRED: "A declared purpose is required.",
  INVALID_RUNTIME_ENVELOPE_TIMESTAMP:
    "The runtime envelope timestamp is invalid.",
  UNSAFE_RUNTIME_ENVELOPE_METADATA:
    "The runtime envelope metadata is unsafe.",
  RUNTIME_ENVELOPE_MODE_CONFLICT:
    "The runtime envelope mode is not valid for this operation.",
  PRODUCTION_SIDE_EFFECTS_NOT_ALLOWED:
    "The runtime envelope does not allow production side effects.",
};

export function createRuntimeEnvelopeDenial(
  input: CreateRuntimeEnvelopeDenialInput,
): RuntimeEnvelopeDenial {
  return {
    code: input.code,
    message: SAFE_RUNTIME_ENVELOPE_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
