import type { MinimalInvestigationUiDescriptor } from "./minimal-investigation-ui-contract";

const completeApproved: MinimalInvestigationUiDescriptor = {
  verdict: "INVESTIGATION_RECONSTRUCTED",
  completeness: "COMPLETE",
  overview: {
    tenantId: "tenant_01",
    governedRunId: "run_approved_static",
    correlationId: "run_approved_static_correlation",
    currentState: "APPROVED",
    status: "ACTIVE_OR_IN_PROGRESS",
    resourceRef: "resource_compliance_review_01",
    requesterRef: "requester_01",
    purpose: "COMPLIANCE_REVIEW",
    safeSummary:
      "Persisted run history reconstructed from safe repository descriptors.",
  },
  stateTimeline: {
    currentState: "APPROVED",
    entries: [
      {
        sequence: 1,
        state: "CREATED",
        reasonCode: "STATE_CREATED",
        safeSummary: "Run root record was created.",
      },
      {
        sequence: 2,
        state: "CONTEXT_RESOLVED",
        reasonCode: "RESOLVE_CONTEXT_ALLOWED",
        safeSummary: "Context descriptor was resolved.",
      },
      {
        sequence: 3,
        state: "POLICY_EVALUATED",
        reasonCode: "EVALUATE_POLICY_ALLOWED",
        safeSummary: "Policy and admission decision was evaluated.",
      },
      {
        sequence: 4,
        state: "WAITING_APPROVAL",
        reasonCode: "REQUIRE_APPROVAL_ALLOWED",
        safeSummary: "Approval was required for medium risk review.",
      },
      {
        sequence: 5,
        state: "APPROVED",
        reasonCode: "APPROVE_ALLOWED",
        safeSummary: "Approval decision was persisted.",
      },
    ],
    warnings: [],
  },
  policyAdmission: {
    riskLevel: "MEDIUM",
    policyOutcome: "REQUIRE_APPROVAL",
    admissionOutcome: "REQUIRE_APPROVAL",
    reasonCode: "MEDIUM_RISK_REQUIRES_APPROVAL",
    policyRef: "policy_01",
    lifecycleIntentHint: "REQUIRE_APPROVAL",
    safeSummary:
      "Policy and admission required approval before the run could proceed.",
    explainable: true,
  },
  approval: {
    approvalRequired: true,
    currentApprovalStatus: "APPROVED",
    decisionOutcome: "APPROVE",
    decisionReason: "APPROVE_DECISION",
    requestedRole: "compliance_reviewer",
    requesterRef: "requester_01",
    approverRef: "approver_01",
    decidedAt: "2026-01-01T00:01:00.000Z",
    approvalCompleteness: "COMPLETE",
    lifecycleCoherence: "COHERENT",
  },
  auditTrail: {
    presentMoments: [
      "REQUEST_CREATED",
      "ADMISSION_DECIDED",
      "APPROVAL_DECIDED",
    ],
    expectedMoments: [
      "REQUEST_CREATED",
      "ADMISSION_DECIDED",
      "APPROVAL_DECIDED",
    ],
    missingMoments: [],
    safeAuditSummaries: [
      "Request boundary persisted.",
      "Admission boundary persisted.",
      "Approval decision boundary persisted.",
    ],
    coverageStatus: "COMPLETE",
  },
  persistenceCoverage: {
    foundRecords: [
      "GovernedRun",
      "RuntimeStateSnapshot",
      "PolicyDecisionRecord",
      "AdmissionDecisionRecord",
      "ApprovalRequest",
      "AuditRecord",
    ],
    missingRecords: [],
    tenantRunAgreement: true,
  },
  findings: [],
  nextActions: ["Review approval decision.", "Prepare read-only UI review."],
};

const incompleteAudit: MinimalInvestigationUiDescriptor = {
  ...completeApproved,
  verdict: "INVESTIGATION_INCOMPLETE",
  completeness: "INCOMPLETE",
  auditTrail: {
    ...completeApproved.auditTrail,
    presentMoments: ["REQUEST_CREATED", "APPROVAL_DECIDED"],
    missingMoments: ["ADMISSION_DECIDED"],
    coverageStatus: "INCOMPLETE",
  },
  findings: [
    {
      severity: "WARNING",
      code: "AUDIT_ADMISSION_DECIDED_MISSING",
      section: "auditTrail",
      safeSummary: "Expected audit moment ADMISSION_DECIDED is missing.",
    },
  ],
  nextActions: ["Inspect missing audit coverage."],
};

