import type { CorrelationId } from "../../foundation/shared-kernel";

export const RuntimeAdmissionDenialCodes = [
  "RUNTIME_ADMISSION_REQUEST_REQUIRED",
  "RUNTIME_ADMISSION_REQUEST_INVALID",
  "RUNTIME_ADMISSION_DECISION_REQUIRED",
  "RUNTIME_ADMISSION_DECISION_INVALID",
  "RUNTIME_ADMISSION_NOT_ADMITTED",
  "TENANT_ID_REQUIRED",
  "RUNTIME_ENVELOPE_REQUIRED",
  "INVALID_RUNTIME_ENVELOPE",
  "RUNTIME_ADMISSION_TENANT_MISMATCH",
  "RUNTIME_IDENTITY_SCOPE_MISMATCH",
  "POLICY_DECISION_REQUIRED",
  "POLICY_DECISION_INVALID",
  "POLICY_DECISION_TENANT_MISMATCH",
  "POLICY_DECISION_NOT_ALLOWED",
  "POLICY_APPROVAL_REQUIRED",
  "POLICY_DECISION_INCONCLUSIVE",
  "UNSAFE_RUNTIME_ADMISSION_METADATA",
  "INVALID_RUNTIME_ADMISSION_TIMESTAMP",
  "PRODUCTION_SIDE_EFFECT_ADMISSION_DENIED",
] as const;

export type RuntimeAdmissionDenialCode =
  (typeof RuntimeAdmissionDenialCodes)[number];

export type RuntimeAdmissionDenial = {
  readonly code: RuntimeAdmissionDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateRuntimeAdmissionDenialInput = {
  readonly code: RuntimeAdmissionDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_RUNTIME_ADMISSION_DENIAL_MESSAGES: Record<
  RuntimeAdmissionDenialCode,
  string
> = {
  RUNTIME_ADMISSION_REQUEST_REQUIRED:
    "A runtime admission request is required.",
  RUNTIME_ADMISSION_REQUEST_INVALID:
    "The runtime admission request is invalid.",
  RUNTIME_ADMISSION_DECISION_REQUIRED:
    "A runtime admission decision is required.",
  RUNTIME_ADMISSION_DECISION_INVALID:
    "The runtime admission decision is invalid.",
  RUNTIME_ADMISSION_NOT_ADMITTED:
    "The operation was not admitted.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  RUNTIME_ENVELOPE_REQUIRED: "A runtime envelope is required.",
  INVALID_RUNTIME_ENVELOPE: "The runtime envelope is invalid.",
  RUNTIME_ADMISSION_TENANT_MISMATCH:
    "The runtime admission scope is invalid.",
  RUNTIME_IDENTITY_SCOPE_MISMATCH:
    "The runtime identity scope is invalid for admission.",
  POLICY_DECISION_REQUIRED: "A policy decision is required.",
  POLICY_DECISION_INVALID: "The policy decision is invalid.",
  POLICY_DECISION_TENANT_MISMATCH:
    "The policy decision scope is invalid.",
  POLICY_DECISION_NOT_ALLOWED:
    "The operation is not allowed by policy.",
  POLICY_APPROVAL_REQUIRED:
    "The operation requires approval before admission.",
  POLICY_DECISION_INCONCLUSIVE:
    "The policy decision is inconclusive.",
  UNSAFE_RUNTIME_ADMISSION_METADATA:
    "The runtime admission metadata is unsafe.",
  INVALID_RUNTIME_ADMISSION_TIMESTAMP:
    "The runtime admission timestamp is invalid.",
  PRODUCTION_SIDE_EFFECT_ADMISSION_DENIED:
    "The runtime envelope does not allow production admission.",
};

export function createRuntimeAdmissionDenial(
  input: CreateRuntimeAdmissionDenialInput,
): RuntimeAdmissionDenial {
  return {
    code: input.code,
    message: SAFE_RUNTIME_ADMISSION_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
