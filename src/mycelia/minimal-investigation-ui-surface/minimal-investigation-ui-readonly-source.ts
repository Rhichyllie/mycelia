import type {
  RuntimeRepositoryAdmissionDecisionRecord,
  RuntimeRepositoryApprovalRequestRecord,
  RuntimeRepositoryAuditRecord,
  RuntimeRepositoryClient,
  RuntimeRepositoryGovernedRunRecord,
  RuntimeRepositoryPolicyDecisionRecord,
  RuntimeRepositoryReadByCorrelationInput,
  RuntimeRepositoryReadByRunInput,
  RuntimeRepositoryStateSnapshotRecord,
} from "../runtime-repository-layer";
import type { PersistedInvestigationReadModelScenario } from "../persisted-investigation-read-model";

export const MINIMAL_INVESTIGATION_REFERENCE_SCENARIO = {
  tenantId: "tenant_01",
  governedRunId: "run_approved_reference",
  correlationId: "run_approved_reference_correlation",
  investigationPurpose: "COMPLIANCE_REVIEW_INVESTIGATION",
  requestedByRef: "investigator_01",
} as const satisfies PersistedInvestigationReadModelScenario;

const timestamp = "2026-01-01T00:00:00.000Z";
const decidedAt = "2026-01-01T00:01:00.000Z";

export type MinimalInvestigationReadonlySourceRecords = {
  readonly governedRuns: readonly RuntimeRepositoryGovernedRunRecord[];
  readonly stateSnapshots: readonly RuntimeRepositoryStateSnapshotRecord[];
  readonly policyDecisionRecords:
    readonly RuntimeRepositoryPolicyDecisionRecord[];
  readonly admissionDecisionRecords:
    readonly RuntimeRepositoryAdmissionDecisionRecord[];
  readonly approvalRequests: readonly RuntimeRepositoryApprovalRequestRecord[];
  readonly auditRecords: readonly RuntimeRepositoryAuditRecord[];
};

export const MINIMAL_INVESTIGATION_REFERENCE_RECORDS = {
  governedRuns: [
    {
      id: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      correlationId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.correlationId,
      currentState: "APPROVED",
      status: "ACTIVE_OR_IN_PROGRESS",
      resourceRef: "resource_compliance_review_01",
      requesterRef: "requester_01",
      purpose: "COMPLIANCE_REVIEW",
      createdAt: timestamp,
      updatedAt: decidedAt,
    },
  ],
  stateSnapshots: [
    {
      id: "run_approved_reference_state_01",
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      state: "CREATED",
      sequence: 1,
      reasonCode: "STATE_CREATED",
      safeSummary: "Run root record was created.",
      createdAt: timestamp,
    },
    {
      id: "run_approved_reference_state_02",
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      state: "CONTEXT_RESOLVED",
      sequence: 2,
      reasonCode: "RESOLVE_CONTEXT_ALLOWED",
      safeSummary: "Context descriptor was resolved.",
      createdAt: timestamp,
    },
    {
      id: "run_approved_reference_state_03",
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      state: "POLICY_EVALUATED",
      sequence: 3,
      reasonCode: "EVALUATE_POLICY_ALLOWED",
      safeSummary: "Policy and admission decision was evaluated.",
      createdAt: timestamp,
    },
    {
      id: "run_approved_reference_state_04",
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      state: "WAITING_APPROVAL",
      sequence: 4,
      reasonCode: "REQUIRE_APPROVAL_ALLOWED",
      safeSummary: "Approval was required for medium risk review.",
      createdAt: timestamp,
    },
    {
      id: "run_approved_reference_state_05",
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      state: "APPROVED",
      sequence: 5,
      reasonCode: "APPROVE_ALLOWED",
      safeSummary: "Approval decision state was persisted.",
      createdAt: decidedAt,
    },
  ],
  policyDecisionRecords: [
    {
      id: "run_approved_reference_policy_01",
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      riskLevel: "MEDIUM",
      outcome: "REQUIRE_APPROVAL",
      reasonCode: "MEDIUM_RISK_REQUIRES_APPROVAL",
      safeSummary:
        "Policy and admission required approval before the run could proceed.",
      policyRef: "policy_01",
      createdAt: timestamp,
    },
  ],
  admissionDecisionRecords: [
    {
      id: "run_approved_reference_admission_01",
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      outcome: "REQUIRE_APPROVAL",
      reasonCode: "MEDIUM_RISK_REQUIRES_APPROVAL",
      safeSummary:
        "Policy and admission required approval before the run could proceed.",
      lifecycleIntentHint: "REQUIRE_APPROVAL",
      createdAt: timestamp,
    },
  ],
  approvalRequests: [
    {
      id: "run_approved_reference_approval_01",
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      admissionDecisionRecordId: "run_approved_reference_admission_01",
      status: "APPROVED",
      requestedRole: "compliance_reviewer",
      requesterRef: "requester_01",
      approverRef: "approver_01",
      decisionOutcome: "APPROVE",
      decisionReasonCode: "APPROVE_DECISION",
      safeDecisionSummary: "Approval decision accepted.",
      createdAt: timestamp,
      decidedAt,
    },
  ],
  auditRecords: [
    {
      id: "run_approved_reference_audit_01",
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      moment: "REQUEST_CREATED",
      requirement: "REQUIRED",
      recordKindHint: "governance",
      reasonCode: "REQUEST_CREATED",
      safeSummary: "Request boundary persisted.",
      subjectRef: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      actorRef: "requester_01",
      evidenceRef: "policy_01",
      createdAt: timestamp,
    },
    {
      id: "run_approved_reference_audit_02",
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      moment: "ADMISSION_DECIDED",
      requirement: "REQUIRED",
      recordKindHint: "decision",
      reasonCode: "ADMISSION_DECIDED",
      safeSummary: "Admission boundary persisted.",
      subjectRef: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      actorRef: "requester_01",
      evidenceRef: "policy_01",
      createdAt: timestamp,
    },
    {
      id: "run_approved_reference_audit_03",
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      moment: "APPROVAL_DECIDED",
      requirement: "REQUIRED",
      recordKindHint: "approval",
      reasonCode: "APPROVE_DECISION",
      safeSummary: "Approval decision boundary persisted.",
      subjectRef: "run_approved_reference_approval_01",
      actorRef: "approver_01",
      evidenceRef: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      createdAt: decidedAt,
    },
  ],
} as const satisfies MinimalInvestigationReadonlySourceRecords;

