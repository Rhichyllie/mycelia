import { z } from "zod";

import {
  evaluateAuditCommitBoundary,
  type AuditCommitMoment,
} from "../audit-commit-boundary";
import {
  evaluateGovernedRunLifecycleTransition,
  type GovernedRunLifecycleDecision,
  type GovernedRunLifecycleIntent,
  type GovernedRunLifecycleState,
} from "../governed-run-lifecycle";
import {
  evaluatePolicyAdmissionV1,
  PolicyAdmissionContextStatusSchema,
  PolicyAdmissionRiskLevelSchema,
  PolicyAdmissionTenantBoundaryStatusSchema,
  type PolicyAdmissionOutcome,
  type PolicyAdmissionV1Decision,
} from "../policy-admission-v1";
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

export const PERSISTED_GOVERNED_FLOW_HARNESS_PHASE = "3C";

export const PERSISTED_GOVERNED_FLOW_HARNESS_NAME =
  "Persisted Governed Flow Harness";

export const PERSISTED_GOVERNED_FLOW_HARNESS_STATUS =
  "controlled local persistence harness only";

export const PersistedGovernedFlowVerdicts = [
  "PERSISTED_COMPLETED",
  "PERSISTED_WAITING_APPROVAL",
  "PERSISTED_REJECTED",
  "PERSISTED_FAILED_SAFE",
] as const;

export type PersistedGovernedFlowVerdict =
  (typeof PersistedGovernedFlowVerdicts)[number];

export const PersistedGovernedFlowVerdictSchema = z.enum(
  PersistedGovernedFlowVerdicts,
);

export const PersistedGovernedFlowDenialCodeSchema = z.enum([
  "PERSISTED_GOVERNED_FLOW_CLIENT_DENIED",
  "PERSISTED_GOVERNED_FLOW_INPUT_INVALID",
  "PERSISTED_GOVERNED_FLOW_POLICY_DENIED",
  "PERSISTED_GOVERNED_FLOW_LIFECYCLE_DENIED",
  "PERSISTED_GOVERNED_FLOW_AUDIT_DENIED",
  "PERSISTED_GOVERNED_FLOW_REPOSITORY_DENIED",
]);

export type PersistedGovernedFlowDenialCode = z.infer<
  typeof PersistedGovernedFlowDenialCodeSchema
>;

const UNSAFE_PERSISTED_FLOW_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|binary|blob|credential|document[_-]?content|file[_-]?blob|password|payload|private[_-]?key|raw|secret|token)/i;

const PersistedFlowSafeRefSchema = z
  .string()
  .min(1)
  .max(120)
  .refine((value) => value.trim() === value)
  .refine((value) => !UNSAFE_PERSISTED_FLOW_TEXT_PATTERN.test(value));

const PersistedFlowSafeSummarySchema = z
  .string()
  .min(1)
  .max(240)
  .refine((value) => value.trim() === value)
  .refine((value) => !UNSAFE_PERSISTED_FLOW_TEXT_PATTERN.test(value));

const PersistedFlowIsoDateTimeSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$/);

export const PersistedGovernedFlowScenarioSchema = z
  .object({
    tenantId: PersistedFlowSafeRefSchema,
    runId: PersistedFlowSafeRefSchema,
    correlationId: PersistedFlowSafeRefSchema,
    requesterRef: PersistedFlowSafeRefSchema,
    resourceRef: PersistedFlowSafeRefSchema,
    action: PersistedFlowSafeRefSchema,
    purpose: PersistedFlowSafeSummarySchema,
    riskLevel: PolicyAdmissionRiskLevelSchema,
    contextStatus: PolicyAdmissionContextStatusSchema,
    tenantBoundaryStatus: PolicyAdmissionTenantBoundaryStatusSchema,
    hasRequiredContext: z.boolean(),
    policyRef: PersistedFlowSafeRefSchema,
    createdAt: PersistedFlowIsoDateTimeSchema,
  })
  .strict();

export type PersistedGovernedFlowScenario = z.infer<
  typeof PersistedGovernedFlowScenarioSchema
