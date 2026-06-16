import { z } from "zod";

import {
  evaluateApprovalGateV1,
  type ApprovalGateV1Decision,
} from "../approval-gate-v1";
import {
  evaluateAuditCommitBoundary,
  type AuditCommitBoundaryDecision,
  type AuditCommitMoment,
  type AuditCommitSourceModule,
} from "../audit-commit-boundary";
import { SafeAuditMetadataSchema } from "../audit-record";
import {
  evaluateGovernedRunLifecycleTransition,
  type GovernedRunLifecycleDecision,
  type GovernedRunLifecycleIntent,
  type GovernedRunLifecycleState,
} from "../governed-run-lifecycle";
import {
  evaluateInvestigationViewModelV1,
  InvestigationApprovalGateDecisionRefSchema,
  InvestigationAuditBoundaryDecisionRefSchema,
  InvestigationLifecycleDecisionRefSchema,
  InvestigationPersistenceRecordRefSchema,
  InvestigationPolicyAdmissionDecisionRefSchema,
  InvestigationViewGovernedRunRefSchema,
  InvestigationViewModelV1DecisionSchema,
  InvestigationViewSafeTextSchema,
  type InvestigationApprovalGateDecisionRef,
  type InvestigationAuditBoundaryDecisionRef,
  type InvestigationLifecycleDecisionRef,
  type InvestigationPolicyAdmissionDecisionRef,
  type InvestigationTimelineEntryV1,
  type InvestigationViewModelV1Decision,
} from "../investigation-view-model-v1";
import {
  evaluatePolicyAdmissionV1,
  PolicyAdmissionContextStatusSchema,
  PolicyAdmissionRiskLevelSchema,
  PolicyAdmissionSafeRefSchema,
  PolicyAdmissionTenantBoundaryStatusSchema,
  type PolicyAdmissionOutcome,
  type PolicyAdmissionV1Decision,
} from "../policy-admission-v1";
import {
  evaluateReplayDryRunDescriptorV1,
  ReplayDryRunBlockedActionSchema,
  ReplayDryRunBlockedActions,
  ReplayDryRunDescriptorV1DecisionSchema,
  type ReplayDryRunDescriptorV1Decision,
} from "../replay-dry-run-descriptor-v1";
import { PolicyActionSchema, PolicyPurposeSchema } from "../policy-decision-gateway";
import {
  CorrelationIdSchema,
  err,
  ok,
  RunIdSchema,
  TenantIdSchema,
  type CorrelationId,
  type Result,
} from "../shared-kernel";

export const INTERNAL_RUNTIME_ORCHESTRATOR_V1_PHASE = "2Y";

export const INTERNAL_RUNTIME_ORCHESTRATOR_V1_NAME =
  "Internal Runtime Orchestrator v1";

export const INTERNAL_RUNTIME_ORCHESTRATOR_V1_STATUS =
  "pure TypeScript in-memory orchestration descriptor only";

export const InternalRuntimeOrchestrationStatuses = [
  "COMPLETED_DESCRIPTOR",
  "WAITING_APPROVAL",
  "REJECTED_DESCRIPTOR",
  "FAILED_DESCRIPTOR",
  "BLOCKED",
] as const;

export type InternalRuntimeOrchestrationStatus =
  (typeof InternalRuntimeOrchestrationStatuses)[number];

export const InternalRuntimeOrchestrationStepKinds = [
  "VALIDATE_INPUT",
  "RESOLVE_CONTEXT_DESCRIPTOR",
  "EVALUATE_POLICY_ADMISSION",
  "APPLY_ADMISSION_LIFECYCLE",
  "EVALUATE_APPROVAL_GATE",
  "APPLY_APPROVAL_LIFECYCLE",
  "EVALUATE_AUDIT_BOUNDARIES",
  "ASSEMBLE_INVESTIGATION_VIEW",
  "ASSEMBLE_REPLAY_DRY_RUN_DESCRIPTOR",
  "FINALIZE_DESCRIPTOR",
] as const;

export type InternalRuntimeOrchestrationStepKind =
  (typeof InternalRuntimeOrchestrationStepKinds)[number];

export const InternalRuntimeOrchestrationStatusSchema = z.enum(
  InternalRuntimeOrchestrationStatuses,
);

export const InternalRuntimeOrchestrationStepKindSchema = z.enum(
  InternalRuntimeOrchestrationStepKinds,
);

export const InternalRuntimeApprovalDecisionInputSchema = z
  .object({
    approval_request_id: PolicyAdmissionSafeRefSchema,
    requested_role: PolicyAdmissionSafeRefSchema,
    approver_ref: PolicyAdmissionSafeRefSchema.optional(),
    decision_outcome: z.enum(["APPROVE", "REJECT", "TIMEOUT", "CANCEL"]),
    decision_reason_code: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[A-Z][A-Z0-9_]*$/),
    safe_decision_summary: PolicyAdmissionSafeRefSchema,
  })
  .strict();

export const InternalRuntimeOrchestratorV1InputSchema = z
  .object({
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema,
    correlation_id: CorrelationIdSchema,
    requester_ref: PolicyAdmissionSafeRefSchema,
    resource_ref: PolicyAdmissionSafeRefSchema,
    action: PolicyActionSchema,
    purpose: PolicyPurposeSchema,
    risk_level: PolicyAdmissionRiskLevelSchema,
    context_status: PolicyAdmissionContextStatusSchema,
    tenant_boundary_status: PolicyAdmissionTenantBoundaryStatusSchema,
    has_required_context: z.boolean(),
    policy_ref: PolicyAdmissionSafeRefSchema.optional(),
    policy_version: PolicyAdmissionSafeRefSchema.optional(),
    approval_decision_input: InternalRuntimeApprovalDecisionInputSchema.optional(),
    orchestration_purpose: InvestigationViewSafeTextSchema,
    requested_by_ref: PolicyAdmissionSafeRefSchema,
    persistence_record_refs: z
      .array(InvestigationPersistenceRecordRefSchema)
      .min(1),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.policy_ref === undefined && input.policy_version === undefined) {
      context.addIssue({
        code: "custom",
        message: "policy_ref or policy_version is required.",
        path: ["policy_ref"],
      });
    }

    input.persistence_record_refs.forEach((record, index) => {
      if (record.tenant_id !== input.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "tenant scope mismatch.",
          path: ["persistence_record_refs", index, "tenant_id"],
        });
      }
    });
  });

