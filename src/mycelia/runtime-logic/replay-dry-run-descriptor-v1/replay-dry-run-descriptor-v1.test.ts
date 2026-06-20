import { describe, expect, it } from "vitest";

import {
  evaluateApprovalGateV1,
  type ApprovalGateDecisionOutcome,
} from "../../runtime-logic/approval-gate-v1";
import {
  evaluateAuditCommitBoundary,
  type AuditCommitMoment,
} from "../../runtime-logic/audit-commit-boundary";
import {
  evaluateGovernedRunLifecycleTransition,
  type GovernedRunLifecycleIntent,
  type GovernedRunLifecycleState,
} from "../../runtime-logic/governed-run-lifecycle";
import {
  evaluateInvestigationViewModelV1,
  type InvestigationTimelineEntryV1,
  type InvestigationViewModelV1Decision,
  type InvestigationViewModelV1InputCandidate,
} from "../../runtime-logic/investigation-view-model-v1";
import {
  evaluatePolicyAdmissionV1,
  type PolicyAdmissionRiskLevel,
} from "../../runtime-logic/policy-admission-v1";
import {
  assertReplayDryRunDescriptorV1,
  evaluateReplayDryRunDescriptorV1,
  getReplayDryRunDescriptorV1Definition,
  ReplayDryRunDescriptorSections,
  ReplayDryRunReplayabilityStatuses,
  ReplayDryRunSideEffectPolicyMarkers,
  type ReplayDryRunDescriptorV1InputCandidate,
} from ".";

const tenantId = "tenant_01";
const runId = "run_01";
const correlationId = "correlation_01";

function lifecycleDecision(
  sequence: number,
  currentState: GovernedRunLifecycleState,
  intent: GovernedRunLifecycleIntent,
) {
  const result = evaluateGovernedRunLifecycleTransition({
    current_state: currentState,
    intent,
  });

  if (!result.ok) {
    throw new Error("Lifecycle fixture denied.");
  }

  return {
    sequence,
    tenant_id: tenantId,
    descriptor_ref: `lifecycle_ref_${sequence}`,
    decision: result.value,
  };
}

function policyDecision(riskLevel: PolicyAdmissionRiskLevel) {
  const result = evaluatePolicyAdmissionV1({
    tenant_id: tenantId,
    run_id: runId,
    correlation_id: correlationId,
    requester_ref: "requester_ref",
    resource_ref: "resource_ref",
    action: "document.review",
    purpose: "COMPLIANCE_REVIEW",
    risk_level: riskLevel,
    context_status: "RESOLVED",
    tenant_boundary_status: "MATCHED",
    has_required_context: true,
    policy_ref: "policy_ref",
  });

  if (!result.ok) {
    throw new Error("Policy fixture denied.");
  }

  return result.value;
}

function approvalDecision(outcome: ApprovalGateDecisionOutcome = "APPROVE") {
  const result = evaluateApprovalGateV1({
    tenant_id: tenantId,
    run_id: runId,
    correlation_id: correlationId,
    approval_request_id: "approval_request_ref",
    requested_role: "compliance_reviewer",
    requester_ref: "requester_ref",
    approver_ref: "approver_ref",
    current_status: "PENDING",
    decision_outcome: outcome,
    decision_reason_code: "APPROVAL_DECISION",
    safe_decision_summary: "approval decision accepted",
    policy_admission_outcome: "REQUIRE_APPROVAL",
    risk_level: "MEDIUM",
  });

  if (!result.ok) {
    throw new Error("Approval fixture denied.");
  }

  return result.value;
}

function auditDecision(sequence: number, moment: AuditCommitMoment) {
  const result = evaluateAuditCommitBoundary({
    tenant_id: tenantId,
    run_id: runId,
    correlation_id: correlationId,
    moment,
    source_module:
      moment === "POLICY_EVALUATED" || moment === "ADMISSION_DECIDED"
        ? "policy-admission-v1"
        : "governed-run-lifecycle",
    subject_ref: `audit_subject_${sequence}`,
    actor_ref: "actor_ref",
    evidence_ref: `audit_evidence_${sequence}`,
    reason_code: moment,
    safe_summary: `Audit boundary ${moment}`,
  });

  if (!result.ok) {
    throw new Error("Audit fixture denied.");
  }

  return {
    sequence,
    tenant_id: tenantId,
    descriptor_ref: `audit_ref_${sequence}`,
    decision: result.value,
  };
}

