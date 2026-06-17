import { z } from "zod";

import {
  evaluateApprovalGateV1,
  ApprovalGateDecisionOutcomeSchema,
  type ApprovalGateV1Decision,
} from "../approval-gate-v1";
import {
  evaluateAuditCommitBoundary,
  type AuditCommitMoment,
} from "../audit-commit-boundary";
import {
  evaluateGovernedRunLifecycleTransition,
  type GovernedRunLifecycleDecision,
  type GovernedRunLifecycleState,
} from "../governed-run-lifecycle";
import {
  createRuntimeRepositoryLayer,
  type RuntimeRepositoryApprovalRequestRecord,
  type RuntimeRepositoryAuditRecord,
  type RuntimeRepositoryClient,
  type RuntimeRepositoryLayer,
  type RuntimeRepositoryStateSnapshotRecord,
} from "../runtime-repository-layer";
import { err, ok, type Result } from "../shared-kernel";

export const APPROVAL_AUDIT_RUNTIME_SLICE_PHASE = "3D";

export const APPROVAL_AUDIT_RUNTIME_SLICE_NAME =
  "Approval + Audit Runtime Slice";

export const APPROVAL_AUDIT_RUNTIME_SLICE_STATUS =
  "narrow persisted approval decision and audit trail slice";

export const ApprovalAuditRuntimeVerdicts = [
  "APPROVAL_AUDIT_APPROVED",
  "APPROVAL_AUDIT_REJECTED",
  "APPROVAL_AUDIT_TIMED_OUT",
  "APPROVAL_AUDIT_CANCELLED",
  "APPROVAL_AUDIT_FAILED_SAFE",
] as const;

export type ApprovalAuditRuntimeVerdict =
  (typeof ApprovalAuditRuntimeVerdicts)[number];

export const ApprovalAuditRuntimeVerdictSchema = z.enum(
  ApprovalAuditRuntimeVerdicts,
);

export const ApprovalAuditRuntimeDenialCodeSchema = z.enum([
  "APPROVAL_AUDIT_CLIENT_DENIED",
  "APPROVAL_AUDIT_INPUT_INVALID",
  "APPROVAL_AUDIT_APPROVAL_NOT_FOUND",
  "APPROVAL_AUDIT_APPROVAL_NOT_PENDING",
  "APPROVAL_AUDIT_GATE_DENIED",
  "APPROVAL_AUDIT_LIFECYCLE_DENIED",
  "APPROVAL_AUDIT_AUDIT_BOUNDARY_DENIED",
  "APPROVAL_AUDIT_REPOSITORY_DENIED",
]);

export type ApprovalAuditRuntimeDenialCode = z.infer<
  typeof ApprovalAuditRuntimeDenialCodeSchema
>;

const UNSAFE_APPROVAL_AUDIT_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|binary|blob|credential|document[_-]?content|file[_-]?blob|password|payload|private[_-]?key|raw|secret|token)/i;

const ApprovalAuditSafeRefSchema = z
  .string()
  .min(1)
  .max(120)
  .refine((value) => value.trim() === value)
  .refine((value) => !UNSAFE_APPROVAL_AUDIT_TEXT_PATTERN.test(value));

const ApprovalAuditSafeSummarySchema = z
  .string()
  .min(1)
  .max(240)
  .refine((value) => value.trim() === value)
  .refine((value) => !UNSAFE_APPROVAL_AUDIT_TEXT_PATTERN.test(value));

const ApprovalAuditReasonCodeSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Z][A-Z0-9_]*$/);

const ApprovalAuditIsoDateTimeSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$/);

export const ApprovalAuditRuntimeScenarioSchema = z
  .object({
    tenantId: ApprovalAuditSafeRefSchema,
    governedRunId: ApprovalAuditSafeRefSchema,
    correlationId: ApprovalAuditSafeRefSchema,
    approvalRequestId: ApprovalAuditSafeRefSchema,
    decisionOutcome: ApprovalGateDecisionOutcomeSchema,
    decisionReasonCode: ApprovalAuditReasonCodeSchema,
    safeDecisionSummary: ApprovalAuditSafeSummarySchema,
    approverRef: ApprovalAuditSafeRefSchema,
    decidedAt: ApprovalAuditIsoDateTimeSchema,
  })
  .strict();

