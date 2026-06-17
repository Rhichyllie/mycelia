import { z } from "zod";

import {
  GovernedRunLifecycleStates,
} from "../governed-run-lifecycle";
import {
  createRuntimeRepositoryLayer,
  type RuntimeRepositoryAdmissionDecisionRecord,
  type RuntimeRepositoryApprovalRequestRecord,
  type RuntimeRepositoryAuditRecord,
  type RuntimeRepositoryClient,
  type RuntimeRepositoryGovernedRunRecord,
  type RuntimeRepositoryLayer,
  type RuntimeRepositoryPolicyDecisionRecord,
  type RuntimeRepositoryStateSnapshotRecord,
} from "../runtime-repository-layer";
import { err, ok, type Result } from "../shared-kernel";

export const PERSISTED_INVESTIGATION_READ_MODEL_PHASE = "3E";

export const PERSISTED_INVESTIGATION_READ_MODEL_NAME =
  "Persisted Investigation Read Model";

export const PERSISTED_INVESTIGATION_READ_MODEL_STATUS =
  "repository-backed investigation read model only";

export const PersistedInvestigationReadModelVerdicts = [
  "INVESTIGATION_RECONSTRUCTED",
  "INVESTIGATION_INCOMPLETE",
  "INVESTIGATION_BLOCKED",
  "INVESTIGATION_FAILED_SAFE",
] as const;

export type PersistedInvestigationReadModelVerdict =
  (typeof PersistedInvestigationReadModelVerdicts)[number];

export const PersistedInvestigationCompletenessValues = [
  "COMPLETE",
  "INCOMPLETE",
  "BLOCKED",
  "FAILED_SAFE",
] as const;

export type PersistedInvestigationCompleteness =
  (typeof PersistedInvestigationCompletenessValues)[number];

export const PersistedInvestigationFindingSeverities = [
  "INFO",
  "WARNING",
  "BLOCKER",
] as const;

export type PersistedInvestigationFindingSeverity =
  (typeof PersistedInvestigationFindingSeverities)[number];

export const PersistedInvestigationSections = [
  "overview",
  "stateTimeline",
  "policyAdmission",
  "approval",
  "auditTrail",
  "persistenceCoverage",
  "findings",
  "nextActions",
] as const;

export type PersistedInvestigationSection =
  (typeof PersistedInvestigationSections)[number];

export const PersistedInvestigationReadModelVerdictSchema = z.enum(
  PersistedInvestigationReadModelVerdicts,
);

export const PersistedInvestigationCompletenessSchema = z.enum(
  PersistedInvestigationCompletenessValues,
);

export const PersistedInvestigationFindingSeveritySchema = z.enum(
  PersistedInvestigationFindingSeverities,
);

export const PersistedInvestigationSectionSchema = z.enum(
  PersistedInvestigationSections,
);

export const PersistedInvestigationDenialCodeSchema = z.enum([
  "PERSISTED_INVESTIGATION_CLIENT_DENIED",
  "PERSISTED_INVESTIGATION_INPUT_INVALID",
  "PERSISTED_INVESTIGATION_REPOSITORY_DENIED",
]);

export type PersistedInvestigationDenialCode = z.infer<
  typeof PersistedInvestigationDenialCodeSchema
>;

const UNSAFE_PERSISTED_INVESTIGATION_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|binary|blob|credential|document[_-]?content|file[_-]?blob|password|payload|private[_-]?key|raw|secret|token)/i;

const PersistedInvestigationSafeRefSchema = z
  .string()
  .min(1)
  .max(160)
  .refine((value) => value.trim() === value)
  .refine((value) => !UNSAFE_PERSISTED_INVESTIGATION_TEXT_PATTERN.test(value));

const PersistedInvestigationSafeSummarySchema = z
  .string()
  .min(1)
  .max(360)
  .refine((value) => value.trim() === value)
  .refine((value) => !UNSAFE_PERSISTED_INVESTIGATION_TEXT_PATTERN.test(value));

export const PersistedInvestigationReadModelScenarioSchema = z
  .object({
    tenantId: PersistedInvestigationSafeRefSchema,
    governedRunId: PersistedInvestigationSafeRefSchema,
    correlationId: PersistedInvestigationSafeRefSchema,
    investigationPurpose: PersistedInvestigationSafeSummarySchema,
    requestedByRef: PersistedInvestigationSafeRefSchema,
  })
  .strict();

