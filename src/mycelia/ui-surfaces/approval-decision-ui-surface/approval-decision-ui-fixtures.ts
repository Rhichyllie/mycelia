import type { ApprovalDecisionUiPreview } from "./approval-decision-ui-contract";

const defaultDecisionOptions = [
  "APPROVE",
  "REJECT",
  "CANCEL",
  "TIMEOUT",
] as const;

const defaultNextSteps = [
  "Keep approval decisions non-mutating until a planned live action boundary exists.",
  "Use this preview to align approval copy, audit expectations and investigation consequences.",
  "Connect future live approval only through explicit repository/API ownership.",
] as const;

const baseApprovalPreview = {
  tenantRef: "tenant_01",
  governedRunRef: "run_medium_review_01",
  approvalRequestRef: "approval_request_medium_review_01",
  requesterRef: "requester_02",
  approverRole: "compliance_reviewer",
  resourceRef: "resource_document_review_02",
  requestPurpose: "Review a compliance document reference that needs approval.",
  riskLevel: "MEDIUM",
  policyOutcome: "REQUIRE_APPROVAL",
  admissionOutcome: "REQUIRE_APPROVAL",
  approvalStatus: "PENDING",
  whyApprovalRequired:
    "Policy/admission requires approval before the governed run can complete.",
  availableDecisionOptions: defaultDecisionOptions,
  expectedAuditMoment: "APPROVAL_DECIDED",
  expectedInvestigationImpact:
    "Investigation should show approval status, lifecycle result and approval audit coverage.",
  tenantRunBoundaryStatus: "MATCHED",
  safeWarnings: [],
  nextSteps: defaultNextSteps,
} as const;

export const APPROVAL_DECISION_UI_FIXTURES = {
  pendingMediumRiskApproval: {
    ...baseApprovalPreview,
    approvalDecisionSurfaceId: "approval_preview_pending_medium",
    selectedDecisionPreview: "APPROVE",
    decisionReasonPreview: "Approve after controlled reviewer inspection.",
    expectedApprovalStatus: "APPROVED",
    expectedLifecycleResult: "APPROVED",
    safeSummary:
      "Pending medium risk approval preview is ready for non-mutating review.",
  },
  approvedDecisionPreview: {
    ...baseApprovalPreview,
    approvalDecisionSurfaceId: "approval_preview_approve",
    selectedDecisionPreview: "APPROVE",
    decisionReasonPreview: "Preview approval outcome for reviewer alignment.",
    expectedApprovalStatus: "APPROVED",
    expectedLifecycleResult: "APPROVED",
    safeSummary:
      "Approve preview shows expected approval status, lifecycle and audit impact.",
  },
  rejectedDecisionPreview: {
    ...baseApprovalPreview,
    approvalDecisionSurfaceId: "approval_preview_reject",
    selectedDecisionPreview: "REJECT",
    decisionReasonPreview: "Preview rejection outcome for reviewer alignment.",
    expectedApprovalStatus: "REJECTED",
    expectedLifecycleResult: "REJECTED",
    safeSummary:
      "Reject preview shows expected rejection status, lifecycle and audit impact.",
  },
  cancelledDecisionPreview: {
    ...baseApprovalPreview,
    approvalDecisionSurfaceId: "approval_preview_cancel",
    selectedDecisionPreview: "CANCEL",
    decisionReasonPreview: "Preview cancellation outcome for reviewer alignment.",
    expectedApprovalStatus: "CANCELLED",
    expectedLifecycleResult: "CANCELLED",
    safeSummary:
      "Cancel preview shows expected cancelled status, lifecycle and audit impact.",
  },
  timedOutDecisionPreview: {
    ...baseApprovalPreview,
    approvalDecisionSurfaceId: "approval_preview_timeout",
    selectedDecisionPreview: "TIMEOUT",
    decisionReasonPreview: "Preview timeout outcome for reviewer alignment.",
    expectedApprovalStatus: "TIMED_OUT",
    expectedLifecycleResult: "FAILED",
    safeSummary:
      "Timeout preview shows expected timed-out approval and failed lifecycle impact.",
  },
  missingApprovalRequest: {
    ...baseApprovalPreview,
    approvalDecisionSurfaceId: "approval_preview_missing_request",
    approvalRequestRef: null,
    selectedDecisionPreview: "APPROVE",
    expectedApprovalStatus: "APPROVED",
    expectedLifecycleResult: "APPROVED",
    safeSummary:
      "Missing approval request preview is visible but blocked before live action.",
  },
  unsupportedDecisionOption: {
    ...baseApprovalPreview,
    approvalDecisionSurfaceId: "approval_preview_unsupported_decision",
    selectedDecisionPreview: "ESCALATE",
    expectedApprovalStatus: "UNKNOWN",
    expectedLifecycleResult: "UNKNOWN",
    safeSummary:
      "Unsupported decision preview is blocked by the controlled approval surface.",
  },
  alreadyTerminalApproval: {
    ...baseApprovalPreview,
    approvalDecisionSurfaceId: "approval_preview_already_terminal",
    approvalStatus: "APPROVED",
    selectedDecisionPreview: "APPROVE",
    expectedApprovalStatus: "APPROVED",
    expectedLifecycleResult: "APPROVED",
    safeSummary:
      "Already terminal approval preview is blocked because only pending requests are decision-ready.",
  },
  tenantRunMismatch: {
    ...baseApprovalPreview,
    approvalDecisionSurfaceId: "approval_preview_tenant_run_mismatch",
    tenantRunBoundaryStatus: "MISMATCHED",
    selectedDecisionPreview: "APPROVE",
    expectedApprovalStatus: "APPROVED",
    expectedLifecycleResult: "APPROVED",
    safeSummary:
      "Tenant/run boundary mismatch preview is blocked before live action.",
  },
} as const satisfies Record<string, ApprovalDecisionUiPreview>;

export const APPROVAL_DECISION_UI_UNSAFE_RAW_CONTENT_ATTEMPT = {
  approvalDecisionSurfaceId: "approval_preview_unsafe_raw_attempt",
  tenantRef: "tenant_01",
  governedRunRef: "run_medium_review_01",
  approvalRequestRef: "approval_request_medium_review_01",
  requesterRef: "requester_02",
  approverRole: "compliance_reviewer",
  resourceRef: "resource_document_review_02",
  requestPurpose: "Preview unsafe approval decision rejection.",
  riskLevel: "UNSAFE",
  policyOutcome: "REQUIRE_APPROVAL",
  admissionOutcome: "REQUIRE_APPROVAL",
  approvalStatus: "PENDING",
  availableDecisionOptions: defaultDecisionOptions,
  selectedDecisionPreview: "APPROVE",
  expectedApprovalStatus: "APPROVED",
  expectedLifecycleResult: "APPROVED",
  expectedAuditMoment: "APPROVAL_DECIDED",
  expectedInvestigationImpact: "Unsafe preview should fail closed.",
  safeSummary: "Unsafe approval decision preview should fail closed.",
  rawDocument: "unsafe content is never accepted",
} as const;

export const DEFAULT_APPROVAL_DECISION_UI_PREVIEW =
  APPROVAL_DECISION_UI_FIXTURES.pendingMediumRiskApproval;