export type ApprovalAuditRuntimeScenario = z.infer<
  typeof ApprovalAuditRuntimeScenarioSchema
>;

export const ApprovalAuditRuntimeDenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    verdict: z.literal("APPROVAL_AUDIT_FAILED_SAFE"),
    code: ApprovalAuditRuntimeDenialCodeSchema,
    safeReason: z.string().min(1).max(240),
    safe: z.literal(true),
  })
  .strict();

export type ApprovalAuditRuntimeDenial = z.infer<
  typeof ApprovalAuditRuntimeDenialSchema
>;

export type ApprovalAuditRuntimeDescriptor = {
  readonly tenantId: string;
  readonly governedRunId: string;
  readonly correlationId: string;
  readonly approvalRequestId: string;
  readonly approvalStatus: string;
  readonly lifecycleState: GovernedRunLifecycleState;
  readonly auditMoments: readonly AuditCommitMoment[];
  readonly safeSummary: string;
};

export type ApprovalAuditRuntimeDecision = {
  readonly verdict: ApprovalAuditRuntimeVerdict;
  readonly approvalRequest: RuntimeRepositoryApprovalRequestRecord;
  readonly stateSnapshots: readonly RuntimeRepositoryStateSnapshotRecord[];
  readonly auditRecords: readonly RuntimeRepositoryAuditRecord[];
  readonly approvalGateDecision: ApprovalGateV1Decision;
  readonly lifecycleDecision: GovernedRunLifecycleDecision;
  readonly reconstructedDescriptor: ApprovalAuditRuntimeDescriptor;
  readonly recordsReadBack: {
    readonly approvalRequests: number;
    readonly stateSnapshots: number;
    readonly auditRecords: number;
  };
  readonly safeSummary: string;
};

export type ApprovalAuditRuntimeResult = Result<
  ApprovalAuditRuntimeDecision,
  ApprovalAuditRuntimeDenial
>;

export type ApprovalAuditRuntimeSlice = {
  readonly phase: typeof APPROVAL_AUDIT_RUNTIME_SLICE_PHASE;
  readonly name: typeof APPROVAL_AUDIT_RUNTIME_SLICE_NAME;
  readonly status: typeof APPROVAL_AUDIT_RUNTIME_SLICE_STATUS;
  readonly decideApprovalRequest: (
    scenario: unknown,
  ) => Promise<ApprovalAuditRuntimeResult>;
  readonly boundary: readonly string[];
};

export type ApprovalAuditRuntimeSliceInput = {
  readonly repositoryClient: RuntimeRepositoryClient;
};

const APPROVAL_AUDIT_RUNTIME_BOUNDARY = [
  "repository client is injected",
  "approval decisions start from an existing pending ApprovalRequest",
  "ApprovalRequest decision fields are updated through the repository boundary",
  "RuntimeStateSnapshot records the resulting lifecycle state",
  "AuditRecord is limited to APPROVAL_DECIDED",
  "raw document content is rejected",
  "API, UI, auth, replay execution, event emission and external integrations are out of scope",
] as const;

function safeReasonFor(code: ApprovalAuditRuntimeDenialCode): string {
  const reasons: Record<ApprovalAuditRuntimeDenialCode, string> = {
    APPROVAL_AUDIT_CLIENT_DENIED:
      "The approval audit runtime repository client was not accepted.",
    APPROVAL_AUDIT_INPUT_INVALID:
      "The approval audit runtime scenario is invalid or unsafe.",
    APPROVAL_AUDIT_APPROVAL_NOT_FOUND:
      "A pending approval request was not available for the supplied scope.",
    APPROVAL_AUDIT_APPROVAL_NOT_PENDING:
      "Only pending approval requests may be decided.",
    APPROVAL_AUDIT_GATE_DENIED:
      "Approval gate v1 denied the supplied approval decision.",
    APPROVAL_AUDIT_LIFECYCLE_DENIED:
      "The governed run lifecycle denied the approval transition.",
    APPROVAL_AUDIT_AUDIT_BOUNDARY_DENIED:
      "The audit commit boundary denied the approval decision moment.",
    APPROVAL_AUDIT_REPOSITORY_DENIED:
      "The repository layer denied a persistence operation.",
  };

  return reasons[code];
}