export type PersistedInvestigationReadModelScenario = z.infer<
  typeof PersistedInvestigationReadModelScenarioSchema
>;

export const PersistedInvestigationDenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    verdict: z.literal("INVESTIGATION_FAILED_SAFE"),
    code: PersistedInvestigationDenialCodeSchema,
    safeReason: z.string().min(1).max(240),
    safe: z.literal(true),
  })
  .strict();

export type PersistedInvestigationDenial = z.infer<
  typeof PersistedInvestigationDenialSchema
>;

export type PersistedInvestigationFinding = {
  readonly severity: PersistedInvestigationFindingSeverity;
  readonly code: string;
  readonly section: PersistedInvestigationSection;
  readonly safeSummary: string;
};

export type PersistedInvestigationTimelineEntry = {
  readonly sequence: number;
  readonly state: string;
  readonly reasonCode: string;
  readonly safeSummary: string;
};

export type PersistedInvestigationReadModelResult = {
  readonly verdict: PersistedInvestigationReadModelVerdict;
  readonly completeness: PersistedInvestigationCompleteness;
  readonly sections: readonly PersistedInvestigationSection[];
  readonly overview: {
    readonly tenantId: string;
    readonly governedRunId: string;
    readonly correlationId: string;
    readonly currentState: string;
    readonly status: string;
    readonly resourceRef: string;
    readonly requesterRef: string;
    readonly purpose: string;
    readonly safeSummary: string;
    readonly reconstructionVerdict: PersistedInvestigationReadModelVerdict;
  };
  readonly stateTimeline: {
    readonly entries: readonly PersistedInvestigationTimelineEntry[];
    readonly initialState: string | null;
    readonly currentState: string;
    readonly transitions: readonly string[];
    readonly missingSequenceWarnings: readonly string[];
    readonly duplicateSequenceWarnings: readonly string[];
    readonly unknownStateWarnings: readonly string[];
  };
  readonly policyAdmission: {
    readonly riskLevel: string | null;
    readonly policyOutcome: string | null;
    readonly admissionOutcome: string | null;
    readonly reasonCode: string | null;
    readonly policyRef: string | null;
    readonly lifecycleIntentHint: string | null;
    readonly safeSummary: string;
    readonly explainable: boolean;
  };
  readonly approval: {
    readonly approvalRequired: boolean;
    readonly currentApprovalStatus: string | null;
    readonly decisionOutcome: string | null;
    readonly decisionReason: string | null;
    readonly requestedRole: string | null;
    readonly requesterRef: string | null;
    readonly approverRef: string | null;
    readonly decidedAt: string | null;
    readonly approvalCompleteness: PersistedInvestigationCompleteness;
    readonly lifecycleCoherence: "COHERENT" | "INCOHERENT" | "NOT_APPLICABLE";
  };
  readonly auditTrail: {
    readonly presentMoments: readonly string[];
    readonly expectedMoments: readonly string[];
    readonly missingMoments: readonly string[];
    readonly safeAuditSummaries: readonly string[];
    readonly coverageStatus: PersistedInvestigationCompleteness;
  };
  readonly persistenceCoverage: {
    readonly foundRecords: readonly string[];
    readonly missingRecords: readonly string[];
    readonly recordCounts: {
      readonly governedRuns: number;
      readonly runtimeStateSnapshots: number;
      readonly policyDecisionRecords: number;
      readonly admissionDecisionRecords: number;
      readonly approvalRequests: number;
      readonly auditRecords: number;
    };
    readonly tenantRunAgreement: boolean;
  };
  readonly findings: readonly PersistedInvestigationFinding[];
  readonly nextActions: readonly string[];
  readonly recordsReadBack: boolean;
  readonly safeSummary: string;
};

export type PersistedInvestigationReadModelResultEnvelope = Result<
  PersistedInvestigationReadModelResult,
  PersistedInvestigationDenial
>;

