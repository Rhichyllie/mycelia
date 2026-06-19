import {
  err,
  ok,
  type CorrelationId,
  type EventId,
  type Result,
  type RuntimeIdentityId,
  type TenantId,
} from "../../foundation/shared-kernel";

import {
  createEventEnvelopeDenial,
  type EventEnvelopeDenial,
} from "./event-denial";
import {
  EventEnvelopeSchema,
  type EventEnvelope,
} from "./event-envelope";
import {
  isEvaluationEventMode,
  isInvestigationEventMode,
  isProductionEventMode,
  isReplayEventMode,
  isTestEventMode,
} from "./event-mode";
import { EventPayloadDescriptorSchema, SafeEventMetadataSchema } from "./event-payload";

type EventEnvelopeLike =
  | {
      readonly event_id?: EventId;
      readonly event_name?: unknown;
      readonly event_mode?: unknown;
      readonly tenant_id?: TenantId;
      readonly runtime_identity_id?: RuntimeIdentityId;
      readonly correlation_id?: CorrelationId;
      readonly subject?: unknown;
      readonly purpose?: unknown;
      readonly occurred_at?: unknown;
      readonly recorded_at?: unknown;
      readonly metadata?: unknown;
      readonly payload?: unknown;
      readonly parent_event_id?: EventId;
    }
  | null
  | undefined;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function isIsoDateTime(value: unknown): boolean {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    /(Z|[+-]\d{2}:\d{2})$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

export function validateEventEnvelope(
  input: unknown,
): Result<EventEnvelope, EventEnvelopeDenial> {
  if (!isRecord(input)) {
    return err(createEventEnvelopeDenial({ code: "INVALID_EVENT_ENVELOPE" }));
  }

  if (input.event_id === undefined) {
    return err(createEventEnvelopeDenial({ code: "EVENT_ID_REQUIRED" }));
  }
  if (input.event_name === undefined) {
    return err(createEventEnvelopeDenial({ code: "EVENT_NAME_REQUIRED" }));
  }
  if (input.event_schema_version === undefined) {
    return err(
      createEventEnvelopeDenial({ code: "EVENT_SCHEMA_VERSION_REQUIRED" }),
    );
  }
  if (input.event_mode === undefined) {
    return err(createEventEnvelopeDenial({ code: "EVENT_MODE_REQUIRED" }));
  }
  if (input.tenant_id === undefined) {
    return err(createEventEnvelopeDenial({ code: "TENANT_ID_REQUIRED" }));
  }
  if (input.runtime_identity_id === undefined) {
    return err(
      createEventEnvelopeDenial({ code: "RUNTIME_IDENTITY_REQUIRED" }),
    );
  }
  if (input.correlation_id === undefined) {
    return err(createEventEnvelopeDenial({ code: "CORRELATION_ID_REQUIRED" }));
  }
  if (typeof input.purpose !== "string" || input.purpose.length === 0) {
    return err(createEventEnvelopeDenial({ code: "PURPOSE_REQUIRED" }));
  }
  if (!isIsoDateTime(input.occurred_at) || !isIsoDateTime(input.recorded_at)) {
    return err(createEventEnvelopeDenial({ code: "INVALID_EVENT_TIMESTAMP" }));
  }
  if (
    input.metadata !== undefined &&
    !SafeEventMetadataSchema.safeParse(input.metadata).success
  ) {
    return err(createEventEnvelopeDenial({ code: "UNSAFE_EVENT_METADATA" }));
  }
  if (
    input.payload !== undefined &&
    !EventPayloadDescriptorSchema.safeParse(input.payload).success
  ) {
    return err(
      createEventEnvelopeDenial({ code: "UNSAFE_EVENT_PAYLOAD_DESCRIPTOR" }),
    );
  }

  const parsed = EventEnvelopeSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (issuePath?.startsWith("subject")) {
      return err(createEventEnvelopeDenial({ code: "INVALID_EVENT_SUBJECT" }));
    }

    if (
      issuePath === "project_id" ||
      issuePath?.startsWith("organizational_scope")
    ) {
      return err(createEventEnvelopeDenial({ code: "INVALID_EVENT_SCOPE" }));
    }

    return err(createEventEnvelopeDenial({ code: "INVALID_EVENT_ENVELOPE" }));
  }

  return ok(parsed.data);
}

