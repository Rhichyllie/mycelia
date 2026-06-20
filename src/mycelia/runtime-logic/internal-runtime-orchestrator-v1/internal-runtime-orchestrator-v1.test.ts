import { describe, expect, it } from "vitest";

import {
  assertInternalRuntimeOrchestratorV1,
  evaluateInternalRuntimeOrchestratorV1,
  getInternalRuntimeOrchestratorV1Definition,
  InternalRuntimeOrchestrationStatuses,
  InternalRuntimeOrchestrationStepKinds,
  type InternalRuntimeOrchestratorV1InputCandidate,
} from ".";

const tenantId = "tenant_01";
const runId = "run_01";
const correlationId = "correlation_01";

function persistenceRefs(
  tenant = tenantId,
): NonNullable<
  InternalRuntimeOrchestratorV1InputCandidate["persistence_record_refs"]
> {
  return [
    {
      record: "GovernedRun",
      tenant_id: tenant,
      ref: "governed_run_persistence_ref",
    },
    {
      record: "RuntimeStateSnapshot",
      tenant_id: tenant,
      ref: "runtime_state_persistence_ref",
    },
    {
      record: "PolicyDecisionRecord",
      tenant_id: tenant,
      ref: "policy_decision_persistence_ref",
    },
    {
      record: "AdmissionDecisionRecord",
      tenant_id: tenant,
      ref: "admission_decision_persistence_ref",
    },
    {
      record: "ApprovalRequest",
      tenant_id: tenant,
      ref: "approval_request_persistence_ref",
    },
    {
      record: "AuditRecord",
      tenant_id: tenant,
      ref: "audit_record_persistence_ref",
    },
  ];
}

function approvalDecision(decisionOutcome: "APPROVE" | "REJECT" | "TIMEOUT") {
  return {
    approval_request_id: "approval_request_ref",
    requested_role: "compliance_reviewer",
    approver_ref: "approver_ref",
    decision_outcome: decisionOutcome,
    decision_reason_code: "APPROVAL_DECISION",
    safe_decision_summary: "approval_decision_ref",
  };
}

function baseInput(
  overrides: Partial<InternalRuntimeOrchestratorV1InputCandidate> = {},
): InternalRuntimeOrchestratorV1InputCandidate {
  return {
    tenant_id: tenantId,
    run_id: runId,
    correlation_id: correlationId,
    requester_ref: "requester_ref",
    resource_ref: "resource_ref",
    action: "document.review",
    purpose: "COMPLIANCE_REVIEW",
    risk_level: "LOW",
    context_status: "RESOLVED",
    tenant_boundary_status: "MATCHED",
    has_required_context: true,
    policy_ref: "policy_ref",
    orchestration_purpose: "Assemble descriptor-only orchestration.",
    requested_by_ref: "orchestrator_ref",
    persistence_record_refs: persistenceRefs(),
    ...overrides,
  };
}

function decisionFor(input: InternalRuntimeOrchestratorV1InputCandidate) {
  const result = evaluateInternalRuntimeOrchestratorV1(input);

  if (!result.ok) {
    throw new Error("Internal runtime orchestrator fixture denied.");
  }

  return result.value;
}