export type InternalRuntimeOrchestratorV1Input = z.infer<
  typeof InternalRuntimeOrchestratorV1InputSchema
>;

export type InternalRuntimeOrchestratorV1InputCandidate = z.input<
  typeof InternalRuntimeOrchestratorV1InputSchema
>;

export const InternalRuntimeOrchestratorV1DenialCodeSchema = z.enum([
  "INTERNAL_RUNTIME_ORCHESTRATOR_INPUT_REQUIRED",
  "INTERNAL_RUNTIME_ORCHESTRATOR_INPUT_INVALID",
  "INTERNAL_RUNTIME_ORCHESTRATOR_POLICY_REFERENCE_REQUIRED",
  "INTERNAL_RUNTIME_ORCHESTRATOR_TENANT_MISMATCH",
  "INTERNAL_RUNTIME_ORCHESTRATOR_UNSAFE_METADATA",
  "INTERNAL_RUNTIME_ORCHESTRATOR_PURE_EVALUATOR_DENIED",
]);

export type InternalRuntimeOrchestratorV1DenialCode = z.infer<
  typeof InternalRuntimeOrchestratorV1DenialCodeSchema
>;

export const InternalRuntimeOrchestratorV1DenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    orchestration_status: z.literal("BLOCKED"),
    code: InternalRuntimeOrchestratorV1DenialCodeSchema,
    message: z.literal("The internal runtime orchestration input is not accepted."),
    safe_reason: InvestigationViewSafeTextSchema,
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export type InternalRuntimeOrchestratorV1Denial = z.infer<
  typeof InternalRuntimeOrchestratorV1DenialSchema
>;

export const InternalRuntimeOrchestrationStepSchema = z
  .object({
    sequence: z.number().int().positive(),
    step: InternalRuntimeOrchestrationStepKindSchema,
    safe_summary: InvestigationViewSafeTextSchema,
    descriptor_ref: PolicyAdmissionSafeRefSchema,
    boundary_status: z.literal("descriptor orchestration step only"),
  })
  .strict();

export type InternalRuntimeOrchestrationStep = z.infer<
  typeof InternalRuntimeOrchestrationStepSchema
>;

export const InternalRuntimeOrchestrationInputRefsSchema = z
  .object({
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema,
    correlation_id: CorrelationIdSchema,
    requester_ref: PolicyAdmissionSafeRefSchema,
    resource_ref: PolicyAdmissionSafeRefSchema,
  })
  .strict();

export const InternalRuntimeOrchestrationPersistenceMappingSchema = z
  .object({
    runtime_persistence_model: z.literal("runtime-persistence-model"),
    record_refs: z.array(InvestigationPersistenceRecordRefSchema).min(1),
    boundary_status: z.literal("conceptual mapping only"),
  })
  .strict();

export const InternalRuntimeOrchestrationDescriptorSchema = z
  .object({
    orchestration_status: InternalRuntimeOrchestrationStatusSchema.exclude([
      "BLOCKED",
    ]),
    input_refs: InternalRuntimeOrchestrationInputRefsSchema,
    steps: z.array(InternalRuntimeOrchestrationStepSchema).min(1),
    lifecycle_decisions: z.array(InvestigationLifecycleDecisionRefSchema).min(1),
    policy_admission_decision: InvestigationPolicyAdmissionDecisionRefSchema,
    approval_gate_decision:
      InvestigationApprovalGateDecisionRefSchema.optional(),
    audit_boundary_decisions: z
      .array(InvestigationAuditBoundaryDecisionRefSchema)
      .min(1),
    investigation_view_decision:
      InvestigationViewModelV1DecisionSchema.optional(),
    replay_dry_run_decision: ReplayDryRunDescriptorV1DecisionSchema.optional(),
    persistence_mapping: InternalRuntimeOrchestrationPersistenceMappingSchema,
    blocked_actions: z.array(ReplayDryRunBlockedActionSchema).length(6),
    safe_summary: InvestigationViewSafeTextSchema,
    limitation_notes: z.array(InvestigationViewSafeTextSchema).min(1),
    next_actions: z.array(InvestigationViewSafeTextSchema).min(1),
    boundary_status: z.literal("in-memory descriptor orchestration only"),
  })
  .strict();

export type InternalRuntimeOrchestrationDescriptor = z.infer<
  typeof InternalRuntimeOrchestrationDescriptorSchema
>;

export const InternalRuntimeOrchestratorV1DecisionSchema = z
  .object({
    orchestration_status: InternalRuntimeOrchestrationStatusSchema.exclude([
      "BLOCKED",
    ]),
    orchestration_descriptor: InternalRuntimeOrchestrationDescriptorSchema,
    safe_summary: InvestigationViewSafeTextSchema,
    blocked_actions: z.array(ReplayDryRunBlockedActionSchema).length(6),
    limitation_notes: z.array(InvestigationViewSafeTextSchema).min(1),
    next_actions: z.array(InvestigationViewSafeTextSchema).min(1),
  })
  .strict();

export type InternalRuntimeOrchestratorV1Decision = z.infer<
  typeof InternalRuntimeOrchestratorV1DecisionSchema
>;

export type InternalRuntimeOrchestratorV1Definition = {
  readonly phase: typeof INTERNAL_RUNTIME_ORCHESTRATOR_V1_PHASE;
  readonly name: typeof INTERNAL_RUNTIME_ORCHESTRATOR_V1_NAME;
  readonly status: typeof INTERNAL_RUNTIME_ORCHESTRATOR_V1_STATUS;
  readonly orchestration_statuses: readonly InternalRuntimeOrchestrationStatus[];
  readonly step_kinds: readonly InternalRuntimeOrchestrationStepKind[];
  readonly module_alignment: readonly string[];
  readonly explicitly_out_of_scope: readonly string[];
  readonly safety_boundary: readonly string[];
};