export type PersistedInvestigationReadModel = {
  readonly phase: typeof PERSISTED_INVESTIGATION_READ_MODEL_PHASE;
  readonly name: typeof PERSISTED_INVESTIGATION_READ_MODEL_NAME;
  readonly status: typeof PERSISTED_INVESTIGATION_READ_MODEL_STATUS;
  readonly reconstruct: (
    scenario: unknown,
  ) => Promise<PersistedInvestigationReadModelResultEnvelope>;
  readonly boundary: readonly string[];
};

const READ_MODEL_BOUNDARY = [
  "repository client is injected",
  "records are read through the runtime repository boundary",
  "no database client is created by this module",
  "no UI or API route is created",
  "no replay execution is performed",
  "missing records become findings instead of hidden inference",
  "raw document content is rejected",
] as const;

type PersistedRecords = {
  readonly governedRun: RuntimeRepositoryGovernedRunRecord | null;
  readonly stateSnapshots: readonly RuntimeRepositoryStateSnapshotRecord[];
  readonly policyDecisionRecords:
    readonly RuntimeRepositoryPolicyDecisionRecord[];
  readonly admissionDecisionRecords:
    readonly RuntimeRepositoryAdmissionDecisionRecord[];
  readonly approvalRequests: readonly RuntimeRepositoryApprovalRequestRecord[];
  readonly auditRecords: readonly RuntimeRepositoryAuditRecord[];
};

function safeReasonFor(code: PersistedInvestigationDenialCode): string {
  const reasons: Record<PersistedInvestigationDenialCode, string> = {
    PERSISTED_INVESTIGATION_CLIENT_DENIED:
      "The persisted investigation repository client was not accepted.",
    PERSISTED_INVESTIGATION_INPUT_INVALID:
      "The persisted investigation input is invalid or unsafe.",
    PERSISTED_INVESTIGATION_REPOSITORY_DENIED:
      "The repository layer denied investigation reconstruction.",
  };

  return reasons[code];
}

export function failClosedPersistedInvestigationDenial(
  code: PersistedInvestigationDenialCode =
    "PERSISTED_INVESTIGATION_INPUT_INVALID",
): PersistedInvestigationDenial {
  return PersistedInvestigationDenialSchema.parse({
    outcome: "DENIED",
    verdict: "INVESTIGATION_FAILED_SAFE",
    code,
    safeReason: safeReasonFor(code),
    safe: true,
  });
}

function repositoryDenied(): PersistedInvestigationDenial {
  return failClosedPersistedInvestigationDenial(
    "PERSISTED_INVESTIGATION_REPOSITORY_DENIED",
  );
}

function finding(
  severity: PersistedInvestigationFindingSeverity,
  code: string,
  section: PersistedInvestigationSection,
  safeSummary: string,
): PersistedInvestigationFinding {
  return {
    severity,
    code,
    section,
    safeSummary,
  };
}

async function readRecords(
  repository: RuntimeRepositoryLayer,
  scenario: PersistedInvestigationReadModelScenario,
): Promise<Result<PersistedRecords, PersistedInvestigationDenial>> {
  const governedRun = await repository.findGovernedRunByTenantAndCorrelation({
    tenantId: scenario.tenantId,
    correlationId: scenario.correlationId,
  });

  if (!governedRun.ok) {
    return err(repositoryDenied());
  }

  if (!governedRun.value.found || governedRun.value.record === null) {
    return ok({
      governedRun: null,
      stateSnapshots: [],
      policyDecisionRecords: [],
      admissionDecisionRecords: [],
      approvalRequests: [],
      auditRecords: [],
    });
  }

  if (governedRun.value.record.id !== scenario.governedRunId) {
    return ok({
      governedRun: governedRun.value.record,
      stateSnapshots: [],
      policyDecisionRecords: [],
      admissionDecisionRecords: [],
      approvalRequests: [],
      auditRecords: [],
    });
  }

  const readInput = {
    tenantId: scenario.tenantId,
    governedRunId: scenario.governedRunId,
  };
  const stateSnapshots = await repository.listRuntimeStateSnapshotsByRun(
    readInput,
  );
  const policyDecisionRecords =
    await repository.listPolicyDecisionRecordsByRun(readInput);
  const admissionDecisionRecords =
    await repository.listAdmissionDecisionRecordsByRun(readInput);
  const approvalRequests = await repository.listApprovalRequestsByRun(
    readInput,
  );
  const auditRecords = await repository.listAuditRecordsByRun(readInput);

  if (
    !stateSnapshots.ok ||
    !policyDecisionRecords.ok ||
    !admissionDecisionRecords.ok ||
    !approvalRequests.ok ||
    !auditRecords.ok
  ) {
    return err(repositoryDenied());
  }

  return ok({
    governedRun: governedRun.value.record,
    stateSnapshots: stateSnapshots.value
      .records as readonly RuntimeRepositoryStateSnapshotRecord[],
    policyDecisionRecords: policyDecisionRecords.value
      .records as readonly RuntimeRepositoryPolicyDecisionRecord[],
    admissionDecisionRecords: admissionDecisionRecords.value
      .records as readonly RuntimeRepositoryAdmissionDecisionRecord[],
    approvalRequests: approvalRequests.value
      .records as readonly RuntimeRepositoryApprovalRequestRecord[],
    auditRecords: auditRecords.value.records as readonly RuntimeRepositoryAuditRecord[],
  });
}

