import {
  APPROVAL_DECISION_UI_SURFACE_NAME,
  APPROVAL_DECISION_UI_SURFACE_PHASE,
  ApprovalDecisionUiDecisionOptions,
  ApprovalDecisionUiPreviewSchema,
  ApprovalDecisionUiSections,
  type ApprovalDecisionUiDisplayValue,
  type ApprovalDecisionUiPresentedModel,
  type ApprovalDecisionUiPreview,
  type ApprovalDecisionUiStatus,
  type ApprovalDecisionUiTone,
  type ApprovalDecisionUiWarning,
} from "./approval-decision-ui-contract";
import {
  DEFAULT_APPROVAL_DECISION_UI_PREVIEW,
} from "./approval-decision-ui-fixtures";

const supportedDecisionOptions = new Set<string>(
  ApprovalDecisionUiDecisionOptions,
);

const terminalApprovalStatuses = new Set<string>([
  "APPROVED",
  "REJECTED",
  "TIMED_OUT",
  "CANCELLED",
]);

const unsafeFieldNamePattern =
  /^(rawDocument|documentContent|rawContent|fileBlob|binary|payload)$/i;

const safetyBoundary = [
  "No approval decision is persisted in this phase.",
  "No API route or route handler is created.",
  "No auth, RBAC, session or approver identity enforcement is active.",
  "No Phase 3D approval runtime execution is triggered.",
  "No replay execution, workflow execution or tool execution is available.",
  "No export, download or PDF artifact is created.",
  "No external service call is made.",
] as const;

const failedSafePreview = {
  approvalDecisionSurfaceId: "approval_preview_failed_safe",
  tenantRef: null,
  governedRunRef: null,
  approvalRequestRef: null,
  requesterRef: null,
  approverRole: null,
  resourceRef: null,
  requestPurpose: "Failed-safe approval preview could not be normalized.",
  riskLevel: "UNSAFE",
  policyOutcome: "UNKNOWN",
  admissionOutcome: "UNKNOWN",
  approvalStatus: "UNKNOWN",
  whyApprovalRequired: null,
  availableDecisionOptions: [],
  selectedDecisionPreview: null,
  decisionReasonPreview: null,
  expectedApprovalStatus: "UNKNOWN",
  expectedLifecycleResult: "UNKNOWN",
  expectedAuditMoment: "APPROVAL_DECIDED",
  expectedInvestigationImpact:
    "Investigation should show failed-safe approval preview handling.",
  tenantRunBoundaryStatus: "UNKNOWN",
  safeSummary: "Approval decision preview failed safe before rendering.",
  safeWarnings: [],
  nextSteps: [
    "Remove unsafe approval preview fields before future review.",
    "Retry with safe references and safe summaries only.",
  ],
} as const satisfies ApprovalDecisionUiPreview;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function unsafeFieldNames(input: unknown): string[] {
  if (!isRecord(input)) {
    return [];
  }

  return Object.keys(input).filter((key) => unsafeFieldNamePattern.test(key));
}

function valueState(
  value: string | null | undefined,
): ApprovalDecisionUiDisplayValue["state"] {
  if (value === null || value === undefined || value === "") {
    return "missing";
  }

  return "present";
}

function displayValue(
  label: string,
  value: string | null | undefined,
  tone: ApprovalDecisionUiTone = "neutral",
): ApprovalDecisionUiDisplayValue {
  const state = valueState(value);
  let renderedValue = "Not supplied";

  if (state !== "missing" && typeof value === "string") {
    renderedValue = value;
  }

  return {
    label,
    value: renderedValue,
    state,
    tone: state === "missing" ? "warning" : tone,
  };
}

function warning(
  code: string,
  severity: ApprovalDecisionUiWarning["severity"],
  safeSummary: string,
): ApprovalDecisionUiWarning {
  return { code, severity, safeSummary };
}

