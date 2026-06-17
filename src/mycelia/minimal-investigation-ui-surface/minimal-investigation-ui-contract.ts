import type {
  PersistedInvestigationCompleteness,
  PersistedInvestigationFindingSeverity,
  PersistedInvestigationReadModelVerdict,
} from "../persisted-investigation-read-model";

export const MINIMAL_INVESTIGATION_UI_PHASE = "3G-A";

export const MINIMAL_INVESTIGATION_UI_NAME =
  "Minimal Investigation UI Surface";

export const MINIMAL_INVESTIGATION_UI_STATUS =
  "live read-only investigation surface";

export const MinimalInvestigationUiSections = [
  "overview",
  "stateTimeline",
  "policyAdmission",
  "approval",
  "auditTrail",
  "persistenceCoverage",
  "findings",
  "nextActions",
] as const;

export type MinimalInvestigationUiSection =
  (typeof MinimalInvestigationUiSections)[number];

export const MinimalInvestigationUiRecordKinds = [
  "GovernedRun",
  "RuntimeStateSnapshot",
  "PolicyDecisionRecord",
  "AdmissionDecisionRecord",
  "ApprovalRequest",
  "AuditRecord",
] as const;

export type MinimalInvestigationUiRecordKind =
  (typeof MinimalInvestigationUiRecordKinds)[number];

export type MinimalInvestigationUiTone =
  | "neutral"
  | "success"
  | "info"
  | "warning"
  | "critical";

export type MinimalInvestigationUiDisplayValue = {
  readonly label: string;
  readonly value: string;
  readonly state: "present" | "missing" | "not_reconstructed" | "suppressed";
  readonly tone: MinimalInvestigationUiTone;
};

export type MinimalInvestigationUiFinding = {
  readonly severity: PersistedInvestigationFindingSeverity;
  readonly code: string;
  readonly section: MinimalInvestigationUiSection;
  readonly safeSummary: string;
};

export type MinimalInvestigationUiTimelineEntry = {
  readonly sequence?: number | null;
  readonly state?: string | null;
  readonly reasonCode?: string | null;
  readonly safeSummary?: string | null;
};

export type MinimalInvestigationUiDescriptor = {
  readonly verdict: PersistedInvestigationReadModelVerdict;
  readonly completeness: PersistedInvestigationCompleteness;
  readonly overview: {
    readonly tenantId?: string | null;
    readonly governedRunId?: string | null;
    readonly correlationId?: string | null;
    readonly currentState?: string | null;
    readonly status?: string | null;
    readonly resourceRef?: string | null;
    readonly requesterRef?: string | null;
    readonly purpose?: string | null;
    readonly safeSummary?: string | null;
  };
  readonly stateTimeline: {
    readonly entries?: readonly MinimalInvestigationUiTimelineEntry[];
    readonly currentState?: string | null;
    readonly warnings?: readonly string[];
  };
  readonly policyAdmission: {
    readonly riskLevel?: string | null;
    readonly policyOutcome?: string | null;
    readonly admissionOutcome?: string | null;
    readonly reasonCode?: string | null;
    readonly policyRef?: string | null;
    readonly lifecycleIntentHint?: string | null;
    readonly safeSummary?: string | null;
    readonly explainable?: boolean | null;
  };
  readonly approval: {
    readonly approvalRequired?: boolean | null;
    readonly currentApprovalStatus?: string | null;
    readonly decisionOutcome?: string | null;
    readonly decisionReason?: string | null;
    readonly requestedRole?: string | null;
    readonly requesterRef?: string | null;
    readonly approverRef?: string | null;
    readonly decidedAt?: string | null;
    readonly approvalCompleteness?: PersistedInvestigationCompleteness | null;
    readonly lifecycleCoherence?: string | null;
  };
  readonly auditTrail: {
    readonly presentMoments?: readonly string[];
    readonly expectedMoments?: readonly string[];
    readonly missingMoments?: readonly string[];
    readonly safeAuditSummaries?: readonly string[];
    readonly coverageStatus?: PersistedInvestigationCompleteness | null;
  };
  readonly persistenceCoverage: {
    readonly foundRecords?: readonly MinimalInvestigationUiRecordKind[];
    readonly missingRecords?: readonly MinimalInvestigationUiRecordKind[];
    readonly tenantRunAgreement?: boolean | null;
  };
  readonly findings?: readonly MinimalInvestigationUiFinding[];
  readonly nextActions?: readonly string[];
};

export type MinimalInvestigationUiPresentedModel = {
  readonly descriptor: MinimalInvestigationUiDescriptor;
  readonly phase: typeof MINIMAL_INVESTIGATION_UI_PHASE;
  readonly name: typeof MINIMAL_INVESTIGATION_UI_NAME;
  readonly status: typeof MINIMAL_INVESTIGATION_UI_STATUS;
  readonly pilotBoundary: readonly string[];
  readonly overview: readonly MinimalInvestigationUiDisplayValue[];
  readonly verdict: MinimalInvestigationUiDisplayValue;
  readonly completeness: MinimalInvestigationUiDisplayValue;
  readonly stateTimeline: {
    readonly entries: readonly MinimalInvestigationUiTimelineEntry[];
    readonly warnings: readonly string[];
    readonly emptyMessage: string | null;
  };
  readonly policyAdmission: readonly MinimalInvestigationUiDisplayValue[];
  readonly approval: readonly MinimalInvestigationUiDisplayValue[];
  readonly auditTrail: {
    readonly presentMoments: readonly string[];
    readonly expectedMoments: readonly string[];
    readonly missingMoments: readonly string[];
    readonly safeAuditSummaries: readonly string[];
    readonly coverageStatus: MinimalInvestigationUiDisplayValue;
    readonly emptyMessage: string | null;
  };
  readonly persistenceCoverage: readonly {
    readonly recordKind: MinimalInvestigationUiRecordKind;
    readonly status: "found" | "missing";
  }[];
  readonly tenantRunAgreement: MinimalInvestigationUiDisplayValue;
  readonly findings: readonly MinimalInvestigationUiFinding[];
  readonly synthesizedFindings: readonly MinimalInvestigationUiFinding[];
  readonly nextActions: readonly string[];
  readonly emptyNextActionMessage: string | null;
};
