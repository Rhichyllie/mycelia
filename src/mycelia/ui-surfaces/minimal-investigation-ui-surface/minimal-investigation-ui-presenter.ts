import {
  MINIMAL_INVESTIGATION_UI_NAME,
  MINIMAL_INVESTIGATION_UI_PHASE,
  MINIMAL_INVESTIGATION_UI_STATUS,
  MinimalInvestigationUiRecordKinds,
  type MinimalInvestigationUiDescriptor,
  type MinimalInvestigationUiDisplayValue,
  type MinimalInvestigationUiFinding,
  type MinimalInvestigationUiPresentedModel,
  type MinimalInvestigationUiRecordKind,
  type MinimalInvestigationUiTone,
} from "./minimal-investigation-ui-contract";

const UNSAFE_UI_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|binary|blob|credential|document[_-]?content|file[_-]?blob|password|payload|private[_-]?key|raw[_-]?content|secret|select\s|stack\s|token)/i;

const PILOT_BOUNDARY = [
  "Read-only pilot surface",
  "Persisted read model loader",
  "Repository boundary reads only",
  "No mutation path",
  "No API route",
  "No auth boundary",
  "No replay execution",
  "No file artifact creation",
] as const;

function isUnsafeText(value: string): boolean {
  return UNSAFE_UI_TEXT_PATTERN.test(value);
}

function safeString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed.length > 420 || isUnsafeText(trimmed)) {
    return null;
  }

  return trimmed;
}

function displayValue(
  label: string,
  value: string | boolean | number | null | undefined,
  missingValue: string,
  tone: MinimalInvestigationUiTone = "neutral",
): MinimalInvestigationUiDisplayValue {
  if (typeof value === "boolean") {
    return {
      label,
      value: value ? "Yes" : "No",
      state: "present",
      tone: value ? "success" : "neutral",
    };
  }

  const rendered = safeString(value === undefined || value === null
    ? null
    : String(value));

  if (rendered === null) {
    return {
      label,
      value: missingValue,
      state: "missing",
      tone: "warning",
    };
  }

  return {
    label,
    value: rendered,
    state: "present",
    tone,
  };
}

function statusTone(value: string): MinimalInvestigationUiTone {
  if (
    value === "COMPLETE" ||
    value === "INVESTIGATION_RECONSTRUCTED" ||
    value === "APPROVED" ||
    value === "COHERENT"
  ) {
    return "success";
  }

  if (value === "INCOMPLETE" || value === "INVESTIGATION_INCOMPLETE") {
    return "warning";
  }

  if (
    value === "BLOCKED" ||
    value === "FAILED_SAFE" ||
    value === "INVESTIGATION_BLOCKED" ||
    value === "INVESTIGATION_FAILED_SAFE"
  ) {
    return "critical";
  }

  return "info";
}

function statusValue(label: string, value: string): MinimalInvestigationUiDisplayValue {
  return displayValue(label, value, "Not reconstructed", statusTone(value));
}

function safeList(values: readonly string[] | undefined): string[] {
  return (values ?? [])
    .map((value) => safeString(value))
    .filter((value): value is string => value !== null);
}

function sortedTimeline(
  descriptor: MinimalInvestigationUiDescriptor,
) {
  return (descriptor.stateTimeline.entries ?? [])
    .filter((entry) => entry.sequence !== undefined && entry.sequence !== null)
    .slice()
    .sort((left, right) => {
      const leftSequence = left.sequence ?? 0;
      const rightSequence = right.sequence ?? 0;

      if (leftSequence !== rightSequence) {
        return leftSequence - rightSequence;
      }

      return String(left.state ?? "").localeCompare(String(right.state ?? ""));
    });
}

function synthesizedFindingsFor(
  descriptor: MinimalInvestigationUiDescriptor,
): MinimalInvestigationUiFinding[] {
  const findings: MinimalInvestigationUiFinding[] = [];

  if (safeString(descriptor.overview.governedRunId) === null) {
    findings.push({
      severity: "BLOCKER",
      code: "UI_GOVERNED_RUN_REF_MISSING",
      section: "overview",
      safeSummary: "Governed run reference is missing from the UI descriptor.",
    });
  }

  if ((descriptor.stateTimeline.entries ?? []).length === 0) {
    findings.push({
      severity: "WARNING",
      code: "UI_STATE_TIMELINE_EMPTY",
      section: "stateTimeline",
      safeSummary: "No state timeline entries were supplied.",
    });
  }

  const expectedMoments = new Set(descriptor.auditTrail.expectedMoments ?? []);
  const presentMoments = new Set(descriptor.auditTrail.presentMoments ?? []);
  const missingMoments = [
    ...safeList(descriptor.auditTrail.missingMoments),
    ...Array.from(expectedMoments).filter((moment) => !presentMoments.has(moment)),
  ].filter((moment, index, moments) => moments.indexOf(moment) === index);

  for (const moment of missingMoments) {
    findings.push({
      severity: "WARNING",
      code: `UI_AUDIT_${moment}_MISSING`,
      section: "auditTrail",
      safeSummary: `Expected audit moment ${moment} is not reconstructed.`,
    });
  }

  if (
    descriptor.approval.approvalRequired === true &&
    safeString(descriptor.approval.currentApprovalStatus) === null
  ) {
    findings.push({
      severity: "WARNING",
      code: "UI_APPROVAL_STATUS_MISSING",
      section: "approval",
      safeSummary:
        "Approval is required but approval status is not reconstructed.",
    });
  }

  return findings;
}