function investigationInput(
  options: {
    risk?: PolicyAdmissionRiskLevel;
    includeApproval?: boolean;
    terminal?: boolean;
  } = {},
): InvestigationViewModelV1InputCandidate {
  const risk = options.risk ?? "MEDIUM";
  const policy = policyDecision(risk);
  const includeApproval =
    options.includeApproval ?? policy.outcome === "REQUIRE_APPROVAL";
  const lifecycle = [
    lifecycleDecision(30, "CREATED", "RESOLVE_CONTEXT"),
    lifecycleDecision(10, "CONTEXT_RESOLVED", "EVALUATE_POLICY"),
    lifecycleDecision(
      20,
      "POLICY_EVALUATED",
      policy.outcome === "ADMIT"
        ? "GRANT_ADMISSION"
        : policy.outcome === "DENY"
          ? "REJECT"
          : "REQUIRE_APPROVAL",
    ),
  ];

  if (includeApproval) {
    lifecycle.push(lifecycleDecision(40, "WAITING_APPROVAL", "APPROVE"));
  }

  if (policy.outcome !== "DENY") {
    lifecycle.push(
      lifecycleDecision(
        50,
        includeApproval ? "APPROVED" : "ADMISSION_GRANTED",
        "START_RUN",
      ),
    );

    if (options.terminal ?? true) {
      lifecycle.push(lifecycleDecision(60, "RUNNING", "COMPLETE_RUN"));
    }
  }

  return {
    tenant_id: tenantId,
    run_id: runId,
    correlation_id: correlationId,
    governed_run_ref: {
      tenant_id: tenantId,
      run_id: runId,
      correlation_id: correlationId,
      ref: "governed_run_ref",
      current_state: policy.outcome === "DENY" ? "REJECTED" : "RUNNING",
    },
    lifecycle_decisions: lifecycle,
    policy_admission_decision: {
      sequence: 15,
      tenant_id: tenantId,
      descriptor_ref: "policy_admission_ref",
      decision: policy,
    },
    approval_gate_decision: includeApproval
      ? {
          sequence: 35,
          tenant_id: tenantId,
          descriptor_ref: "approval_gate_ref",
          decision: approvalDecision(),
        }
      : undefined,
    audit_boundary_decisions: [
      auditDecision(25, "ADMISSION_DECIDED"),
      auditDecision(5, "POLICY_EVALUATED"),
      auditDecision(65, "RUN_COMPLETED"),
    ],
    persistence_record_refs: [
      {
        record: "GovernedRun",
        tenant_id: tenantId,
        ref: "governed_run_persistence_ref",
      },
      {
        record: "PolicyDecisionRecord",
        tenant_id: tenantId,
        ref: "policy_persistence_ref",
      },
      {
        record: "AdmissionDecisionRecord",
        tenant_id: tenantId,
        ref: "admission_persistence_ref",
      },
      {
        record: "AuditRecord",
        tenant_id: tenantId,
        ref: "audit_persistence_ref",
      },
    ],
    investigation_purpose: "Review governed run descriptor story.",
    requested_by_ref: "investigator_ref",
  };
}

function lifecycleTimelineFromInvestigation(
  investigationView: InvestigationViewModelV1Decision,
): InvestigationTimelineEntryV1[] {
  return investigationView.investigation_view.timeline
    .filter((entry) => entry.source_type === "LIFECYCLE")
    .reverse();
}

function baseInput(
  options: {
    risk?: PolicyAdmissionRiskLevel;
    includeApproval?: boolean;
    terminal?: boolean;
  } = {},
): ReplayDryRunDescriptorV1InputCandidate {
  const investigationSource = investigationInput(options);
  const investigationResult =
    evaluateInvestigationViewModelV1(investigationSource);

  if (!investigationResult.ok) {
    throw new Error("Investigation fixture denied.");
  }

  return {
    tenant_id: tenantId,
    run_id: runId,
    correlation_id: correlationId,
    investigation_view: investigationResult.value,
    lifecycle_timeline: lifecycleTimelineFromInvestigation(
      investigationResult.value,
    ),
    policy_admission_decision:
      investigationSource.policy_admission_decision,
    approval_gate_decision: investigationSource.approval_gate_decision,
    audit_boundary_decisions: investigationSource.audit_boundary_decisions,
    persistence_record_refs: investigationSource.persistence_record_refs,
    replay_purpose: "Prepare descriptor dry-run for governed review.",
    requested_by_ref: "replay_reviewer_ref",
  };
}

