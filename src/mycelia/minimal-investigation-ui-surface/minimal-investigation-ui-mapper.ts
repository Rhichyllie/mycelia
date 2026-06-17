import type {
  PersistedInvestigationReadModelResult,
} from "../persisted-investigation-read-model";
import {
  MinimalInvestigationUiRecordKinds,
  type MinimalInvestigationUiDescriptor,
  type MinimalInvestigationUiRecordKind,
  type MinimalInvestigationUiSection,
} from "./minimal-investigation-ui-contract";

const recordKindSet = new Set<string>(MinimalInvestigationUiRecordKinds);
const sectionSet = new Set<string>([
  "overview",
  "stateTimeline",
  "policyAdmission",
  "approval",
  "auditTrail",
  "persistenceCoverage",
  "findings",
  "nextActions",
]);

function recordKinds(
  records: readonly string[],
): readonly MinimalInvestigationUiRecordKind[] {
  return records.filter((record): record is MinimalInvestigationUiRecordKind =>
    recordKindSet.has(record)
  );
}

function sectionName(section: string): MinimalInvestigationUiSection {
  return sectionSet.has(section)
    ? section as MinimalInvestigationUiSection
    : "findings";
}

export function mapPersistedInvestigationReadModelToUiDescriptor(
  readModel: PersistedInvestigationReadModelResult,
): MinimalInvestigationUiDescriptor {
  return {
    verdict: readModel.verdict,
    completeness: readModel.completeness,
    overview: {
      tenantId: readModel.overview.tenantId,
      governedRunId: readModel.overview.governedRunId,
      correlationId: readModel.overview.correlationId,
      currentState: readModel.overview.currentState,
      status: readModel.overview.status,
      resourceRef: readModel.overview.resourceRef,
      requesterRef: readModel.overview.requesterRef,
      purpose: readModel.overview.purpose,
      safeSummary: readModel.overview.safeSummary,
    },
    stateTimeline: {
      entries: readModel.stateTimeline.entries.map((entry) => ({
        sequence: entry.sequence,
        state: entry.state,
        reasonCode: entry.reasonCode,
        safeSummary: entry.safeSummary,
      })),
      currentState: readModel.stateTimeline.currentState,
      warnings: [
        ...readModel.stateTimeline.missingSequenceWarnings,
        ...readModel.stateTimeline.duplicateSequenceWarnings,
        ...readModel.stateTimeline.unknownStateWarnings,
      ],
    },
    policyAdmission: {
      riskLevel: readModel.policyAdmission.riskLevel,
      policyOutcome: readModel.policyAdmission.policyOutcome,
      admissionOutcome: readModel.policyAdmission.admissionOutcome,
      reasonCode: readModel.policyAdmission.reasonCode,
      policyRef: readModel.policyAdmission.policyRef,
      lifecycleIntentHint: readModel.policyAdmission.lifecycleIntentHint,
      safeSummary: readModel.policyAdmission.safeSummary,
      explainable: readModel.policyAdmission.explainable,
    },
    approval: {
      approvalRequired: readModel.approval.approvalRequired,
      currentApprovalStatus: readModel.approval.currentApprovalStatus,
      decisionOutcome: readModel.approval.decisionOutcome,
      decisionReason: readModel.approval.decisionReason,
      requestedRole: readModel.approval.requestedRole,
      requesterRef: readModel.approval.requesterRef,
      approverRef: readModel.approval.approverRef,
      decidedAt: readModel.approval.decidedAt,
      approvalCompleteness: readModel.approval.approvalCompleteness,
      lifecycleCoherence: readModel.approval.lifecycleCoherence,
    },
    auditTrail: {
      presentMoments: readModel.auditTrail.presentMoments,
      expectedMoments: readModel.auditTrail.expectedMoments,
      missingMoments: readModel.auditTrail.missingMoments,
      safeAuditSummaries: readModel.auditTrail.safeAuditSummaries,
      coverageStatus: readModel.auditTrail.coverageStatus,
    },
    persistenceCoverage: {
      foundRecords: recordKinds(readModel.persistenceCoverage.foundRecords),
      missingRecords: recordKinds(readModel.persistenceCoverage.missingRecords),
      tenantRunAgreement: readModel.persistenceCoverage.tenantRunAgreement,
    },
    findings: readModel.findings.map((finding) => ({
      severity: finding.severity,
      code: finding.code,
      section: sectionName(finding.section),
      safeSummary: finding.safeSummary,
    })),
    nextActions: readModel.nextActions,
  };
}
