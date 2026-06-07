import { describe, expect, it } from "vitest";

import {
  assertEventSubjectMatchesEnvelope,
  hasParentEvent,
  isEvaluationEvent,
  isInvestigationEvent,
  isProductionEvent,
  isReplayEvent,
  isTestEvent,
  requireEventCorrelation,
  requireEventIdentity,
  requireEventRuntimeIdentity,
  requireEventTenant,
  requireProductionEventMode,
  validateEventEnvelope,
} from "./event-checks";
import { EventEnvelopeSchema, type EventEnvelopeInput } from "./event-envelope";

function validEnvelope(overrides: Partial<EventEnvelopeInput> = {}) {
  const envelope: EventEnvelopeInput = {
    event_id: "evt_checks_01",
    event_name: "Workflow.VersionResolved",
    event_schema_version: "1.0.0",
    event_mode: "PRODUCTION",
    tenant_id: "tenant_checks_01",
    workspace_id: "workspace_checks_01",
    subject: {
      subject_type: "Workflow.Version",
      subject_id: "workflow_version_01",
      tenant_id: "tenant_checks_01",
      workspace_id: "workspace_checks_01",
    },
    correlation_id: "correlation_checks_01",
    runtime_identity_id: "runtime_identity_checks_01",
    origin: "SERVICE_INTERNAL",
    purpose: "validate event checks",
    data_classification: "CONFIDENTIAL",
    occurred_at: "2026-06-06T12:00:00.000Z",
    recorded_at: "2026-06-06T12:00:01.000Z",
  };

  return { ...envelope, ...overrides };
}

function parsedEnvelope(overrides: Partial<EventEnvelopeInput> = {}) {
  return EventEnvelopeSchema.parse(validEnvelope(overrides));
}

describe("event checks", () => {
  it("validates safe event envelopes", () => {
    const result = validateEventEnvelope(validEnvelope());

    expect(result.ok).toBe(true);
  });

  it("fails closed when required event fields are missing", () => {
    expect(validateEventEnvelope({}).ok).toBe(false);
    expect(requireEventIdentity(undefined).ok).toBe(false);
    expect(requireEventTenant(undefined).ok).toBe(false);
    expect(requireEventCorrelation(undefined).ok).toBe(false);
    expect(requireEventRuntimeIdentity(undefined).ok).toBe(false);
  });

  it("detects parent event presence without requiring it", () => {
    expect(hasParentEvent(parsedEnvelope())).toBe(false);
    expect(
      hasParentEvent(parsedEnvelope({ parent_event_id: "evt_parent_01" })),
    ).toBe(true);
  });

  it("returns true only for PRODUCTION events", () => {
    expect(isProductionEvent(parsedEnvelope({ event_mode: "PRODUCTION" }))).toBe(
      true,
    );
    expect(isProductionEvent(parsedEnvelope({ event_mode: "REPLAY" }))).toBe(
      false,
    );
    expect(
      isProductionEvent(parsedEnvelope({ event_mode: "EVALUATION" })),
    ).toBe(false);
    expect(isProductionEvent(parsedEnvelope({ event_mode: "TEST" }))).toBe(
      false,
    );
    expect(
      isProductionEvent(parsedEnvelope({ event_mode: "INVESTIGATION" })),
    ).toBe(false);
  });

  it("returns true only for REPLAY events", () => {
    expect(isReplayEvent(parsedEnvelope({ event_mode: "REPLAY" }))).toBe(true);
    expect(isReplayEvent(parsedEnvelope({ event_mode: "PRODUCTION" }))).toBe(
      false,
    );
  });

  it("returns true only for EVALUATION events", () => {
    expect(isEvaluationEvent(parsedEnvelope({ event_mode: "EVALUATION" }))).toBe(
      true,
    );
    expect(
      isEvaluationEvent(parsedEnvelope({ event_mode: "PRODUCTION" })),
    ).toBe(false);
  });

  it("returns true only for TEST events", () => {
    expect(isTestEvent(parsedEnvelope({ event_mode: "TEST" }))).toBe(true);
    expect(isTestEvent(parsedEnvelope({ event_mode: "PRODUCTION" }))).toBe(
      false,
    );
  });

  it("returns true only for INVESTIGATION events", () => {
    expect(
      isInvestigationEvent(parsedEnvelope({ event_mode: "INVESTIGATION" })),
    ).toBe(true);
    expect(
      isInvestigationEvent(parsedEnvelope({ event_mode: "PRODUCTION" })),
    ).toBe(false);
  });

  it("requires production event mode and fails closed for other modes", () => {
    expect(
      requireProductionEventMode(parsedEnvelope({ event_mode: "PRODUCTION" })).ok,
    ).toBe(true);
    expect(
      requireProductionEventMode(parsedEnvelope({ event_mode: "REPLAY" })).ok,
    ).toBe(false);
    expect(
      requireProductionEventMode(parsedEnvelope({ event_mode: "EVALUATION" }))
        .ok,
    ).toBe(false);
    expect(
      requireProductionEventMode(parsedEnvelope({ event_mode: "TEST" })).ok,
    ).toBe(false);
    expect(
      requireProductionEventMode(parsedEnvelope({ event_mode: "INVESTIGATION" }))
        .ok,
    ).toBe(false);
  });

  it("asserts event subject and envelope scope alignment", () => {
    const envelope = parsedEnvelope();

    expect(assertEventSubjectMatchesEnvelope(envelope).ok).toBe(true);
  });

  it("does not infer tenant from email, domain, or prefix-like strings", () => {
    const result = validateEventEnvelope({
      ...validEnvelope({
        tenant_id: undefined,
        metadata: {
          source: "tenant-acme-example.com",
        },
      }),
      subject: {
        subject_type: "Workflow.Version",
        subject_id: "workflow_version_01",
        tenant_id: "tenant-acme-example.com",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });
});
