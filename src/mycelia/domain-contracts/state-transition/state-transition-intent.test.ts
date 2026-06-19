import { describe, expect, it } from "vitest";

import {
  evaluateStateTransitionIntent,
  isStateTransitionAccepted,
  isStateTransitionRejected,
  validateStateTransitionIntent,
} from ".";
import type { StateTransitionIntentInput } from "./state-transition-intent";

export function validStateTransitionIntent(
  overrides: Partial<StateTransitionIntentInput> = {},
): StateTransitionIntentInput {
  return {
    transition_intent_id: "state_transition_intent_001",
    tenant_id: "tenant_001",
    run_id: "run_001",
    from_state_id: "runtime_state_001",
    from_kind: "CREATED",
    to_kind: "ADMITTED",
    expected_from_version: 1,
    requested_by: "runtime_identity_001",
    reason_code: "STATE_TRANSITION_REQUESTED",
    declared_purpose: "state transition validation",
    data_classification: "INTERNAL",
    requested_at: "2026-06-01T00:00:05.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      phase: "one_j",
    },
    ...overrides,
  };
}

describe("StateTransitionIntent", () => {
  it.each([
    ["CREATED", "ADMITTED"],
    ["CREATED", "REJECTED"],
    ["CREATED", "CANCELLED"],
    ["ADMITTED", "CANCELLED"],
    ["REJECTED", "CANCELLED"],
  ] as const)("accepts valid %s -> %s intent", (from_kind, to_kind) => {
    const result = evaluateStateTransitionIntent(
      validStateTransitionIntent({
        from_kind,
        to_kind,
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("ACCEPTED");
      expect(isStateTransitionAccepted(result.value)).toBe(true);
    }
  });

  it("rejects same-kind transition intent", () => {
    const result = evaluateStateTransitionIntent(
      validStateTransitionIntent({
        from_kind: "CREATED",
        to_kind: "CREATED",
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("REJECTED");
      expect(isStateTransitionRejected(result.value)).toBe(true);
    }
  });

  it("rejects ADMITTED -> REJECTED intent", () => {
    const result = evaluateStateTransitionIntent(
      validStateTransitionIntent({
        from_kind: "ADMITTED",
        to_kind: "REJECTED",
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("REJECTED");
    }
  });

  it("rejects REJECTED -> ADMITTED intent", () => {
    const result = evaluateStateTransitionIntent(
      validStateTransitionIntent({
        from_kind: "REJECTED",
        to_kind: "ADMITTED",
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("REJECTED");
    }
  });

  it("rejects missing tenant_id", () => {
    const intent = validStateTransitionIntent() as Record<string, unknown>;
    delete intent.tenant_id;
    intent.metadata = {
      display: "alice@example.com",
    };

    const result = validateStateTransitionIntent(intent);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects missing run_id", () => {
    const intent = validStateTransitionIntent() as Record<string, unknown>;
    delete intent.run_id;

    const result = validateStateTransitionIntent(intent);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RUN_ID_REQUIRED");
    }
  });

  it("rejects non-positive expected_from_version", () => {
    const result = validateStateTransitionIntent(
      validStateTransitionIntent({
        expected_from_version: 0,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("EXPECTED_FROM_VERSION_INVALID");
    }
  });

  it("rejects invalid requested_at", () => {
    const result = validateStateTransitionIntent(
      validStateTransitionIntent({
        requested_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_STATE_TRANSITION_TIMESTAMP");
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateStateTransitionIntent(
      validStateTransitionIntent({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_STATE_TRANSITION_METADATA");
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const intent = validStateTransitionIntent() as Record<string, unknown>;
    delete intent.tenant_id;
    intent.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateStateTransitionIntent(intent);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });
});