>;

export const PersistedGovernedFlowDenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    verdict: z.literal("PERSISTED_FAILED_SAFE"),
    code: PersistedGovernedFlowDenialCodeSchema,
    safeReason: z.string().min(1).max(240),
    safe: z.literal(true),
  })
  .strict();

export type PersistedGovernedFlowDenial = z.infer<
  typeof PersistedGovernedFlowDenialSchema
>;

export type PersistedGovernedFlowDescriptor = {
  readonly tenantId: string;
  readonly runId: string;
  readonly correlationId: string;
  readonly finalState: GovernedRunLifecycleState;
  readonly policyOutcome: PolicyAdmissionOutcome;
  readonly approvalStatus: "PENDING" | "NOT_REQUIRED" | "REJECTED";
  readonly auditMoments: readonly AuditCommitMoment[];
  readonly safeSummary: string;
};

export type PersistedGovernedFlowResult = {
  readonly verdict: PersistedGovernedFlowVerdict;
  readonly governedRun: RuntimeRepositoryGovernedRunRecord;
  readonly stateSnapshots: readonly RuntimeRepositoryStateSnapshotRecord[];
  readonly policyDecisionRecords:
    readonly RuntimeRepositoryPolicyDecisionRecord[];
  readonly admissionDecisionRecords:
    readonly RuntimeRepositoryAdmissionDecisionRecord[];
  readonly approvalRequests: readonly RuntimeRepositoryApprovalRequestRecord[];
  readonly auditRecords: readonly RuntimeRepositoryAuditRecord[];
  readonly policyAdmissionDecision: PolicyAdmissionV1Decision;
  readonly lifecycleDecisions: readonly GovernedRunLifecycleDecision[];
  readonly reconstructedDescriptor: PersistedGovernedFlowDescriptor;
  readonly persistedRecordCounts: {
    readonly governedRuns: number;
    readonly stateSnapshots: number;
    readonly policyDecisionRecords: number;
    readonly admissionDecisionRecords: number;
    readonly approvalRequests: number;
    readonly auditRecords: number;
  };
  readonly safeSummary: string;
};

export type PersistedGovernedFlowHarness = {
  readonly phase: typeof PERSISTED_GOVERNED_FLOW_HARNESS_PHASE;
  readonly name: typeof PERSISTED_GOVERNED_FLOW_HARNESS_NAME;
  readonly status: typeof PERSISTED_GOVERNED_FLOW_HARNESS_STATUS;
  readonly runScenario: (
    scenario: unknown,
  ) => Promise<
    Result<PersistedGovernedFlowResult, PersistedGovernedFlowDenial>
  >;
  readonly boundary: readonly string[];
};

export type PersistedGovernedFlowHarnessInput = {
  readonly repositoryClient: RuntimeRepositoryClient;
};

const HARNESS_BOUNDARY = [
  "repository client is injected",
  "scenario inputs are deterministic",
  "record identifiers and timestamps are supplied by the scenario",
  "repository writes are limited to the six first-slice records",
  "raw document content is rejected",
  "API, UI, auth, replay execution and external integrations are out of scope",
] as const;

function safeReasonFor(code: PersistedGovernedFlowDenialCode): string {
  const reasons: Record<PersistedGovernedFlowDenialCode, string> = {
    PERSISTED_GOVERNED_FLOW_CLIENT_DENIED:
      "The persisted governed flow repository client was not accepted.",
    PERSISTED_GOVERNED_FLOW_INPUT_INVALID:
      "The persisted governed flow scenario is invalid or unsafe.",
    PERSISTED_GOVERNED_FLOW_POLICY_DENIED:
      "Policy/admission v1 could not produce a safe decision.",
    PERSISTED_GOVERNED_FLOW_LIFECYCLE_DENIED:
      "The governed run lifecycle denied a required transition.",
    PERSISTED_GOVERNED_FLOW_AUDIT_DENIED:
      "The audit boundary could not produce a safe descriptor.",
    PERSISTED_GOVERNED_FLOW_REPOSITORY_DENIED:
      "The repository layer denied a persistence operation.",
  };

  return reasons[code];
}

