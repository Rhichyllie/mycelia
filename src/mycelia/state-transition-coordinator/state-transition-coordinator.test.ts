import { describe, expect, it } from "vitest";

import type { RuntimeStateInput } from "../runtime-state";
import type { StateTransitionIntentInput } from "../state-transition";

import {
  assertStateTransitionCoordinationReady,
  coordinateStateTransition,
  createStateTransitionCoordinationDenial,
  isStateTransitionCoordinationReady,
  isStateTransitionCoordinationRejected,
  validateStateTransitionCoordinationRequest,
} from ".";
import type { StateTransitionCoordinationRequestInput } from "./state-transition-coordination-request";

function validRuntimeState(
  kind: "CREATED" | "ADMITTED" | "REJECTED" | "CANCELLED" = "CREATED",
  version = 1,
  overrides: Partial<RuntimeStateInput> = {},
): RuntimeStateInput {
  return {
    state_id: "runtime_state_001",
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
      phase: "one_k",
    },
    ...overrides,
  };
}

function validTransitionIntent(
  from_kind: "CREATED" | "ADMITTED" | "REJECTED" | "CANCELLED" = "CREATED",
  to_kind: "CREATED" | "ADMITTED" | "REJECTED" | "CANCELLED" = "ADMITTED",
  overrides: Partial<StateTransitionIntentInput> = {},
): StateTransitionIntentInput {
  return {
    transition_intent_id: "state_transition_intent_001",
    tenant_id: "tenant_001",
    run_id: "run_001",
    from_state_id: "runtime_state_001",
    from_kind,
    to_kind,
    expected_from_version: 1,
    requested_by: "runtime_identity_001",
    reason_code: "STATE_TRANSITION_REQUESTED",
    declared_purpose: "state transition coordination validation",
    data_classification: "INTERNAL",
    requested_at: "2026-06-01T00:00:05.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      phase: "one_k",
    },
    ...overrides,
  };
}

function validCoordinationRequest(
  overrides: Partial<StateTransitionCoordinationRequestInput> = {},
): StateTransitionCoordinationRequestInput {
  return {
    coordination_request_id: "state_transition_coordination_request_001",
    tenant_id: "tenant_001",
    run_id: "run_001",
    current_state: validRuntimeState(),
    transition_intent: validTransitionIntent(),
    requested_at: "2026-06-01T00:00:06.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      phase: "one_k",
    },
    ...overrides,
  };
}

