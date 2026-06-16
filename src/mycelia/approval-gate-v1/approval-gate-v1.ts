import { z } from "zod";

import {
  err,
  ok,
  CorrelationIdSchema,
  RunIdSchema,
  TenantIdSchema,
  type CorrelationId,
  type Result,
} from "../shared-kernel";
import { AuditReasonCodeSchema, SafeAuditMetadataSchema } from "../audit-record";
import {
  AuditCommitMomentSchema,
  type AuditCommitMoment,
} from "../audit-commit-boundary";
import {
  GovernedRunLifecycleIntentSchema,
  type GovernedRunLifecycleIntent,
} from "../governed-run-lifecycle";
import {
  PolicyAdmissionOutcomeSchema,
  PolicyAdmissionRiskLevelSchema,
  PolicyAdmissionSafeRefSchema,
} from "../policy-admission-v1";
import { RUNTIME_SLICE_APPROVAL_GATE_V1 } from "../runtime-slice-technical-plan";

export const APPROVAL_GATE_V1_PHASE = "2V";

export const APPROVAL_GATE_V1_NAME = "Approval Gate v1";

export const APPROVAL_GATE_V1_STATUS =
  "pure TypeScript deterministic approval gate logic only";

export const ApprovalGateRequestStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "TIMED_OUT",
  "CANCELLED",
] as const;

export type ApprovalGateRequestStatus =
  (typeof ApprovalGateRequestStatuses)[number];

export const ApprovalGateDecisionOutcomes = [
  "APPROVE",
  "REJECT",
  "TIMEOUT",
  "CANCEL",
] as const;

export type ApprovalGateDecisionOutcome =
  (typeof ApprovalGateDecisionOutcomes)[number];

export const ApprovalGateRequestStatusSchema = z.enum(
  ApprovalGateRequestStatuses,
);

export const ApprovalGateDecisionOutcomeSchema = z.enum(
  ApprovalGateDecisionOutcomes,
);

export const ApprovalGateV1InputSchema = z
  .object({
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
    approval_request_id: PolicyAdmissionSafeRefSchema,
    requested_role: PolicyAdmissionSafeRefSchema,
    requester_ref: PolicyAdmissionSafeRefSchema,
    approver_ref: PolicyAdmissionSafeRefSchema.optional(),
    current_status: ApprovalGateRequestStatusSchema,
    decision_outcome: ApprovalGateDecisionOutcomeSchema,
    decision_reason_code: AuditReasonCodeSchema,
    safe_decision_summary: PolicyAdmissionSafeRefSchema,
    policy_admission_outcome: PolicyAdmissionOutcomeSchema,
    risk_level: PolicyAdmissionRiskLevelSchema,
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.run_id === undefined && input.correlation_id === undefined) {
      context.addIssue({
        code: "custom",
        message: "run_id or correlation_id is required.",
        path: ["run_id"],
      });
    }
  });

export type ApprovalGateV1Input = z.infer<typeof ApprovalGateV1InputSchema>;

export type ApprovalGateV1InputCandidate = z.input<
  typeof ApprovalGateV1InputSchema
>;

export const ApprovalGateV1ReasonCodeSchema = z.enum([
  "APPROVAL_ACCEPTED",
  "APPROVAL_REJECTED",
  "APPROVAL_TIMED_OUT",
  "APPROVAL_CANCELLED",
]);

export type ApprovalGateV1ReasonCode = z.infer<
  typeof ApprovalGateV1ReasonCodeSchema
>;

export const ApprovalGateV1DenialCodeSchema = z.enum([
  "APPROVAL_GATE_INPUT_REQUIRED",
  "APPROVAL_GATE_INPUT_INVALID",
  "APPROVAL_GATE_TENANT_REQUIRED",
  "APPROVAL_GATE_SCOPE_REQUIRED",
  "APPROVAL_GATE_STATUS_NOT_PENDING",
  "APPROVAL_GATE_POLICY_ADMISSION_NOT_APPROVAL",
  "APPROVAL_GATE_UNSAFE_METADATA",
]);

export type ApprovalGateV1DenialCode = z.infer<
  typeof ApprovalGateV1DenialCodeSchema
>;

export const ApprovalGateV1PersistenceMappingSchema = z
  .object({
    approval_request: z.literal("ApprovalRequest"),
    admission_decision_record: z.literal("AdmissionDecisionRecord"),
    governed_run: z.literal("GovernedRun"),
    runtime_state_snapshot: z.literal("RuntimeStateSnapshot"),
    audit_record: z.literal("AuditRecord later"),
  })
  .strict();

export type ApprovalGateV1PersistenceMapping = z.infer<
  typeof ApprovalGateV1PersistenceMappingSchema
>;

