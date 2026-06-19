import { describe, expect, it } from "vitest";

import {
  RuntimeEnvelopeSchema,
  type RuntimeEnvelopeInput,
} from "./runtime-envelope";

export function validRuntimeEnvelope(
  overrides: Partial<RuntimeEnvelopeInput> = {},
): RuntimeEnvelopeInput {
  const envelope: RuntimeEnvelopeInput = {
    envelope_id: "runtime_envelope_01",
    tenant_id: "tenant_runtime_01",
    scope: {
      tenant_id: "tenant_runtime_01",
      workspace_id: "workspace_runtime_01",
      project_id: "project_runtime_01",
    },
    request_id: "request_runtime_01",
    runtime_identity: {
      runtime_identity_id: "runtime_identity_01",
      actor_id: "actor_runtime_01",
      tenant_id: "tenant_runtime_01",
      workspace_id: "workspace_runtime_01",
      project_id: "project_runtime_01",
    },
    actor: {
      actor_id: "actor_runtime_01",
      tenant_id: "tenant_runtime_01",
      workspace_id: "workspace_runtime_01",
      project_id: "project_runtime_01",
    },
    actor_id: "actor_runtime_01",
    policy_context: {
      decision_request_id: "policy_decision_request_runtime_01",
      policy_decision_id: "policy_decision_runtime_01",
      policy_snapshot_id: "policy_snapshot_runtime_01",
      policy_basis_ref: "policy_basis_runtime_01",
    },
    correlation_id: "correlation_runtime_01",
    causation_id: "causation_runtime_01",
    source_event_id: "event_runtime_01",
    declared_purpose: "govern runtime envelope propagation",
    data_classification: "CONFIDENTIAL",
    mode: "PRODUCTION",
    created_at: "2026-06-06T12:00:00.000Z",
    expires_at: "2026-06-06T12:30:00.000Z",
    metadata: {
      component: "runtime-envelope-test",
    },
  };

  return { ...envelope, ...overrides };
}

describe("RuntimeEnvelopeSchema", () => {
  it("accepts a valid production runtime envelope", () => {
    expect(RuntimeEnvelopeSchema.safeParse(validRuntimeEnvelope()).success).toBe(
      true,
    );
  });

  it("accepts a valid replay runtime envelope", () => {
    expect(
      RuntimeEnvelopeSchema.safeParse(
        validRuntimeEnvelope({
          mode: "REPLAY",
          is_replay: true,
          replay_suppression_active: true,
        }),
      ).success,
    ).toBe(true);
  });

  it("rejects missing tenant_id", () => {
    expect(
      RuntimeEnvelopeSchema.safeParse(
        validRuntimeEnvelope({ tenant_id: undefined }),
      ).success,
    ).toBe(false);
  });

  it("rejects scope tenant mismatch", () => {
    expect(
      RuntimeEnvelopeSchema.safeParse(
        validRuntimeEnvelope({
          scope: {
            tenant_id: "tenant_runtime_02",
            workspace_id: "workspace_runtime_01",
            project_id: "project_runtime_01",
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects project_id without workspace_id", () => {
    expect(
      RuntimeEnvelopeSchema.safeParse(
        validRuntimeEnvelope({
          scope: {
            tenant_id: "tenant_runtime_01",
            project_id: "project_runtime_01",
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix, or external ID", () => {
    expect(
      RuntimeEnvelopeSchema.safeParse(
        validRuntimeEnvelope({
          tenant_id: undefined,
          metadata: {
            label: "tenant-acme-prefix",
            source: "external-reference-only",
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects invalid timestamps", () => {
    expect(
      RuntimeEnvelopeSchema.safeParse(
        validRuntimeEnvelope({ created_at: "2026-06-06 12:00:00" }),
      ).success,
    ).toBe(false);
  });

  it("rejects expires_at before created_at", () => {
    expect(
      RuntimeEnvelopeSchema.safeParse(
        validRuntimeEnvelope({
          expires_at: "2026-06-06T11:59:59.000Z",
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects unsafe metadata", () => {
    expect(
      RuntimeEnvelopeSchema.safeParse(
        validRuntimeEnvelope({
          metadata: {
            token: "secret",
          },
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects production mode with replay flags", () => {
    expect(
      RuntimeEnvelopeSchema.safeParse(
        validRuntimeEnvelope({
          mode: "PRODUCTION",
          is_replay: true,
          replay_suppression_active: true,
        }),
      ).success,
    ).toBe(false);
  });
});