function sortedStates(
  states: readonly RuntimeRepositoryStateSnapshotRecord[],
): RuntimeRepositoryStateSnapshotRecord[] {
  return states.slice().sort((left, right) => {
    if (left.sequence !== right.sequence) {
      return left.sequence - right.sequence;
    }

    return left.id.localeCompare(right.id);
  });
}

function stateTimeline(
  records: PersistedRecords,
  fallbackState: string,
) {
  const entries = sortedStates(records.stateSnapshots);
  const sequenceCounts = new Map<number, number>();

  for (const entry of entries) {
    sequenceCounts.set(entry.sequence, (sequenceCounts.get(entry.sequence) ?? 0) + 1);
  }

  const maxSequence = entries.reduce(
    (max, entry) => entry.sequence > max ? entry.sequence : max,
    0,
  );
  const missingSequenceWarnings = Array.from(
    { length: maxSequence },
    (_unused, index) => index + 1,
  )
    .filter((sequence) => !sequenceCounts.has(sequence))
    .map((sequence) => `Missing state sequence ${sequence}.`);
  const duplicateSequenceWarnings = Array.from(sequenceCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([sequence]) => `Duplicate state sequence ${sequence}.`);
  const knownStates = new Set<string>(GovernedRunLifecycleStates);
  const unknownStateWarnings = entries
    .filter((entry) => !knownStates.has(entry.state))
    .map((entry) => `Unknown state ${entry.state}.`);
  const timelineEntries = entries.map((entry) => ({
    sequence: entry.sequence,
    state: entry.state,
    reasonCode: entry.reasonCode,
    safeSummary: entry.safeSummary,
  }));
  const transitions = entries.slice(1).map((entry, index) =>
    `${entries[index].state}->${entry.state}`
  );
  const currentState = entries.length === 0
    ? fallbackState
    : entries[entries.length - 1].state;

  return {
    entries: timelineEntries,
    initialState: entries[0]?.state ?? null,
    currentState,
    transitions,
    missingSequenceWarnings,
    duplicateSequenceWarnings,
    unknownStateWarnings,
  };
}

function latestPolicy(
  records: PersistedRecords,
): RuntimeRepositoryPolicyDecisionRecord | undefined {
  return records.policyDecisionRecords[records.policyDecisionRecords.length - 1];
}

function latestAdmission(
  records: PersistedRecords,
): RuntimeRepositoryAdmissionDecisionRecord | undefined {
  return records.admissionDecisionRecords[
    records.admissionDecisionRecords.length - 1
  ];
}

function latestApproval(
  records: PersistedRecords,
): RuntimeRepositoryApprovalRequestRecord | undefined {
  return records.approvalRequests[records.approvalRequests.length - 1];
}

function approvalRequired(records: PersistedRecords): boolean {
  const policy = latestPolicy(records);
  const admission = latestAdmission(records);

  return (
    records.approvalRequests.length > 0 ||
    policy?.outcome === "REQUIRE_APPROVAL" ||
    admission?.outcome === "REQUIRE_APPROVAL"
  );
}

