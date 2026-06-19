import type { CorrelationId } from "./ids";

export const MyceliaErrorCodes = [
  "VALIDATION_FAILED",
  "TENANT_CONTEXT_REQUIRED",
  "RUNTIME_IDENTITY_REQUIRED",
  "CORRELATION_ID_REQUIRED",
  "CLASSIFICATION_DOWNGRADE",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "INVARIANT_VIOLATION",
  "CONFIGURATION_ERROR",
  "INTERNAL_ERROR",
] as const;

export type MyceliaErrorCode = (typeof MyceliaErrorCodes)[number];

export type MyceliaError = {
  readonly code: MyceliaErrorCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly safe: true;
};

export type CreateSafeErrorInput = {
  readonly code: MyceliaErrorCode;
  readonly safe_message?: string;
  readonly correlation_id?: CorrelationId;
};

const DEFAULT_SAFE_MESSAGES: Record<MyceliaErrorCode, string> = {
  VALIDATION_FAILED: "The request failed validation.",
  TENANT_CONTEXT_REQUIRED: "A tenant context is required.",
  RUNTIME_IDENTITY_REQUIRED: "A runtime identity is required.",
  CORRELATION_ID_REQUIRED: "A correlation identifier is required.",
  CLASSIFICATION_DOWNGRADE:
    "Data classification downgrade requires explicit governance.",
  UNAUTHORIZED: "Authentication is required.",
  FORBIDDEN: "The operation is not permitted.",
  INVARIANT_VIOLATION: "A MYCELIA invariant was violated.",
  CONFIGURATION_ERROR: "A configuration error occurred.",
  INTERNAL_ERROR: "An internal MYCELIA error occurred.",
};

const SENSITIVE_MESSAGE_PATTERN =
  /(authorization|api[_-]?key|bearer|credential|password|secret|token)/i;

function sanitizeSafeMessage(
  code: MyceliaErrorCode,
  safeMessage?: string,
): string {
  if (!safeMessage || SENSITIVE_MESSAGE_PATTERN.test(safeMessage)) {
    return DEFAULT_SAFE_MESSAGES[code];
  }

  return safeMessage.replace(/[\r\n\t]+/g, " ").slice(0, 240);
}

export function createSafeError(input: CreateSafeErrorInput): MyceliaError {
  return {
    code: input.code,
    message: sanitizeSafeMessage(input.code, input.safe_message),
    correlation_id: input.correlation_id,
    safe: true,
  };
}