const noAuditMoments: MinimalInvestigationUiDescriptor = {
  ...completeApproved,
  verdict: "INVESTIGATION_INCOMPLETE",
  completeness: "INCOMPLETE",
  auditTrail: {
    presentMoments: [],
    expectedMoments: ["REQUEST_CREATED", "ADMISSION_DECIDED"],
    missingMoments: ["REQUEST_CREATED", "ADMISSION_DECIDED"],
    safeAuditSummaries: [],
    coverageStatus: "INCOMPLETE",
  },
  findings: [
    {
      severity: "WARNING",
      code: "AUDIT_COVERAGE_EMPTY",
      section: "auditTrail",
      safeSummary: "No persisted audit moments were supplied.",
    },
  ],
  nextActions: ["Inspect missing audit coverage."],
};

const approvalMissing: MinimalInvestigationUiDescriptor = {
  ...completeApproved,
  verdict: "INVESTIGATION_INCOMPLETE",
  completeness: "INCOMPLETE",
  overview: {
    ...completeApproved.overview,
    currentState: "WAITING_APPROVAL",
  },
  approval: {
    approvalRequired: true,
    currentApprovalStatus: null,
    decisionOutcome: null,
    decisionReason: null,
    requestedRole: "compliance_reviewer",
    requesterRef: "requester_01",
    approverRef: null,
    decidedAt: null,
    approvalCompleteness: "INCOMPLETE",
    lifecycleCoherence: "NOT_APPLICABLE",
  },
  findings: [
    {
      severity: "WARNING",
      code: "APPROVAL_RECORD_MISSING",
      section: "approval",
      safeSummary:
        "Approval was required but a complete approval descriptor was not supplied.",
    },
  ],
  nextActions: ["Escalate incomplete approval record set."],
};

const partialCoverage: MinimalInvestigationUiDescriptor = {
  ...completeApproved,
  verdict: "INVESTIGATION_INCOMPLETE",
  completeness: "INCOMPLETE",
  persistenceCoverage: {
    foundRecords: [
      "GovernedRun",
      "RuntimeStateSnapshot",
      "AdmissionDecisionRecord",
      "AuditRecord",
    ],
    missingRecords: ["PolicyDecisionRecord", "ApprovalRequest"],
    tenantRunAgreement: true,
  },
  findings: [
    {
      severity: "WARNING",
      code: "PERSISTENCE_COVERAGE_PARTIAL",
      section: "persistenceCoverage",
      safeSummary: "Expected persisted records are missing from the descriptor.",
    },
  ],
  nextActions: ["Escalate incomplete record set."],
};

const emptyFindings: MinimalInvestigationUiDescriptor = {
  ...completeApproved,
  findings: [],
  nextActions: [],
};

const blockedReconstruction: MinimalInvestigationUiDescriptor = {
  ...completeApproved,
  verdict: "INVESTIGATION_BLOCKED",
  completeness: "BLOCKED",
  overview: {
    tenantId: "tenant_01",
    governedRunId: "run_blocked_static",
    correlationId: "run_blocked_static_correlation",
    currentState: null,
    status: "BLOCKED",
    resourceRef: null,
    requesterRef: null,
    purpose: "COMPLIANCE_REVIEW",
    safeSummary: "Investigation reconstruction is blocked.",
  },
  stateTimeline: {
    entries: [],
    currentState: null,
    warnings: ["No runtime state snapshots were supplied."],
  },
  approval: {
    approvalRequired: null,
    currentApprovalStatus: null,
    decisionOutcome: null,
    decisionReason: null,
    requestedRole: null,
    requesterRef: null,
    approverRef: null,
    decidedAt: null,
    approvalCompleteness: "BLOCKED",
    lifecycleCoherence: "NOT_APPLICABLE",
  },
  auditTrail: {
    presentMoments: [],
    expectedMoments: [],
    missingMoments: [],
    safeAuditSummaries: [],
    coverageStatus: "BLOCKED",
  },
  persistenceCoverage: {
    foundRecords: [],
    missingRecords: [
      "GovernedRun",
      "RuntimeStateSnapshot",
      "PolicyDecisionRecord",
      "AdmissionDecisionRecord",
      "ApprovalRequest",
      "AuditRecord",
    ],
    tenantRunAgreement: false,
  },
  findings: [
    {
      severity: "BLOCKER",
      code: "GOVERNED_RUN_MISSING",
      section: "overview",
      safeSummary: "Governed run root record was not found for this scope.",
    },
  ],
  nextActions: ["Escalate incomplete record set before investigation review."],
};

export const MINIMAL_INVESTIGATION_UI_FIXTURES = {
  completeApproved,
  incompleteAudit,
  noAuditMoments,
  approvalMissing,
  partialCoverage,
  emptyFindings,
  blockedReconstruction,
} as const satisfies Record<string, MinimalInvestigationUiDescriptor>;

export const DEFAULT_MINIMAL_INVESTIGATION_UI_DESCRIPTOR =
  MINIMAL_INVESTIGATION_UI_FIXTURES.completeApproved;