export function failClosedPersistedGovernedFlowDenial(
  code: PersistedGovernedFlowDenialCode =
    "PERSISTED_GOVERNED_FLOW_INPUT_INVALID",
): PersistedGovernedFlowDenial {
  return PersistedGovernedFlowDenialSchema.parse({
    outcome: "DENIED",
    verdict: "PERSISTED_FAILED_SAFE",
    code,
    safeReason: safeReasonFor(code),
    safe: true,
  });
}

function repositoryDenied(): PersistedGovernedFlowDenial {
  return failClosedPersistedGovernedFlowDenial(
    "PERSISTED_GOVERNED_FLOW_REPOSITORY_DENIED",
  );
}

function statusForState(state: GovernedRunLifecycleState): string {
  if (state === "COMPLETED") {
    return "TERMINAL_COMPLETED";
  }

  if (state === "REJECTED") {
    return "TERMINAL_REJECTED";
  }

  if (state === "FAILED") {
    return "TERMINAL_FAILED";
  }

  if (state === "CANCELLED") {
    return "TERMINAL_CANCELLED";
  }

  return "ACTIVE_OR_IN_PROGRESS";
}

function verdictFor(
  decision: PolicyAdmissionV1Decision,
  finalState: GovernedRunLifecycleState,
): PersistedGovernedFlowVerdict {
  if (decision.outcome === "REQUIRE_APPROVAL") {
    return "PERSISTED_WAITING_APPROVAL";
  }

  if (finalState === "REJECTED") {
    return "PERSISTED_REJECTED";
  }

  if (finalState === "COMPLETED") {
    return "PERSISTED_COMPLETED";
  }

  return "PERSISTED_FAILED_SAFE";
}

function recordId(scenario: PersistedGovernedFlowScenario, suffix: string) {
  return `${scenario.runId}_${suffix}`;
}

function stateSnapshot(
  scenario: PersistedGovernedFlowScenario,
  state: GovernedRunLifecycleState,
  sequence: number,
): RuntimeRepositoryStateSnapshotRecord {
  return {
    id: recordId(scenario, `state_${sequence}`),
    tenantId: scenario.tenantId,
    governedRunId: scenario.runId,
    state,
    sequence,
    reasonCode: sequence === 1 ? "STATE_CREATED" : `${state}_RECORDED`,
    safeSummary: "State snapshot persisted.",
    createdAt: scenario.createdAt,
  };
}

function lifecycleDecision(
  currentState: GovernedRunLifecycleState,
  intent: GovernedRunLifecycleIntent,
): Result<GovernedRunLifecycleDecision, PersistedGovernedFlowDenial> {
  const decision = evaluateGovernedRunLifecycleTransition({
    current_state: currentState,
    intent,
  });

  if (!decision.ok) {
    return err(
      failClosedPersistedGovernedFlowDenial(
        "PERSISTED_GOVERNED_FLOW_LIFECYCLE_DENIED",
      ),
    );
  }

  return ok(decision.value);
}

function auditRecordFor(
  scenario: PersistedGovernedFlowScenario,
  moment: "REQUEST_CREATED" | "ADMISSION_DECIDED",
  sequence: number,
): Result<RuntimeRepositoryAuditRecord, PersistedGovernedFlowDenial> {
  const decision = evaluateAuditCommitBoundary({
    tenant_id: scenario.tenantId,
    run_id: scenario.runId,
    correlation_id: scenario.correlationId,
    moment,
    source_module:
      moment === "REQUEST_CREATED"
        ? "runtime-persistence-model"
        : "policy-admission-v1",
    subject_ref: scenario.runId,
    actor_ref: scenario.requesterRef,
    evidence_ref: scenario.policyRef,
    reason_code: moment,
    safe_summary:
      moment === "REQUEST_CREATED"
        ? "Request boundary persisted."
        : "Admission boundary persisted.",
  });

  if (!decision.ok) {
    return err(
      failClosedPersistedGovernedFlowDenial(
        "PERSISTED_GOVERNED_FLOW_AUDIT_DENIED",
      ),
    );
  }

  return ok({
    id: recordId(scenario, `audit_${sequence}`),
    tenantId: scenario.tenantId,
    governedRunId: scenario.runId,
    moment: decision.value.moment,
    requirement: decision.value.requirement,
    recordKindHint: decision.value.audit_record_kind,
    reasonCode: moment,
    safeSummary: decision.value.safe_reason,
    subjectRef: scenario.runId,
    actorRef: scenario.requesterRef,
    evidenceRef: scenario.policyRef,
    createdAt: scenario.createdAt,
  });
}

