import { describe, expect, it } from "vitest";

import { EventEnvelopeSchema, type EventEnvelopeInput } from "./event-envelope";

const unsafeContentTerms = [
  "token",
  "secret",
  "password",
  "credential",
  "raw_prompt",
  "raw_model_output",
  "raw_tool_payload",
  "raw_memory_fragment",
  "private_key",
] as const;

function validEnvelope(overrides: Partial<EventEnvelopeInput> = {}) {
  const envelope: EventEnvelopeInput = {
    event_id: "evt_01",
    event_name: "Runtime.RunRequested",
    event_schema_version: "1.0.0",
    event_mode: "PRODUCTION",
    tenant_id: "tenant_01",
    workspace_id: "workspace_01",
    project_id: "project_01",
    subject: {
      subject_type: "Runtime.Run",
      subject_id: "run_01",
      tenant_id: "tenant_01",
      workspace_id: "workspace_01",
      project_id: "project_01",
    },
    request_id: "request_01",
    correlation_id: "correlation_01",
    runtime_identity_id: "runtime_identity_01",
    actor_id: "actor_01",
    origin: "HUMAN_UI",
    purpose: "validate event envelope shape",
    data_classification: "INTERNAL",
    occurred_at: "2026-06-06T12:00:00.000Z",
    recorded_at: "2026-06-06T12:00:01.000Z",
    ordering: {
      ordering_scope: "RUN",
      ordering_key: "run_01",
      sequence_number: 1,
    },
    payload: {
      payload_ref: "payload_ref_01",
      payload_hash: "sha256_01",
      payload_schema_version: "1.0.0",
      payload_classification: "INTERNAL",
      redaction_status: "EXTERNALIZED_REFERENCE",
      safe_summary: "safe operational summary",
    },
    metadata: {
      component: "event-envelope-test",
    },
  };

  return { ...envelope, ...overrides };
}

function withoutKey<Key extends keyof EventEnvelopeInput>(
  key: Key,
): EventEnvelopeInput {
  const envelope = validEnvelope();
  delete envelope[key];
  return envelope;
}

describe("EventEnvelopeSchema", () => {
  it("requires event_id", () => {
    expect(EventEnvelopeSchema.safeParse(withoutKey("event_id")).success).toBe(
      false,
    );
  });

  it("requires event_name", () => {
    expect(EventEnvelopeSchema.safeParse(withoutKey("event_name")).success).toBe(
      false,
    );
  });

  it("requires event_schema_version", () => {
    expect(
      EventEnvelopeSchema.safeParse(withoutKey("event_schema_version")).success,
    ).toBe(false);
  });

  it("requires event_mode", () => {
    expect(EventEnvelopeSchema.safeParse(withoutKey("event_mode")).success).toBe(
      false,
    );
  });

  it("requires tenant_id", () => {
    expect(EventEnvelopeSchema.safeParse(withoutKey("tenant_id")).success).toBe(
      false,
    );
  });

  it("requires runtime_identity_id", () => {
    expect(
      EventEnvelopeSchema.safeParse(withoutKey("runtime_identity_id")).success,
    ).toBe(false);
  });

  it("requires correlation_id", () => {
    expect(
      EventEnvelopeSchema.safeParse(withoutKey("correlation_id")).success,
    ).toBe(false);
  });

  it("requires purpose", () => {
    expect(EventEnvelopeSchema.safeParse(withoutKey("purpose")).success).toBe(
      false,
    );
  });

  it("rejects project_id without workspace_id", () => {
    const input = validEnvelope({
      workspace_id: undefined,
      project_id: "project_01",
      subject: {
        subject_type: "Runtime.Run",
        subject_id: "run_01",
        tenant_id: "tenant_01",
        project_id: "project_01",
      },
    });

    expect(EventEnvelopeSchema.safeParse(input).success).toBe(false);
  });

  it("rejects invalid occurred_at", () => {
    expect(
      EventEnvelopeSchema.safeParse(
        validEnvelope({ occurred_at: "not-a-date" }),
      ).success,
    ).toBe(false);
  });

  it("rejects invalid recorded_at", () => {
    expect(
      EventEnvelopeSchema.safeParse(
        validEnvelope({ recorded_at: "2026-06-06 12:00:00" }),
      ).success,
    ).toBe(false);
  });

  it("rejects unsafe metadata keys and values", () => {
    for (const unsafeTerm of unsafeContentTerms) {
      expect(
        EventEnvelopeSchema.safeParse(
          validEnvelope({ metadata: { [unsafeTerm]: "safe-looking" } }),
        ).success,
      ).toBe(false);

      expect(
        EventEnvelopeSchema.safeParse(
          validEnvelope({ metadata: { component: unsafeTerm } }),
        ).success,
      ).toBe(false);
    }
  });

  it("rejects unsafe payload descriptor content", () => {
    for (const unsafeTerm of unsafeContentTerms) {
      expect(
        EventEnvelopeSchema.safeParse(
          validEnvelope({
            payload: {
              payload_ref: unsafeTerm,
              payload_classification: "SECRET",
              redaction_status: "EXTERNALIZED_REFERENCE",
            },
          }),
        ).success,
      ).toBe(false);
    }
  });

  it("requires subject tenant_id to match envelope tenant_id", () => {
    expect(
      EventEnvelopeSchema.safeParse(
        validEnvelope({
          subject: {
            subject_type: "Runtime.Run",
            subject_id: "run_01",
            tenant_id: "tenant_02",
            workspace_id: "workspace_01",
            project_id: "project_01",
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("requires subject workspace_id to match envelope workspace_id when both are present", () => {
    expect(
      EventEnvelopeSchema.safeParse(
        validEnvelope({
          subject: {
            subject_type: "Runtime.Run",
            subject_id: "run_01",
            tenant_id: "tenant_01",
            workspace_id: "workspace_02",
            project_id: "project_01",
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("requires subject project_id to match envelope project_id when both are present", () => {
    expect(
      EventEnvelopeSchema.safeParse(
        validEnvelope({
          subject: {
            subject_type: "Runtime.Run",
            subject_id: "run_01",
            tenant_id: "tenant_01",
            workspace_id: "workspace_01",
            project_id: "project_02",
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("allows root events to omit causation_id", () => {
    expect(
      EventEnvelopeSchema.safeParse(withoutKey("causation_id")).success,
    ).toBe(true);
  });

  it("allows parent_event_id to be omitted", () => {
    expect(
      EventEnvelopeSchema.safeParse(withoutKey("parent_event_id")).success,
    ).toBe(true);
  });

  it("requires sequence_number to be positive when present", () => {
    expect(
      EventEnvelopeSchema.safeParse(
        validEnvelope({
          ordering: {
            ordering_scope: "RUN",
            ordering_key: "run_01",
            sequence_number: 0,
          },
        }),
      ).success,
    ).toBe(false);
  });
});