function coverageFor(
  descriptor: MinimalInvestigationUiDescriptor,
): readonly {
  readonly recordKind: MinimalInvestigationUiRecordKind;
  readonly status: "found" | "missing";
}[] {
  const found = new Set(descriptor.persistenceCoverage.foundRecords ?? []);
  const missing = new Set(descriptor.persistenceCoverage.missingRecords ?? []);

  return MinimalInvestigationUiRecordKinds.map((recordKind) => ({
    recordKind,
    status: missing.has(recordKind) || !found.has(recordKind)
      ? "missing"
      : "found",
  }));
}

export function presentMinimalInvestigationDescriptor(
  descriptor: MinimalInvestigationUiDescriptor,
): MinimalInvestigationUiPresentedModel {
  const timeline = sortedTimeline(descriptor);
  const warnings = [
    ...safeList(descriptor.stateTimeline.warnings),
  ];
  const presentMoments = safeList(descriptor.auditTrail.presentMoments);
  const expectedMoments = safeList(descriptor.auditTrail.expectedMoments);
  const missingMoments = safeList(descriptor.auditTrail.missingMoments);
  const safeAuditSummaries = safeList(descriptor.auditTrail.safeAuditSummaries);
  const findings = descriptor.findings ?? [];
  const nextActions = safeList(descriptor.nextActions);

  return {
    descriptor,
    phase: MINIMAL_INVESTIGATION_UI_PHASE,
    name: MINIMAL_INVESTIGATION_UI_NAME,
    status: MINIMAL_INVESTIGATION_UI_STATUS,
    pilotBoundary: PILOT_BOUNDARY,
    overview: [
      displayValue("Governed run", descriptor.overview.governedRunId, "Missing run reference"),
      displayValue("Tenant", descriptor.overview.tenantId, "Missing tenant reference"),
      displayValue("Correlation", descriptor.overview.correlationId, "Missing correlation reference"),
      displayValue("Current state", descriptor.overview.currentState, "Not reconstructed"),
      displayValue("Status", descriptor.overview.status, "Not reconstructed"),
      displayValue("Resource", descriptor.overview.resourceRef, "Missing resource reference"),
      displayValue("Requester", descriptor.overview.requesterRef, "Missing requester reference"),
      displayValue("Purpose", descriptor.overview.purpose, "Missing purpose"),
      displayValue("Safe summary", descriptor.overview.safeSummary, "No safe summary supplied"),
    ],
    verdict: statusValue("Reconstruction verdict", descriptor.verdict),
    completeness: statusValue("Completeness", descriptor.completeness),
    stateTimeline: {
      entries: timeline,
      warnings,
      emptyMessage: timeline.length === 0
        ? "No state snapshots are reconstructed in this descriptor."
        : null,
    },
    policyAdmission: [
      displayValue("Risk level", descriptor.policyAdmission.riskLevel, "Not reconstructed"),
      displayValue("Policy outcome", descriptor.policyAdmission.policyOutcome, "Not reconstructed"),
      displayValue("Admission outcome", descriptor.policyAdmission.admissionOutcome, "Not reconstructed"),
      displayValue("Reason code", descriptor.policyAdmission.reasonCode, "Missing reason code"),
      displayValue("Policy ref", descriptor.policyAdmission.policyRef, "Missing policy reference"),
      displayValue("Lifecycle intent", descriptor.policyAdmission.lifecycleIntentHint, "Not reconstructed"),
      displayValue("Safe summary", descriptor.policyAdmission.safeSummary, "No safe summary supplied"),
      displayValue("Explainable", descriptor.policyAdmission.explainable, "Not reconstructed"),
    ],
    approval: [
      displayValue("Approval required", descriptor.approval.approvalRequired, "Not reconstructed"),
      displayValue("Approval status", descriptor.approval.currentApprovalStatus, "Not reconstructed"),
      displayValue("Decision outcome", descriptor.approval.decisionOutcome, "No decision reconstructed"),
      displayValue("Decision reason", descriptor.approval.decisionReason, "Missing decision reason"),
      displayValue("Requested role", descriptor.approval.requestedRole, "Missing requested role"),
      displayValue("Requester", descriptor.approval.requesterRef, "Missing requester reference"),
      displayValue("Approver", descriptor.approval.approverRef, "No approver reconstructed"),
      displayValue("Decision time", descriptor.approval.decidedAt, "No decision time reconstructed"),
      displayValue("Approval completeness", descriptor.approval.approvalCompleteness, "Not reconstructed"),
      displayValue("Lifecycle coherence", descriptor.approval.lifecycleCoherence, "Not reconstructed"),
    ],
    auditTrail: {
      presentMoments,
      expectedMoments,
      missingMoments,
      safeAuditSummaries,
      coverageStatus: statusValue(
        "Audit coverage",
        descriptor.auditTrail.coverageStatus ?? "INCOMPLETE",
      ),
      emptyMessage: presentMoments.length === 0
        ? "No persisted audit moments are reconstructed in this descriptor."
        : null,
    },
    persistenceCoverage: coverageFor(descriptor),
    tenantRunAgreement: displayValue(
      "Tenant/run agreement",
      descriptor.persistenceCoverage.tenantRunAgreement,
      "Not reconstructed",
    ),
    findings,
    synthesizedFindings: synthesizedFindingsFor(descriptor),
    nextActions,
    emptyNextActionMessage: nextActions.length === 0
      ? "No next actions were supplied by the read model descriptor."
      : null,
  };
}