async function persistWrite(
  operation: Promise<Result<unknown, unknown>>,
): Promise<Result<unknown, PersistedGovernedFlowDenial>> {
  const result = await operation;

  if (!result.ok) {
    return err(repositoryDenied());
  }

  return ok(result.value);
}

async function readBackRecords(
  repository: RuntimeRepositoryLayer,
  scenario: PersistedGovernedFlowScenario,
): Promise<
  Result<
    {
      readonly governedRun: RuntimeRepositoryGovernedRunRecord;
      readonly stateSnapshots: readonly RuntimeRepositoryStateSnapshotRecord[];
      readonly policyDecisionRecords:
        readonly RuntimeRepositoryPolicyDecisionRecord[];
      readonly admissionDecisionRecords:
        readonly RuntimeRepositoryAdmissionDecisionRecord[];
      readonly approvalRequests:
        readonly RuntimeRepositoryApprovalRequestRecord[];
      readonly auditRecords: readonly RuntimeRepositoryAuditRecord[];
    },
    PersistedGovernedFlowDenial
  >
> {
  const findRun = await repository.findGovernedRunByTenantAndCorrelation({
    tenantId: scenario.tenantId,
    correlationId: scenario.correlationId,
  });

  if (!findRun.ok || !findRun.value.found || findRun.value.record === null) {
    return err(repositoryDenied());
  }

  const readInput = {
    tenantId: scenario.tenantId,
    governedRunId: scenario.runId,
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
    governedRun: findRun.value.record,
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

async function runScenarioWithRepository(
  repository: RuntimeRepositoryLayer,
  scenario: PersistedGovernedFlowScenario,
): Promise<Result<PersistedGovernedFlowResult, PersistedGovernedFlowDenial>> {
  const contextDecision = lifecycleDecision("CREATED", "RESOLVE_CONTEXT");

  if (!contextDecision.ok) {
    return contextDecision;
  }

  const policyLifecycleDecision = lifecycleDecision(
    contextDecision.value.next_state,
    "EVALUATE_POLICY",
  );

  if (!policyLifecycleDecision.ok) {
    return policyLifecycleDecision;
  }

  const policyDecision = evaluatePolicyAdmissionV1({
    tenant_id: scenario.tenantId,
    run_id: scenario.runId,
    correlation_id: scenario.correlationId,
    requester_ref: scenario.requesterRef,
    resource_ref: scenario.resourceRef,
    action: scenario.action,
    purpose: scenario.purpose,
    risk_level: scenario.riskLevel,
    context_status: scenario.contextStatus,
    tenant_boundary_status: scenario.tenantBoundaryStatus,
    has_required_context: scenario.hasRequiredContext,
    policy_ref: scenario.policyRef,
  });

  if (!policyDecision.ok) {
    return err(
      failClosedPersistedGovernedFlowDenial(
        "PERSISTED_GOVERNED_FLOW_POLICY_DENIED",
      ),
    );
  }

  const admissionLifecycleDecision = lifecycleDecision(
    policyLifecycleDecision.value.next_state,
    policyDecision.value.lifecycle_intent_hint,
  );

  if (!admissionLifecycleDecision.ok) {
    return admissionLifecycleDecision;
  }

  const lifecycleDecisions = [
    contextDecision.value,
    policyLifecycleDecision.value,
    admissionLifecycleDecision.value,
  ];

  if (policyDecision.value.outcome === "ADMIT") {
    const startDecision = lifecycleDecision(
      admissionLifecycleDecision.value.next_state,
      "START_RUN",
    );

    if (!startDecision.ok) {
      return startDecision;
    }

    const completeDecision = lifecycleDecision(
      startDecision.value.next_state,
      "COMPLETE_RUN",
    );

    if (!completeDecision.ok) {
      return completeDecision;
    }

    lifecycleDecisions.push(startDecision.value, completeDecision.value);
  }

  const finalState = lifecycleDecisions[lifecycleDecisions.length - 1]
    .next_state;
  const verdict = verdictFor(policyDecision.value, finalState);
  const stateSnapshots = [
    stateSnapshot(scenario, "CREATED", 1),
    ...lifecycleDecisions.map((decision, index) =>
      stateSnapshot(scenario, decision.next_state, index + 2)
    ),
  ];
  const governedRun: RuntimeRepositoryGovernedRunRecord = {
    id: scenario.runId,
    tenantId: scenario.tenantId,
    correlationId: scenario.correlationId,
    currentState: finalState,
    status: statusForState(finalState),
    resourceRef: scenario.resourceRef,
    requesterRef: scenario.requesterRef,
    purpose: scenario.purpose,
    createdAt: scenario.createdAt,
    updatedAt: scenario.createdAt,
  };
  const policyRecord: RuntimeRepositoryPolicyDecisionRecord = {
    id: recordId(scenario, "policy_01"),
    tenantId: scenario.tenantId,
    governedRunId: scenario.runId,
    riskLevel: policyDecision.value.risk_level,
    outcome: policyDecision.value.outcome,
    reasonCode: policyDecision.value.reason_code,
    safeSummary: policyDecision.value.safe_reason,
    policyRef: scenario.policyRef,
    createdAt: scenario.createdAt,
  };
  const admissionRecord: RuntimeRepositoryAdmissionDecisionRecord = {
    id: recordId(scenario, "admission_01"),
    tenantId: scenario.tenantId,
    governedRunId: scenario.runId,
    outcome: policyDecision.value.outcome,
    reasonCode: policyDecision.value.reason_code,
    safeSummary: policyDecision.value.safe_reason,
    lifecycleIntentHint: policyDecision.value.lifecycle_intent_hint,
    createdAt: scenario.createdAt,
  };
  const approvalRequest: RuntimeRepositoryApprovalRequestRecord | undefined =
    policyDecision.value.outcome === "REQUIRE_APPROVAL"
      ? {
        id: recordId(scenario, "approval_01"),
        tenantId: scenario.tenantId,
        governedRunId: scenario.runId,
        admissionDecisionRecordId: admissionRecord.id,
        status: "PENDING",
        requestedRole: "compliance_reviewer",
        requesterRef: scenario.requesterRef,
        createdAt: scenario.createdAt,
      }
      : undefined;
  const requestAuditRecord = auditRecordFor(scenario, "REQUEST_CREATED", 1);
  const admissionAuditRecord = auditRecordFor(scenario, "ADMISSION_DECIDED", 2);

  if (!requestAuditRecord.ok || !admissionAuditRecord.ok) {
    return err(
      failClosedPersistedGovernedFlowDenial(
        "PERSISTED_GOVERNED_FLOW_AUDIT_DENIED",
      ),
    );
  }

  const writes = [
    await persistWrite(repository.createGovernedRun(governedRun)),
    ...(await Promise.all(
      stateSnapshots.map((snapshot) =>
        persistWrite(repository.createRuntimeStateSnapshot(snapshot))
      ),
    )),
    await persistWrite(repository.createPolicyDecisionRecord(policyRecord)),
    await persistWrite(
      repository.createAdmissionDecisionRecord(admissionRecord),
    ),
    ...(approvalRequest === undefined
      ? []
      : [await persistWrite(repository.createApprovalRequest(approvalRequest))]),
    await persistWrite(repository.createAuditRecord(requestAuditRecord.value)),
    await persistWrite(repository.createAuditRecord(admissionAuditRecord.value)),
  ];

  if (writes.some((write) => !write.ok)) {
    return err(repositoryDenied());
  }

  const persisted = await readBackRecords(repository, scenario);

  if (!persisted.ok) {
    return persisted;
  }

  return ok({
    verdict,
    governedRun: persisted.value.governedRun,
    stateSnapshots: persisted.value.stateSnapshots,
    policyDecisionRecords: persisted.value.policyDecisionRecords,
    admissionDecisionRecords: persisted.value.admissionDecisionRecords,
    approvalRequests: persisted.value.approvalRequests,
    auditRecords: persisted.value.auditRecords,
    policyAdmissionDecision: policyDecision.value,
    lifecycleDecisions,
    reconstructedDescriptor: {
      tenantId: scenario.tenantId,
      runId: scenario.runId,
      correlationId: scenario.correlationId,
      finalState,
      policyOutcome: policyDecision.value.outcome,
      approvalStatus:
        policyDecision.value.outcome === "REQUIRE_APPROVAL"
          ? "PENDING"
          : policyDecision.value.outcome === "DENY"
            ? "REJECTED"
            : "NOT_REQUIRED",
      auditMoments: persisted.value.auditRecords.map((record) =>
        record.moment as AuditCommitMoment
      ),
      safeSummary:
        "Persisted governed flow reconstructed from repository descriptors.",
    },
    persistedRecordCounts: {
      governedRuns: 1,
      stateSnapshots: persisted.value.stateSnapshots.length,
      policyDecisionRecords: persisted.value.policyDecisionRecords.length,
      admissionDecisionRecords: persisted.value.admissionDecisionRecords.length,
      approvalRequests: persisted.value.approvalRequests.length,
      auditRecords: persisted.value.auditRecords.length,
    },
    safeSummary:
      "Persisted governed flow harness completed with safe descriptors.",
  });
}

export function createPersistedGovernedFlowHarness(
  input: unknown,
): Result<PersistedGovernedFlowHarness, PersistedGovernedFlowDenial> {
  const parsed = z
    .object({
      repositoryClient: z.custom<RuntimeRepositoryClient>(),
    })
    .strict()
    .safeParse(input);

  if (!parsed.success) {
    return err(
      failClosedPersistedGovernedFlowDenial(
        "PERSISTED_GOVERNED_FLOW_CLIENT_DENIED",
      ),
    );
  }

  const repository = createRuntimeRepositoryLayer(parsed.data.repositoryClient);

  if (!repository.ok) {
    return err(
      failClosedPersistedGovernedFlowDenial(
        "PERSISTED_GOVERNED_FLOW_CLIENT_DENIED",
      ),
    );
  }

  return ok({
    phase: PERSISTED_GOVERNED_FLOW_HARNESS_PHASE,
    name: PERSISTED_GOVERNED_FLOW_HARNESS_NAME,
    status: PERSISTED_GOVERNED_FLOW_HARNESS_STATUS,
    runScenario: (scenario) =>
      runPersistedGovernedFlowScenario(repository.value, scenario),
    boundary: HARNESS_BOUNDARY,
  });
}

export async function runPersistedGovernedFlowScenario(
  harnessOrRepository: PersistedGovernedFlowHarness | RuntimeRepositoryLayer,
  scenario: unknown,
): Promise<Result<PersistedGovernedFlowResult, PersistedGovernedFlowDenial>> {
  if ("runScenario" in harnessOrRepository) {
    return harnessOrRepository.runScenario(scenario);
  }

  const parsed = PersistedGovernedFlowScenarioSchema.safeParse(scenario);

  if (!parsed.success) {
    return err(
      failClosedPersistedGovernedFlowDenial(
        "PERSISTED_GOVERNED_FLOW_INPUT_INVALID",
      ),
    );
  }

  return runScenarioWithRepository(harnessOrRepository, parsed.data);
}

export function assertPersistedGovernedFlowResult(
  result: Result<PersistedGovernedFlowResult, PersistedGovernedFlowDenial>,
): PersistedGovernedFlowResult {
  if (!result.ok) {
    throw new Error("Persisted governed flow harness denied.");
  }

  return result.value;
}