function expectedApprovalState(status: string | undefined): string | undefined {
  if (status === "PENDING") {
    return "WAITING_APPROVAL";
  }

  if (status === "APPROVED") {
    return "APPROVED";
  }

  if (status === "REJECTED") {
    return "REJECTED";
  }

  if (status === "TIMED_OUT") {
    return "FAILED";
  }

  if (status === "CANCELLED") {
    return "CANCELLED";
  }

  return undefined;
}

function expectedAuditMoments(records: PersistedRecords): string[] {
  const moments = ["REQUEST_CREATED"];

  if (records.admissionDecisionRecords.length > 0) {
    moments.push("ADMISSION_DECIDED");
  }

  const approval = latestApproval(records);

  if (
    approval !== undefined &&
    approval.status !== "PENDING" &&
    approval.decisionOutcome !== undefined
  ) {
    moments.push("APPROVAL_DECIDED");
  }

  return moments;
}

function presentAuditMoments(records: PersistedRecords): string[] {
  return records.auditRecords
    .map((record) => record.moment)
    .filter((moment, index, moments) => moments.indexOf(moment) === index);
}

function missingMoments(records: PersistedRecords): string[] {
  const present = new Set(presentAuditMoments(records));

  return expectedAuditMoments(records).filter((moment) => !present.has(moment));
}

function foundRecordNames(records: PersistedRecords): string[] {
  const found = ["GovernedRun"];

  if (records.stateSnapshots.length > 0) {
    found.push("RuntimeStateSnapshot");
  }

  if (records.policyDecisionRecords.length > 0) {
    found.push("PolicyDecisionRecord");
  }

  if (records.admissionDecisionRecords.length > 0) {
    found.push("AdmissionDecisionRecord");
  }

  if (records.approvalRequests.length > 0) {
    found.push("ApprovalRequest");
  }

  if (records.auditRecords.length > 0) {
    found.push("AuditRecord");
  }

  return found;
}

function missingRecordNames(records: PersistedRecords): string[] {
  const found = new Set(foundRecordNames(records));

  return [
    "GovernedRun",
    "RuntimeStateSnapshot",
    "PolicyDecisionRecord",
    "AdmissionDecisionRecord",
    "ApprovalRequest",
    "AuditRecord",
  ].filter((record) => !found.has(record));
}

function tenantRunAgreement(
  scenario: PersistedInvestigationReadModelScenario,
  records: PersistedRecords,
): boolean {
  const runLinked = [
    ...records.stateSnapshots,
    ...records.policyDecisionRecords,
    ...records.admissionDecisionRecords,
    ...records.approvalRequests,
    ...records.auditRecords,
  ];

  return runLinked.every(
    (record) =>
      record.tenantId === scenario.tenantId &&
      record.governedRunId === scenario.governedRunId,
  );
}

