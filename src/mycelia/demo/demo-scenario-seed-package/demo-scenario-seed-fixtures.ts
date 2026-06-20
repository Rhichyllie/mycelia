import type {
  DemoScenarioRouteStep,
  DemoScenarioSeed,
} from "./demo-scenario-seed-contract";

const sharedTargetBuyerContext =
  "Compliance operations buyer evaluating governed document review before a pilot.";

const baseRouteSequence = [
  {
    kind: "REQUEST_CREATION",
    route: "/mycelia/request/new",
    label: "Request seed preview",
    safeSummary:
      "Operator inspects the governed request draft without creating records.",
  },
  {
    kind: "POLICY_ADMISSION",
    route: "/mycelia/request/new",
    label: "Policy and admission expectation",
    safeSummary:
      "Request preview states the expected policy and admission result.",
  },
  {
    kind: "APPROVAL_DECISION",
    route: "/mycelia/approval/decision",
    label: "Approval decision preview",
    safeSummary:
      "Reviewer inspects the non-mutating approval decision preview when relevant.",
  },
  {
    kind: "AUDIT_EXPECTATION",
    route: "/mycelia/investigation",
    label: "Audit expectation review",
    safeSummary:
      "Investigation view shows expected audit coverage from safe descriptors.",
  },
  {
    kind: "INVESTIGATION_REVIEW",
    route: "/mycelia/investigation",
    label: "Investigation review",
    safeSummary:
      "Investigator reviews the expected safe persisted investigation state.",
  },
] as const satisfies readonly DemoScenarioRouteStep[];

const defaultPresenterNotes = [
  "Scenario seeds are deterministic and non-executing.",
  "Routes are existing controlled MYCELIA surfaces only.",
  "The package connects the pilot story without adding live mutations.",
] as const;

const defaultNextSteps = [
  "Use this seed package to rehearse the controlled pilot narrative.",
  "Keep live creation and live approval action behind future explicit phases.",
  "Use investigation output to show explainability without replay execution.",
] as const;

const requestSeedBase = {
  tenantRef: "tenant_01",
  requesterRef: "requester_demo_01",
  resourceRef: "resource_document_review_demo",
  actionType: "DOCUMENT_APPROVAL_REVIEW",
} as const;