describe("replay dry-run descriptor v1", () => {
  it("exports the deterministic descriptor definition", () => {
    const definition = getReplayDryRunDescriptorV1Definition();

    expect(definition.phase).toBe("2X");
    expect(definition.replayability_statuses).toEqual(
      ReplayDryRunReplayabilityStatuses,
    );
    expect(definition.side_effect_policy).toEqual(
      ReplayDryRunSideEffectPolicyMarkers,
    );
    expect(definition.sections).toEqual(ReplayDryRunDescriptorSections);
  });

  it("defines exact replayability statuses and side-effect policy markers", () => {
    expect(ReplayDryRunReplayabilityStatuses).toEqual([
      "REPLAYABLE",
      "PARTIALLY_REPLAYABLE",
      "NOT_REPLAYABLE",
      "BLOCKED",
    ]);
    expect(ReplayDryRunSideEffectPolicyMarkers).toEqual([
      "NO_SIDE_EFFECTS",
      "DESCRIPTOR_ONLY",
      "NO_TOOL_EXECUTION",
      "NO_EXTERNAL_CALLS",
      "NO_STATE_MUTATION",
    ]);
  });

  it("creates a replay dry-run descriptor from valid minimal descriptors", () => {
    const result = evaluateReplayDryRunDescriptorV1(baseInput());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected replay dry-run descriptor decision.");
    }

    expect(result.value.replayability_status).toBe("REPLAYABLE");
    expect(result.value.replay_dry_run_descriptor.section_keys).toEqual(
      ReplayDryRunDescriptorSections,
    );
    expect(result.value.replay_dry_run_descriptor.dry_run_steps.length).toBe(7);
  });

  it("includes all required descriptor sections", () => {
    const result = evaluateReplayDryRunDescriptorV1(baseInput());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected replay dry-run descriptor decision.");
    }

    expect(result.value.replay_dry_run_descriptor.section_keys).toEqual([
      "overview",
      "sourceRefs",
      "replayability",
      "dryRunSteps",
      "sideEffectPolicy",
      "blockedActions",
      "requiredEvidence",
      "limitations",
      "nextActions",
    ]);
  });

  it("includes all side-effect policy markers", () => {
    const result = evaluateReplayDryRunDescriptorV1(baseInput());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected replay dry-run descriptor decision.");
    }

    expect(result.value.side_effect_policy).toEqual(
      ReplayDryRunSideEffectPolicyMarkers,
    );
  });

  it("denies when investigation view is missing", () => {
    const input: Record<string, unknown> = { ...baseInput() };
    delete input.investigation_view;
    const result = evaluateReplayDryRunDescriptorV1(input);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected missing investigation denial.");
    }
    expect(result.error.code).toBe(
      "REPLAY_DRY_RUN_INVESTIGATION_VIEW_REQUIRED",
    );
  });

  it("denies when lifecycle timeline is missing", () => {
    const result = evaluateReplayDryRunDescriptorV1({
      ...baseInput(),
      lifecycle_timeline: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected missing lifecycle denial.");
    }
    expect(result.error.code).toBe(
      "REPLAY_DRY_RUN_LIFECYCLE_TIMELINE_REQUIRED",
    );
  });

  it("denies when policy admission descriptor is missing", () => {
    const input: Record<string, unknown> = { ...baseInput() };
    delete input.policy_admission_decision;
    const result = evaluateReplayDryRunDescriptorV1(input);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected missing policy denial.");
    }
    expect(result.error.code).toBe(
      "REPLAY_DRY_RUN_POLICY_ADMISSION_REQUIRED",
    );
  });

  it("denies when audit boundary decisions are missing", () => {
    const result = evaluateReplayDryRunDescriptorV1({
      ...baseInput(),
      audit_boundary_decisions: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected missing audit boundary denial.");
    }
    expect(result.error.code).toBe("REPLAY_DRY_RUN_AUDIT_BOUNDARY_REQUIRED");
  });

  it("requires approval gate descriptor when approval was required", () => {
    const input: Record<string, unknown> = { ...baseInput() };
    delete input.approval_gate_decision;
    const result = evaluateReplayDryRunDescriptorV1(input);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected missing approval denial.");
    }
    expect(result.error.code).toBe("REPLAY_DRY_RUN_APPROVAL_REQUIRED");
  });

  it("allows absent approval gate descriptor when policy admitted", () => {
    const result = evaluateReplayDryRunDescriptorV1(
      baseInput({
        risk: "LOW",
        includeApproval: false,
      }),
    );

    expect(result.ok).toBe(true);
  });

  it("fails closed on cross-tenant mismatch", () => {
    const input = baseInput();
    input.persistence_record_refs = [
      {
        record: "GovernedRun",
        tenant_id: "tenant_other",
        ref: "other_ref",
      },
    ];
    const result = evaluateReplayDryRunDescriptorV1(input);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected tenant mismatch denial.");
    }
    expect(result.error.code).toBe("REPLAY_DRY_RUN_TENANT_MISMATCH");
  });

  it("fails closed on unsafe metadata", () => {
    const result = evaluateReplayDryRunDescriptorV1({
      ...baseInput(),
      metadata: {
        secret: "value",
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected unsafe metadata denial.");
    }
    expect(result.error.code).toBe("REPLAY_DRY_RUN_UNSAFE_METADATA");
  });

  it("sorts dry-run steps by explicit step order", () => {
    const result = evaluateReplayDryRunDescriptorV1(baseInput());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected replay dry-run descriptor decision.");
    }

    const orders = result.value.replay_dry_run_descriptor.dry_run_steps.map(
      (step) => step.step_order,
    );
    expect(orders).toEqual([...orders].sort((left, right) => left - right));
  });

  it("does not infer missing approval events when approval is not required", () => {
    const result = evaluateReplayDryRunDescriptorV1(
      baseInput({
        risk: "LOW",
        includeApproval: false,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected replay dry-run descriptor decision.");
    }

    expect(
      result.value.replay_dry_run_descriptor.dry_run_steps.some(
        (step) => step.step_kind === "INSPECT_APPROVAL_GATE_DECISION",
      ),
    ).toBe(false);
  });

  it("does not claim replay execution happened", () => {
    const result = evaluateReplayDryRunDescriptorV1(baseInput());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected replay dry-run descriptor decision.");
    }

    const serialized = JSON.stringify(result.value);
    expect(serialized).not.toMatch(
      /replay was executed|replay executed|executed replay|execution completed/i,
    );
  });

  it("includes blocked actions for tools, external calls, state, DB, audit and events", () => {
    const result = evaluateReplayDryRunDescriptorV1(baseInput());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected replay dry-run descriptor decision.");
    }

    expect(result.value.blocked_actions).toEqual([
      "TOOL_EXECUTION",
      "EXTERNAL_CALLS",
      "STATE_MUTATION",
      "DB_READS",
      "AUDIT_WRITING",
      "EVENT_EMISSION",
    ]);
  });

  it("returns the expected decision shape", () => {
    const result = evaluateReplayDryRunDescriptorV1(baseInput());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected replay dry-run descriptor decision.");
    }

    expect(result.value).toEqual(
      expect.objectContaining({
        replay_dry_run_descriptor: expect.any(Object),
        replayability_status: "REPLAYABLE",
        blocked_actions: expect.any(Array),
        side_effect_policy: expect.any(Array),
        safe_summary: expect.any(String),
        source_descriptor_refs: expect.any(Array),
        limitation_notes: expect.any(Array),
      }),
    );
  });

  it("classifies incomplete but safe evidence as partially replayable", () => {
    const result = evaluateReplayDryRunDescriptorV1(
      baseInput({
        terminal: false,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected replay dry-run descriptor decision.");
    }
    expect(result.value.replayability_status).toBe("PARTIALLY_REPLAYABLE");
  });

  it("classifies denied policy state as not replayable", () => {
    const result = evaluateReplayDryRunDescriptorV1(
      baseInput({
        risk: "HIGH",
        includeApproval: false,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected replay dry-run descriptor decision.");
    }
    expect(result.value.replayability_status).toBe("NOT_REPLAYABLE");
  });

  it("does not mutate input", () => {
    const input = baseInput();
    const before = structuredClone(input);

    evaluateReplayDryRunDescriptorV1(input);

    expect(input).toEqual(before);
  });

  it("throws only a safe generic assertion error", () => {
    expect(() =>
      assertReplayDryRunDescriptorV1({
        tenant_id: tenantId,
      }),
    ).toThrow("Replay dry-run descriptor v1 decision denied.");
  });
});