export const INTERNAL_RUNTIME_ORCHESTRATOR_V1_MODULE_ALIGNMENT = [
  "src/mycelia/runtime-slice-technical-plan/",
  "src/mycelia/runtime-persistence-model/",
  "src/mycelia/governed-run-lifecycle/",
  "src/mycelia/policy-admission-v1/",
  "src/mycelia/approval-gate-v1/",
  "src/mycelia/audit-commit-boundary/",
  "src/mycelia/investigation-view-model-v1/",
  "src/mycelia/replay-dry-run-descriptor-v1/",
] as const;

export const INTERNAL_RUNTIME_ORCHESTRATOR_V1_EXPLICITLY_OUT_OF_SCOPE = [
  "no runtime execution",
  "no replay execution",
  "no workflow execution",
  "no tool execution",
  "no external integrations",
  "no persistence",
  "no storage reads",
  "no storage writes",
  "no migrations",
  "no repository layer",
  "no API",
  "no auth",
  "no UI",
  "no event publication",
  "no audit record writing",
  "no append log writing",
  "no generated identifiers",
  "no timestamps",
  "no random behavior",
  "no export or generated artifacts",
] as const;

export const INTERNAL_RUNTIME_ORCHESTRATOR_V1_SAFETY_BOUNDARY = [
  "this module validates one safe in-memory input",
  "this module calls pure descriptor evaluators only",
  "this module returns deterministic orchestration descriptors or safe denials",
  "this module does not mutate input",
  "this module does not persist data",
  "this module does not call APIs",
  "this module does not execute tools",
  "this module does not execute replay",
  "this module does not execute runtime",
] as const;

export const INTERNAL_RUNTIME_ORCHESTRATOR_V1 = {
  phase: INTERNAL_RUNTIME_ORCHESTRATOR_V1_PHASE,
  name: INTERNAL_RUNTIME_ORCHESTRATOR_V1_NAME,
  status: INTERNAL_RUNTIME_ORCHESTRATOR_V1_STATUS,
  orchestration_statuses: InternalRuntimeOrchestrationStatuses,
  step_kinds: InternalRuntimeOrchestrationStepKinds,
  module_alignment: INTERNAL_RUNTIME_ORCHESTRATOR_V1_MODULE_ALIGNMENT,
  explicitly_out_of_scope:
    INTERNAL_RUNTIME_ORCHESTRATOR_V1_EXPLICITLY_OUT_OF_SCOPE,
  safety_boundary: INTERNAL_RUNTIME_ORCHESTRATOR_V1_SAFETY_BOUNDARY,
} as const satisfies InternalRuntimeOrchestratorV1Definition;

type MutableOrchestrationDraft = {
  lifecycleDecisions: InvestigationLifecycleDecisionRef[];
  auditBoundaryDecisions: InvestigationAuditBoundaryDecisionRef[];
  steps: InternalRuntimeOrchestrationStep[];
};

