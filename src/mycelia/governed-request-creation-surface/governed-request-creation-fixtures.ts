import type { GovernedRequestCreationDraft } from "./governed-request-creation-contract";

const expectedInvestigationSections = [
  "overview",
  "stateTimeline",
  "policyAdmission",
  "approval",
  "auditTrail",
  "persistenceCoverage",
  "findings",
  "nextActions",
] as const;

const defaultNextSteps = [
  "Use this seed to prepare a future governed request creation flow.",
  "Keep policy, approval and investigation paths explicit before persistence writes.",
  "Move to live creation only through a planned repository/API boundary phase.",
] as const;

export const GOVERNED_REQUEST_CREATION_FIXTURES = {
  lowRiskDocumentReview: {
    draftRef: "draft_low_risk_document_review",
    tenantRef: "tenant_01",
    requesterRef: "requester_01",
    resourceRef: "resource_document_review_01",
    requestPurpose: "Review a safe compliance document reference.",
    actionType: "DOCUMENT_REVIEW",
    requestMode: "CONTROLLED_DRAFT",
    riskHint: "LOW",
    expectedPolicyOutcome: "ADMIT",
    expectedAdmissionOutcome: "ADMIT",
    approvalExpected: false,
    expectedApprovalRole: null,
    expectedInvestigationSections,
    safeSummary:
      "Low risk document review seed is ready for future governed request creation.",
    safeWarnings: [],
    nextSteps: defaultNextSteps,
  },
  mediumRiskApprovalRequired: {
    draftRef: "draft_medium_risk_approval_review",
    tenantRef: "tenant_01",
    requesterRef: "requester_02",
    resourceRef: "resource_document_review_02",
    requestPurpose: "Review a compliance document reference that needs approval.",
    actionType: "DOCUMENT_APPROVAL_REVIEW",
    requestMode: "DEMO_SEED_PREVIEW",
    riskHint: "MEDIUM",
    expectedPolicyOutcome: "REQUIRE_APPROVAL",
    expectedAdmissionOutcome: "REQUIRE_APPROVAL",
    approvalExpected: true,
    expectedApprovalRole: "compliance_reviewer",
    expectedInvestigationSections,
    safeSummary:
      "Medium risk document review seed expects an approval gate before completion.",
    safeWarnings: [
      {
        code: "APPROVAL_EXPECTED",
        severity: "INFO",
        safeSummary: "Approval is expected for this controlled request seed.",
      },
    ],
    nextSteps: [
      "Use this seed to plan the future approval UI path.",
      "Keep approval decision persistence inside a later explicit runtime phase.",
      "Prepare audit coverage expectations for approval decisions.",
    ],
  },
  highRiskBlocked: {
    draftRef: "draft_high_risk_review_blocked",
    tenantRef: "tenant_01",
    requesterRef: "requester_03",
    resourceRef: "resource_document_review_03",
    requestPurpose: "Review a high risk compliance document reference.",
    actionType: "COMPLIANCE_REVIEW",
    requestMode: "CONTROLLED_DRAFT",
    riskHint: "HIGH",
    expectedPolicyOutcome: "DENY",
    expectedAdmissionOutcome: "DENY",
    approvalExpected: false,
    expectedApprovalRole: null,
    expectedInvestigationSections,
    safeSummary:
      "High risk request seed is blocked before future creation and should be reviewed.",
    safeWarnings: [
      {
        code: "HIGH_RISK_HINT",
        severity: "BLOCKER",
        safeSummary: "High risk hints should not proceed without policy review.",
      },
    ],
    nextSteps: [
      "Review policy/admission expectations before enabling live creation.",
      "Confirm whether denial should be the default future behavior.",
    ],
  },
  incompleteDraft: {
    draftRef: "draft_incomplete_review",
    tenantRef: "tenant_01",
    requesterRef: "requester_04",
    resourceRef: null,
    requestPurpose: null,
    actionType: "DOCUMENT_REVIEW",
    requestMode: "CONTROLLED_DRAFT",
    riskHint: "UNKNOWN",
    expectedPolicyOutcome: "UNKNOWN",
    expectedAdmissionOutcome: "UNKNOWN",
    approvalExpected: null,
    expectedApprovalRole: null,
    expectedInvestigationSections,
    safeSummary:
      "Incomplete request seed is visible but not ready for future creation.",
    safeWarnings: [],
    nextSteps: [
      "Supply a safe resource reference.",
      "Supply a bounded request purpose.",
    ],
  },
  unsupportedActionType: {
    draftRef: "draft_unsupported_action",
    tenantRef: "tenant_01",
    requesterRef: "requester_05",
    resourceRef: "resource_document_review_05",
    requestPurpose: "Preview unsupported action handling.",
    actionType: "BPMN_WORKFLOW_LAUNCH",
    requestMode: "CONTROLLED_DRAFT",
    riskHint: "MEDIUM",
    expectedPolicyOutcome: "UNKNOWN",
    expectedAdmissionOutcome: "UNKNOWN",
    approvalExpected: true,
    expectedApprovalRole: "compliance_reviewer",
    expectedInvestigationSections,
    safeSummary:
      "Unsupported action seed is blocked because Phase 3H is not a workflow builder.",
    safeWarnings: [],
    nextSteps: [
      "Keep workflow builder scope out of the request creation surface.",
      "Define supported action types before future live creation.",
    ],
  },
} as const satisfies Record<string, GovernedRequestCreationDraft>;

export const GOVERNED_REQUEST_CREATION_UNSAFE_RAW_CONTENT_ATTEMPT = {
  draftRef: "draft_unsafe_raw_attempt",
  tenantRef: "tenant_01",
  requesterRef: "requester_06",
  resourceRef: "resource_document_review_06",
  requestPurpose: "Preview unsafe raw content rejection.",
  actionType: "DOCUMENT_REVIEW",
  requestMode: "CONTROLLED_DRAFT",
  riskHint: "UNSAFE",
  expectedPolicyOutcome: "DENY",
  expectedAdmissionOutcome: "DENY",
  approvalExpected: false,
  expectedInvestigationSections,
  safeSummary: "Unsafe request seed should fail closed.",
  rawDocument: "unsafe content is never accepted",
} as const;

export const DEFAULT_GOVERNED_REQUEST_CREATION_DRAFT =
  GOVERNED_REQUEST_CREATION_FIXTURES.mediumRiskApprovalRequired;
