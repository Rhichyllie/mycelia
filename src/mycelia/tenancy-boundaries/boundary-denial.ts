import type { CorrelationId } from "../shared-kernel";

export const BoundaryDenialCodes = [
  "TENANT_SCOPE_REQUIRED",
  "WORKSPACE_SCOPE_REQUIRED",
  "PROJECT_SCOPE_REQUIRED",
  "CROSS_TENANT_ACCESS_DENIED",
  "CROSS_WORKSPACE_ACCESS_DENIED",
  "CROSS_PROJECT_ACCESS_DENIED",
  "INVALID_ORGANIZATIONAL_SCOPE",
] as const;

export type BoundaryDenialCode = (typeof BoundaryDenialCodes)[number];

export type BoundaryDenial = {
  readonly code: BoundaryDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateBoundaryDenialInput = {
  readonly code: BoundaryDenialCode;
  readonly correlation_id?: CorrelationId;
};

const SAFE_BOUNDARY_DENIAL_MESSAGES: Record<BoundaryDenialCode, string> = {
  TENANT_SCOPE_REQUIRED: "A valid tenant scope is required.",
  WORKSPACE_SCOPE_REQUIRED: "A valid workspace scope is required.",
  PROJECT_SCOPE_REQUIRED: "A valid project scope is required.",
  CROSS_TENANT_ACCESS_DENIED: "The requested resource is outside the allowed boundary.",
  CROSS_WORKSPACE_ACCESS_DENIED:
    "The requested resource is outside the allowed boundary.",
  CROSS_PROJECT_ACCESS_DENIED:
    "The requested resource is outside the allowed boundary.",
  INVALID_ORGANIZATIONAL_SCOPE: "The organizational scope is invalid.",
};

export function createBoundaryDenial(
  input: CreateBoundaryDenialInput,
): BoundaryDenial {
  return {
    code: input.code,
    message: SAFE_BOUNDARY_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    safe: true,
  };
}
