import type { CorrelationId } from "../shared-kernel";

export const PolicyDenialCodes = [
  "POLICY_DECISION_REQUEST_INVALID",
  "POLICY_DECISION_INVALID",
  "TENANT_ID_REQUIRED",
  "ACTION_REQUIRED",
  "RESOURCE_REQUIRED",
  "RUNTIME_IDENTITY_REQUIRED",
  "PURPOSE_REQUIRED",
  "INVALID_POLICY_ACTION",
  "INVALID_POLICY_RESOURCE",
  "INVALID_POLICY_PURPOSE",
  "UNSAFE_POLICY_METADATA",
  "POLICY_DECISION_REQUIRED",
  "POLICY_DECISION_NOT_ALLOWED",
  "POLICY_DECISION_INCONCLUSIVE",
  "POLICY_DECISION_TENANT_MISMATCH",
  "POLICY_APPROVAL_REQUIRED",
] as const;

export type PolicyDenialCode = (typeof PolicyDenialCodes)[number];

export type PolicyDenial = {
  readonly code: PolicyDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreatePolicyDenialInput = {
  readonly code: PolicyDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_POLICY_DENIAL_MESSAGES: Record<PolicyDenialCode, string> = {
  POLICY_DECISION_REQUEST_INVALID: "The policy decision request is invalid.",
  POLICY_DECISION_INVALID: "The policy decision is invalid.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  ACTION_REQUIRED: "A policy action is required.",
  RESOURCE_REQUIRED: "A policy resource is required.",
  RUNTIME_IDENTITY_REQUIRED: "A runtime identity is required.",
  PURPOSE_REQUIRED: "A declared purpose is required.",
  INVALID_POLICY_ACTION: "The policy action is invalid.",
  INVALID_POLICY_RESOURCE: "The policy resource is invalid.",
  INVALID_POLICY_PURPOSE: "The policy purpose is invalid.",
  UNSAFE_POLICY_METADATA: "The policy metadata is unsafe.",
  POLICY_DECISION_REQUIRED: "A policy decision is required.",
  POLICY_DECISION_NOT_ALLOWED: "The policy decision does not allow the operation.",
  POLICY_DECISION_INCONCLUSIVE:
    "The policy decision is not conclusive for this operation.",
  POLICY_DECISION_TENANT_MISMATCH:
    "The policy decision does not match the request boundary.",
  POLICY_APPROVAL_REQUIRED: "The operation requires approval before proceeding.",
};

export function createPolicyDenial(
  input: CreatePolicyDenialInput,
): PolicyDenial {
  return {
    code: input.code,
    message: SAFE_POLICY_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
