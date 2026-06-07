import { describe, expect, it } from "vitest";

import {
  assertGovernedRunAdmitted,
  createGovernedRunDenial,
  isGovernedRunAdmitted,
  isGovernedRunCancelled,
  isGovernedRunCreated,
  isGovernedRunRejected,
  validateGovernedRun,
} from ".";
import type { RuntimeAdmissionDecisionInput } from "../runtime-admission-gateway";
import type { GovernedRunInput } from "./governed-run";

export function validRuntimeEnvelope(tenantId = "tenant_001") {
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
    declared_purpose: "run shell validation",
    data_classification: "INTERNAL",
    mode: "PRODUCTION",
    created_at: "2026-06-01T00:00:00.000Z",
  } as const;
}

export function validAdmissionDecision(
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
  overrides: Partial<GovernedRunInput> = {},
): GovernedRunInput {
  return {
    run_id: "run_001",
    tenant_id: "tenant_001",
    workspace_id: "workspace_001",
    project_id: "project_001",
    status: "CREATED",
    origin: "RUNTIME_ADMISSION",
    runtime_envelope_id: "runtime_envelope_001",
    runtime_envelope: validRuntimeEnvelope(),
    admission_decision_id: "runtime_admission_decision_001",
    request_id: "request_001",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    declared_purpose: "run shell validation",
    data_classification: "INTERNAL",
    created_at: "2026-06-01T00:00:02.000Z",
    metadata: {
      phase: "one_h",
    },
    ...overrides,
  };
}

describe("GovernedRun", () => {
  it("accepts a valid CREATED governed run shell", () => {
    const result = validateGovernedRun(validGovernedRun());

    expect(result.ok).toBe(true);
    expect(isGovernedRunCreated(validGovernedRun())).toBe(true);
    expect(isGovernedRunAdmitted(validGovernedRun())).toBe(false);
  });

  it("accepts a valid ADMITTED governed run with an ADMIT decision", () => {
    const run = validGovernedRun({
      status: "ADMITTED",
      admission_decision: validAdmissionDecision("ADMIT"),
      admitted_at: "2026-06-01T00:00:03.000Z",
    });
    const result = validateGovernedRun(run);

    expect(result.ok).toBe(true);
    expect(isGovernedRunAdmitted(run)).toBe(true);
    expect(assertGovernedRunAdmitted(run).ok).toBe(true);
  });

  it("rejects missing tenant_id", () => {
    const run = validGovernedRun() as Record<string, unknown>;
    delete run.tenant_id;
    run.metadata = {
      display: "alice@example.com",
    };

    const result = validateGovernedRun(run);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects project_id without workspace_id", () => {
    const run = validGovernedRun() as Record<string, unknown>;
    delete run.workspace_id;

    const result = validateGovernedRun(run);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("GOVERNED_RUN_SCOPE_INVALID");
    }
  });

  it("rejects runtime envelope tenant mismatch", () => {
    const result = validateGovernedRun(
      validGovernedRun({
        runtime_envelope: validRuntimeEnvelope("tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("GOVERNED_RUN_TENANT_MISMATCH");
    }
  });

  it("rejects admission decision tenant mismatch", () => {
    const result = validateGovernedRun(
      validGovernedRun({
        status: "ADMITTED",
        admission_decision: validAdmissionDecision("ADMIT", "tenant_002"),
        admitted_at: "2026-06-01T00:00:03.000Z",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ADMISSION_DECISION_TENANT_MISMATCH");
    }
  });

  it("rejects ADMITTED status without an ADMIT decision", () => {
    const result = validateGovernedRun(
      validGovernedRun({
        status: "ADMITTED",
        admission_decision: validAdmissionDecision("DENY"),
        admitted_at: "2026-06-01T00:00:03.000Z",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ADMITTED_DECISION_REQUIRED");
    }
  });

  it("accepts REJECTED status with a DENY decision", () => {
    const run = validGovernedRun({
      status: "REJECTED",
      admission_decision: validAdmissionDecision("DENY"),
      rejected_at: "2026-06-01T00:00:03.000Z",
    });
    const result = validateGovernedRun(run);

    expect(result.ok).toBe(true);
    expect(isGovernedRunRejected(run)).toBe(true);
    expect(isGovernedRunAdmitted(run)).toBe(false);
  });

  it("treats REQUIRE_APPROVAL as rejected and non-executable shell behavior", () => {
    const run = validGovernedRun({
      status: "REJECTED",
      admission_decision: validAdmissionDecision("REQUIRE_APPROVAL"),
      rejected_at: "2026-06-01T00:00:03.000Z",
    });
    const result = validateGovernedRun(run);
    const assertion = assertGovernedRunAdmitted(run);

    expect(result.ok).toBe(true);
    expect(isGovernedRunRejected(run)).toBe(true);
    expect(isGovernedRunAdmitted(run)).toBe(false);
    expect(assertion.ok).toBe(false);
    if (!assertion.ok) {
      expect(assertion.error.code).toBe("GOVERNED_RUN_NOT_ADMITTED");
    }
  });

  it("does not treat CREATED as admitted or executable", () => {
    const assertion = assertGovernedRunAdmitted(validGovernedRun());

    expect(isGovernedRunAdmitted(validGovernedRun())).toBe(false);
    expect(assertion.ok).toBe(false);
  });

  it("does not treat CANCELLED as admitted or executable", () => {
    const run = validGovernedRun({
      status: "CANCELLED",
      cancelled_at: "2026-06-01T00:00:03.000Z",
    });
    const assertion = assertGovernedRunAdmitted(run);

    expect(validateGovernedRun(run).ok).toBe(true);
    expect(isGovernedRunCancelled(run)).toBe(true);
    expect(isGovernedRunAdmitted(run)).toBe(false);
    expect(assertion.ok).toBe(false);
  });

  it("rejects unsafe metadata", () => {
    const result = validateGovernedRun(
      validGovernedRun({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_GOVERNED_RUN_METADATA");
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const run = validGovernedRun() as Record<string, unknown>;
    delete run.tenant_id;
    run.metadata = {
      hint: "tenant-from-prefix",
      external: "external-id-123",
      route: "https://tenant.example.test/path",
      display: "Alice Example alice@example.com",
    };

    const result = validateGovernedRun(run);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createGovernedRunDenial({
      code: "GOVERNED_RUN_TENANT_MISMATCH",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("permission");
    expect(serialized).not.toContain("secret-token");
  });
});