export function requireEventIdentity(
  envelope: EventEnvelopeLike,
): Result<EventId, EventEnvelopeDenial> {
  if (envelope?.event_id === undefined) {
    return err(createEventEnvelopeDenial({ code: "EVENT_ID_REQUIRED" }));
  }

  if (envelope.event_name === undefined) {
    return err(createEventEnvelopeDenial({ code: "EVENT_NAME_REQUIRED" }));
  }

  return ok(envelope.event_id);
}

export function requireEventTenant(
  envelope: EventEnvelopeLike,
): Result<TenantId, EventEnvelopeDenial> {
  if (envelope?.tenant_id === undefined) {
    return err(createEventEnvelopeDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  return ok(envelope.tenant_id);
}

export function requireEventCorrelation(
  envelope: EventEnvelopeLike,
): Result<CorrelationId, EventEnvelopeDenial> {
  if (envelope?.correlation_id === undefined) {
    return err(createEventEnvelopeDenial({ code: "CORRELATION_ID_REQUIRED" }));
  }

  return ok(envelope.correlation_id);
}

export function requireEventRuntimeIdentity(
  envelope: EventEnvelopeLike,
): Result<RuntimeIdentityId, EventEnvelopeDenial> {
  if (envelope?.runtime_identity_id === undefined) {
    return err(
      createEventEnvelopeDenial({ code: "RUNTIME_IDENTITY_REQUIRED" }),
    );
  }

  return ok(envelope.runtime_identity_id);
}

export function requireProductionEventMode(
  envelope: EventEnvelopeLike,
): Result<true, EventEnvelopeDenial> {
  if (
    envelope?.event_mode !== "PRODUCTION" ||
    !isProductionEventMode(envelope.event_mode)
  ) {
    return err(createEventEnvelopeDenial({ code: "EVENT_MODE_CONFLICT" }));
  }

  return ok(true);
}

export function assertEventSubjectMatchesEnvelope(
  envelope: EventEnvelope,
): Result<true, EventEnvelopeDenial> {
  if (envelope.subject.tenant_id !== envelope.tenant_id) {
    return err(createEventEnvelopeDenial({ code: "INVALID_EVENT_SCOPE" }));
  }

  if (
    envelope.subject.workspace_id !== undefined &&
    envelope.workspace_id !== undefined &&
    envelope.subject.workspace_id !== envelope.workspace_id
  ) {
    return err(createEventEnvelopeDenial({ code: "INVALID_EVENT_SCOPE" }));
  }

  if (
    envelope.subject.project_id !== undefined &&
    envelope.project_id !== undefined &&
    envelope.subject.project_id !== envelope.project_id
  ) {
    return err(createEventEnvelopeDenial({ code: "INVALID_EVENT_SCOPE" }));
  }

  return ok(true);
}

export function hasParentEvent(envelope: EventEnvelopeLike): boolean {
  return envelope?.parent_event_id !== undefined;
}

export function isReplayEvent(envelope: EventEnvelopeLike): boolean {
  return envelope?.event_mode === "REPLAY" && isReplayEventMode(envelope.event_mode);
}

export function isEvaluationEvent(envelope: EventEnvelopeLike): boolean {
  return (
    envelope?.event_mode === "EVALUATION" &&
    isEvaluationEventMode(envelope.event_mode)
  );
}

export function isTestEvent(envelope: EventEnvelopeLike): boolean {
  return envelope?.event_mode === "TEST" && isTestEventMode(envelope.event_mode);
}

export function isInvestigationEvent(envelope: EventEnvelopeLike): boolean {
  return (
    envelope?.event_mode === "INVESTIGATION" &&
    isInvestigationEventMode(envelope.event_mode)
  );
}

export function isProductionEvent(envelope: EventEnvelopeLike): boolean {
  return (
    envelope?.event_mode === "PRODUCTION" &&
    isProductionEventMode(envelope.event_mode)
  );
}