export function failClosedApprovalAuditRuntimeDenial(
  code: ApprovalAuditRuntimeDenialCode = "APPROVAL_AUDIT_INPUT_INVALID",
): ApprovalAuditRuntimeDenial {
  return ApprovalAuditRuntimeDenialSchema.parse({
    outcome: "DENIED",
    verdict: "APPROVAL_AUDIT_FAILED_SAFE",
    code,
    safeReason: safeReasonFor(code),
    safe: true,
  });
}

function repositoryDenied(): ApprovalAuditRuntimeDenial {
  return failClosedApprovalAuditRuntimeDenial(
    "APPROVAL_AUDIT_REPOSITORY_DENIED",
  );
}

function verdictForState(
  state: GovernedRunLifecycleState,
): ApprovalAuditRuntimeVerdict {
  if (state === "APPROVED") {
    return "APPROVAL_AUDIT_APPROVED";
  }

  if (state === "REJECTED") {
    return "APPROVAL_AUDIT_REJECTED";
  }

  if (state === "FAILED") {
    return "APPROVAL_AUDIT_TIMED_OUT";
  }

  if (state === "CANCELLED") {
    return "APPROVAL_AUDIT_CANCELLED";
  }

  return "APPROVAL_AUDIT_FAILED_SAFE";
}

function approvalRecordForScenario(
  approvalRequests: readonly RuntimeRepositoryApprovalRequestRecord[],
  scenario: ApprovalAuditRuntimeScenario,
): RuntimeRepositoryApprovalRequestRecord | undefined {
  return approvalRequests.find(
    (record) =>
      record.id === scenario.approvalRequestId &&
      record.tenantId === scenario.tenantId &&
      record.governedRunId === scenario.governedRunId,
  );
}

function nextSequence(
  snapshots: readonly RuntimeRepositoryStateSnapshotRecord[],
): number {
  return snapshots.reduce(
    (highest, snapshot) =>
      snapshot.sequence > highest ? snapshot.sequence : highest,
    0,
  ) + 1;
}

function stateSnapshotForDecision(
  scenario: ApprovalAuditRuntimeScenario,
  lifecycleDecision: GovernedRunLifecycleDecision,
  sequence: number,
): RuntimeRepositoryStateSnapshotRecord {
  return {
    id: `${scenario.approvalRequestId}_state_${sequence}`,
    tenantId: scenario.tenantId,
    governedRunId: scenario.governedRunId,
    state: lifecycleDecision.next_state,
    sequence,
    reasonCode: lifecycleDecision.reason_code,
    safeSummary: "Approval decision lifecycle state persisted.",
    createdAt: scenario.decidedAt,
  };
}

function auditRecordForDecision(
  scenario: ApprovalAuditRuntimeScenario,
  gateDecision: ApprovalGateV1Decision,
): Result<RuntimeRepositoryAuditRecord, ApprovalAuditRuntimeDenial> {
  const decision = evaluateAuditCommitBoundary({
    tenant_id: scenario.tenantId,
    run_id: scenario.governedRunId,
    correlation_id: scenario.correlationId,
    moment: "APPROVAL_DECIDED",
    source_module: "future-approval-gate",
    subject_ref: scenario.approvalRequestId,
    actor_ref: scenario.approverRef,
    evidence_ref: scenario.governedRunId,
    reason_code: gateDecision.reason_code,
    safe_summary: "Approval decision boundary persisted.",
  });

  if (!decision.ok) {
    return err(
      failClosedApprovalAuditRuntimeDenial(
        "APPROVAL_AUDIT_AUDIT_BOUNDARY_DENIED",
      ),
    );
  }

  return ok({
    id: `${scenario.approvalRequestId}_audit_approval_decided`,
    tenantId: scenario.tenantId,
    governedRunId: scenario.governedRunId,
    moment: decision.value.moment,
    requirement: decision.value.requirement,
    recordKindHint: decision.value.audit_record_kind,
    reasonCode: gateDecision.reason_code,
    safeSummary: decision.value.safe_reason,
    subjectRef: scenario.approvalRequestId,
    actorRef: scenario.approverRef,
    evidenceRef: scenario.governedRunId,
    createdAt: scenario.decidedAt,
  });
}

