import type { CorrelationId, RequestId } from "../../foundation/shared-kernel";

export const IdentityDenialCodes = [
  "RUNTIME_IDENTITY_REQUIRED",
  "ACTOR_ID_REQUIRED",
  "TENANT_ID_REQUIRED",
  "CORRELATION_ID_REQUIRED",
  "REQUEST_ID_REQUIRED",
  "PURPOSE_REQUIRED",
  "INVALID_REQUEST_ORIGIN",
  "INVALID_REQUEST_ENVELOPE",
  "UNSAFE_REQUEST_METADATA",
  "INVALID_RUNTIME_IDENTITY_SCOPE",
] as const;

export type IdentityDenialCode = (typeof IdentityDenialCodes)[number];

export type IdentityDenial = {
  readonly code: IdentityDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly request_id?: RequestId;
  readonly safe: true;
};

export type CreateIdentityDenialInput = {
  readonly code: IdentityDenialCode;
  readonly correlation_id?: CorrelationId;
  readonly request_id?: RequestId;
};

const SAFE_IDENTITY_DENIAL_MESSAGES: Record<IdentityDenialCode, string> = {
  RUNTIME_IDENTITY_REQUIRED: "A runtime identity is required.",
  ACTOR_ID_REQUIRED: "A human actor identity is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  CORRELATION_ID_REQUIRED: "A correlation identifier is required.",
  REQUEST_ID_REQUIRED: "A request identifier is required.",
  PURPOSE_REQUIRED: "A request purpose is required.",
  INVALID_REQUEST_ORIGIN: "The request origin is invalid.",
  INVALID_REQUEST_ENVELOPE: "The request envelope is invalid.",
  UNSAFE_REQUEST_METADATA: "The request metadata is unsafe.",
  INVALID_RUNTIME_IDENTITY_SCOPE: "The runtime identity scope is invalid.",
};

export function createIdentityDenial(
  input: CreateIdentityDenialInput,
): IdentityDenial {
  return {
    code: input.code,
    message: SAFE_IDENTITY_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    request_id: input.request_id,
    safe: true,
  };
}