function missingWarnings(
  preview: ApprovalDecisionUiPreview,
): ApprovalDecisionUiWarning[] {
  const warnings: ApprovalDecisionUiWarning[] = [];

  if (preview.tenantRef === null || preview.tenantRef === undefined) {
    warnings.push(
      warning("TENANT_REF_MISSING", "BLOCKER", "Tenant reference is required."),
    );
  }

  if (
    preview.governedRunRef === null ||
    preview.governedRunRef === undefined
  ) {
    warnings.push(
      warning(
        "GOVERNED_RUN_REF_MISSING",
        "BLOCKER",
        "Governed run reference is required.",
      ),
    );
  }

  if (
    preview.approvalRequestRef === null ||
    preview.approvalRequestRef === undefined
  ) {
    warnings.push(
      warning(
        "APPROVAL_REQUEST_REF_MISSING",
        "BLOCKER",
        "Approval request reference is required before any future live action.",
      ),
    );
  }

  if (preview.approverRole === null || preview.approverRole === undefined) {
    warnings.push(
      warning(
        "APPROVER_ROLE_MISSING",
        "WARNING",
        "Approver role is missing from the approval preview.",
      ),
    );
  }

  if (preview.requestPurpose === null || preview.requestPurpose === undefined) {
    warnings.push(
      warning(
        "REQUEST_PURPOSE_MISSING",
        "WARNING",
        "Request purpose is missing from the approval preview.",
      ),
    );
  }

  return warnings;
}

function decisionWarnings(
  preview: ApprovalDecisionUiPreview,
): ApprovalDecisionUiWarning[] {
  const warnings: ApprovalDecisionUiWarning[] = [];
  const options = preview.availableDecisionOptions ?? [];

  for (const option of options) {
    if (!supportedDecisionOptions.has(option)) {
      warnings.push(
        warning(
          "UNSUPPORTED_DECISION_OPTION",
          "BLOCKER",
          "Available decision options include an unsupported value.",
        ),
      );
    }
  }

  if (
    preview.selectedDecisionPreview !== null &&
    preview.selectedDecisionPreview !== undefined &&
    !supportedDecisionOptions.has(preview.selectedDecisionPreview)
  ) {
    warnings.push(
      warning(
        "UNSUPPORTED_DECISION_OPTION",
        "BLOCKER",
        "Selected decision preview is not supported by this controlled surface.",
      ),
    );
  }

  if (
    preview.approvalStatus !== null &&
    preview.approvalStatus !== undefined &&
    terminalApprovalStatuses.has(preview.approvalStatus)
  ) {
    warnings.push(
      warning(
        "APPROVAL_STATUS_TERMINAL",
        "BLOCKER",
        "Only pending approval requests are decision-ready in this preview.",
      ),
    );
  }

  if (preview.tenantRunBoundaryStatus === "MISMATCHED") {
    warnings.push(
      warning(
        "TENANT_RUN_BOUNDARY_MISMATCH",
        "BLOCKER",
        "Tenant/run scope does not match and must fail closed before live action.",
      ),
    );
  }

  return warnings;
}

function statusForWarnings(
  warnings: readonly ApprovalDecisionUiWarning[],
): ApprovalDecisionUiStatus {
  if (
    warnings.some((item) =>
      item.code === "UNSAFE_RAW_FIELD_NAME" ||
      item.code === "APPROVAL_DECISION_SCHEMA_INVALID"
    )
  ) {
    return "APPROVAL_DECISION_PREVIEW_FAILED_SAFE";
  }

  if (warnings.some((item) => item.severity === "BLOCKER")) {
    return "APPROVAL_DECISION_PREVIEW_BLOCKED";
  }

  if (warnings.some((item) => item.severity === "WARNING")) {
    return "APPROVAL_DECISION_PREVIEW_INCOMPLETE";
  }

  return "APPROVAL_DECISION_PREVIEW_READY";
}

function normalizeOptions(
  options: readonly string[] | undefined,
): string {
  if (options === undefined || options.length === 0) {
    return "Not supplied";
  }

  return options.join(", ");
}

function normalizeNextActions(
  preview: ApprovalDecisionUiPreview,
): readonly string[] {
  if (preview.nextSteps !== undefined && preview.nextSteps.length > 0) {
    return preview.nextSteps;
  }

  return [
    "Prepare a future live approval action boundary before allowing persistence writes.",
    "Keep approval UI separate from broad inbox and task management scope.",
  ];
}