async function readRunDescriptors(
  repository: RuntimeRepositoryLayer,
  scenario: ApprovalAuditRuntimeScenario,
): Promise<
  Result<
    {
      readonly approvalRequests:
        readonly RuntimeRepositoryApprovalRequestRecord[];
      readonly stateSnapshots:
        readonly RuntimeRepositoryStateSnapshotRecord[];
      readonly auditRecords: readonly RuntimeRepositoryAuditRecord[];
    },
    ApprovalAuditRuntimeDenial
  >
> {
  const readInput = {
    tenantId: scenario.tenantId,
    governedRunId: scenario.governedRunId,
  };
  const approvalRequests = await repository.listApprovalRequestsByRun(
    readInput,
  );
  const stateSnapshots = await repository.listRuntimeStateSnapshotsByRun(
    readInput,
  );
  const auditRecords = await repository.listAuditRecordsByRun(readInput);

  if (!approvalRequests.ok || !stateSnapshots.ok || !auditRecords.ok) {
    return err(repositoryDenied());
  }

  return ok({
    approvalRequests: approvalRequests.value
      .records as readonly RuntimeRepositoryApprovalRequestRecord[],
    stateSnapshots: stateSnapshots.value
      .records as readonly RuntimeRepositoryStateSnapshotRecord[],
    auditRecords: auditRecords.value.records as readonly RuntimeRepositoryAuditRecord[],
  });
}

async function decideWithRepository(
  repository: RuntimeRepositoryLayer,
  scenario: ApprovalAuditRuntimeScenario,
): Promise<ApprovalAuditRuntimeResult> {
  const existing = await readRunDescriptors(repository, scenario);

  if (!existing.ok) {
    return existing;
  }

  const pendingApproval = approvalRecordForScenario(
    existing.value.approvalRequests,
    scenario,
  );

  if (pendingApproval === undefined) {
    return err(
      failClosedApprovalAuditRuntimeDenial(
        "APPROVAL_AUDIT_APPROVAL_NOT_FOUND",
      ),
    );
  }

  if (pendingApproval.status !== "PENDING") {
    return err(
      failClosedApprovalAuditRuntimeDenial(
        "APPROVAL_AUDIT_APPROVAL_NOT_PENDING",
      ),
    );
  }

  const gateDecision = evaluateApprovalGateV1({
    tenant_id: scenario.tenantId,
    run_id: scenario.governedRunId,
    correlation_id: scenario.correlationId,
    approval_request_id: scenario.approvalRequestId,
    requested_role: pendingApproval.requestedRole,
    requester_ref: pendingApproval.requesterRef,
    approver_ref: scenario.approverRef,
    current_status: pendingApproval.status,
    decision_outcome: scenario.decisionOutcome,
    decision_reason_code: scenario.decisionReasonCode,
    safe_decision_summary: scenario.safeDecisionSummary,
    policy_admission_outcome: "REQUIRE_APPROVAL",
    risk_level: "MEDIUM",
  });

  if (!gateDecision.ok) {
    return err(
      failClosedApprovalAuditRuntimeDenial("APPROVAL_AUDIT_GATE_DENIED"),
    );
  }

  const lifecycleDecision = evaluateGovernedRunLifecycleTransition({
    current_state: "WAITING_APPROVAL",
    intent: gateDecision.value.lifecycle_intent_hint,
  });

  if (!lifecycleDecision.ok) {
    return err(
      failClosedApprovalAuditRuntimeDenial(
        "APPROVAL_AUDIT_LIFECYCLE_DENIED",
      ),
    );
  }

  const updatedApproval = await repository.updateApprovalRequestDecision({
    tenantId: scenario.tenantId,
    governedRunId: scenario.governedRunId,
    approvalRequestId: scenario.approvalRequestId,
    nextStatus: gateDecision.value.next_status,
    approverRef: scenario.approverRef,
    decisionOutcome: scenario.decisionOutcome,
    decisionReasonCode: gateDecision.value.reason_code,
    safeDecisionSummary: scenario.safeDecisionSummary,
    decidedAt: scenario.decidedAt,
  });

  if (!updatedApproval.ok) {
    return err(repositoryDenied());
  }

  const stateSnapshot = stateSnapshotForDecision(
    scenario,
    lifecycleDecision.value,
    nextSequence(existing.value.stateSnapshots),
  );
  const stateWrite = await repository.createRuntimeStateSnapshot(stateSnapshot);

  if (!stateWrite.ok) {
    return err(repositoryDenied());
  }

  const auditRecord = auditRecordForDecision(scenario, gateDecision.value);

  if (!auditRecord.ok) {
    return auditRecord;
  }

  const auditWrite = await repository.createAuditRecord(auditRecord.value);

  if (!auditWrite.ok) {
    return err(repositoryDenied());
  }

  const persisted = await readRunDescriptors(repository, scenario);

  if (!persisted.ok) {
    return persisted;
  }

  const approvalRequest = approvalRecordForScenario(
    persisted.value.approvalRequests,
    scenario,
  );

  if (approvalRequest === undefined) {
    return err(repositoryDenied());
  }

  return ok({
    verdict: verdictForState(lifecycleDecision.value.next_state),
    approvalRequest,
    stateSnapshots: persisted.value.stateSnapshots,
    auditRecords: persisted.value.auditRecords,
    approvalGateDecision: gateDecision.value,
    lifecycleDecision: lifecycleDecision.value,
    reconstructedDescriptor: {
      tenantId: scenario.tenantId,
      governedRunId: scenario.governedRunId,
      correlationId: scenario.correlationId,
      approvalRequestId: scenario.approvalRequestId,
      approvalStatus: approvalRequest.status,
      lifecycleState: lifecycleDecision.value.next_state,
      auditMoments: persisted.value.auditRecords.map((record) =>
        record.moment as AuditCommitMoment
      ),
      safeSummary:
        "Approval audit runtime slice reconstructed from repository descriptors.",
    },
    recordsReadBack: {
      approvalRequests: persisted.value.approvalRequests.length,
      stateSnapshots: persisted.value.stateSnapshots.length,
      auditRecords: persisted.value.auditRecords.length,
    },
    safeSummary:
      "Approval decision, lifecycle snapshot and audit record were persisted and read back.",
  });
}