function createFindings(
  scenario: PersistedInvestigationReadModelScenario,
  records: PersistedRecords,
  currentState: string,
): PersistedInvestigationFinding[] {
  const findings: PersistedInvestigationFinding[] = [];

  if (records.governedRun === null) {
    findings.push(
      finding(
        "BLOCKER",
        "GOVERNED_RUN_MISSING",
        "overview",
        "Governed run root record was not found for the supplied scope.",
      ),
    );
    return findings;
  }

  if (records.governedRun.id !== scenario.governedRunId) {
    findings.push(
      finding(
        "BLOCKER",
        "GOVERNED_RUN_SCOPE_MISMATCH",
        "persistenceCoverage",
        "Governed run root did not match the requested run scope.",
      ),
    );
  }

  if (!tenantRunAgreement(scenario, records)) {
    findings.push(
      finding(
        "BLOCKER",
        "TENANT_RUN_SCOPE_MISMATCH",
        "persistenceCoverage",
        "Run-linked records do not agree on tenant and run scope.",
      ),
    );
  }

  if (records.stateSnapshots.length === 0) {
    findings.push(
      finding(
        "WARNING",
        "STATE_TIMELINE_MISSING",
        "stateTimeline",
        "No runtime state snapshots were found.",
      ),
    );
  }

  const timeline = stateTimeline(records, records.governedRun.currentState);

  for (const warning of [
    ...timeline.missingSequenceWarnings,
    ...timeline.duplicateSequenceWarnings,
    ...timeline.unknownStateWarnings,
  ]) {
    findings.push(
      finding("WARNING", "STATE_TIMELINE_WARNING", "stateTimeline", warning),
    );
  }

  if (
    records.policyDecisionRecords.length === 0 &&
    records.admissionDecisionRecords.length === 0
  ) {
    findings.push(
      finding(
        "BLOCKER",
        "POLICY_AND_ADMISSION_MISSING",
        "policyAdmission",
        "Policy and admission records are missing.",
      ),
    );
  } else if (records.policyDecisionRecords.length === 0) {
    findings.push(
      finding(
        "WARNING",
        "POLICY_DECISION_MISSING",
        "policyAdmission",
        "Admission exists but policy decision record is missing.",
      ),
    );
  } else if (records.admissionDecisionRecords.length === 0) {
    findings.push(
      finding(
        "WARNING",
        "ADMISSION_DECISION_MISSING",
        "policyAdmission",
        "Policy exists but admission decision record is missing.",
      ),
    );
  }

  if (approvalRequired(records) && records.approvalRequests.length === 0) {
    findings.push(
      finding(
        "WARNING",
        "APPROVAL_RECORD_MISSING",
        "approval",
        "Approval was required but no approval request record was found.",
      ),
    );
  }

  const approval = latestApproval(records);
  const expectedState = expectedApprovalState(approval?.status);

  if (expectedState !== undefined && expectedState !== currentState) {
    findings.push(
      finding(
        "WARNING",
        "APPROVAL_LIFECYCLE_INCOHERENT",
        "approval",
        "Approval status and latest lifecycle state do not align.",
      ),
    );
  }

  for (const moment of missingMoments(records)) {
    findings.push(
      finding(
        "WARNING",
        `AUDIT_${moment}_MISSING`,
        "auditTrail",
        `Expected audit moment ${moment} is missing.`,
      ),
    );
  }

  return findings;
}

function completenessForFindings(
  findings: readonly PersistedInvestigationFinding[],
): PersistedInvestigationCompleteness {
  if (findings.some((candidate) => candidate.severity === "BLOCKER")) {
    return "BLOCKED";
  }

  if (findings.some((candidate) => candidate.severity === "WARNING")) {
    return "INCOMPLETE";
  }

  return "COMPLETE";
}

function verdictForCompleteness(
  completeness: PersistedInvestigationCompleteness,
): PersistedInvestigationReadModelVerdict {
  if (completeness === "COMPLETE") {
    return "INVESTIGATION_RECONSTRUCTED";
  }

  if (completeness === "INCOMPLETE") {
    return "INVESTIGATION_INCOMPLETE";
  }

  if (completeness === "BLOCKED") {
    return "INVESTIGATION_BLOCKED";
  }

  return "INVESTIGATION_FAILED_SAFE";
}

function nextActionsFor(
  findings: readonly PersistedInvestigationFinding[],
  approval: RuntimeRepositoryApprovalRequestRecord | undefined,
): string[] {
  if (findings.some((candidate) => candidate.severity === "BLOCKER")) {
    return ["Escalate incomplete record set before investigation review."];
  }

  const actions = new Set<string>();

  if (approval !== undefined && approval.status !== "PENDING") {
    actions.add("Review approval decision.");
  }

  if (findings.some((candidate) => candidate.code.includes("AUDIT"))) {
    actions.add("Inspect missing audit coverage.");
  }

  if (findings.some((candidate) => candidate.code.includes("STATE"))) {
    actions.add("Confirm lifecycle state timeline.");
  }

  if (actions.size === 0) {
    actions.add("Investigation read model is ready for later UI review.");
  }

  return Array.from(actions);
}

function approvalCompletenessFor(
  records: PersistedRecords,
): PersistedInvestigationCompleteness {
  if (!approvalRequired(records)) {
    return "COMPLETE";
  }

  if (records.approvalRequests.length === 0) {
    return "INCOMPLETE";
  }

  return "COMPLETE";
}

function lifecycleCoherenceFor(
  approval: RuntimeRepositoryApprovalRequestRecord | undefined,
  currentState: string,
): "COHERENT" | "INCOHERENT" | "NOT_APPLICABLE" {
  const expectedState = expectedApprovalState(approval?.status);

  if (expectedState === undefined) {
    return "NOT_APPLICABLE";
  }

  return expectedState === currentState ? "COHERENT" : "INCOHERENT";
}