function riskTone(
  riskLevel: ApprovalDecisionUiPreview["riskLevel"],
): ApprovalDecisionUiTone {
  if (riskLevel === "LOW") {
    return "success";
  }

  if (riskLevel === "MEDIUM" || riskLevel === "UNKNOWN") {
    return "warning";
  }

  if (riskLevel === "HIGH" || riskLevel === "UNSAFE") {
    return "critical";
  }

  return "neutral";
}

function presentValidPreview(
  preview: ApprovalDecisionUiPreview,
  warnings: readonly ApprovalDecisionUiWarning[],
): ApprovalDecisionUiPresentedModel {
  const status = statusForWarnings(warnings);

  return {
    phase: APPROVAL_DECISION_UI_SURFACE_PHASE,
    name: APPROVAL_DECISION_UI_SURFACE_NAME,
    status,
    sections: ApprovalDecisionUiSections,
    preview,
    approvalOverview: [
      displayValue("Approval preview reference", preview.approvalDecisionSurfaceId),
      displayValue("Tenant reference", preview.tenantRef),
      displayValue("Governed run reference", preview.governedRunRef),
      displayValue("Approval request reference", preview.approvalRequestRef),
      displayValue("Requester reference", preview.requesterRef),
      displayValue("Approver role", preview.approverRole),
      displayValue("Resource reference", preview.resourceRef),
      displayValue("Purpose", preview.requestPurpose),
    ],
    governanceContext: [
      displayValue("Risk level", preview.riskLevel, riskTone(preview.riskLevel)),
      displayValue("Policy outcome", preview.policyOutcome),
      displayValue("Admission outcome", preview.admissionOutcome),
      displayValue("Why approval is required", preview.whyApprovalRequired),
      displayValue("Safe summary", preview.safeSummary),
    ],
    decisionPreview: [
      displayValue("Available options", normalizeOptions(preview.availableDecisionOptions)),
      displayValue("Selected decision preview", preview.selectedDecisionPreview),
      displayValue("Decision reason preview", preview.decisionReasonPreview),
      displayValue(
        "Decision boundary",
        "Non-mutating preview only; no approval action is submitted.",
        "warning",
      ),
    ],
    expectedRuntimeEffect: [
      displayValue("Current approval status", preview.approvalStatus),
      displayValue("Expected approval status", preview.expectedApprovalStatus),
      displayValue("Expected lifecycle state", preview.expectedLifecycleResult),
      displayValue("Expected audit moment", preview.expectedAuditMoment),
      displayValue(
        "Expected investigation impact",
        preview.expectedInvestigationImpact,
      ),
    ],
    safetyBoundary,
    safeDecisionSummary:
      preview.safeSummary ?? "No safe approval decision summary was supplied.",
    warnings,
    nextActions: normalizeNextActions(preview),
    emptyWarningMessage:
      warnings.length === 0
        ? "No warnings were produced for this controlled approval preview."
        : null,
    emptyNextActionMessage:
      normalizeNextActions(preview).length === 0
        ? "No next actions were supplied for this approval preview."
        : null,
  };
}

function failedSafeModel(
  reason: ApprovalDecisionUiWarning,
): ApprovalDecisionUiPresentedModel {
  return presentValidPreview(failedSafePreview, [reason]);
}

export function presentApprovalDecisionUiPreview(
  input: unknown = DEFAULT_APPROVAL_DECISION_UI_PREVIEW,
): ApprovalDecisionUiPresentedModel {
  const unsafeKeys = unsafeFieldNames(input);

  if (unsafeKeys.length > 0) {
    return failedSafeModel(
      warning(
        "UNSAFE_RAW_FIELD_NAME",
        "BLOCKER",
        "Unsafe raw-content-like field names are not accepted.",
      ),
    );
  }

  const parsed = ApprovalDecisionUiPreviewSchema.safeParse(input);

  if (!parsed.success) {
    return failedSafeModel(
      warning(
        "APPROVAL_DECISION_SCHEMA_INVALID",
        "BLOCKER",
        "Approval decision preview could not be normalized safely.",
      ),
    );
  }

  const preview = parsed.data;
  const warnings = [
    ...(preview.safeWarnings ?? []),
    ...missingWarnings(preview),
    ...decisionWarnings(preview),
  ];

  return presentValidPreview(preview, warnings);
}