export function createApprovalAuditRuntimeSlice(
  input: unknown,
): Result<ApprovalAuditRuntimeSlice, ApprovalAuditRuntimeDenial> {
  const parsed = z
    .object({
      repositoryClient: z.custom<RuntimeRepositoryClient>(),
    })
    .strict()
    .safeParse(input);

  if (!parsed.success) {
    return err(
      failClosedApprovalAuditRuntimeDenial("APPROVAL_AUDIT_CLIENT_DENIED"),
    );
  }

  const repository = createRuntimeRepositoryLayer(parsed.data.repositoryClient);

  if (!repository.ok) {
    return err(
      failClosedApprovalAuditRuntimeDenial("APPROVAL_AUDIT_CLIENT_DENIED"),
    );
  }

  return ok({
    phase: APPROVAL_AUDIT_RUNTIME_SLICE_PHASE,
    name: APPROVAL_AUDIT_RUNTIME_SLICE_NAME,
    status: APPROVAL_AUDIT_RUNTIME_SLICE_STATUS,
    decideApprovalRequest: (scenario) =>
      decideApprovalRequest(repository.value, scenario),
    boundary: APPROVAL_AUDIT_RUNTIME_BOUNDARY,
  });
}

export async function decideApprovalRequest(
  sliceOrRepository: ApprovalAuditRuntimeSlice | RuntimeRepositoryLayer,
  scenario: unknown,
): Promise<ApprovalAuditRuntimeResult> {
  if ("decideApprovalRequest" in sliceOrRepository) {
    return sliceOrRepository.decideApprovalRequest(scenario);
  }

  const parsed = ApprovalAuditRuntimeScenarioSchema.safeParse(scenario);

  if (!parsed.success) {
    return err(
      failClosedApprovalAuditRuntimeDenial("APPROVAL_AUDIT_INPUT_INVALID"),
    );
  }

  return decideWithRepository(sliceOrRepository, parsed.data);
}

export function assertApprovalAuditRuntimeResult(
  result: ApprovalAuditRuntimeResult,
): ApprovalAuditRuntimeDecision {
  if (!result.ok) {
    throw new Error("Approval audit runtime slice denied.");
  }

  return result.value;
}
