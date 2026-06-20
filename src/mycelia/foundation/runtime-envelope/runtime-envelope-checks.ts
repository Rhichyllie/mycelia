import {
  err,
  ok,
  type Result,
} from "../../foundation/shared-kernel";

import {
  RuntimeEnvelopeSchema,
  type RuntimeEnvelope,
} from "./runtime-envelope";
import {
  SafeRuntimeEnvelopeMetadataSchema,
  isRuntimeEnvelopeIsoDateTime,
} from "./runtime-envelope-context";
import {
  createRuntimeEnvelopeDenial,
  type RuntimeEnvelopeDenial,
} from "./runtime-envelope-denial";
import {
  isNonProductionRuntimeEnvelopeMode,
  isProductionRuntimeEnvelopeMode,
  isReplayRuntimeEnvelopeMode,
} from "./runtime-envelope-mode";
import {
  RuntimeEnvelopeScopeSchema,
  type RuntimeEnvelopeScope,
} from "./runtime-envelope-scope";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasInvalidTimestamp(input: Record<string, unknown>): boolean {
  if (
    typeof input.created_at !== "string" ||
    !isRuntimeEnvelopeIsoDateTime(input.created_at)
  ) {
    return true;
  }

  return (
    input.expires_at !== undefined &&
    (typeof input.expires_at !== "string" ||
      !isRuntimeEnvelopeIsoDateTime(input.expires_at) ||
      Date.parse(input.expires_at) <= Date.parse(input.created_at))
  );
}

export function validateRuntimeEnvelopeScope(
  input: unknown,
): Result<RuntimeEnvelopeScope, RuntimeEnvelopeDenial> {
  const parsed = RuntimeEnvelopeScopeSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createRuntimeEnvelopeDenial({
        code: "INVALID_RUNTIME_ENVELOPE_SCOPE",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateRuntimeEnvelope(
  input: unknown,
): Result<RuntimeEnvelope, RuntimeEnvelopeDenial> {
  if (!isRecord(input)) {
    return err(
      createRuntimeEnvelopeDenial({ code: "RUNTIME_ENVELOPE_REQUIRED" }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createRuntimeEnvelopeDenial({ code: "TENANT_ID_REQUIRED" }));
  }
  if (input.scope === undefined) {
    return err(createRuntimeEnvelopeDenial({ code: "SCOPE_REQUIRED" }));
  }
  if (input.runtime_identity === undefined) {
    return err(
      createRuntimeEnvelopeDenial({ code: "RUNTIME_IDENTITY_REQUIRED" }),
    );
  }
  if (input.request_id === undefined) {
    return err(
      createRuntimeEnvelopeDenial({ code: "REQUEST_REFERENCE_REQUIRED" }),
    );
  }
  if (input.policy_context === undefined) {
    return err(
      createRuntimeEnvelopeDenial({ code: "POLICY_CONTEXT_REQUIRED" }),
    );
  }
  if (input.correlation_id === undefined) {
    return err(
      createRuntimeEnvelopeDenial({ code: "CORRELATION_ID_REQUIRED" }),
    );
  }
  if (
    typeof input.declared_purpose !== "string" ||
    input.declared_purpose.length === 0
  ) {
    return err(createRuntimeEnvelopeDenial({ code: "PURPOSE_REQUIRED" }));
  }
  if (hasInvalidTimestamp(input)) {
    return err(
      createRuntimeEnvelopeDenial({
        code: "INVALID_RUNTIME_ENVELOPE_TIMESTAMP",
      }),
    );
  }
  if (
    input.metadata !== undefined &&
    !SafeRuntimeEnvelopeMetadataSchema.safeParse(input.metadata).success
  ) {
    return err(
      createRuntimeEnvelopeDenial({
        code: "UNSAFE_RUNTIME_ENVELOPE_METADATA",
      }),
    );
  }

  const parsed = RuntimeEnvelopeSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (issuePath?.startsWith("scope")) {
      return err(
        createRuntimeEnvelopeDenial({
          code: "INVALID_RUNTIME_ENVELOPE_SCOPE",
        }),
      );
    }

    if (issuePath === "mode" || issuePath?.startsWith("is_")) {
      return err(
        createRuntimeEnvelopeDenial({
          code: "RUNTIME_ENVELOPE_MODE_CONFLICT",
        }),
      );
    }

    return err(
      createRuntimeEnvelopeDenial({ code: "RUNTIME_ENVELOPE_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function isProductionRuntimeEnvelope(input: unknown): boolean {
  const result = validateRuntimeEnvelope(input);

  return (
    result.ok && isProductionRuntimeEnvelopeMode(result.value.mode)
  );
}

export function isReplayRuntimeEnvelope(input: unknown): boolean {
  const result = validateRuntimeEnvelope(input);

  return result.ok && isReplayRuntimeEnvelopeMode(result.value.mode);
}

export function isNonProductionRuntimeEnvelope(input: unknown): boolean {
  const result = validateRuntimeEnvelope(input);

  return result.ok && isNonProductionRuntimeEnvelopeMode(result.value.mode);
}

export function ensureRuntimeEnvelopeTenantMatchesScope(
  envelope: RuntimeEnvelope,
): Result<true, RuntimeEnvelopeDenial> {
  if (envelope.scope.tenant_id !== envelope.tenant_id) {
    return err(
      createRuntimeEnvelopeDenial({
        code: "INVALID_RUNTIME_ENVELOPE_SCOPE",
        correlation_id: envelope.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureRuntimeEnvelopeAllowsProductionSideEffects(
  input: unknown,
): Result<true, RuntimeEnvelopeDenial> {
  const result = validateRuntimeEnvelope(input);

  if (!result.ok) {
    return result;
  }

  if (!isProductionRuntimeEnvelopeMode(result.value.mode)) {
    return err(
      createRuntimeEnvelopeDenial({
        code: "PRODUCTION_SIDE_EFFECTS_NOT_ALLOWED",
        correlation_id: result.value.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function assertRuntimeEnvelopeUsable(
  input: unknown,
): Result<RuntimeEnvelope, RuntimeEnvelopeDenial> {
  return validateRuntimeEnvelope(input);
}

export function failClosedRuntimeEnvelope(
  correlation_id?: RuntimeEnvelope["correlation_id"],
): RuntimeEnvelopeDenial {
  return createRuntimeEnvelopeDenial({
    code: "RUNTIME_ENVELOPE_INVALID",
    correlation_id,
  });
}