function cloneRecord<T extends object>(record: T): T {
  return { ...record };
}

function denyReadOnlyWrite() {
  throw new Error("Read-only investigation source denied mutation.");
}

function byRun<T extends { readonly tenantId: string; readonly governedRunId: string }>(
  records: readonly T[],
  input: RuntimeRepositoryReadByRunInput,
): T[] {
  return records
    .filter(
      (record) =>
        record.tenantId === input.tenantId &&
        record.governedRunId === input.governedRunId,
    )
    .map(cloneRecord);
}

export function createMinimalInvestigationReadonlyRepositoryClient(
  records: MinimalInvestigationReadonlySourceRecords =
    MINIMAL_INVESTIGATION_REFERENCE_RECORDS,
): RuntimeRepositoryClient {
  return {
    createGovernedRun: denyReadOnlyWrite,
    createRuntimeStateSnapshot: denyReadOnlyWrite,
    createPolicyDecisionRecord: denyReadOnlyWrite,
    createAdmissionDecisionRecord: denyReadOnlyWrite,
    createApprovalRequest: denyReadOnlyWrite,
    updateApprovalRequestDecision: denyReadOnlyWrite,
    createAuditRecord: denyReadOnlyWrite,
    findGovernedRunByTenantAndCorrelation(
      input: RuntimeRepositoryReadByCorrelationInput,
    ) {
      const record = records.governedRuns.find(
        (candidate) =>
          candidate.tenantId === input.tenantId &&
          candidate.correlationId === input.correlationId,
      );

      return record === undefined ? null : cloneRecord(record);
    },
    listRuntimeStateSnapshotsByRun(input: RuntimeRepositoryReadByRunInput) {
      return byRun(records.stateSnapshots, input).sort(
        (left, right) => left.sequence - right.sequence,
      );
    },
    listPolicyDecisionRecordsByRun(input: RuntimeRepositoryReadByRunInput) {
      return byRun(records.policyDecisionRecords, input);
    },
    listAdmissionDecisionRecordsByRun(input: RuntimeRepositoryReadByRunInput) {
      return byRun(records.admissionDecisionRecords, input);
    },
    listApprovalRequestsByRun(input: RuntimeRepositoryReadByRunInput) {
      return byRun(records.approvalRequests, input);
    },
    listAuditRecordsByRun(input: RuntimeRepositoryReadByRunInput) {
      return byRun(records.auditRecords, input);
    },
  };
}
