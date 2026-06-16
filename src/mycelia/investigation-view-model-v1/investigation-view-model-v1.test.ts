import { describe, expect, it } from "vitest";

import {
  evaluateApprovalGateV1,
  type ApprovalGateDecisionOutcome,
} from "../approval-gate-v1";
import {
  evaluateAuditCommitBoundary,
  type AuditCommitMoment,
} from "../audit-commit-boundary";
import {
  evaluateGovernedRunLifecycleTransition,
  type GovernedRunLifecycleIntent,
  type GovernedRunLifecycleState,
} from "../governed-run-lifecycle";
import {
  evaluatePolicyAdmissionV1,
  type PolicyAdmissionOutcome,
  type PolicyAdmissionRiskLevel,
} from "../policy-admission-v1";
import {
  assertInvestigationViewModelV1,
  evaluateInvestigationViewModelV1,
  getInvestigationViewModelV1Definition,
  InvestigationCompletenessStatuses,
  InvestigationFindingSeverities,
  InvestigationViewSections,
  type InvestigationViewModelV1InputCandidate,
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

function policyDecision(
  riskLevel: PolicyAdmissionRiskLevel,
  overrides: Partial<{
    context_status: "RESOLVED" | "MISSING" | "AMBIGUOUS";
    tenant_boundary_status: "MATCHED" | "MISMATCHED" | "UNKNOWN";
    has_required_context: boolean;
  }> = {},
) {
  const result = evaluatePolicyAdmissionV1({
    tenant_id: tenantId,
    run_id: runId,
    correlation_id: correlationId,
    requester_ref: "requester_ref",
    resource_ref: "resource_ref",
    action: "document.review",
    purpose: "COMPLIANCE_REVIEW",
    risk_level: riskLevel,
    context_status: overrides.context_status ?? "RESOLVED",
    tenant_boundary_status: overrides.tenant_boundary_status ?? "MATCHED",
    has_required_context: overrides.has_required_context ?? true,
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

function baseInput(
  options: {
    policyOutcome?: PolicyAdmissionOutcome;
    policyRisk?: PolicyAdmissionRiskLevel;
    includeApproval?: boolean;
    lifecycleTerminal?: boolean;
  } = {},
): InvestigationViewModelV1InputCandidate {
  const risk = options.policyRisk ??
    (options.policyOutcome === "ADMIT" ? "LOW" : "MEDIUM");
  const policy = policyDecision(risk);
  const includeApproval =
    options.includeApproval ?? policy.outcome === "REQUIRE_APPROVAL";
  const lifecycle = [
    lifecycleDecision(30, "CREATED", "RESOLVE_CONTEXT"),
    lifecycleDecision(10, "CONTEXT_RESOLVED", "EVALUATE_POLICY"),
    lifecycleDecision(
      20,
      "POLICY_EVALUATED",
      policy.outcome === "ADMIT" ? "GRANT_ADMISSION" : "REQUIRE_APPROVAL",
    ),
  ];

  if (includeApproval) {
    lifecycle.push(lifecycleDecision(40, "WAITING_APPROVAL", "APPROVE"));
  }

  lifecycle.push(
    lifecycleDecision(
      50,
      includeApproval ? "APPROVED" : "ADMISSION_GRANTED",
      "START_RUN",
    ),
  );

  if (options.lifecycleTerminal ?? true) {
    lifecycle.push(lifecycleDecision(60, "RUNNING", "COMPLETE_RUN"));
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
      current_state: "RUNNING",
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

describe("investigation view model v1", () => {
  it("exports the deterministic model definition", () => {
    const definition = getInvestigationViewModelV1Definition();

    expect(definition.phase).toBe("2W");
    expect(definition.sections).toEqual(InvestigationViewSections);
    expect(definition.finding_severities).toEqual(
      InvestigationFindingSeverities,
    );
    expect(definition.completeness_statuses).toEqual(
      InvestigationCompletenessStatuses,
    );
  });

  it("defines exact investigation sections, finding severities and completeness statuses", () => {
    expect(InvestigationViewSections).toEqual([
      "overview",
      "runStatus",
      "timeline",
      "policyAdmission",
      "approval",
      "auditCoverage",
      "persistenceRefs",
      "openQuestions",
      "limitations",
      "nextActions",
    ]);
    expect(InvestigationFindingSeverities).toEqual([
      "INFO",
      "WARNING",
      "BLOCKER",
    ]);
    expect(InvestigationCompletenessStatuses).toEqual([
      "COMPLETE",
      "INCOMPLETE",
      "BLOCKED",
    ]);
  });

  it("creates an investigation view from valid minimal descriptors", () => {
    const result = evaluateInvestigationViewModelV1(baseInput());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected investigation view model decision.");
    }

    expect(result.value.investigation_view.section_keys).toEqual(
      InvestigationViewSections,
    );
    expect(result.value.investigation_view.policy_outcome).toBe(
      "REQUIRE_APPROVAL",
    );
    expect(result.value.investigation_view.current_state).toBe("COMPLETED");
    expect(result.value.completeness_status).toBe("COMPLETE");
    expect(result.value.source_descriptor_refs).toContain("approval_gate_ref");
  });

  it("denies when the policy admission descriptor is missing", () => {
    const input = baseInput();
    const missingPolicy: Record<string, unknown> = { ...input };
    delete missingPolicy.policy_admission_decision;
    const result = evaluateInvestigationViewModelV1(missingPolicy);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected missing policy denial.");
    }
    expect(result.error.code).toBe(
      "INVESTIGATION_VIEW_POLICY_ADMISSION_REQUIRED",
    );
  });

  it("denies when lifecycle descriptors are missing", () => {
    const result = evaluateInvestigationViewModelV1({
      ...baseInput(),
      lifecycle_decisions: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected missing lifecycle denial.");
    }
    expect(result.error.code).toBe("INVESTIGATION_VIEW_LIFECYCLE_REQUIRED");
  });

  it("requires approval descriptor when policy admission requires approval", () => {
    const input = baseInput({ includeApproval: true });
    const missingApproval: Record<string, unknown> = { ...input };
    delete missingApproval.approval_gate_decision;
    const result = evaluateInvestigationViewModelV1(missingApproval);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected missing approval denial.");
    }
    expect(result.error.code).toBe("INVESTIGATION_VIEW_APPROVAL_REQUIRED");
  });

  it("does not require approval descriptor when policy admission admits", () => {
    const result = evaluateInvestigationViewModelV1(
      baseInput({
        policyOutcome: "ADMIT",
        policyRisk: "LOW",
        includeApproval: false,
      }),
    );

    expect(result.ok).toBe(true);
  });

  it("does not require approval descriptor when policy admission denies", () => {
    const input = baseInput({
      policyOutcome: "DENY",
      policyRisk: "HIGH",
      includeApproval: false,
    });
    input.lifecycle_decisions = [
      lifecycleDecision(1, "CREATED", "RESOLVE_CONTEXT"),
      lifecycleDecision(2, "CONTEXT_RESOLVED", "EVALUATE_POLICY"),
      lifecycleDecision(3, "POLICY_EVALUATED", "REJECT"),
    ];
    const result = evaluateInvestigationViewModelV1(input);

    expect(result.ok).toBe(true);
  });

  it("denies when POLICY_EVALUATED audit boundary coverage is missing", () => {
    const input = baseInput();
    input.audit_boundary_decisions = input.audit_boundary_decisions.filter(
      (entry) => entry.decision.moment !== "POLICY_EVALUATED",
    );
    const result = evaluateInvestigationViewModelV1(input);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected missing audit coverage denial.");
    }
    expect(result.error.code).toBe("INVESTIGATION_VIEW_AUDIT_COVERAGE_REQUIRED");
  });

  it("denies when ADMISSION_DECIDED audit boundary coverage is missing", () => {
    const input = baseInput();
    input.audit_boundary_decisions = input.audit_boundary_decisions.filter(
      (entry) => entry.decision.moment !== "ADMISSION_DECIDED",
    );
    const result = evaluateInvestigationViewModelV1(input);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected missing audit coverage denial.");
    }
    expect(result.error.code).toBe("INVESTIGATION_VIEW_AUDIT_COVERAGE_REQUIRED");
  });

  it("fails closed on cross-tenant mismatches", () => {
    const input = baseInput();
    input.governed_run_ref = {
      ...input.governed_run_ref,
      tenant_id: "tenant_other",
    };
    const result = evaluateInvestigationViewModelV1(input);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected tenant mismatch denial.");
    }
    expect(result.error.code).toBe("INVESTIGATION_VIEW_TENANT_MISMATCH");
  });

  it("fails closed on unsafe metadata", () => {
    const result = evaluateInvestigationViewModelV1({
      ...baseInput(),
      metadata: {
        secret: "value",
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected unsafe metadata denial.");
    }
    expect(result.error.code).toBe("INVESTIGATION_VIEW_UNSAFE_METADATA");
  });

  it("sorts timeline entries by explicit sequence", () => {
    const result = evaluateInvestigationViewModelV1(baseInput());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected investigation view model decision.");
    }

    const sequences = result.value.investigation_view.timeline.map(
      (entry) => entry.sequence,
    );
    expect(sequences).toEqual([...sequences].sort((left, right) => left - right));
  });

  it("does not infer missing approval events when approval is not required", () => {
    const result = evaluateInvestigationViewModelV1(
      baseInput({
        policyOutcome: "ADMIT",
        policyRisk: "LOW",
        includeApproval: false,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected investigation view model decision.");
    }

    expect(
      result.value.investigation_view.timeline.some(
        (entry) => entry.source_type === "APPROVAL_GATE",
      ),
    ).toBe(false);
  });

  it("keeps findings safe and bounded", () => {
    const result = evaluateInvestigationViewModelV1(
      baseInput({ lifecycleTerminal: false }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected investigation view model decision.");
    }

    expect(result.value.completeness_status).toBe("INCOMPLETE");
    expect(
      result.value.findings.every(
        (finding) =>
          finding.safe_summary.length <= 240 &&
          !/https?:\/\/|@|secret|token|raw/i.test(finding.safe_summary),
      ),
    ).toBe(true);
  });

  it("returns the expected decision shape", () => {
    const result = evaluateInvestigationViewModelV1(baseInput());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected investigation view model decision.");
    }

    expect(result.value).toEqual(
      expect.objectContaining({
        investigation_view: expect.any(Object),
        findings: expect.any(Array),
        completeness_status: "COMPLETE",
        safe_summary: expect.any(String),
        source_descriptor_refs: expect.any(Array),
        limitation_notes: expect.any(Array),
      }),
    );
  });

  it("does not mutate input", () => {
    const input = baseInput();
    const before = structuredClone(input);

    evaluateInvestigationViewModelV1(input);

    expect(input).toEqual(before);
  });

  it("throws only a safe generic assertion error", () => {
    expect(() =>
      assertInvestigationViewModelV1({
        tenant_id: tenantId,
      }),
    ).toThrow("Investigation view model v1 decision denied.");
  });
});