export const DEMO_SCENARIO_SEED_FIXTURES = {
  lowRiskDirectCompletion: {
    demoScenarioId: "demo_seed_low_risk_direct_completion",
    scenarioName: "Low risk direct completion",
    scenarioPurpose:
      "Show a governed document review that is expected to pass admission without approval.",
    targetBuyerContext: sharedTargetBuyerContext,
    requestSeed: {
      ...requestSeedBase,
      requestRef: "request_seed_low_risk",
      requestPurpose: "Review a safe compliance document reference.",
      riskHint: "LOW",
      safeSummary:
        "Low risk request seed is expected to complete without approval.",
    },
    policyAdmissionExpectation: {
      riskLevel: "LOW",
      policyOutcome: "ADMIT",
      admissionOutcome: "ADMIT",
      reasonCode: "LOW_RISK_ADMITTED",
      lifecycleHint: "GRANT_ADMISSION",
      safeSummary:
        "Policy and admission are expected to admit the low risk review.",
    },
    approvalExpectation: {
      approvalRequired: false,
      approvalPreviewRef: "approval_preview_not_required",
      selectedDecisionPreview: null,
      expectedApprovalStatus: "NOT_REQUIRED",
      expectedLifecycleResult: "COMPLETED",
      expectedApprovalRole: null,
      safeSummary: "Approval is not expected for the low risk scenario.",
    },
    investigationExpectation: {
      expectedState: "COMPLETED",
      expectedCompleteness: "COMPLETE",
      expectedFindings: [],
      safeSummary:
        "Investigation should show direct completion with complete safe evidence.",
    },
    auditExpectation: {
      expectedMoments: ["REQUEST_CREATED", "ADMISSION_DECIDED"],
      missingMoments: [],
      safeSummary:
        "Audit expectation includes request creation and admission decision moments.",
    },
    routeSequence: baseRouteSequence,
    presenterNotes: defaultPresenterNotes,
    safetyWarnings: [],
    demoReadinessStatus: "DEMO_SCENARIO_READY",
    nextSteps: defaultNextSteps,
  },
  mediumRiskApprovalRequired: {
    demoScenarioId: "demo_seed_medium_risk_approval_required",
    scenarioName: "Medium risk approval required",
    scenarioPurpose:
      "Show a medium risk document review that requires approval before completion.",
    targetBuyerContext: sharedTargetBuyerContext,
    requestSeed: {
      ...requestSeedBase,
      requestRef: "request_seed_medium_approval",
      requesterRef: "requester_demo_02",
      requestPurpose: "Review a compliance document reference that needs approval.",
      riskHint: "MEDIUM",
      safeSummary:
        "Medium risk request seed is expected to pause for approval.",
    },
    policyAdmissionExpectation: {
      riskLevel: "MEDIUM",
      policyOutcome: "REQUIRE_APPROVAL",
      admissionOutcome: "REQUIRE_APPROVAL",
      reasonCode: "MEDIUM_RISK_REQUIRES_APPROVAL",
      lifecycleHint: "REQUIRE_APPROVAL",
      safeSummary:
        "Policy and admission are expected to require approval.",
    },
    approvalExpectation: {
      approvalRequired: true,
      approvalPreviewRef: "approval_preview_pending_medium",
      selectedDecisionPreview: "APPROVE",
      expectedApprovalStatus: "APPROVED",
      expectedLifecycleResult: "APPROVED",
      expectedApprovalRole: "compliance_reviewer",
      safeSummary:
        "Approval preview shows an approve path before investigation review.",
    },
    investigationExpectation: {
      expectedState: "APPROVED",
      expectedCompleteness: "COMPLETE",
      expectedFindings: [],
      safeSummary:
        "Investigation should show approval requirement, decision and audit coverage.",
    },
    auditExpectation: {
      expectedMoments: [
        "REQUEST_CREATED",
        "ADMISSION_DECIDED",
        "APPROVAL_DECIDED",
      ],
      missingMoments: [],
      safeSummary:
        "Audit expectation includes approval decision coverage.",
    },
    routeSequence: baseRouteSequence,
    presenterNotes: defaultPresenterNotes,
    safetyWarnings: [],
    demoReadinessStatus: "DEMO_SCENARIO_READY",
    nextSteps: defaultNextSteps,
  },
  mediumRiskRejectedDecision: {
    demoScenarioId: "demo_seed_medium_risk_rejected_decision",
    scenarioName: "Medium risk rejected decision",
    scenarioPurpose:
      "Show a required approval path where the previewed decision is rejection.",
    targetBuyerContext: sharedTargetBuyerContext,
    requestSeed: {
      ...requestSeedBase,
      requestRef: "request_seed_medium_rejected",
      requesterRef: "requester_demo_03",
      requestPurpose: "Review a compliance document reference with rejection path.",
      riskHint: "MEDIUM",
      safeSummary:
        "Medium risk request seed is expected to be rejected after review.",
    },
    policyAdmissionExpectation: {
      riskLevel: "MEDIUM",
      policyOutcome: "REQUIRE_APPROVAL",
      admissionOutcome: "REQUIRE_APPROVAL",
      reasonCode: "MEDIUM_RISK_REQUIRES_APPROVAL",
      lifecycleHint: "REQUIRE_APPROVAL",
      safeSummary:
        "Policy and admission require approval before rejection is decided.",
    },
    approvalExpectation: {
      approvalRequired: true,
      approvalPreviewRef: "approval_preview_reject",
      selectedDecisionPreview: "REJECT",
      expectedApprovalStatus: "REJECTED",
      expectedLifecycleResult: "REJECTED",
      expectedApprovalRole: "compliance_reviewer",
      safeSummary:
        "Approval preview shows a reject path and rejected lifecycle result.",
    },
    investigationExpectation: {
      expectedState: "REJECTED",
      expectedCompleteness: "COMPLETE",
      expectedFindings: [],
      safeSummary:
        "Investigation should show rejected approval and approval audit coverage.",
    },
    auditExpectation: {
      expectedMoments: [
        "REQUEST_CREATED",
        "ADMISSION_DECIDED",
        "APPROVAL_DECIDED",
      ],
      missingMoments: [],
      safeSummary:
        "Audit expectation includes the rejected approval decision moment.",
    },
    routeSequence: baseRouteSequence,
    presenterNotes: defaultPresenterNotes,
    safetyWarnings: [],
    demoReadinessStatus: "DEMO_SCENARIO_READY",
    nextSteps: defaultNextSteps,
  },
  cancelledApprovalPath: {
    demoScenarioId: "demo_seed_cancelled_approval_path",
    scenarioName: "Cancelled approval path",
    scenarioPurpose:
      "Show a required approval path where the controlled preview is cancellation.",
    targetBuyerContext: sharedTargetBuyerContext,
    requestSeed: {
      ...requestSeedBase,
      requestRef: "request_seed_cancelled_approval",
      requesterRef: "requester_demo_04",
      requestPurpose: "Review a compliance document reference with cancel path.",
      riskHint: "MEDIUM",
      safeSummary:
        "Medium risk request seed is expected to be cancelled during approval.",
    },
    policyAdmissionExpectation: {
      riskLevel: "MEDIUM",
      policyOutcome: "REQUIRE_APPROVAL",
      admissionOutcome: "REQUIRE_APPROVAL",
      reasonCode: "MEDIUM_RISK_REQUIRES_APPROVAL",
      lifecycleHint: "REQUIRE_APPROVAL",
      safeSummary:
        "Policy and admission require approval before cancellation is previewed.",
    },
    approvalExpectation: {
      approvalRequired: true,
      approvalPreviewRef: "approval_preview_cancel",
      selectedDecisionPreview: "CANCEL",
      expectedApprovalStatus: "CANCELLED",
      expectedLifecycleResult: "CANCELLED",
      expectedApprovalRole: "compliance_reviewer",
      safeSummary:
        "Approval preview shows a cancellation path and cancelled lifecycle result.",
    },
    investigationExpectation: {
      expectedState: "CANCELLED",
      expectedCompleteness: "COMPLETE",
      expectedFindings: [],
      safeSummary:
        "Investigation should show cancelled approval and approval audit coverage.",
    },
    auditExpectation: {
      expectedMoments: [
        "REQUEST_CREATED",
        "ADMISSION_DECIDED",
        "APPROVAL_DECIDED",
      ],
      missingMoments: [],
      safeSummary:
        "Audit expectation includes the cancelled approval decision moment.",
    },
    routeSequence: baseRouteSequence,
    presenterNotes: defaultPresenterNotes,
    safetyWarnings: [],
    demoReadinessStatus: "DEMO_SCENARIO_READY",
    nextSteps: defaultNextSteps,
  },
  timedOutApprovalPath: {
    demoScenarioId: "demo_seed_timed_out_approval_path",
    scenarioName: "Timed out approval path",
    scenarioPurpose:
      "Show a required approval path where the controlled preview times out.",
    targetBuyerContext: sharedTargetBuyerContext,
    requestSeed: {
      ...requestSeedBase,
      requestRef: "request_seed_timed_out_approval",
      requesterRef: "requester_demo_05",
      requestPurpose: "Review a compliance document reference with timeout path.",
      riskHint: "MEDIUM",
      safeSummary:
        "Medium risk request seed is expected to fail safely after timeout.",
    },
    policyAdmissionExpectation: {
      riskLevel: "MEDIUM",
      policyOutcome: "REQUIRE_APPROVAL",
      admissionOutcome: "REQUIRE_APPROVAL",
      reasonCode: "MEDIUM_RISK_REQUIRES_APPROVAL",
      lifecycleHint: "REQUIRE_APPROVAL",
      safeSummary:
        "Policy and admission require approval before timeout is previewed.",
    },
    approvalExpectation: {
      approvalRequired: true,
      approvalPreviewRef: "approval_preview_timeout",
      selectedDecisionPreview: "TIMEOUT",
      expectedApprovalStatus: "TIMED_OUT",
      expectedLifecycleResult: "FAILED",
      expectedApprovalRole: "compliance_reviewer",
      safeSummary:
        "Approval preview shows timeout and failed lifecycle result.",
    },
    investigationExpectation: {
      expectedState: "FAILED",
      expectedCompleteness: "COMPLETE",
      expectedFindings: [],
      safeSummary:
        "Investigation should show timed-out approval and approval audit coverage.",
    },
    auditExpectation: {
      expectedMoments: [
        "REQUEST_CREATED",
        "ADMISSION_DECIDED",
        "APPROVAL_DECIDED",
      ],
      missingMoments: [],
      safeSummary:
        "Audit expectation includes the timed-out approval decision moment.",
    },
    routeSequence: baseRouteSequence,
    presenterNotes: defaultPresenterNotes,
    safetyWarnings: [],
    demoReadinessStatus: "DEMO_SCENARIO_READY",
    nextSteps: defaultNextSteps,
  },
  highRiskBlockedRejectedPath: {
    demoScenarioId: "demo_seed_high_risk_blocked_rejected",
    scenarioName: "High risk blocked or rejected path",
    scenarioPurpose:
      "Show a high risk request seed whose policy/admission expectation is denial.",
    targetBuyerContext: sharedTargetBuyerContext,
    requestSeed: {
      ...requestSeedBase,
      requestRef: "request_seed_high_risk_rejected",
      requesterRef: "requester_demo_06",
      requestPurpose: "Review a high risk compliance document reference.",
      actionType: "COMPLIANCE_REVIEW",
      riskHint: "HIGH",
      safeSummary:
        "High risk request seed is coherent for a blocked or rejected demo path.",
    },
    policyAdmissionExpectation: {
      riskLevel: "HIGH",
      policyOutcome: "DENY",
      admissionOutcome: "DENY",
      reasonCode: "HIGH_RISK_DENIED",
      lifecycleHint: "REJECT",
      safeSummary:
        "Policy and admission are expected to deny the high risk path.",
    },
    approvalExpectation: {
      approvalRequired: false,
      approvalPreviewRef: "approval_preview_not_started",
      selectedDecisionPreview: null,
      expectedApprovalStatus: "NOT_STARTED",
      expectedLifecycleResult: "REJECTED",
      expectedApprovalRole: null,
      safeSummary:
        "Approval does not proceed when policy/admission denies the request.",
    },
    investigationExpectation: {
      expectedState: "REJECTED",
      expectedCompleteness: "COMPLETE",
      expectedFindings: ["HIGH_RISK_DENIED"],
      safeSummary:
        "Investigation should show policy/admission rejection and safe audit coverage.",
    },
    auditExpectation: {
      expectedMoments: ["REQUEST_CREATED", "ADMISSION_DECIDED"],
      missingMoments: [],
      safeSummary:
        "Audit expectation includes request creation and admission denial moments.",
    },
    routeSequence: baseRouteSequence,
    presenterNotes: defaultPresenterNotes,
    safetyWarnings: [
      {
        code: "HIGH_RISK_EXPECTED_DENIAL",
        severity: "INFO",
        safeSummary:
          "This scenario is ready because high risk denial is the expected demo result.",
      },
    ],
    demoReadinessStatus: "DEMO_SCENARIO_READY",
    nextSteps: defaultNextSteps,
  },
  incompleteEvidencePath: {
    demoScenarioId: "demo_seed_incomplete_evidence",
    scenarioName: "Incomplete evidence path",
    scenarioPurpose:
      "Show investigation warning behavior when expected audit evidence is missing.",
    targetBuyerContext: sharedTargetBuyerContext,
    requestSeed: {
      ...requestSeedBase,
      requestRef: "request_seed_incomplete_evidence",
      requesterRef: "requester_demo_07",
      requestPurpose:
        "Review a compliance document reference with incomplete evidence.",
      riskHint: "MEDIUM",
      safeSummary:
        "Medium risk request seed is safe but evidence coverage is incomplete.",
    },
    policyAdmissionExpectation: {
      riskLevel: "MEDIUM",
      policyOutcome: "REQUIRE_APPROVAL",
      admissionOutcome: "REQUIRE_APPROVAL",
      reasonCode: "MEDIUM_RISK_REQUIRES_APPROVAL",
      lifecycleHint: "REQUIRE_APPROVAL",
      safeSummary:
        "Policy and admission are expected to require approval.",
    },
    approvalExpectation: {
      approvalRequired: true,
      approvalPreviewRef: "approval_preview_pending_medium",
      selectedDecisionPreview: "APPROVE",
      expectedApprovalStatus: "APPROVED",
      expectedLifecycleResult: "APPROVED",
      expectedApprovalRole: "compliance_reviewer",
      safeSummary:
        "Approval expectation exists but evidence coverage remains incomplete.",
    },
    investigationExpectation: {
      expectedState: "APPROVED",
      expectedCompleteness: "INCOMPLETE",
      expectedFindings: ["AUDIT_ADMISSION_DECIDED_MISSING"],
      safeSummary:
        "Investigation should show incomplete evidence and warnings.",
    },
    auditExpectation: {
      expectedMoments: ["REQUEST_CREATED", "APPROVAL_DECIDED"],
      missingMoments: ["ADMISSION_DECIDED"],
      safeSummary:
        "Audit expectation intentionally shows a missing admission moment.",
    },
    routeSequence: baseRouteSequence,
    presenterNotes: defaultPresenterNotes,
    safetyWarnings: [
      {
        code: "INCOMPLETE_EVIDENCE_EXPECTED",
        severity: "WARNING",
        safeSummary:
          "This scenario is safe but should be marked incomplete for demo review.",
      },
    ],
    demoReadinessStatus: "DEMO_SCENARIO_INCOMPLETE",
    nextSteps: [
      "Use investigation to show missing audit warning behavior.",
      "Avoid presenting incomplete evidence as a complete demo success.",
    ],
  },
} as const satisfies Record<string, DemoScenarioSeed>;

