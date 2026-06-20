import { describe, expect, it } from "vitest";

import type { GovernedRunInput } from "../../domain-contracts/governed-run";
import type { RuntimeAdmissionDecisionInput } from "../../domain-contracts/runtime-admission-gateway";

import {
  assertRuntimeStateUsable,
  createRuntimeStateDenial,
  isRuntimeStateAdmitted,
  isRuntimeStateCancelled,
  isRuntimeStateCreated,
  validateRuntimeState,
} from ".";
import type { RuntimeStateInput } from "./runtime-state";

function validRuntimeEnvelope(tenantId = "tenant_001") {
  return {
    envelope_id: "runtime_envelope_001",
    tenant_id: tenantId,
    scope: {
      tenant_id: tenantId,
      workspace_id: "workspace_001",
      project_id: "project_001",
    },
    request_id: "request_001",
    runtime_identity: {
      runtime_identity_id: "runtime_identity_001",
      actor_id: "actor_001",
      tenant_id: tenantId,
      workspace_id: "workspace_001",
      project_id: "project_001",
    },
    actor: {
      actor_id: "actor_001",
      tenant_id: tenantId,
      workspace_id: "workspace_001",
      project_id: "project_001",
    },
    actor_id: "actor_001",
    policy_context: {
      decision_request_id: "policy_decision_request_001",
      policy_decision_id: "policy_decision_001",
      policy_basis_ref: "policy_basis_001",
    },
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    declared_purpose: "runtime state validation",
    data_classification: "INTERNAL",
    mode: "PRODUCTION",
    created_at: "2026-06-01T00:00:00.000Z",
  } as const;
}

function validAdmissionDecision(
  outcome: "ADMIT" | "DENY" | "REQUIRE_APPROVAL" = "ADMIT",
  tenantId = "tenant_001",
): RuntimeAdmissionDecisionInput {
  const byOutcome = {
    ADMIT: {
      reason_code: "RUNTIME_ADMISSION_ALLOWED",
      message: "The operation is admitted.",
    },
    DENY: {
      reason_code: "RUNTIME_ADMISSION_DENIED",
      message: "The operation is denied before admission.",
    },
    REQUIRE_APPROVAL: {
      reason_code: "RUNTIME_ADMISSION_APPROVAL_REQUIRED",
      message: "The operation requires approval before admission.",
    },
  } as const;

  return {
    admission_decision_id: "runtime_admission_decision_001",
    admission_request_id: "runtime_admission_request_001",
    tenant_id: tenantId,
    outcome,
    decided_at: "2026-06-01T00:00:01.000Z",
    reason_code: byOutcome[outcome].reason_code,
    message: byOutcome[outcome].message,
    correlation_id: "correlation_001",
    obligations: [
      {
        obligation_type: "EMIT_AUDIT",
        severity: "REQUIRED",
        reason_code: "AUDIT_REQUIRED",
      },
    ],
  };
}

export function validGovernedRun(
  status: "CREATED" | "ADMITTED" | "REJECTED" | "CANCELLED" = "CREATED",
  overrides: Partial<GovernedRunInput> = {},
): GovernedRunInput {
  const admission_decision =
    status === "ADMITTED"
      ? validAdmissionDecision("ADMIT")
      : status === "REJECTED"
        ? validAdmissionDecision("DENY")
        : undefined;

  return {
    run_id: "run_001",
    tenant_id: "tenant_001",
    workspace_id: "workspace_001",
    project_id: "project_001",
    status,
    origin: "RUNTIME_ADMISSION",
    runtime_envelope_id: "runtime_envelope_001",
    runtime_envelope: validRuntimeEnvelope(),
    admission_decision_id: "runtime_admission_decision_001",
    admission_decision,
    request_id: "request_001",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    declared_purpose: "runtime state validation",
    data_classification: "INTERNAL",
    created_at: "2026-06-01T00:00:02.000Z",
    admitted_at:
      status === "ADMITTED" ? "2026-06-01T00:00:03.000Z" : undefined,
    rejected_at:
      status === "REJECTED" ? "2026-06-01T00:00:03.000Z" : undefined,
    cancelled_at:
      status === "CANCELLED" ? "2026-06-01T00:00:03.000Z" : undefined,
    metadata: {
      phase: "one_i",
    },
    ...overrides,
  };
}

