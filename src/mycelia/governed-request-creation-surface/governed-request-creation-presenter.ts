import {
  GOVERNED_REQUEST_CREATION_SURFACE_NAME,
  GOVERNED_REQUEST_CREATION_SURFACE_PHASE,
  GovernedRequestCreationDraftSchema,
  GovernedRequestCreationSections,
  GovernedRequestCreationSupportedActionTypes,
  type GovernedRequestCreationDisplayValue,
  type GovernedRequestCreationDraft,
  type GovernedRequestCreationPresentedModel,
  type GovernedRequestCreationStatus,
  type GovernedRequestCreationTone,
  type GovernedRequestCreationWarning,
} from "./governed-request-creation-contract";
import {
  DEFAULT_GOVERNED_REQUEST_CREATION_DRAFT,
} from "./governed-request-creation-fixtures";

const supportedActions = new Set<string>(
  GovernedRequestCreationSupportedActionTypes,
);

const unsafeFieldNamePattern =
  /^(rawDocument|documentContent|rawContent|fileBlob|binary|payload)$/i;

const safetyBoundary = [
  "No live database write occurs in this phase.",
  "No API route or route handler is created.",
  "No auth, RBAC or session behavior is active.",
  "No replay execution, workflow execution or tool execution is available.",
  "No export, download or PDF artifact is created.",
  "No external service call is made.",
] as const;

const failedSafeDraft = {
  draftRef: "request_draft_failed_safe",
  tenantRef: null,
  requesterRef: null,
  resourceRef: null,
  requestPurpose: "Failed-safe request draft could not be normalized.",
  actionType: null,
  requestMode: "CONTROLLED_DRAFT",
  riskHint: "UNSAFE",
  expectedPolicyOutcome: "DENY",
  expectedAdmissionOutcome: "DENY",
  approvalExpected: false,
  expectedApprovalRole: null,
  expectedInvestigationSections: [],
  safeSummary: "Request creation preview failed safe before rendering.",
  safeWarnings: [],
  nextSteps: [
    "Remove unsafe request seed fields before future review.",
    "Retry with safe references and safe summaries only.",
  ],
} as const satisfies GovernedRequestCreationDraft;

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
  value: string | boolean | null | undefined,
): GovernedRequestCreationDisplayValue["state"] {
  if (value === null || value === undefined || value === "") {
    return "missing";
  }

  return "present";
}