function blockedModel(
  scenario: PersistedInvestigationReadModelScenario,
  records: PersistedRecords,
): PersistedInvestigationReadModelResult {
  const findings = createFindings(scenario, records, "UNKNOWN");
  const completeness = completenessForFindings(findings);
  const verdict = verdictForCompleteness(completeness);

  return {
    verdict,
    completeness,
    sections: PersistedInvestigationSections,
    overview: {
      tenantId: scenario.tenantId,
      governedRunId: scenario.governedRunId,
      correlationId: scenario.correlationId,
      currentState: "UNKNOWN",
      status: "BLOCKED",
      resourceRef: "unavailable",
      requesterRef: "unavailable",
      purpose: scenario.investigationPurpose,
      safeSummary: "Investigation reconstruction is blocked.",
      reconstructionVerdict: verdict,
    },
    stateTimeline: {
      entries: [],
      initialState: null,
      currentState: "UNKNOWN",
      transitions: [],
      missingSequenceWarnings: [],
      duplicateSequenceWarnings: [],
      unknownStateWarnings: [],
    },
    policyAdmission: {
      riskLevel: null,
      policyOutcome: null,
      admissionOutcome: null,
      reasonCode: null,
      policyRef: null,
      lifecycleIntentHint: null,
      safeSummary: "Policy and admission cannot be reconstructed.",
      explainable: false,
    },
    approval: {
      approvalRequired: false,
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
      foundRecords: records.governedRun === null ? [] : ["GovernedRun"],
      missingRecords: missingRecordNames(records),
      recordCounts: {
        governedRuns: records.governedRun === null ? 0 : 1,
        runtimeStateSnapshots: 0,
        policyDecisionRecords: 0,
        admissionDecisionRecords: 0,
        approvalRequests: 0,
        auditRecords: 0,
      },
      tenantRunAgreement: false,
    },
    findings,
    nextActions: nextActionsFor(findings, undefined),
    recordsReadBack: true,
    safeSummary: "Persisted investigation reconstruction blocked safely.",
  };
}

function reconstructFromRecords(
  scenario: PersistedInvestigationReadModelScenario,
  records: PersistedRecords,
): PersistedInvestigationReadModelResult {
  if (records.governedRun === null || records.governedRun.id !== scenario.governedRunId) {
    return blockedModel(scenario, records);
  }

  const timeline = stateTimeline(records, records.governedRun.currentState);
  const policy = latestPolicy(records);
  const admission = latestAdmission(records);
  const approval = latestApproval(records);
  const findings = createFindings(scenario, records, timeline.currentState);
  const completeness = completenessForFindings(findings);
  const verdict = verdictForCompleteness(completeness);
  const presentMoments = presentAuditMoments(records);
  const expectedMoments = expectedAuditMoments(records);
  const missingAuditMoments = missingMoments(records);
  const auditCoverageStatus =
    missingAuditMoments.length === 0 ? "COMPLETE" : "INCOMPLETE";

  return {
    verdict,
    completeness,
    sections: PersistedInvestigationSections,
    overview: {
      tenantId: records.governedRun.tenantId,
      governedRunId: records.governedRun.id,
      correlationId: records.governedRun.correlationId,
      currentState: timeline.currentState,
      status: records.governedRun.status,
      resourceRef: records.governedRun.resourceRef,
      requesterRef: records.governedRun.requesterRef,
      purpose: records.governedRun.purpose,
      safeSummary: "Persisted run history reconstructed for investigation.",
      reconstructionVerdict: verdict,
    },
    stateTimeline: timeline,
    policyAdmission: {
      riskLevel: policy?.riskLevel ?? null,
      policyOutcome: policy?.outcome ?? null,
      admissionOutcome: admission?.outcome ?? null,
      reasonCode: admission?.reasonCode ?? policy?.reasonCode ?? null,
      policyRef: policy?.policyRef ?? null,
      lifecycleIntentHint: admission?.lifecycleIntentHint ?? null,
      safeSummary:
        policy !== undefined || admission !== undefined
          ? "Policy and admission descriptors were reconstructed."
          : "Policy and admission descriptors are missing.",
      explainable: policy !== undefined && admission !== undefined,
    },
    approval: {
      approvalRequired: approvalRequired(records),
      currentApprovalStatus: approval?.status ?? null,
      decisionOutcome: approval?.decisionOutcome ?? null,
      decisionReason: approval?.decisionReasonCode ?? null,
      requestedRole: approval?.requestedRole ?? null,
      requesterRef: approval?.requesterRef ?? null,
      approverRef: approval?.approverRef ?? null,
      decidedAt: approval?.decidedAt ?? null,
      approvalCompleteness: approvalCompletenessFor(records),
      lifecycleCoherence: lifecycleCoherenceFor(approval, timeline.currentState),
    },
    auditTrail: {
      presentMoments,
      expectedMoments,
      missingMoments: missingAuditMoments,
      safeAuditSummaries: records.auditRecords.map((record) =>
        record.safeSummary
      ),
      coverageStatus: auditCoverageStatus,
    },
    persistenceCoverage: {
      foundRecords: foundRecordNames(records),
      missingRecords: missingRecordNames(records),
      recordCounts: {
        governedRuns: 1,
        runtimeStateSnapshots: records.stateSnapshots.length,
        policyDecisionRecords: records.policyDecisionRecords.length,
        admissionDecisionRecords: records.admissionDecisionRecords.length,
        approvalRequests: records.approvalRequests.length,
        auditRecords: records.auditRecords.length,
      },
      tenantRunAgreement: tenantRunAgreement(scenario, records),
    },
    findings,
    nextActions: nextActionsFor(findings, approval),
    recordsReadBack: true,
    safeSummary:
      "Persisted investigation read model reconstructed from repository records.",
  };
}