describe("internal runtime orchestrator v1", () => {
  it("exports the model, schemas and evaluator functions", () => {
    const model = getInternalRuntimeOrchestratorV1Definition();

    expect(model.phase).toBe("2Y");
    expect(model.name).toBe("Internal Runtime Orchestrator v1");
    expect(typeof evaluateInternalRuntimeOrchestratorV1).toBe("function");
    expect(typeof assertInternalRuntimeOrchestratorV1).toBe("function");
  });

  it("defines the exact orchestration statuses", () => {
    expect(InternalRuntimeOrchestrationStatuses).toEqual([
      "COMPLETED_DESCRIPTOR",
      "WAITING_APPROVAL",
      "REJECTED_DESCRIPTOR",
      "FAILED_DESCRIPTOR",
      "BLOCKED",
    ]);
  });

  it("defines deterministic orchestration step kinds", () => {
    expect(InternalRuntimeOrchestrationStepKinds).toContain("VALIDATE_INPUT");
    expect(InternalRuntimeOrchestrationStepKinds).toContain(
      "EVALUATE_POLICY_ADMISSION",
    );
    expect(InternalRuntimeOrchestrationStepKinds).toContain(
      "ASSEMBLE_REPLAY_DRY_RUN_DESCRIPTOR",
    );
    expect(InternalRuntimeOrchestrationStepKinds).toContain(
      "FINALIZE_DESCRIPTOR",
    );
  });

  it("produces COMPLETED_DESCRIPTOR for valid low-risk input", () => {
    const decision = decisionFor(baseInput());

    expect(decision.orchestration_status).toBe("COMPLETED_DESCRIPTOR");
    expect(
      decision.orchestration_descriptor.policy_admission_decision.decision
        .outcome,
    ).toBe("ADMIT");
    expect(
      decision.orchestration_descriptor.investigation_view_decision,
    ).toBeDefined();
    expect(decision.orchestration_descriptor.replay_dry_run_decision).toBeDefined();
  });

  it("produces WAITING_APPROVAL for valid medium-risk input without approval", () => {
    const decision = decisionFor(baseInput({ risk_level: "MEDIUM" }));

    expect(decision.orchestration_status).toBe("WAITING_APPROVAL");
    expect(
      decision.orchestration_descriptor.policy_admission_decision.decision
        .outcome,
    ).toBe("REQUIRE_APPROVAL");
    expect(decision.orchestration_descriptor.approval_gate_decision).toBeUndefined();
    expect(
      decision.orchestration_descriptor.investigation_view_decision,
    ).toBeUndefined();
    expect(decision.orchestration_descriptor.replay_dry_run_decision).toBeUndefined();
  });

  it("produces COMPLETED_DESCRIPTOR for valid medium-risk approved input", () => {
    const decision = decisionFor(
      baseInput({
        risk_level: "MEDIUM",
        approval_decision_input: approvalDecision("APPROVE"),
      }),
    );

    expect(decision.orchestration_status).toBe("COMPLETED_DESCRIPTOR");
    expect(
      decision.orchestration_descriptor.approval_gate_decision?.decision
        .next_status,
    ).toBe("APPROVED");
    expect(
      decision.orchestration_descriptor.approval_gate_decision?.decision
        .lifecycle_intent_hint,
    ).toBe("APPROVE");
  });

  it("produces REJECTED_DESCRIPTOR for valid medium-risk rejected input", () => {
    const decision = decisionFor(
      baseInput({
        risk_level: "MEDIUM",
        approval_decision_input: approvalDecision("REJECT"),
      }),
    );

    expect(decision.orchestration_status).toBe("REJECTED_DESCRIPTOR");
    expect(
      decision.orchestration_descriptor.approval_gate_decision?.decision
        .next_status,
    ).toBe("REJECTED");
    expect(
      decision.orchestration_descriptor.approval_gate_decision?.decision
        .lifecycle_intent_hint,
    ).toBe("REJECT");
  });

  it("produces FAILED_DESCRIPTOR for valid medium-risk timed-out input", () => {
    const decision = decisionFor(
      baseInput({
        risk_level: "MEDIUM",
        approval_decision_input: approvalDecision("TIMEOUT"),
      }),
    );

    expect(decision.orchestration_status).toBe("FAILED_DESCRIPTOR");
    expect(
      decision.orchestration_descriptor.approval_gate_decision?.decision
        .next_status,
    ).toBe("TIMED_OUT");
    expect(
      decision.orchestration_descriptor.approval_gate_decision?.decision
        .lifecycle_intent_hint,
    ).toBe("FAIL_RUN");
  });

  it("produces REJECTED_DESCRIPTOR for high-risk input", () => {
    const decision = decisionFor(baseInput({ risk_level: "HIGH" }));

    expect(decision.orchestration_status).toBe("REJECTED_DESCRIPTOR");
    expect(
      decision.orchestration_descriptor.policy_admission_decision.decision
        .outcome,
    ).toBe("DENY");
  });

  it("rejects descriptor flow safely when required context is missing", () => {
    const decision = decisionFor(
      baseInput({
        has_required_context: false,
        context_status: "MISSING",
      }),
    );

    expect(decision.orchestration_status).toBe("REJECTED_DESCRIPTOR");
    expect(
      decision.orchestration_descriptor.policy_admission_decision.decision
        .reason_code,
    ).toBe("MISSING_REQUIRED_CONTEXT_DENIED");
  });

  it("rejects descriptor flow safely when tenant boundary is mismatched", () => {
    const decision = decisionFor(
      baseInput({
        tenant_boundary_status: "MISMATCHED",
      }),
    );

    expect(decision.orchestration_status).toBe("REJECTED_DESCRIPTOR");
    expect(
      decision.orchestration_descriptor.policy_admission_decision.decision
        .reason_code,
    ).toBe("TENANT_BOUNDARY_MISMATCH_DENIED");
  });

  it("returns safe denial for invalid input", () => {
    const result = evaluateInternalRuntimeOrchestratorV1({
      tenant_id: tenantId,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.outcome).toBe("DENIED");
      expect(result.error.orchestration_status).toBe("BLOCKED");
      expect(result.error.safe).toBe(true);
      expect(result.error.safe_reason).not.toContain(tenantId);
    }
  });

  it("returns safe denial for cross-tenant persistence refs", () => {
    const result = evaluateInternalRuntimeOrchestratorV1(
      baseInput({
        persistence_record_refs: persistenceRefs("tenant_02"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INTERNAL_RUNTIME_ORCHESTRATOR_TENANT_MISMATCH",
      );
    }
  });

  it("does not mutate input", () => {
    const input = baseInput({ risk_level: "MEDIUM" });
    const before = JSON.stringify(input);

    evaluateInternalRuntimeOrchestratorV1(input);

    expect(JSON.stringify(input)).toBe(before);
  });

  it("includes ordered lifecycle decisions", () => {
    const decision = decisionFor(baseInput());
    const sequences =
      decision.orchestration_descriptor.lifecycle_decisions.map(
        (entry) => entry.sequence,
      );

    expect(sequences).toEqual([...sequences].sort((left, right) => left - right));
    expect(
      decision.orchestration_descriptor.lifecycle_decisions.map(
        (entry) => entry.decision.next_state,
      ),
    ).toEqual([
      "CONTEXT_RESOLVED",
      "POLICY_EVALUATED",
      "ADMISSION_GRANTED",
      "RUNNING",
      "COMPLETED",
    ]);
  });

  it("includes policy admission and conditional approval gate decisions", () => {
    const lowRiskDecision = decisionFor(baseInput());
    const waitingDecision = decisionFor(baseInput({ risk_level: "MEDIUM" }));
    const approvedDecision = decisionFor(
      baseInput({
        risk_level: "MEDIUM",
        approval_decision_input: approvalDecision("APPROVE"),
      }),
    );

    expect(
      lowRiskDecision.orchestration_descriptor.policy_admission_decision,
    ).toBeDefined();
    expect(lowRiskDecision.orchestration_descriptor.approval_gate_decision)
      .toBeUndefined();
    expect(waitingDecision.orchestration_descriptor.approval_gate_decision)
      .toBeUndefined();
    expect(approvedDecision.orchestration_descriptor.approval_gate_decision)
      .toBeDefined();
  });

  it("includes required audit boundary moments for valid policy flow", () => {
    const decision = decisionFor(baseInput());
    const moments =
      decision.orchestration_descriptor.audit_boundary_decisions.map(
        (entry) => entry.decision.moment,
      );

    expect(moments).toContain("REQUEST_CREATED");
    expect(moments).toContain("POLICY_EVALUATED");
    expect(moments).toContain("ADMISSION_DECIDED");
  });

  it("adds terminal audit boundaries for completed, rejected and failed descriptors", () => {
    const completed = decisionFor(baseInput());
    const rejected = decisionFor(baseInput({ risk_level: "HIGH" }));
    const failed = decisionFor(
      baseInput({
        risk_level: "MEDIUM",
        approval_decision_input: approvalDecision("TIMEOUT"),
      }),
    );

    expect(
      completed.orchestration_descriptor.audit_boundary_decisions.map(
        (entry) => entry.decision.moment,
      ),
    ).toContain("RUN_COMPLETED");
    expect(
      rejected.orchestration_descriptor.audit_boundary_decisions.map(
        (entry) => entry.decision.moment,
      ),
    ).toContain("RUN_REJECTED");
    expect(
      failed.orchestration_descriptor.audit_boundary_decisions.map(
        (entry) => entry.decision.moment,
      ),
    ).toContain("RUN_FAILED");
  });

  it("adds approval requested audit boundary for waiting approval", () => {
    const waiting = decisionFor(baseInput({ risk_level: "MEDIUM" }));

    expect(
      waiting.orchestration_descriptor.audit_boundary_decisions.map(
        (entry) => entry.decision.moment,
      ),
    ).toContain("APPROVAL_REQUESTED");
  });

  it("assembles investigation and replay for terminal descriptors only", () => {
    const completed = decisionFor(baseInput());
    const rejected = decisionFor(baseInput({ risk_level: "HIGH" }));
    const failed = decisionFor(
      baseInput({
        risk_level: "MEDIUM",
        approval_decision_input: approvalDecision("TIMEOUT"),
      }),
    );
    const waiting = decisionFor(baseInput({ risk_level: "MEDIUM" }));

    expect(
      completed.orchestration_descriptor.investigation_view_decision,
    ).toBeDefined();
    expect(completed.orchestration_descriptor.replay_dry_run_decision)
      .toBeDefined();
    expect(rejected.orchestration_descriptor.investigation_view_decision)
      .toBeDefined();
    expect(rejected.orchestration_descriptor.replay_dry_run_decision)
      .toBeDefined();
    expect(failed.orchestration_descriptor.investigation_view_decision)
      .toBeDefined();
    expect(
      failed.orchestration_descriptor.replay_dry_run_decision,
    ).toBeDefined();
    expect(waiting.orchestration_descriptor.investigation_view_decision)
      .toBeUndefined();
    expect(waiting.orchestration_descriptor.replay_dry_run_decision)
      .toBeUndefined();
  });

  it("includes descriptor metadata and safe boundaries", () => {
    const decision = decisionFor(baseInput());
    const descriptor = decision.orchestration_descriptor;

    expect(descriptor.blocked_actions).toEqual([
      "TOOL_EXECUTION",
      "EXTERNAL_CALLS",
      "STATE_MUTATION",
      "DB_READS",
      "AUDIT_WRITING",
      "EVENT_EMISSION",
    ]);
    expect(descriptor.safe_summary).toContain("descriptor");
    expect(descriptor.persistence_mapping.record_refs).toHaveLength(6);
    expect(descriptor.limitation_notes.length).toBeGreaterThan(0);
    expect(descriptor.next_actions.length).toBeGreaterThan(0);
  });

  it("does not claim side effects in any descriptor text", () => {
    const decision = decisionFor(baseInput());
    const descriptorText = JSON.stringify(decision).toLowerCase();

    expect(descriptorText).not.toContain("database was read");
    expect(descriptorText).not.toContain("database was written");
    expect(descriptorText).not.toContain("api was called");
    expect(descriptorText).not.toContain("event was emitted");
    expect(descriptorText).not.toContain("audit record was written");
    expect(descriptorText).not.toContain("tool was executed");
    expect(descriptorText).not.toContain("external call completed");
    expect(descriptorText).not.toContain("replay was executed");
    expect(descriptorText).not.toContain("runtime was executed");
  });

  it("assertion helper throws a generic safe error only", () => {
    expect(() =>
      assertInternalRuntimeOrchestratorV1({ tenant_id: tenantId }),
    ).toThrow("Internal runtime orchestrator v1 decision denied.");
  });
});