function displayValue(
  label: string,
  value: string | boolean | null | undefined,
  tone: GovernedRequestCreationTone = "neutral",
): GovernedRequestCreationDisplayValue {
  const state = valueState(value);
  let renderedValue = "Not supplied";

  if (state !== "missing") {
    if (typeof value === "boolean") {
      renderedValue = value ? "Yes" : "No";
    } else if (typeof value === "string") {
      renderedValue = value;
    }
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
  severity: GovernedRequestCreationWarning["severity"],
  safeSummary: string,
): GovernedRequestCreationWarning {
  return { code, severity, safeSummary };
}

function missingWarnings(
  draft: GovernedRequestCreationDraft,
): GovernedRequestCreationWarning[] {
  const warnings: GovernedRequestCreationWarning[] = [];

  if (draft.tenantRef === null || draft.tenantRef === undefined) {
    warnings.push(
      warning("TENANT_REF_MISSING", "BLOCKER", "Tenant reference is required."),
    );
  }

  if (draft.requesterRef === null || draft.requesterRef === undefined) {
    warnings.push(
      warning(
        "REQUESTER_REF_MISSING",
        "WARNING",
        "Requester reference is required before future live creation.",
      ),
    );
  }

  if (draft.resourceRef === null || draft.resourceRef === undefined) {
    warnings.push(
      warning(
        "RESOURCE_REF_MISSING",
        "WARNING",
        "Resource reference is missing from the request seed.",
      ),
    );
  }

  if (draft.requestPurpose === null || draft.requestPurpose === undefined) {
    warnings.push(
      warning(
        "REQUEST_PURPOSE_MISSING",
        "WARNING",
        "Request purpose is missing from the request seed.",
      ),
    );
  }

  return warnings;
}

function actionWarnings(
  draft: GovernedRequestCreationDraft,
): GovernedRequestCreationWarning[] {
  if (draft.actionType === null || draft.actionType === undefined) {
    return [
      warning(
        "ACTION_TYPE_MISSING",
        "WARNING",
        "Action type is missing from the request seed.",
      ),
    ];
  }

  if (!supportedActions.has(draft.actionType)) {
    return [
      warning(
        "UNSUPPORTED_ACTION_TYPE",
        "BLOCKER",
        "Action type is not supported by the Phase 3H controlled surface.",
      ),
    ];
  }

  return [];
}

function riskWarnings(
  draft: GovernedRequestCreationDraft,
): GovernedRequestCreationWarning[] {
  if (draft.riskHint === "HIGH") {
    return [
      warning(
        "HIGH_RISK_HINT",
        "BLOCKER",
        "High risk request hints are blocked in this controlled surface.",
      ),
    ];
  }

  if (draft.riskHint === "UNSAFE") {
    return [
      warning(
        "UNSAFE_RISK_HINT",
        "BLOCKER",
        "Unsafe request hints fail closed before future live creation.",
      ),
    ];
  }

  return [];
}

function statusForWarnings(
  warnings: readonly GovernedRequestCreationWarning[],
): GovernedRequestCreationStatus {
  if (
    warnings.some((item) =>
      item.code === "UNSAFE_RAW_FIELD_NAME" ||
      item.code === "REQUEST_DRAFT_SCHEMA_INVALID"
    )
  ) {
    return "REQUEST_DRAFT_FAILED_SAFE";
  }

  if (warnings.some((item) => item.severity === "BLOCKER")) {
    return "REQUEST_DRAFT_BLOCKED";
  }

  if (warnings.some((item) => item.severity === "WARNING")) {
    return "REQUEST_DRAFT_INCOMPLETE";
  }

  return "REQUEST_DRAFT_READY";
}

function expectedRunPath(draft: GovernedRequestCreationDraft): readonly string[] {
  const approvalStep =
    draft.approvalExpected === true
      ? "Approval gate is expected before completion."
      : "Approval gate is not expected for this seed.";

  return [
    "Request draft is reviewed as a controlled seed descriptor.",
    "Policy/admission expectations are evaluated before any future creation.",
    approvalStep,
    "Audit boundary expectations are prepared for request and admission moments.",
    "Investigation path is expected to render the persisted run history later.",
  ];
}

function normalizeNextActions(
  draft: GovernedRequestCreationDraft,
): readonly string[] {
  if (draft.nextSteps !== undefined && draft.nextSteps.length > 0) {
    return draft.nextSteps;
  }

  return [
    "Prepare a future live creation boundary before allowing persistence writes.",
    "Keep request intake separate from workflow builder scope.",
  ];
}

function presentValidDraft(
  draft: GovernedRequestCreationDraft,
  warnings: readonly GovernedRequestCreationWarning[],
): GovernedRequestCreationPresentedModel {
  const status = statusForWarnings(warnings);

  return {
    phase: GOVERNED_REQUEST_CREATION_SURFACE_PHASE,
    name: GOVERNED_REQUEST_CREATION_SURFACE_NAME,
    status,
    sections: GovernedRequestCreationSections,
    draft,
    requestOverview: [
      displayValue("Draft reference", draft.draftRef),
      displayValue("Tenant reference", draft.tenantRef),
      displayValue("Requester reference", draft.requesterRef),
      displayValue("Resource reference", draft.resourceRef),
      displayValue("Purpose", draft.requestPurpose),
      displayValue("Action type", draft.actionType),
      displayValue("Request mode", draft.requestMode),
    ],
    governancePreview: [
      displayValue("Risk hint", draft.riskHint, riskTone(draft.riskHint)),
      displayValue("Expected policy outcome", draft.expectedPolicyOutcome),
      displayValue("Expected admission outcome", draft.expectedAdmissionOutcome),
      displayValue("Approval expected", draft.approvalExpected),
      displayValue("Expected approval role", draft.expectedApprovalRole),
    ],
    safetyBoundary,
    expectedRunPath: expectedRunPath(draft),
    requestSeedSummary:
      draft.safeSummary ?? "No safe request seed summary was supplied.",
    warnings,
    nextActions: normalizeNextActions(draft),
    emptyWarningMessage:
      warnings.length === 0
        ? "No warnings were produced for this controlled request seed."
        : null,
    emptyNextActionMessage:
      normalizeNextActions(draft).length === 0
        ? "No next actions were supplied for this request seed."
        : null,
  };
}

function riskTone(
  riskHint: GovernedRequestCreationDraft["riskHint"],
): GovernedRequestCreationTone {
  if (riskHint === "LOW") {
    return "success";
  }

  if (riskHint === "MEDIUM" || riskHint === "UNKNOWN") {
    return "warning";
  }

  if (riskHint === "HIGH" || riskHint === "UNSAFE") {
    return "critical";
  }

  return "neutral";
}

function failedSafeModel(
  reason: GovernedRequestCreationWarning,
): GovernedRequestCreationPresentedModel {
  return presentValidDraft(failedSafeDraft, [reason]);
}

export function presentGovernedRequestCreationDraft(
  input: unknown = DEFAULT_GOVERNED_REQUEST_CREATION_DRAFT,
): GovernedRequestCreationPresentedModel {
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

  const parsed = GovernedRequestCreationDraftSchema.safeParse(input);

  if (!parsed.success) {
    return failedSafeModel(
      warning(
        "REQUEST_DRAFT_SCHEMA_INVALID",
        "BLOCKER",
        "Request draft could not be normalized safely.",
      ),
    );
  }

  const draft = parsed.data;
  const warnings = [
    ...(draft.safeWarnings ?? []),
    ...missingWarnings(draft),
    ...actionWarnings(draft),
    ...riskWarnings(draft),
  ];

  return presentValidDraft(draft, warnings);
}
