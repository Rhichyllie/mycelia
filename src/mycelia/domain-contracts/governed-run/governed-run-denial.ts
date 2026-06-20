import type { CorrelationId } from "../../foundation/shared-kernel";

export const GovernedRunDenialCodes = [
  "GOVERNED_RUN_REQUIRED",
  "GOVERNED_RUN_INVALID",
  "GOVERNED_RUN_STATUS_INVALID",
  "GOVERNED_RUN_SCOPE_INVALID",
  "GOVERNED_RUN_NOT_ADMITTED",
  "RUN_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "RUNTIME_ENVELOPE_REQUIRED",
  "RUNTIME_ENVELOPE_INVALID",
  "GOVERNED_RUN_TENANT_MISMATCH",
  "ADMISSION_DECISION_REQUIRED",
  "ADMISSION_DECISION_INVALID",
  "ADMISSION_DECISION_TENANT_MISMATCH",
  "ADMITTED_DECISION_REQUIRED",
  "REJECTED_DECISION_REQUIRED",
  "INVALID_GOVERNED_RUN_TIMESTAMP",
  "UNSAFE_GOVERNED_RUN_METADATA",
] as const;

export type GovernedRunDenialCode =
  (typeof GovernedRunDenialCodes)[number];

export type GovernedRunDenial = {
  readonly code: GovernedRunDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateGovernedRunDenialInput = {
  readonly code: GovernedRunDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_GOVERNED_RUN_DENIAL_MESSAGES: Record<
  GovernedRunDenialCode,
  string
> = {
  GOVERNED_RUN_REQUIRED: "A governed run shell is required.",
  GOVERNED_RUN_INVALID: "The governed run shell is invalid.",
  GOVERNED_RUN_STATUS_INVALID: "The governed run status is invalid.",
  GOVERNED_RUN_SCOPE_INVALID: "The governed run scope is invalid.",
  GOVERNED_RUN_NOT_ADMITTED:
    "The governed run shell is not admitted for execution.",
  RUN_ID_REQUIRED: "A run identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  RUNTIME_ENVELOPE_REQUIRED: "A runtime envelope reference is required.",
  RUNTIME_ENVELOPE_INVALID: "The runtime envelope reference is invalid.",
  GOVERNED_RUN_TENANT_MISMATCH: "The governed run scope is invalid.",
  ADMISSION_DECISION_REQUIRED: "An admission decision reference is required.",
  ADMISSION_DECISION_INVALID: "The admission decision reference is invalid.",
  ADMISSION_DECISION_TENANT_MISMATCH:
    "The admission decision scope is invalid.",
  ADMITTED_DECISION_REQUIRED:
    "An admitted governed run requires an admitted decision.",
  REJECTED_DECISION_REQUIRED:
    "A rejected governed run requires a blocking decision.",
  INVALID_GOVERNED_RUN_TIMESTAMP:
    "The governed run timestamp is invalid.",
  UNSAFE_GOVERNED_RUN_METADATA: "The governed run metadata is unsafe.",
};

export function createGovernedRunDenial(
  input: CreateGovernedRunDenialInput,
): GovernedRunDenial {
  return {
    code: input.code,
    message: SAFE_GOVERNED_RUN_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
