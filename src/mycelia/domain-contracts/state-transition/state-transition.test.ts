import { describe, expect, it } from "vitest";

import type { RuntimeStateInput } from "../../domain-contracts/runtime-state";

import {
  assertStateTransitionAccepted,
  createStateTransitionDenial,
  evaluateStateTransitionIntent,
  failClosedStateTransitionResult,
  isStateTransitionAccepted,
  isStateTransitionRejected,
  validateStateTransition,
  validateStateTransitionIntent,
} from ".";
import type { StateTransitionInput } from "./state-transition";
import { validStateTransitionIntent } from "./state-transition-intent.test";

function validRuntimeState(
  kind: "CREATED" | "ADMITTED" | "REJECTED" | "CANCELLED" = "CREATED",
  version = 1,
  overrides: Partial<RuntimeStateInput> = {},
): RuntimeStateInput {
  return {
    state_id: `runtime_state_${version}`,
    run_id: "run_001",
    tenant_id: "tenant_001",
    workspace_id: "workspace_001",
    project_id: "project_001",
    kind,
    governed_run_ref: "governed_run_ref_001",
    version,
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    data_classification: "INTERNAL",
    recorded_at: "2026-06-01T00:00:04.000Z",
    metadata: {
      phase: "one_j",
    },
    ...overrides,
  };
}

function validStateTransition(
  overrides: Partial<StateTransitionInput> = {},
): StateTransitionInput {
  return {
    transition_id: "state_transition_001",
    tenant_id: "tenant_001",
    run_id: "run_001",
    from_state: validRuntimeState("CREATED", 1),
    to_state: validRuntimeState("ADMITTED", 2),
    intent: validStateTransitionIntent(),
    from_kind: "CREATED",
    to_kind: "ADMITTED",
    from_version: 1,
    to_version: 2,
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    data_classification: "INTERNAL",
    validated_at: "2026-06-01T00:00:06.000Z",
    metadata: {
      phase: "one_j",
    },
    ...overrides,
  };
}

describe("StateTransition", () => {
  it("accepts a valid descriptor with embedded from/to states", () => {
    const result = validateStateTransition(validStateTransition());

    expect(result.ok).toBe(true);
  });

  it("rejects transition tenant mismatch with embedded states", () => {
    const result = validateStateTransition(
      validStateTransition({
        from_state: validRuntimeState("CREATED", 1, {
          tenant_id: "tenant_002",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STATE_TRANSITION_TENANT_MISMATCH");
    }
  });

  it("rejects intent tenant mismatch", () => {
    const result = validateStateTransition(
      validStateTransition({
        intent: validStateTransitionIntent({
          tenant_id: "tenant_002",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STATE_TRANSITION_TENANT_MISMATCH");
    }
  });

  it("rejects intent run mismatch", () => {
    const result = validateStateTransition(
      validStateTransition({
        intent: validStateTransitionIntent({
          run_id: "run_002",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STATE_TRANSITION_RUN_MISMATCH");
    }
  });

  it("rejects from/to kind mismatch", () => {
    const result = validateStateTransition(
      validStateTransition({
        from_kind: "ADMITTED",
        to_kind: "CANCELLED",
        intent: validStateTransitionIntent({
          from_kind: "ADMITTED",
          to_kind: "CANCELLED",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STATE_TRANSITION_KIND_MISMATCH");
    }
  });

  it("rejects to_version not equal to from_version + 1", () => {
    const result = validateStateTransition(
      validStateTransition({
        to_version: 3,
        to_state: validRuntimeState("ADMITTED", 3),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STATE_TRANSITION_VERSION_MISMATCH");
    }
  });

  it("fails closed for a missing transition result", () => {
    expect(isStateTransitionRejected(undefined)).toBe(true);

    const assertion = assertStateTransitionAccepted(undefined);

    expect(assertion.ok).toBe(false);
    if (!assertion.ok) {
      expect(assertion.error.code).toBe("STATE_TRANSITION_RESULT_REQUIRED");
    }
  });

  it("keeps ACCEPTED result as contract acceptance without mutating state", () => {
    const fromState = validRuntimeState("CREATED", 1);
    const result = evaluateStateTransitionIntent(validStateTransitionIntent());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("ACCEPTED");
      expect(isStateTransitionAccepted(result.value)).toBe(true);
      expect(fromState.kind).toBe("CREATED");
      expect(result.value).not.toHaveProperty("mutated_state");
      expect(result.value).not.toHaveProperty("persisted_state");
    }
  });

  it("creates fail-closed REJECTED result descriptors", () => {
    const intent = validateStateTransitionIntent(
      validStateTransitionIntent({
        from_kind: "ADMITTED",
        to_kind: "REJECTED",
      }),
    );

    expect(intent.ok).toBe(true);
    if (intent.ok) {
      const rejected = failClosedStateTransitionResult(intent.value);

      expect(rejected.outcome).toBe("REJECTED");
      expect(isStateTransitionRejected(rejected)).toBe(true);
    }
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createStateTransitionDenial({
      code: "STATE_TRANSITION_TENANT_MISMATCH",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("checkpoint_internals");
    expect(serialized).not.toContain("state_internals");
    expect(serialized).not.toContain("secret-token");
  });
});