export function validRuntimeState(
  overrides: Partial<RuntimeStateInput> = {},
): RuntimeStateInput {
  return {
    state_id: "runtime_state_001",
    run_id: "run_001",
    tenant_id: "tenant_001",
    workspace_id: "workspace_001",
    project_id: "project_001",
    kind: "CREATED",
    governed_run_ref: "governed_run_ref_001",
    version: 1,
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    data_classification: "INTERNAL",
    recorded_at: "2026-06-01T00:00:04.000Z",
    checkpoint_ref: "checkpoint_ref_001",
    previous_state_id: "runtime_state_000",
    metadata: {
      phase: "one_i",
    },
    ...overrides,
  };
}

describe("RuntimeState", () => {
  it("accepts a valid CREATED runtime state", () => {
    const state = validRuntimeState();
    const result = validateRuntimeState(state);

    expect(result.ok).toBe(true);
    expect(isRuntimeStateCreated(state)).toBe(true);
    expect(isRuntimeStateAdmitted(state)).toBe(false);
    expect(assertRuntimeStateUsable(state).ok).toBe(true);
  });

  it("accepts a valid ADMITTED runtime state with embedded admitted GovernedRun", () => {
    const state = validRuntimeState({
      kind: "ADMITTED",
      governed_run_ref: undefined,
      governed_run: validGovernedRun("ADMITTED"),
    });
    const result = validateRuntimeState(state);

    expect(result.ok).toBe(true);
    expect(isRuntimeStateAdmitted(state)).toBe(true);
  });

  it("rejects missing tenant_id", () => {
    const state = validRuntimeState() as Record<string, unknown>;
    delete state.tenant_id;
    state.metadata = {
      display: "alice@example.com",
    };

    const result = validateRuntimeState(state);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects missing run_id", () => {
    const state = validRuntimeState() as Record<string, unknown>;
    delete state.run_id;

    const result = validateRuntimeState(state);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RUN_ID_REQUIRED");
    }
  });

  it("rejects project_id without workspace_id", () => {
    const state = validRuntimeState() as Record<string, unknown>;
    delete state.workspace_id;

    const result = validateRuntimeState(state);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RUNTIME_STATE_SCOPE_INVALID");
    }
  });

  it("rejects non-positive version", () => {
    const result = validateRuntimeState(
      validRuntimeState({
        version: 0,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RUNTIME_STATE_VERSION_INVALID");
    }
  });

  it("rejects governed_run tenant mismatch", () => {
    const result = validateRuntimeState(
      validRuntimeState({
        governed_run_ref: undefined,
        governed_run: validGovernedRun("CREATED", {
          tenant_id: "tenant_002",
          runtime_envelope: validRuntimeEnvelope("tenant_002"),
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RUNTIME_STATE_TENANT_MISMATCH");
    }
  });

  it("rejects governed_run run_id mismatch", () => {
    const result = validateRuntimeState(
      validRuntimeState({
        governed_run_ref: undefined,
        governed_run: validGovernedRun("CREATED", {
          run_id: "run_002",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RUNTIME_STATE_RUN_MISMATCH");
    }
  });

  it("rejects kind mismatch with governed_run status", () => {
    const result = validateRuntimeState(
      validRuntimeState({
        kind: "ADMITTED",
        governed_run_ref: undefined,
        governed_run: validGovernedRun("CREATED"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("RUNTIME_STATE_KIND_MISMATCH");
    }
  });

  it("rejects invalid recorded_at", () => {
    const result = validateRuntimeState(
      validRuntimeState({
        recorded_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_RUNTIME_STATE_TIMESTAMP");
    }
  });

  it("rejects unsafe checkpoint_ref", () => {
    const result = validateRuntimeState(
      validRuntimeState({
        checkpoint_ref: "https://example.test/checkpoint",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_RUNTIME_STATE_REFERENCE");
    }
  });

  it("rejects unsafe previous_state_id", () => {
    const result = validateRuntimeState(
      validRuntimeState({
        previous_state_id: "alice@example.com",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_RUNTIME_STATE_REFERENCE");
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateRuntimeState(
      validRuntimeState({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_RUNTIME_STATE_METADATA");
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const state = validRuntimeState() as Record<string, unknown>;
    delete state.tenant_id;
    state.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateRuntimeState(state);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("does not treat CANCELLED as admitted", () => {
    const state = validRuntimeState({
      kind: "CANCELLED",
      governed_run_ref: undefined,
      governed_run: validGovernedRun("CANCELLED"),
    });

    expect(validateRuntimeState(state).ok).toBe(true);
    expect(isRuntimeStateCancelled(state)).toBe(true);
    expect(isRuntimeStateAdmitted(state)).toBe(false);
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createRuntimeStateDenial({
      code: "RUNTIME_STATE_TENANT_MISMATCH",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("checkpoint_internals");
    expect(serialized).not.toContain("secret-token");
  });
});
