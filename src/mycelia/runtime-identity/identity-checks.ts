import {
  err,
  ok,
  type ActorId,
  type CorrelationId,
  type RequestId,
  type Result,
  type RuntimeIdentityId,
  type TenantId,
} from "../shared-kernel";

import {
  createIdentityDenial,
  type IdentityDenial,
} from "./identity-denial";
import {
  RequestEnvelopeSchema,
  SafeRequestMetadataSchema,
  type RequestEnvelope,
} from "./request-envelope";
import { RequestOrigins, type RequestOrigin } from "./request-origin";

export type IdentityEnvelopeLike =
  | {
      readonly request_id?: RequestId;
      readonly tenant_id?: TenantId;
      readonly actor_id?: ActorId;
      readonly runtime_identity_id?: RuntimeIdentityId;
      readonly correlation_id?: CorrelationId;
      readonly origin?: RequestOrigin | string;
      readonly metadata?: unknown;
      readonly purpose?: unknown;
    }
  | null
  | undefined;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

export function requireRuntimeIdentity(
  envelope: IdentityEnvelopeLike,
): Result<RuntimeIdentityId, IdentityDenial> {
  if (envelope?.runtime_identity_id === undefined) {
    return err(createIdentityDenial({ code: "RUNTIME_IDENTITY_REQUIRED" }));
  }

  return ok(envelope.runtime_identity_id);
}

export function requireHumanActor(
  envelope: IdentityEnvelopeLike,
): Result<ActorId, IdentityDenial> {
  if (envelope?.actor_id === undefined) {
    return err(createIdentityDenial({ code: "ACTOR_ID_REQUIRED" }));
  }

  return ok(envelope.actor_id);
}

export function requireTenantIdentity(
  envelope: IdentityEnvelopeLike,
): Result<TenantId, IdentityDenial> {
  if (envelope?.tenant_id === undefined) {
    return err(createIdentityDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  return ok(envelope.tenant_id);
}

export function requireCorrelation(
  envelope: IdentityEnvelopeLike,
): Result<CorrelationId, IdentityDenial> {
  if (envelope?.correlation_id === undefined) {
    return err(createIdentityDenial({ code: "CORRELATION_ID_REQUIRED" }));
  }

  return ok(envelope.correlation_id);
}

export function validateRequestEnvelope(
  input: unknown,
): Result<RequestEnvelope, IdentityDenial> {
  if (!isRecord(input)) {
    return err(createIdentityDenial({ code: "INVALID_REQUEST_ENVELOPE" }));
  }

  if (input.request_id === undefined) {
    return err(createIdentityDenial({ code: "REQUEST_ID_REQUIRED" }));
  }
  if (input.tenant_id === undefined) {
    return err(createIdentityDenial({ code: "TENANT_ID_REQUIRED" }));
  }
  if (input.runtime_identity_id === undefined) {
    return err(createIdentityDenial({ code: "RUNTIME_IDENTITY_REQUIRED" }));
  }
  if (input.correlation_id === undefined) {
    return err(createIdentityDenial({ code: "CORRELATION_ID_REQUIRED" }));
  }
  if (typeof input.purpose !== "string" || input.purpose.length === 0) {
    return err(createIdentityDenial({ code: "PURPOSE_REQUIRED" }));
  }
  if (
    typeof input.origin !== "string" ||
    !RequestOrigins.includes(input.origin as RequestOrigin)
  ) {
    return err(createIdentityDenial({ code: "INVALID_REQUEST_ORIGIN" }));
  }
  if (
    input.metadata !== undefined &&
    !SafeRequestMetadataSchema.safeParse(input.metadata).success
  ) {
    return err(createIdentityDenial({ code: "UNSAFE_REQUEST_METADATA" }));
  }

  const parsed = RequestEnvelopeSchema.safeParse(input);

  if (!parsed.success) {
    return err(createIdentityDenial({ code: "INVALID_REQUEST_ENVELOPE" }));
  }

  return ok(parsed.data);
}

export function hasHumanActor(envelope: IdentityEnvelopeLike): boolean {
  return envelope?.actor_id !== undefined;
}

export function isReplayOrigin(envelope: IdentityEnvelopeLike): boolean {
  return envelope?.origin === "REPLAY";
}

export function isTestRunOrigin(envelope: IdentityEnvelopeLike): boolean {
  return envelope?.origin === "TEST_RUN";
}

export function isProductionLikeOrigin(envelope: IdentityEnvelopeLike): boolean {
  return (
    typeof envelope?.origin === "string" &&
    RequestOrigins.includes(envelope.origin as RequestOrigin) &&
    !isReplayOrigin(envelope) &&
    !isTestRunOrigin(envelope)
  );
}