export const ApprovalGateV1DecisionSchema = z
  .object({
    approval_request_id: PolicyAdmissionSafeRefSchema,
    previous_status: ApprovalGateRequestStatusSchema,
    next_status: ApprovalGateRequestStatusSchema,
    decision_outcome: ApprovalGateDecisionOutcomeSchema,
    reason_code: ApprovalGateV1ReasonCodeSchema,
    safe_reason: z.string().min(1).max(240),
    lifecycle_intent_hint: GovernedRunLifecycleIntentSchema,
    audit_boundary_moments: z.array(AuditCommitMomentSchema).length(2),
    persistence_mapping: ApprovalGateV1PersistenceMappingSchema,
    boundary_status: z.literal("descriptor decision only"),
  })
  .strict();

export type ApprovalGateV1Decision = z.infer<
  typeof ApprovalGateV1DecisionSchema
>;

export const ApprovalGateV1DenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    code: ApprovalGateV1DenialCodeSchema,
    message: z.literal("The approval gate input is not accepted."),
    safe_reason: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export type ApprovalGateV1Denial = z.infer<
  typeof ApprovalGateV1DenialSchema
>;

export type ApprovalGateV1RuleDescriptor = {
  readonly condition: string;
  readonly next_status: ApprovalGateRequestStatus | "DENIED";
  readonly lifecycle_intent_hint?: GovernedRunLifecycleIntent;
  readonly reason_code?: ApprovalGateV1ReasonCode;
};

export type ApprovalGateV1 = {
  readonly phase: typeof APPROVAL_GATE_V1_PHASE;
  readonly name: typeof APPROVAL_GATE_V1_NAME;
  readonly status: typeof APPROVAL_GATE_V1_STATUS;
  readonly request_statuses: readonly ApprovalGateRequestStatus[];
  readonly decision_outcomes: readonly ApprovalGateDecisionOutcome[];
  readonly deterministic_rules: readonly ApprovalGateV1RuleDescriptor[];
  readonly lifecycle_mapping: readonly string[];
  readonly audit_boundary_mapping: readonly string[];
  readonly persistence_mapping: readonly string[];
  readonly module_alignment: readonly string[];
  readonly plan_alignment: readonly string[];
  readonly explicitly_out_of_scope: readonly string[];
  readonly safety_boundary: readonly string[];
};

export const APPROVAL_GATE_V1_DETERMINISTIC_RULES = [
  {
    condition: "current status is not PENDING",
    next_status: "DENIED",
  },
  {
    condition: "policy admission outcome is not REQUIRE_APPROVAL",
    next_status: "DENIED",
  },
  {
    condition: "APPROVE from PENDING with REQUIRE_APPROVAL",
    next_status: "APPROVED",
    lifecycle_intent_hint: "APPROVE",
    reason_code: "APPROVAL_ACCEPTED",
  },
  {
    condition: "REJECT from PENDING with REQUIRE_APPROVAL",
    next_status: "REJECTED",
    lifecycle_intent_hint: "REJECT",
    reason_code: "APPROVAL_REJECTED",
  },
  {
    condition: "TIMEOUT from PENDING",
    next_status: "TIMED_OUT",
    lifecycle_intent_hint: "FAIL_RUN",
    reason_code: "APPROVAL_TIMED_OUT",
  },
  {
    condition: "CANCEL from PENDING",
    next_status: "CANCELLED",
    lifecycle_intent_hint: "CANCEL_RUN",
    reason_code: "APPROVAL_CANCELLED",
  },
] as const satisfies readonly ApprovalGateV1RuleDescriptor[];

export const APPROVAL_GATE_V1_LIFECYCLE_MAPPING = [
  "APPROVED maps to governed-run-lifecycle intent APPROVE",
  "REJECTED maps to governed-run-lifecycle intent REJECT",
  "TIMED_OUT maps to governed-run-lifecycle intent FAIL_RUN because timeout is an operational failure rather than a business rejection",
  "CANCELLED maps to governed-run-lifecycle intent CANCEL_RUN",
] as const;

export const APPROVAL_GATE_V1_AUDIT_BOUNDARY_MAPPING = [
  "approval request creation maps conceptually to APPROVAL_REQUESTED",
  "approve, reject, timeout and cancel decisions map conceptually to APPROVAL_DECIDED",
  "no audit record is written in this phase",
] as const;

export const APPROVAL_GATE_V1_PERSISTENCE_MAPPING = [
  "all approval decisions map conceptually to ApprovalRequest",
  "all approval decisions map conceptually to AdmissionDecisionRecord",
  "all approval decisions map conceptually to GovernedRun",
  "all approval decisions map conceptually to RuntimeStateSnapshot",
  "all approval decisions should become future AuditRecord moments",
] as const;

