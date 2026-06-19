import type { CorrelationId, EventId } from "../../foundation/shared-kernel";

export const EventEnvelopeDenialCodes = [
  "EVENT_ID_REQUIRED",
  "EVENT_NAME_REQUIRED",
  "EVENT_SCHEMA_VERSION_REQUIRED",
  "EVENT_MODE_REQUIRED",
  "TENANT_ID_REQUIRED",
  "RUNTIME_IDENTITY_REQUIRED",
  "CORRELATION_ID_REQUIRED",
  "PURPOSE_REQUIRED",
  "INVALID_EVENT_SUBJECT",
  "INVALID_EVENT_SCOPE",
  "INVALID_EVENT_TIMESTAMP",
  "UNSAFE_EVENT_METADATA",
  "UNSAFE_EVENT_PAYLOAD_DESCRIPTOR",
  "EVENT_MODE_CONFLICT",
  "INVALID_EVENT_ENVELOPE",
] as const;

export type EventEnvelopeDenialCode =
  (typeof EventEnvelopeDenialCodes)[number];

export type EventEnvelopeDenial = {
  readonly code: EventEnvelopeDenialCode;
  readonly message: string;
  readonly correlation_id?: CorrelationId;
  readonly event_id?: EventId;
  readonly safe: true;
};

export type CreateEventEnvelopeDenialInput = {
  readonly code: EventEnvelopeDenialCode;
  readonly correlation_id?: CorrelationId;
  readonly event_id?: EventId;
};

const SAFE_EVENT_DENIAL_MESSAGES: Record<EventEnvelopeDenialCode, string> = {
  EVENT_ID_REQUIRED: "An event identifier is required.",
  EVENT_NAME_REQUIRED: "An event name is required.",
  EVENT_SCHEMA_VERSION_REQUIRED: "An event schema version is required.",
  EVENT_MODE_REQUIRED: "An event mode is required.",
  TENANT_ID_REQUIRED: "A tenant identity is required.",
  RUNTIME_IDENTITY_REQUIRED: "A runtime identity is required.",
  CORRELATION_ID_REQUIRED: "A correlation identifier is required.",
  PURPOSE_REQUIRED: "An event purpose is required.",
  INVALID_EVENT_SUBJECT: "The event subject is invalid.",
  INVALID_EVENT_SCOPE: "The event scope is invalid.",
  INVALID_EVENT_TIMESTAMP: "The event timestamp is invalid.",
  UNSAFE_EVENT_METADATA: "The event metadata is unsafe.",
  UNSAFE_EVENT_PAYLOAD_DESCRIPTOR: "The event payload descriptor is unsafe.",
  EVENT_MODE_CONFLICT: "The event mode is not valid for this operation.",
  INVALID_EVENT_ENVELOPE: "The event envelope is invalid.",
};

export function createEventEnvelopeDenial(
  input: CreateEventEnvelopeDenialInput,
): EventEnvelopeDenial {
  return {
    code: input.code,
    message: SAFE_EVENT_DENIAL_MESSAGES[input.code],
    correlation_id: input.correlation_id,
    event_id: input.event_id,
    safe: true,
  };
}