describe("StateTransitionCoordinator", () => {
  it("returns READY for valid CREATED -> ADMITTED coordination", () => {
    const result = coordinateStateTransition(validCoordinationRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("READY");
      expect(isStateTransitionCoordinationReady(result.value)).toBe(true);
      expect(result.value.transition?.from_kind).toBe("CREATED");
      expect(result.value.transition?.to_kind).toBe("ADMITTED");
      expect(result.value.transition_result?.outcome).toBe("ACCEPTED");
    }
  });

  it("returns READY for valid CREATED -> REJECTED coordination", () => {
    const result = coordinateStateTransition(
      validCoordinationRequest({
        transition_intent: validTransitionIntent("CREATED", "REJECTED"),
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("READY");
      expect(result.value.transition_result?.outcome).toBe("ACCEPTED");
    }
  });

  it("returns REJECTED for invalid same-kind transition", () => {
    const result = coordinateStateTransition(
      validCoordinationRequest({
        transition_intent: validTransitionIntent("CREATED", "CREATED"),
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("REJECTED");
      expect(isStateTransitionCoordinationRejected(result.value)).toBe(true);
    }
  });

  it("returns REJECTED for invalid ADMITTED -> REJECTED transition", () => {
    const result = coordinateStateTransition(
      validCoordinationRequest({
        current_state: validRuntimeState("ADMITTED"),
        transition_intent: validTransitionIntent("ADMITTED", "REJECTED"),
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("REJECTED");
    }
  });

  it("rejects missing tenant_id", () => {
    const request = validCoordinationRequest() as Record<string, unknown>;
    delete request.tenant_id;

    const result = validateStateTransitionCoordinationRequest(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects missing run_id", () => {
    const request = validCoordinationRequest() as Record<string, unknown>;
    delete request.run_id;

    const result = validateStateTransitionCoordinationRequest(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RUN_ID_REQUIRED");
    }
  });

  it("rejects invalid current_state", () => {
    const result = validateStateTransitionCoordinationRequest(
      validCoordinationRequest({
        current_state: validRuntimeState("CREATED", 0),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CURRENT_STATE_INVALID");
    }
  });

  it("rejects invalid transition_intent", () => {
    const result = validateStateTransitionCoordinationRequest(
      validCoordinationRequest({
        transition_intent: validTransitionIntent("CREATED", "ADMITTED", {
          expected_from_version: 0,
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TRANSITION_INTENT_INVALID");
    }
  });

  it("rejects current_state tenant mismatch", () => {
    const result = validateStateTransitionCoordinationRequest(
      validCoordinationRequest({
        current_state: validRuntimeState("CREATED", 1, {
          tenant_id: "tenant_002",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATE_TRANSITION_COORDINATION_TENANT_MISMATCH",
      );
    }
  });

  it("rejects current_state run mismatch", () => {
    const result = validateStateTransitionCoordinationRequest(
      validCoordinationRequest({
        current_state: validRuntimeState("CREATED", 1, {
          run_id: "run_002",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATE_TRANSITION_COORDINATION_RUN_MISMATCH",
      );
    }
  });

  it("rejects transition_intent tenant mismatch", () => {
    const result = validateStateTransitionCoordinationRequest(
      validCoordinationRequest({
        transition_intent: validTransitionIntent("CREATED", "ADMITTED", {
          tenant_id: "tenant_002",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATE_TRANSITION_COORDINATION_TENANT_MISMATCH",
      );
    }
  });

  it("rejects transition_intent run mismatch", () => {
    const result = validateStateTransitionCoordinationRequest(
      validCoordinationRequest({
        transition_intent: validTransitionIntent("CREATED", "ADMITTED", {
          run_id: "run_002",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATE_TRANSITION_COORDINATION_RUN_MISMATCH",
      );
    }
  });

  it("rejects transition_intent from_kind mismatch with current_state kind", () => {
    const result = validateStateTransitionCoordinationRequest(
      validCoordinationRequest({
        transition_intent: validTransitionIntent("ADMITTED", "CANCELLED"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATE_TRANSITION_COORDINATION_KIND_MISMATCH",
      );
    }
  });

  it("rejects expected_from_version mismatch", () => {
    const result = validateStateTransitionCoordinationRequest(
      validCoordinationRequest({
        transition_intent: validTransitionIntent("CREATED", "ADMITTED", {
          expected_from_version: 2,
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATE_TRANSITION_COORDINATION_VERSION_MISMATCH",
      );
    }
  });

  it("rejects invalid requested_at", () => {
    const result = validateStateTransitionCoordinationRequest(
      validCoordinationRequest({
        requested_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INVALID_STATE_TRANSITION_COORDINATION_TIMESTAMP",
      );
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateStateTransitionCoordinationRequest(
      validCoordinationRequest({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "UNSAFE_STATE_TRANSITION_COORDINATION_METADATA",
      );
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const request = validCoordinationRequest() as Record<string, unknown>;
    delete request.tenant_id;
    request.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateStateTransitionCoordinationRequest(request);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("includes typed transition and accepted transition_result descriptors when READY", () => {
    const result = coordinateStateTransition(validCoordinationRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.transition).toBeDefined();
      expect(result.value.transition?.to_state_ref).toBe("runtime_state_001.next");
      expect(result.value.transition).not.toHaveProperty("to_state");
      expect(result.value.transition_result?.outcome).toBe("ACCEPTED");
      expect(assertStateTransitionCoordinationReady(result.value).ok).toBe(true);
    }
  });

  it("does not mutate input RuntimeState when READY", () => {
    const currentState = validRuntimeState();
    const before = JSON.stringify(currentState);
    const result = coordinateStateTransition(
      validCoordinationRequest({
        current_state: currentState,
      }),
    );

    expect(result.ok).toBe(true);
    expect(JSON.stringify(currentState)).toBe(before);
  });

  it("returns fail-closed REJECTED results for malformed requests", () => {
    const result = coordinateStateTransition(undefined);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.outcome).toBe("REJECTED");
      expect(isStateTransitionCoordinationRejected(result.value)).toBe(true);
      expect(result.value.transition).toBeUndefined();
      expect(result.value.transition_result).toBeUndefined();
    }
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createStateTransitionCoordinationDenial({
      code: "STATE_TRANSITION_COORDINATION_TENANT_MISMATCH",
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
