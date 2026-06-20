import type { CorrelationId } from "../../foundation/shared-kernel";

export const RuntimeStateDenialCodes = [
  "RUNTIME_STATE_REQUIRED",
  "RUNTIME_STATE_INVALID",
  "RUNTIME_STATE_KIND_INVALID",
  "RUNTIME_STATE_SNAPSHOT_REQUIRED",
  "RUNTIME_STATE_SNAPSHOT_INVALID",
  "RUNTIME_STATE_SNAPSHOT_MISMATCH",
  "STATE_ID_REQUIRED",
  "RUN_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "GOVERNED_RUN_REQUIRED",
  "GOVERNED_RUN_INVALID",
  "RUNTIME_STATE_SCOPE_INVALID",
  "RUNTIME_STATE_TENANT_MISMATCH",
  "RUNTIME_STATE_RUN_MISMATCH",
  "RUNTIME_STATE_KIND_MISMATCH",
  "RUNTIME_STATE_VERSION_INVALID",
  "INVALID_RUNTIME_STATE_TIMESTAMP",
  "UNSAFE_RUNTIME_STATE_REFERENCE",
  "UNSAFE_RUNTIME_STATE_METADATA",
] as const;

export type RuntimeStateDenialCode =
  (typeof RuntimeStateDenialCodes)[number];

export type RuntimeStateDenial = {
  readonly code: RuntimeStateDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateRuntimeStateDenialInput = {
  readonly code: RuntimeStateDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_RUNTIME_STATE_DENIAL_MESSAGES: Record<
  RuntimeStateDenialCode,
  string
> = {
  RUNTIME_STATE_REQUIRED: "A runtime state descriptor is required.",
  RUNTIME_STATE_INVALID: "The runtime state descriptor is invalid.",
  RUNTIME_STATE_KIND_INVALID: "The runtime state kind is invalid.",
  RUNTIME_STATE_SNAPSHOT_REQUIRED:
    "A runtime state snapshot descriptor is required.",
  RUNTIME_STATE_SNAPSHOT_INVALID:
    "The runtime state snapshot descriptor is invalid.",
  RUNTIME_STATE_SNAPSHOT_MISMATCH:
    "The runtime state snapshot does not match its state.",
  STATE_ID_REQUIRED: "A state identity is required.",
  RUN_ID_REQUIRED: "A run identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  GOVERNED_RUN_REQUIRED: "A governed run reference is required.",
  GOVERNED_RUN_INVALID: "The governed run reference is invalid.",
  RUNTIME_STATE_SCOPE_INVALID: "The runtime state scope is invalid.",
  RUNTIME_STATE_TENANT_MISMATCH:
    "The runtime state tenant scope is invalid.",
  RUNTIME_STATE_RUN_MISMATCH: "The runtime state run scope is invalid.",
  RUNTIME_STATE_KIND_MISMATCH:
    "The runtime state kind does not match its governed run.",
  RUNTIME_STATE_VERSION_INVALID:
    "The runtime state version must be a positive integer.",
  INVALID_RUNTIME_STATE_TIMESTAMP: "The runtime state timestamp is invalid.",
  UNSAFE_RUNTIME_STATE_REFERENCE:
    "The runtime state reference contains unsafe content.",
  UNSAFE_RUNTIME_STATE_METADATA: "The runtime state metadata is unsafe.",
};

export function createRuntimeStateDenial(
  input: CreateRuntimeStateDenialInput,
): RuntimeStateDenial {
  return {
    code: input.code,
    message: SAFE_RUNTIME_STATE_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