type TerminalDescriptorState =
  | "COMPLETED"
  | "REJECTED"
  | "FAILED"
  | "CANCELLED";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasOwn(input: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function denialReason(
  code: InternalRuntimeOrchestratorV1DenialCode,
): string {
  const reasons: Record<InternalRuntimeOrchestratorV1DenialCode, string> = {
    INTERNAL_RUNTIME_ORCHESTRATOR_INPUT_REQUIRED:
      "An internal orchestration input is required.",
    INTERNAL_RUNTIME_ORCHESTRATOR_INPUT_INVALID:
      "The internal orchestration input is invalid or unsafe.",
    INTERNAL_RUNTIME_ORCHESTRATOR_POLICY_REFERENCE_REQUIRED:
      "A policy reference or version is required.",
    INTERNAL_RUNTIME_ORCHESTRATOR_TENANT_MISMATCH:
      "The supplied descriptor references do not share one tenant scope.",
    INTERNAL_RUNTIME_ORCHESTRATOR_UNSAFE_METADATA:
      "The supplied metadata is unsafe.",
    INTERNAL_RUNTIME_ORCHESTRATOR_PURE_EVALUATOR_DENIED:
      "A required pure descriptor evaluator denied the orchestration.",
  };

  return reasons[code];
}

export function failClosedInternalRuntimeOrchestratorV1Denial(
  input?: unknown,
  code: InternalRuntimeOrchestratorV1DenialCode =
    "INTERNAL_RUNTIME_ORCHESTRATOR_INPUT_INVALID",
): InternalRuntimeOrchestratorV1Denial {
  const correlationId =
    isRecord(input) && typeof input.correlation_id === "string"
      ? CorrelationIdSchema.safeParse(input.correlation_id).success
        ? (input.correlation_id as CorrelationId)
        : undefined
      : undefined;

  return InternalRuntimeOrchestratorV1DenialSchema.parse({
    outcome: "DENIED",
    orchestration_status: "BLOCKED",
    code,
    message: "The internal runtime orchestration input is not accepted.",
    safe_reason: denialReason(code),
    correlation_id: correlationId,
    safe: true,
  });
}

function denialForInvalidInput(
  input: unknown,
): InternalRuntimeOrchestratorV1Denial {
  if (!isRecord(input)) {
    return failClosedInternalRuntimeOrchestratorV1Denial(
      input,
      "INTERNAL_RUNTIME_ORCHESTRATOR_INPUT_REQUIRED",
    );
  }

  if (!hasOwn(input, "policy_ref") && !hasOwn(input, "policy_version")) {
    return failClosedInternalRuntimeOrchestratorV1Denial(
      input,
      "INTERNAL_RUNTIME_ORCHESTRATOR_POLICY_REFERENCE_REQUIRED",
    );
  }

  if (
    hasOwn(input, "metadata") &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  ) {
    return failClosedInternalRuntimeOrchestratorV1Denial(
      input,
      "INTERNAL_RUNTIME_ORCHESTRATOR_UNSAFE_METADATA",
    );
  }

  return failClosedInternalRuntimeOrchestratorV1Denial(input);
}

function step(
  sequence: number,
  kind: InternalRuntimeOrchestrationStepKind,
  safeSummary: string,
  descriptorRef: string,
): InternalRuntimeOrchestrationStep {
  return InternalRuntimeOrchestrationStepSchema.parse({
    sequence,
    step: kind,
    safe_summary: safeSummary,
    descriptor_ref: descriptorRef,
    boundary_status: "descriptor orchestration step only",
  });
}

function lifecycleDecisionRef(
  sequence: number,
  tenantId: InternalRuntimeOrchestratorV1Input["tenant_id"],
  descriptorRef: string,
  decision: GovernedRunLifecycleDecision,
): InvestigationLifecycleDecisionRef {
  return InvestigationLifecycleDecisionRefSchema.parse({
    sequence,
    tenant_id: tenantId,
    descriptor_ref: descriptorRef,
    decision,
  });
}

function policyDecisionRef(
  tenantId: InternalRuntimeOrchestratorV1Input["tenant_id"],
  decision: PolicyAdmissionV1Decision,
): InvestigationPolicyAdmissionDecisionRef {
  return InvestigationPolicyAdmissionDecisionRefSchema.parse({
    sequence: 30,
    tenant_id: tenantId,
    descriptor_ref: "policy_admission_descriptor",
    decision,
  });
}

function approvalDecisionRef(
  tenantId: InternalRuntimeOrchestratorV1Input["tenant_id"],
  decision: ApprovalGateV1Decision,
): InvestigationApprovalGateDecisionRef {
  return InvestigationApprovalGateDecisionRefSchema.parse({
    sequence: 55,
    tenant_id: tenantId,
    descriptor_ref: "approval_gate_descriptor",
    decision,
  });
}

function auditDecisionRef(
  sequence: number,
  tenantId: InternalRuntimeOrchestratorV1Input["tenant_id"],
  descriptorRef: string,
  decision: AuditCommitBoundaryDecision,
): InvestigationAuditBoundaryDecisionRef {
  return InvestigationAuditBoundaryDecisionRefSchema.parse({
    sequence,
    tenant_id: tenantId,
    descriptor_ref: descriptorRef,
    decision,
  });
}

function evaluateLifecycleOrDeny(
  currentState: GovernedRunLifecycleState,
  intent: GovernedRunLifecycleIntent,
): Result<GovernedRunLifecycleDecision, InternalRuntimeOrchestratorV1Denial> {
  const result = evaluateGovernedRunLifecycleTransition({
    current_state: currentState,
    intent,
  });

  if (!result.ok) {
    return err(
      failClosedInternalRuntimeOrchestratorV1Denial(
        undefined,
        "INTERNAL_RUNTIME_ORCHESTRATOR_PURE_EVALUATOR_DENIED",
      ),
    );
  }

  return ok(result.value);
}

function addLifecycleDecision(
  draft: MutableOrchestrationDraft,
  tenantId: InternalRuntimeOrchestratorV1Input["tenant_id"],
  sequence: number,
  descriptorRef: string,
  currentState: GovernedRunLifecycleState,
  intent: GovernedRunLifecycleIntent,
): Result<GovernedRunLifecycleDecision, InternalRuntimeOrchestratorV1Denial> {
  const result = evaluateLifecycleOrDeny(currentState, intent);

  if (!result.ok) {
    return result;
  }

  draft.lifecycleDecisions.push(
    lifecycleDecisionRef(sequence, tenantId, descriptorRef, result.value),
  );

  return result;
}

function sourceModuleForMoment(
  moment: AuditCommitMoment,
): AuditCommitSourceModule {
  if (moment === "POLICY_EVALUATED" || moment === "ADMISSION_DECIDED") {
    return "policy-admission-v1";
  }

  if (moment === "APPROVAL_REQUESTED" || moment === "APPROVAL_DECIDED") {
    return "future-approval-gate";
  }

  if (
    moment === "REQUEST_CREATED" ||
    moment === "CONTEXT_RESOLVED" ||
    moment === "TENANT_BOUNDARY_CHECKED"
  ) {
    return "runtime-slice-technical-plan";
  }

  return "governed-run-lifecycle";
}

function auditSafeSummary(moment: AuditCommitMoment): string {
  const summaries: Record<AuditCommitMoment, string> = {
    REQUEST_CREATED: "Audit boundary REQUEST_CREATED",
    CONTEXT_RESOLVED: "Audit boundary CONTEXT_RESOLVED",
    TENANT_BOUNDARY_CHECKED: "Audit boundary TENANT_BOUNDARY_CHECKED",
    POLICY_EVALUATED: "Audit boundary POLICY_EVALUATED",
    ADMISSION_DECIDED: "Audit boundary ADMISSION_DECIDED",
    APPROVAL_REQUESTED: "Audit boundary APPROVAL_REQUESTED",
    APPROVAL_DECIDED: "Audit boundary APPROVAL_DECIDED",
    LIFECYCLE_TRANSITIONED: "Audit boundary LIFECYCLE_TRANSITIONED",
    RUN_COMPLETED: "Audit boundary RUN_COMPLETED",
    RUN_REJECTED: "Audit boundary RUN_REJECTED",
    RUN_CANCELLED: "Audit boundary RUN_CANCELLED",
    RUN_FAILED: "Audit boundary RUN_FAILED",
    INVESTIGATION_PREPARED: "Audit boundary INVESTIGATION_PREPARED",
    REPLAY_DRY_RUN_PREPARED: "Audit boundary REPLAY_DRY_RUN_PREPARED",
  };

  return summaries[moment];
}

function addAuditDecision(
  draft: MutableOrchestrationDraft,
  input: InternalRuntimeOrchestratorV1Input,
  sequence: number,
  moment: AuditCommitMoment,
): Result<AuditCommitBoundaryDecision, InternalRuntimeOrchestratorV1Denial> {
  const result = evaluateAuditCommitBoundary({
    tenant_id: input.tenant_id,
    run_id: input.run_id,
    correlation_id: input.correlation_id,
    moment,
    source_module: sourceModuleForMoment(moment),
    subject_ref: `audit_subject_${sequence}`,
    actor_ref: input.requested_by_ref,
    evidence_ref: `audit_evidence_${sequence}`,
    reason_code: moment,
    safe_summary: auditSafeSummary(moment),
  });

  if (!result.ok) {
    return err(
      failClosedInternalRuntimeOrchestratorV1Denial(
        input,
        "INTERNAL_RUNTIME_ORCHESTRATOR_PURE_EVALUATOR_DENIED",
      ),
    );
  }

  draft.auditBoundaryDecisions.push(
    auditDecisionRef(
      sequence,
      input.tenant_id,
      `audit_boundary_${sequence}`,
      result.value,
    ),
  );

  return ok(result.value);
}

function addAuditMoments(
  draft: MutableOrchestrationDraft,
  input: InternalRuntimeOrchestratorV1Input,
  startSequence: number,
  moments: readonly AuditCommitMoment[],
): Result<readonly AuditCommitBoundaryDecision[], InternalRuntimeOrchestratorV1Denial> {
  const decisions: AuditCommitBoundaryDecision[] = [];

  for (const [index, moment] of moments.entries()) {
    const result = addAuditDecision(draft, input, startSequence + index, moment);

    if (!result.ok) {
      return result;
    }

    decisions.push(result.value);
  }

  return ok(decisions);
}

function lifecycleIntentForOutcome(
  outcome: PolicyAdmissionOutcome,
): GovernedRunLifecycleIntent {
  const mapping: Record<PolicyAdmissionOutcome, GovernedRunLifecycleIntent> = {
    ADMIT: "GRANT_ADMISSION",
    REQUIRE_APPROVAL: "REQUIRE_APPROVAL",
    DENY: "REJECT",
  };

  return mapping[outcome];
}

function terminalMomentForState(
  state: TerminalDescriptorState,
): AuditCommitMoment {
  const mapping: Record<TerminalDescriptorState, AuditCommitMoment> = {
    COMPLETED: "RUN_COMPLETED",
    REJECTED: "RUN_REJECTED",
    FAILED: "RUN_FAILED",
    CANCELLED: "RUN_CANCELLED",
  };

  return mapping[state];
}

function statusForTerminalState(
  state: TerminalDescriptorState,
): Exclude<InternalRuntimeOrchestrationStatus, "BLOCKED"> {
  if (state === "COMPLETED") {
    return "COMPLETED_DESCRIPTOR";
  }

  if (state === "REJECTED") {
    return "REJECTED_DESCRIPTOR";
  }

  return "FAILED_DESCRIPTOR";
}

function currentStateFromLatestLifecycle(
  lifecycleDecisions: readonly InvestigationLifecycleDecisionRef[],
): GovernedRunLifecycleState {
  return lifecycleDecisions[lifecycleDecisions.length - 1].decision.next_state;
}

function inputRefs(input: InternalRuntimeOrchestratorV1Input) {
  return InternalRuntimeOrchestrationInputRefsSchema.parse({
    tenant_id: input.tenant_id,
    run_id: input.run_id,
    correlation_id: input.correlation_id,
    requester_ref: input.requester_ref,
    resource_ref: input.resource_ref,
  });
}

function defaultLimitationNotes(): string[] {
  return [
    "This descriptor does not execute runtime.",
    "This descriptor does not persist data.",
    "This descriptor does not call APIs.",
    "This descriptor does not emit events.",
    "This descriptor does not write audit records.",
    "This descriptor does not execute replay.",
  ];
}

function nextActionsForStatus(
  status: InternalRuntimeOrchestrationStatus,
): string[] {
  if (status === "WAITING_APPROVAL") {
    return ["Supply a safe approval descriptor to continue planning."];
  }

  if (status === "COMPLETED_DESCRIPTOR") {
    return ["Use this descriptor to guide future service planning."];
  }

  if (status === "REJECTED_DESCRIPTOR") {
    return ["Review policy and approval descriptors before planning execution."];
  }

  if (status === "FAILED_DESCRIPTOR") {
    return ["Review failed descriptor outcome before planning service work."];
  }

  return ["Provide valid bounded descriptors before orchestration."];
}

function safeSummaryForStatus(
  status: InternalRuntimeOrchestrationStatus,
): string {
  const summaries: Record<InternalRuntimeOrchestrationStatus, string> = {
    COMPLETED_DESCRIPTOR:
      "Internal orchestration descriptor completed without runtime execution.",
    WAITING_APPROVAL:
      "Internal orchestration descriptor is waiting for approval input.",
    REJECTED_DESCRIPTOR:
      "Internal orchestration descriptor reached a rejected outcome.",
    FAILED_DESCRIPTOR:
      "Internal orchestration descriptor reached a failed outcome.",
    BLOCKED: "Internal orchestration descriptor is blocked.",
  };

  return summaries[status];
}

function createDescriptor(
  input: InternalRuntimeOrchestratorV1Input,
  status: Exclude<InternalRuntimeOrchestrationStatus, "BLOCKED">,
  draft: MutableOrchestrationDraft,
  policyAdmissionDecision: InvestigationPolicyAdmissionDecisionRef,
  approvalGateDecision: InvestigationApprovalGateDecisionRef | undefined,
  investigationViewDecision: InvestigationViewModelV1Decision | undefined,
  replayDryRunDecision: ReplayDryRunDescriptorV1Decision | undefined,
): InternalRuntimeOrchestrationDescriptor {
  const limitationNotes = defaultLimitationNotes();
  const nextActions = nextActionsForStatus(status);

  return InternalRuntimeOrchestrationDescriptorSchema.parse({
    orchestration_status: status,
    input_refs: inputRefs(input),
    steps: draft.steps.sort((left, right) => left.sequence - right.sequence),
    lifecycle_decisions: draft.lifecycleDecisions.sort(
      (left, right) => left.sequence - right.sequence,
    ),
    policy_admission_decision: policyAdmissionDecision,
    approval_gate_decision: approvalGateDecision,
    audit_boundary_decisions: draft.auditBoundaryDecisions.sort(
      (left, right) => left.sequence - right.sequence,
    ),
    investigation_view_decision: investigationViewDecision,
    replay_dry_run_decision: replayDryRunDecision,
    persistence_mapping: {
      runtime_persistence_model: "runtime-persistence-model",
      record_refs: input.persistence_record_refs,
      boundary_status: "conceptual mapping only",
    },
    blocked_actions: ReplayDryRunBlockedActions,
    safe_summary: safeSummaryForStatus(status),
    limitation_notes: limitationNotes,
    next_actions: nextActions,
    boundary_status: "in-memory descriptor orchestration only",
  });
}

function createDecision(
  descriptor: InternalRuntimeOrchestrationDescriptor,
): InternalRuntimeOrchestratorV1Decision {
  return InternalRuntimeOrchestratorV1DecisionSchema.parse({
    orchestration_status: descriptor.orchestration_status,
    orchestration_descriptor: descriptor,
    safe_summary: descriptor.safe_summary,
    blocked_actions: descriptor.blocked_actions,
    limitation_notes: descriptor.limitation_notes,
    next_actions: descriptor.next_actions,
  });
}

function buildInvestigationView(
  input: InternalRuntimeOrchestratorV1Input,
  draft: MutableOrchestrationDraft,
  policyAdmissionDecision: InvestigationPolicyAdmissionDecisionRef,
  approvalGateDecision: InvestigationApprovalGateDecisionRef | undefined,
): Result<InvestigationViewModelV1Decision, InternalRuntimeOrchestratorV1Denial> {
  const governedRunRef = InvestigationViewGovernedRunRefSchema.parse({
    tenant_id: input.tenant_id,
    run_id: input.run_id,
    correlation_id: input.correlation_id,
    ref: "governed_run_descriptor",
    current_state: currentStateFromLatestLifecycle(draft.lifecycleDecisions),
  });

  const result = evaluateInvestigationViewModelV1({
    tenant_id: input.tenant_id,
    run_id: input.run_id,
    correlation_id: input.correlation_id,
    governed_run_ref: governedRunRef,
    lifecycle_decisions: draft.lifecycleDecisions,
    policy_admission_decision: policyAdmissionDecision,
    approval_gate_decision: approvalGateDecision,
    audit_boundary_decisions: draft.auditBoundaryDecisions,
    persistence_record_refs: input.persistence_record_refs,
    investigation_purpose: "Assemble in-memory orchestration investigation.",
    requested_by_ref: input.requested_by_ref,
  });

  if (!result.ok) {
    return err(
      failClosedInternalRuntimeOrchestratorV1Denial(
        input,
        "INTERNAL_RUNTIME_ORCHESTRATOR_PURE_EVALUATOR_DENIED",
      ),
    );
  }

  return ok(result.value);
}

function buildReplayDryRun(
  input: InternalRuntimeOrchestratorV1Input,
  investigationViewDecision: InvestigationViewModelV1Decision,
  policyAdmissionDecision: InvestigationPolicyAdmissionDecisionRef,
  approvalGateDecision: InvestigationApprovalGateDecisionRef | undefined,
  auditBoundaryDecisions: readonly InvestigationAuditBoundaryDecisionRef[],
): Result<ReplayDryRunDescriptorV1Decision, InternalRuntimeOrchestratorV1Denial> {
  const lifecycleTimeline: InvestigationTimelineEntryV1[] =
    investigationViewDecision.investigation_view.timeline.filter(
      (entry) => entry.source_type === "LIFECYCLE",
    );

  const result = evaluateReplayDryRunDescriptorV1({
    tenant_id: input.tenant_id,
    run_id: input.run_id,
    correlation_id: input.correlation_id,
    investigation_view: investigationViewDecision,
    lifecycle_timeline: lifecycleTimeline,
    policy_admission_decision: policyAdmissionDecision,
    approval_gate_decision: approvalGateDecision,
    audit_boundary_decisions: auditBoundaryDecisions,
    persistence_record_refs: input.persistence_record_refs,
    replay_purpose: "Assemble descriptor-only replay dry-run.",
    requested_by_ref: input.requested_by_ref,
  });

  if (!result.ok) {
    return err(
      failClosedInternalRuntimeOrchestratorV1Denial(
        input,
        "INTERNAL_RUNTIME_ORCHESTRATOR_PURE_EVALUATOR_DENIED",
      ),
    );
  }

  return ok(result.value);
}

function finalizeTerminalDescriptor(
  input: InternalRuntimeOrchestratorV1Input,
  draft: MutableOrchestrationDraft,
  policyAdmissionDecision: InvestigationPolicyAdmissionDecisionRef,
  approvalGateDecision: InvestigationApprovalGateDecisionRef | undefined,
  terminalState: TerminalDescriptorState,
): Result<InternalRuntimeOrchestratorV1Decision, InternalRuntimeOrchestratorV1Denial> {
  const terminalAudit = addAuditMoments(draft, input, 190, [
    terminalMomentForState(terminalState),
  ]);

  if (!terminalAudit.ok) {
    return terminalAudit;
  }

  draft.steps.push(
    step(
      80,
      "ASSEMBLE_INVESTIGATION_VIEW",
      "Assemble investigation descriptor from supplied decisions.",
      "investigation_view_step",
    ),
  );

  const investigation = buildInvestigationView(
    input,
    draft,
    policyAdmissionDecision,
    approvalGateDecision,
  );

  if (!investigation.ok) {
    return investigation;
  }

  draft.steps.push(
    step(
      90,
      "ASSEMBLE_REPLAY_DRY_RUN_DESCRIPTOR",
      "Assemble replay dry-run descriptor without replay execution.",
      "replay_dry_run_step",
    ),
  );

  const replay = buildReplayDryRun(
    input,
    investigation.value,
    policyAdmissionDecision,
    approvalGateDecision,
    draft.auditBoundaryDecisions,
  );

  if (!replay.ok) {
    return replay;
  }

  draft.steps.push(
    step(
      100,
      "FINALIZE_DESCRIPTOR",
      "Finalize deterministic internal orchestration descriptor.",
      "finalize_descriptor_step",
    ),
  );

  const status = statusForTerminalState(terminalState);
  const descriptor = createDescriptor(
    input,
    status,
    draft,
    policyAdmissionDecision,
    approvalGateDecision,
    investigation.value,
    replay.value,
  );

  return ok(createDecision(descriptor));
}

function applyAdmittedTerminalFlow(
  input: InternalRuntimeOrchestratorV1Input,
  draft: MutableOrchestrationDraft,
  policyAdmissionDecision: InvestigationPolicyAdmissionDecisionRef,
  approvalGateDecision: InvestigationApprovalGateDecisionRef | undefined,
  startState: "ADMISSION_GRANTED" | "APPROVED",
): Result<InternalRuntimeOrchestratorV1Decision, InternalRuntimeOrchestratorV1Denial> {
  const start = addLifecycleDecision(
    draft,
    input.tenant_id,
    60,
    "lifecycle_start_descriptor",
    startState,
    "START_RUN",
  );

  if (!start.ok) {
    return start;
  }

  const complete = addLifecycleDecision(
    draft,
    input.tenant_id,
    70,
    "lifecycle_complete_descriptor",
    "RUNNING",
    "COMPLETE_RUN",
  );

  if (!complete.ok) {
    return complete;
  }

  return finalizeTerminalDescriptor(
    input,
    draft,
    policyAdmissionDecision,
    approvalGateDecision,
    "COMPLETED",
  );
}

function evaluatePolicyDecision(
  input: InternalRuntimeOrchestratorV1Input,
): Result<PolicyAdmissionV1Decision, InternalRuntimeOrchestratorV1Denial> {
  const result = evaluatePolicyAdmissionV1({
    tenant_id: input.tenant_id,
    run_id: input.run_id,
    correlation_id: input.correlation_id,
    requester_ref: input.requester_ref,
    resource_ref: input.resource_ref,
    action: input.action,
    purpose: input.purpose,
    risk_level: input.risk_level,
    context_status: input.context_status,
    tenant_boundary_status: input.tenant_boundary_status,
    has_required_context: input.has_required_context,
    policy_ref: input.policy_ref,
    policy_version: input.policy_version,
    metadata: input.metadata,
  });

  if (!result.ok) {
    return err(
      failClosedInternalRuntimeOrchestratorV1Denial(
        input,
        "INTERNAL_RUNTIME_ORCHESTRATOR_PURE_EVALUATOR_DENIED",
      ),
    );
  }

  return ok(result.value);
}

function evaluateApprovalDecision(
  input: InternalRuntimeOrchestratorV1Input,
  policyDecision: PolicyAdmissionV1Decision,
): Result<ApprovalGateV1Decision, InternalRuntimeOrchestratorV1Denial> {
  const approvalInput = input.approval_decision_input;

  if (approvalInput === undefined) {
    return err(
      failClosedInternalRuntimeOrchestratorV1Denial(
        input,
        "INTERNAL_RUNTIME_ORCHESTRATOR_INPUT_INVALID",
      ),
    );
  }

  const result = evaluateApprovalGateV1({
    tenant_id: input.tenant_id,
    run_id: input.run_id,
    correlation_id: input.correlation_id,
    approval_request_id: approvalInput.approval_request_id,
    requested_role: approvalInput.requested_role,
    requester_ref: input.requester_ref,
    approver_ref: approvalInput.approver_ref,
    current_status: "PENDING",
    decision_outcome: approvalInput.decision_outcome,
    decision_reason_code: approvalInput.decision_reason_code,
    safe_decision_summary: approvalInput.safe_decision_summary,
    policy_admission_outcome: policyDecision.outcome,
    risk_level: policyDecision.risk_level,
    metadata: input.metadata,
  });

  if (!result.ok) {
    return err(
      failClosedInternalRuntimeOrchestratorV1Denial(
        input,
        "INTERNAL_RUNTIME_ORCHESTRATOR_PURE_EVALUATOR_DENIED",
      ),
    );
  }

  return ok(result.value);
}

function applyApprovalTerminalFlow(
  input: InternalRuntimeOrchestratorV1Input,
  draft: MutableOrchestrationDraft,
  policyAdmissionDecision: InvestigationPolicyAdmissionDecisionRef,
  approvalGateDecision: InvestigationApprovalGateDecisionRef,
): Result<InternalRuntimeOrchestratorV1Decision, InternalRuntimeOrchestratorV1Denial> {
  const approvalLifecycle = addLifecycleDecision(
    draft,
    input.tenant_id,
    50,
    "lifecycle_approval_descriptor",
    "WAITING_APPROVAL",
    approvalGateDecision.decision.lifecycle_intent_hint,
  );

  if (!approvalLifecycle.ok) {
    return approvalLifecycle;
  }

  if (approvalLifecycle.value.next_state === "APPROVED") {
    return applyAdmittedTerminalFlow(
      input,
      draft,
      policyAdmissionDecision,
      approvalGateDecision,
      "APPROVED",
    );
  }

  if (approvalLifecycle.value.next_state === "REJECTED") {
    return finalizeTerminalDescriptor(
      input,
      draft,
      policyAdmissionDecision,
      approvalGateDecision,
      "REJECTED",
    );
  }

  if (approvalLifecycle.value.next_state === "CANCELLED") {
    return finalizeTerminalDescriptor(
      input,
      draft,
      policyAdmissionDecision,
      approvalGateDecision,
      "CANCELLED",
    );
  }

  return finalizeTerminalDescriptor(
    input,
    draft,
    policyAdmissionDecision,
    approvalGateDecision,
    "FAILED",
  );
}

function finalizeWaitingApproval(
  input: InternalRuntimeOrchestratorV1Input,
  draft: MutableOrchestrationDraft,
  policyAdmissionDecision: InvestigationPolicyAdmissionDecisionRef,
): InternalRuntimeOrchestratorV1Decision {
  draft.steps.push(
    step(
      100,
      "FINALIZE_DESCRIPTOR",
      "Finalize waiting approval descriptor without completed investigation.",
      "finalize_waiting_step",
    ),
  );

  const descriptor = createDescriptor(
    input,
    "WAITING_APPROVAL",
    draft,
    policyAdmissionDecision,
    undefined,
    undefined,
    undefined,
  );

  return createDecision(descriptor);
}

function evaluateValidatedInput(
  input: InternalRuntimeOrchestratorV1Input,
): Result<InternalRuntimeOrchestratorV1Decision, InternalRuntimeOrchestratorV1Denial> {
  const draft: MutableOrchestrationDraft = {
    lifecycleDecisions: [],
    auditBoundaryDecisions: [],
    steps: [
      step(
        10,
        "VALIDATE_INPUT",
        "Validated bounded orchestration input.",
        "validate_input_step",
      ),
    ],
  };

  const contextResolved = addLifecycleDecision(
    draft,
    input.tenant_id,
    10,
    "lifecycle_context_descriptor",
    "CREATED",
    "RESOLVE_CONTEXT",
  );

  if (!contextResolved.ok) {
    return contextResolved;
  }

  draft.steps.push(
    step(
      20,
      "RESOLVE_CONTEXT_DESCRIPTOR",
      "Context and tenant boundary descriptors are represented only.",
      "resolve_context_step",
    ),
  );

  const policyEvaluated = addLifecycleDecision(
    draft,
    input.tenant_id,
    20,
    "lifecycle_policy_descriptor",
    "CONTEXT_RESOLVED",
    "EVALUATE_POLICY",
  );

  if (!policyEvaluated.ok) {
    return policyEvaluated;
  }

  const policyResult = evaluatePolicyDecision(input);

  if (!policyResult.ok) {
    return policyResult;
  }

  const policyAdmissionDecision = policyDecisionRef(
    input.tenant_id,
    policyResult.value,
  );

  draft.steps.push(
    step(
      30,
      "EVALUATE_POLICY_ADMISSION",
      "Policy admission v1 produced a descriptor decision.",
      "policy_admission_step",
    ),
  );

  const admissionLifecycle = addLifecycleDecision(
    draft,
    input.tenant_id,
    40,
    "lifecycle_admission_descriptor",
    "POLICY_EVALUATED",
    lifecycleIntentForOutcome(policyResult.value.outcome),
  );

  if (!admissionLifecycle.ok) {
    return admissionLifecycle;
  }

  draft.steps.push(
    step(
      40,
      "APPLY_ADMISSION_LIFECYCLE",
      "Admission outcome was mapped to lifecycle intent.",
      "admission_lifecycle_step",
    ),
  );

  const baseAudit = addAuditMoments(draft, input, 110, [
    "REQUEST_CREATED",
    "CONTEXT_RESOLVED",
    "TENANT_BOUNDARY_CHECKED",
    "POLICY_EVALUATED",
    "ADMISSION_DECIDED",
    "LIFECYCLE_TRANSITIONED",
  ]);

  if (!baseAudit.ok) {
    return baseAudit;
  }

  draft.steps.push(
    step(
      70,
      "EVALUATE_AUDIT_BOUNDARIES",
      "Audit boundary descriptors were classified without writing records.",
      "audit_boundary_step",
    ),
  );

  if (policyResult.value.outcome === "ADMIT") {
    return applyAdmittedTerminalFlow(
      input,
      draft,
      policyAdmissionDecision,
      undefined,
      "ADMISSION_GRANTED",
    );
  }

  if (policyResult.value.outcome === "DENY") {
    return finalizeTerminalDescriptor(
      input,
      draft,
      policyAdmissionDecision,
      undefined,
      "REJECTED",
    );
  }

  const approvalRequested = addAuditMoments(draft, input, 150, [
    "APPROVAL_REQUESTED",
  ]);

  if (!approvalRequested.ok) {
    return approvalRequested;
  }

  if (input.approval_decision_input === undefined) {
    return ok(finalizeWaitingApproval(input, draft, policyAdmissionDecision));
  }

  draft.steps.push(
    step(
      50,
      "EVALUATE_APPROVAL_GATE",
      "Approval gate v1 produced a descriptor decision.",
      "approval_gate_step",
    ),
  );

  const approvalResult = evaluateApprovalDecision(input, policyResult.value);

  if (!approvalResult.ok) {
    return approvalResult;
  }

  const approvalGateDecision = approvalDecisionRef(
    input.tenant_id,
    approvalResult.value,
  );

  const approvalDecided = addAuditMoments(draft, input, 160, [
    "APPROVAL_DECIDED",
  ]);

  if (!approvalDecided.ok) {
    return approvalDecided;
  }

  draft.steps.push(
    step(
      60,
      "APPLY_APPROVAL_LIFECYCLE",
      "Approval outcome was mapped to lifecycle intent.",
      "approval_lifecycle_step",
    ),
  );

  return applyApprovalTerminalFlow(
    input,
    draft,
    policyAdmissionDecision,
    approvalGateDecision,
  );
}

export function evaluateInternalRuntimeOrchestratorV1(
  input: unknown,
): Result<
  InternalRuntimeOrchestratorV1Decision,
  InternalRuntimeOrchestratorV1Denial
> {
  const parsed = InternalRuntimeOrchestratorV1InputSchema.safeParse(input);

  if (!parsed.success) {
    const tenantMismatch = parsed.error.issues.some((issue) =>
      issue.message.toLowerCase().includes("tenant scope mismatch"),
    );

    if (tenantMismatch) {
      return err(
        failClosedInternalRuntimeOrchestratorV1Denial(
          input,
          "INTERNAL_RUNTIME_ORCHESTRATOR_TENANT_MISMATCH",
        ),
      );
    }

    return err(denialForInvalidInput(input));
  }

  return evaluateValidatedInput(parsed.data);
}

export function assertInternalRuntimeOrchestratorV1(
  input: unknown,
): InternalRuntimeOrchestratorV1Decision {
  const result = evaluateInternalRuntimeOrchestratorV1(input);

  if (!result.ok) {
    throw new Error("Internal runtime orchestrator v1 decision denied.");
  }

  return result.value;
}

export function getInternalRuntimeOrchestratorV1Definition():
  InternalRuntimeOrchestratorV1Definition {
  return INTERNAL_RUNTIME_ORCHESTRATOR_V1;
}