export const DEMO_SCENARIO_SEED_UNSUPPORTED_STEP_KIND_ATTEMPT = {
  ...DEMO_SCENARIO_SEED_FIXTURES.mediumRiskApprovalRequired,
  demoScenarioId: "demo_seed_unsupported_step_kind",
  routeSequence: [
    ...baseRouteSequence,
    {
      kind: "WORKFLOW_EXECUTION",
      route: "/mycelia/investigation",
      label: "Unsupported workflow step",
      safeSummary:
        "Unsupported workflow execution step should be blocked by presenter.",
    },
  ],
} as const;

export const DEMO_SCENARIO_SEED_INVALID_ROUTE_ATTEMPT = {
  ...DEMO_SCENARIO_SEED_FIXTURES.mediumRiskApprovalRequired,
  demoScenarioId: "demo_seed_invalid_route_path",
  routeSequence: [
    ...baseRouteSequence,
    {
      kind: "INVESTIGATION_REVIEW",
      route: "/mycelia/admin",
      label: "Invalid route",
      safeSummary:
        "Invalid route path should be blocked by the demo package presenter.",
    },
  ],
} as const;

export const DEMO_SCENARIO_SEED_UNSAFE_RAW_CONTENT_ATTEMPT = {
  ...DEMO_SCENARIO_SEED_FIXTURES.mediumRiskApprovalRequired,
  demoScenarioId: "demo_seed_unsafe_attempt",
  scenarioName: "Unsafe raw content attempt",
  rawDocument: "unsafe source material is never accepted",
} as const;

export const DEFAULT_DEMO_SCENARIO_SEED =
  DEMO_SCENARIO_SEED_FIXTURES.mediumRiskApprovalRequired;