export const APPROVAL_GATE_V1_MODULE_ALIGNMENT = [
  "src/mycelia/policy-admission-v1/",
  "src/mycelia/governed-run-lifecycle/",
  "src/mycelia/audit-commit-boundary/",
  "src/mycelia/runtime-persistence-model/",
  "src/mycelia/runtime-slice-technical-plan/",
  "src/mycelia/runtime-admission-gateway/",
] as const;

export const APPROVAL_GATE_V1_EXPLICITLY_OUT_OF_SCOPE = [
  "no runtime execution",
  "no persistence",
  "no DB access",
  "no migrations",
  "no repository/service layer",
  "no API",
  "no auth",
  "no UI",
  "no event emission",
  "no audit record writing",
  "no append log writing",
  "no workflow execution",
  "no approval queue",
  "no replay execution",
  "no external integrations",
  "no tool execution",
  "no full user profile objects",
  "no raw approval comments",
  "no raw document content",
  "no export/PDF/download",
] as const;

export const APPROVAL_GATE_V1_SAFETY_BOUNDARY = [
  "this module evaluates approval decisions in memory only",
  "this module accepts safe bounded references only",
  "this module rejects payload-like fields through strict schemas",
  "this module returns deterministic decisions or safe denials",
  "this module maps timeout to FAIL_RUN because timeout is operational failure",
  "this module does not mutate input",
  "this module does not persist data",
  "this module does not emit events",
  "this module does not write audit records",
  "this module does not append audit logs",
  "this module does not call APIs or external services",
] as const;

export const APPROVAL_GATE_V1 = {
  phase: APPROVAL_GATE_V1_PHASE,
  name: APPROVAL_GATE_V1_NAME,
  status: APPROVAL_GATE_V1_STATUS,
  request_statuses: ApprovalGateRequestStatuses,
  decision_outcomes: ApprovalGateDecisionOutcomes,
  deterministic_rules: APPROVAL_GATE_V1_DETERMINISTIC_RULES,
  lifecycle_mapping: APPROVAL_GATE_V1_LIFECYCLE_MAPPING,
  audit_boundary_mapping: APPROVAL_GATE_V1_AUDIT_BOUNDARY_MAPPING,
  persistence_mapping: APPROVAL_GATE_V1_PERSISTENCE_MAPPING,
  module_alignment: APPROVAL_GATE_V1_MODULE_ALIGNMENT,
  plan_alignment: RUNTIME_SLICE_APPROVAL_GATE_V1.result_handling,
  explicitly_out_of_scope: APPROVAL_GATE_V1_EXPLICITLY_OUT_OF_SCOPE,
  safety_boundary: APPROVAL_GATE_V1_SAFETY_BOUNDARY,
} as const satisfies ApprovalGateV1;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function correlationIdFromInput(input: unknown): CorrelationId | undefined {
  if (!isRecord(input)) {
    return undefined;
  }

  const parsed = CorrelationIdSchema.safeParse(input.correlation_id);

  return parsed.success ? parsed.data : undefined;
}

function lifecycleIntentForStatus(
  status: ApprovalGateRequestStatus,
): GovernedRunLifecycleIntent {
  if (status === "APPROVED") {
    return "APPROVE";
  }

  if (status === "REJECTED") {
    return "REJECT";
  }

  if (status === "TIMED_OUT") {
    return "FAIL_RUN";
  }

  return "CANCEL_RUN";
}

function nextStatusForOutcome(
  outcome: ApprovalGateDecisionOutcome,
): ApprovalGateRequestStatus {
  if (outcome === "APPROVE") {
    return "APPROVED";
  }

  if (outcome === "REJECT") {
    return "REJECTED";
  }

  if (outcome === "TIMEOUT") {
    return "TIMED_OUT";
  }

  return "CANCELLED";
}

function reasonCodeForStatus(
  status: ApprovalGateRequestStatus,
): ApprovalGateV1ReasonCode {
  if (status === "APPROVED") {
    return "APPROVAL_ACCEPTED";
  }

  if (status === "REJECTED") {
    return "APPROVAL_REJECTED";
  }

  if (status === "TIMED_OUT") {
    return "APPROVAL_TIMED_OUT";
  }

  return "APPROVAL_CANCELLED";
}

function safeReasonForStatus(status: ApprovalGateRequestStatus): string {
  const reasons: Record<ApprovalGateRequestStatus, string> = {
    PENDING: "The approval request is awaiting a decision.",
    APPROVED: "The pending approval request was approved.",
    REJECTED: "The pending approval request was rejected.",
    TIMED_OUT:
      "The pending approval request timed out and maps to operational failure.",
    CANCELLED:
      "The pending approval request was cancelled before continuation.",
  };

  return reasons[status];
}