async function reconstructWithRepository(
  repository: RuntimeRepositoryLayer,
  scenario: PersistedInvestigationReadModelScenario,
): Promise<PersistedInvestigationReadModelResultEnvelope> {
  const records = await readRecords(repository, scenario);

  if (!records.ok) {
    return err(records.error);
  }

  return ok(reconstructFromRecords(scenario, records.value));
}

export function createPersistedInvestigationReadModel(
  input: unknown,
): Result<PersistedInvestigationReadModel, PersistedInvestigationDenial> {
  const parsed = z
    .object({
      repositoryClient: z.custom<RuntimeRepositoryClient>(),
    })
    .strict()
    .safeParse(input);

  if (!parsed.success) {
    return err(
      failClosedPersistedInvestigationDenial(
        "PERSISTED_INVESTIGATION_CLIENT_DENIED",
      ),
    );
  }

  const repository = createRuntimeRepositoryLayer(parsed.data.repositoryClient);

  if (!repository.ok) {
    return err(
      failClosedPersistedInvestigationDenial(
        "PERSISTED_INVESTIGATION_CLIENT_DENIED",
      ),
    );
  }

  return ok({
    phase: PERSISTED_INVESTIGATION_READ_MODEL_PHASE,
    name: PERSISTED_INVESTIGATION_READ_MODEL_NAME,
    status: PERSISTED_INVESTIGATION_READ_MODEL_STATUS,
    reconstruct: (scenario) =>
      reconstructPersistedInvestigationReadModel(repository.value, scenario),
    boundary: READ_MODEL_BOUNDARY,
  });
}

export async function reconstructPersistedInvestigationReadModel(
  modelOrRepository: PersistedInvestigationReadModel | RuntimeRepositoryLayer,
  scenario: unknown,
): Promise<PersistedInvestigationReadModelResultEnvelope> {
  if ("reconstruct" in modelOrRepository) {
    return modelOrRepository.reconstruct(scenario);
  }

  const parsed = PersistedInvestigationReadModelScenarioSchema.safeParse(
    scenario,
  );

  if (!parsed.success) {
    return err(
      failClosedPersistedInvestigationDenial(
        "PERSISTED_INVESTIGATION_INPUT_INVALID",
      ),
    );
  }

  return reconstructWithRepository(modelOrRepository, parsed.data);
}

export function assertPersistedInvestigationReadModelResult(
  result: PersistedInvestigationReadModelResultEnvelope,
): PersistedInvestigationReadModelResult {
  if (!result.ok) {
    throw new Error("Persisted investigation read model denied.");
  }

  return result.value;
}