function createPersistenceMapping(): ApprovalGateV1PersistenceMapping {
  return ApprovalGateV1PersistenceMappingSchema.parse({
    approval_request: "ApprovalRequest",
    admission_decision_record: "AdmissionDecisionRecord",
    governed_run: "GovernedRun",
    runtime_state_snapshot: "RuntimeStateSnapshot",
    audit_record: "AuditRecord later",
  });
}

function auditBoundaryMoments(): readonly [AuditCommitMoment, AuditCommitMoment] {
  return ["APPROVAL_REQUESTED", "APPROVAL_DECIDED"];
}

function createDecision(
  input: ApprovalGateV1Input,
): ApprovalGateV1Decision {
  const nextStatus = nextStatusForOutcome(input.decision_outcome);

  return ApprovalGateV1DecisionSchema.parse({
    approval_request_id: input.approval_request_id,
    previous_status: input.current_status,
    next_status: nextStatus,
    decision_outcome: input.decision_outcome,
    reason_code: reasonCodeForStatus(nextStatus),
    safe_reason: safeReasonForStatus(nextStatus),
    lifecycle_intent_hint: lifecycleIntentForStatus(nextStatus),
    audit_boundary_moments: auditBoundaryMoments(),
    persistence_mapping: createPersistenceMapping(),
    boundary_status: "descriptor decision only",
  });
}

export function failClosedApprovalGateV1Denial(
  input?: unknown,
  code: ApprovalGateV1DenialCode = "APPROVAL_GATE_INPUT_INVALID",
): ApprovalGateV1Denial {
  const safeReasonByCode: Record<ApprovalGateV1DenialCode, string> = {
    APPROVAL_GATE_INPUT_REQUIRED: "An approval gate input is required.",
    APPROVAL_GATE_INPUT_INVALID:
      "The approval gate input is invalid or unsafe.",
    APPROVAL_GATE_TENANT_REQUIRED: "A tenant identity is required.",
    APPROVAL_GATE_SCOPE_REQUIRED:
      "A run or correlation scope is required.",
    APPROVAL_GATE_STATUS_NOT_PENDING:
      "Only pending approval requests may be resolved.",
    APPROVAL_GATE_POLICY_ADMISSION_NOT_APPROVAL:
      "Approval gate resolution requires an approval-required admission outcome.",
    APPROVAL_GATE_UNSAFE_METADATA: "The approval gate metadata is unsafe.",
  };

  return ApprovalGateV1DenialSchema.parse({
    outcome: "DENIED",
    code,
    message: "The approval gate input is not accepted.",
    safe_reason: safeReasonByCode[code],
    correlation_id: correlationIdFromInput(input),
    safe: true,
  });
}

function denialForInvalidInput(input: unknown): ApprovalGateV1Denial {
  if (!isRecord(input)) {
    return failClosedApprovalGateV1Denial(
      input,
      "APPROVAL_GATE_INPUT_REQUIRED",
    );
  }

  if (input.tenant_id === undefined) {
    return failClosedApprovalGateV1Denial(
      input,
      "APPROVAL_GATE_TENANT_REQUIRED",
    );
  }

  if (input.run_id === undefined && input.correlation_id === undefined) {
    return failClosedApprovalGateV1Denial(
      input,
      "APPROVAL_GATE_SCOPE_REQUIRED",
    );
  }

  if (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  ) {
    return failClosedApprovalGateV1Denial(
      input,
      "APPROVAL_GATE_UNSAFE_METADATA",
    );
  }

  return failClosedApprovalGateV1Denial(input);
}

function validateGateState(input: ApprovalGateV1Input): ApprovalGateV1Denial | undefined {
  if (input.current_status !== "PENDING") {
    return failClosedApprovalGateV1Denial(
      input,
      "APPROVAL_GATE_STATUS_NOT_PENDING",
    );
  }

  if (input.policy_admission_outcome !== "REQUIRE_APPROVAL") {
    return failClosedApprovalGateV1Denial(
      input,
      "APPROVAL_GATE_POLICY_ADMISSION_NOT_APPROVAL",
    );
  }

  return undefined;
}

export function evaluateApprovalGateV1(
  input: unknown,
): Result<ApprovalGateV1Decision, ApprovalGateV1Denial> {
  const parsed = ApprovalGateV1InputSchema.safeParse(input);

  if (!parsed.success) {
    return err(denialForInvalidInput(input));
  }

  const gateDenial = validateGateState(parsed.data);

  if (gateDenial !== undefined) {
    return err(gateDenial);
  }

  return ok(createDecision(parsed.data));
}

export function assertApprovalGateV1(
  input: unknown,
): ApprovalGateV1Decision {
  const result = evaluateApprovalGateV1(input);

  if (!result.ok) {
    throw new Error("Approval gate v1 decision denied.");
  }

  return result.value;
}

export function getApprovalGateV1(): ApprovalGateV1 {
  return APPROVAL_GATE_V1;
}
