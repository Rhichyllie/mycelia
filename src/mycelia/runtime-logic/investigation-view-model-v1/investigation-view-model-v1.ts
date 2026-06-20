import { z } from "zod";

import {
  err,
  ok,
  CorrelationIdSchema,
  RunIdSchema,
  TenantIdSchema,
  type CorrelationId,
  type Result,
} from "../../foundation/shared-kernel";
import {
  AuditCommitBoundaryDecisionSchema,
  AuditCommitMomentSchema,
  type AuditCommitBoundaryDecision,
  type AuditCommitMoment,
} from "../../runtime-logic/audit-commit-boundary";
import { SafeAuditMetadataSchema } from "../../domain-contracts/audit-record";
import {
  ApprovalGateV1DecisionSchema,
  type ApprovalGateV1Decision,
} from "../../runtime-logic/approval-gate-v1";
import {
  GovernedRunLifecycleDecisionSchema,
  GovernedRunLifecycleStateSchema,
  GovernedRunLifecycleTerminalStates,
  type GovernedRunLifecycleDecision,
  type GovernedRunLifecycleState,
} from "../../runtime-logic/governed-run-lifecycle";
import {
  PolicyAdmissionSafeRefSchema,
  PolicyAdmissionV1DecisionSchema,
  type PolicyAdmissionV1Decision,
} from "../../runtime-logic/policy-admission-v1";
import {
  RUNTIME_PERSISTENCE_RECORD_NAMES,
  RuntimePersistenceRunStateSchema,
  type RuntimePersistenceRecordName,
} from "../../persistence/runtime-persistence-model";

export const INVESTIGATION_VIEW_MODEL_V1_PHASE = "2W";

export const INVESTIGATION_VIEW_MODEL_V1_NAME =
  "Investigation View Model v1";

export const INVESTIGATION_VIEW_MODEL_V1_STATUS =
  "pure TypeScript investigation read model only";

export const InvestigationViewSections = [
  "overview",
  "runStatus",
  "timeline",
  "policyAdmission",
  "approval",
  "auditCoverage",
  "persistenceRefs",
  "openQuestions",
  "limitations",
  "nextActions",
] as const;

export type InvestigationViewSection =
  (typeof InvestigationViewSections)[number];

export const InvestigationFindingSeverities = [
  "INFO",
  "WARNING",
  "BLOCKER",
] as const;

export type InvestigationFindingSeverity =
  (typeof InvestigationFindingSeverities)[number];

export const InvestigationCompletenessStatuses = [
  "COMPLETE",
  "INCOMPLETE",
  "BLOCKED",
] as const;

export type InvestigationCompletenessStatus =
  (typeof InvestigationCompletenessStatuses)[number];

export const InvestigationTimelineSourceTypes = [
  "LIFECYCLE",
  "POLICY_ADMISSION",
  "APPROVAL_GATE",
  "AUDIT_BOUNDARY",
] as const;

export type InvestigationTimelineSourceType =
  (typeof InvestigationTimelineSourceTypes)[number];

export const InvestigationViewSectionSchema = z.enum(
  InvestigationViewSections,
);

export const InvestigationFindingSeveritySchema = z.enum(
  InvestigationFindingSeverities,
);

export const InvestigationCompletenessStatusSchema = z.enum(
  InvestigationCompletenessStatuses,
);

export const InvestigationTimelineSourceTypeSchema = z.enum(
  InvestigationTimelineSourceTypes,
);

const MAX_INVESTIGATION_VIEW_TEXT_LENGTH = 240;
const INVESTIGATION_VIEW_UNSAFE_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|blob|connection[_-]?string|credential|display[_-]?name|download|email|external[_-]?id|password|path|permission|policy[_-]?internals|private[_-]?key|raw|secret|shell|sql|sudo|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name|prefix)/i;

export const InvestigationViewSafeTextSchema = z
  .string()
  .min(1, "investigation view text is required.")
  .max(
    MAX_INVESTIGATION_VIEW_TEXT_LENGTH,
    `investigation view text must not exceed ${MAX_INVESTIGATION_VIEW_TEXT_LENGTH} characters.`,
  )
  .refine(
    (value) => value.trim() === value,
    "investigation view text must not contain leading or trailing whitespace.",
  )
  .refine(
    (value) => !INVESTIGATION_VIEW_UNSAFE_TEXT_PATTERN.test(value),
    "investigation view text must be bounded and non-enumerating.",
  );

export const InvestigationViewPersistenceRecordNameSchema = z.enum(
  RUNTIME_PERSISTENCE_RECORD_NAMES,
);

export const InvestigationViewGovernedRunRefSchema = z
  .object({
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
    ref: PolicyAdmissionSafeRefSchema,
    current_state: RuntimePersistenceRunStateSchema,
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

export type InvestigationViewGovernedRunRef = z.infer<
  typeof InvestigationViewGovernedRunRefSchema
>;

export const InvestigationLifecycleDecisionRefSchema = z
  .object({
    sequence: z.number().int().positive(),
    tenant_id: TenantIdSchema,
    descriptor_ref: PolicyAdmissionSafeRefSchema,
    decision: GovernedRunLifecycleDecisionSchema,
  })
  .strict();

export type InvestigationLifecycleDecisionRef = z.infer<
  typeof InvestigationLifecycleDecisionRefSchema
>;

export const InvestigationPolicyAdmissionDecisionRefSchema = z
  .object({
    sequence: z.number().int().positive(),
    tenant_id: TenantIdSchema,
    descriptor_ref: PolicyAdmissionSafeRefSchema,
    decision: PolicyAdmissionV1DecisionSchema,
  })
  .strict();

export type InvestigationPolicyAdmissionDecisionRef = z.infer<
  typeof InvestigationPolicyAdmissionDecisionRefSchema
>;

export const InvestigationApprovalGateDecisionRefSchema = z
  .object({
    sequence: z.number().int().positive(),
    tenant_id: TenantIdSchema,
    descriptor_ref: PolicyAdmissionSafeRefSchema,
    decision: ApprovalGateV1DecisionSchema,
  })
  .strict();

export type InvestigationApprovalGateDecisionRef = z.infer<
  typeof InvestigationApprovalGateDecisionRefSchema
>;

export const InvestigationAuditBoundaryDecisionRefSchema = z
  .object({
    sequence: z.number().int().positive(),
    tenant_id: TenantIdSchema,
    descriptor_ref: PolicyAdmissionSafeRefSchema,
    decision: AuditCommitBoundaryDecisionSchema,
  })
  .strict();

export type InvestigationAuditBoundaryDecisionRef = z.infer<
  typeof InvestigationAuditBoundaryDecisionRefSchema
>;

export const InvestigationPersistenceRecordRefSchema = z
  .object({
    record: InvestigationViewPersistenceRecordNameSchema,
    tenant_id: TenantIdSchema,
    ref: PolicyAdmissionSafeRefSchema,
  })
  .strict();

export type InvestigationPersistenceRecordRef = z.infer<
  typeof InvestigationPersistenceRecordRefSchema
>;

export const InvestigationViewModelV1InputSchema = z
  .object({
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
    governed_run_ref: InvestigationViewGovernedRunRefSchema,
    lifecycle_decisions: z
      .array(InvestigationLifecycleDecisionRefSchema)
      .min(1),
    policy_admission_decision: InvestigationPolicyAdmissionDecisionRefSchema,
    approval_gate_decision:
      InvestigationApprovalGateDecisionRefSchema.optional(),
    audit_boundary_decisions: z
      .array(InvestigationAuditBoundaryDecisionRefSchema)
      .min(1),
    persistence_record_refs: z
      .array(InvestigationPersistenceRecordRefSchema)
      .min(1),
    investigation_purpose: InvestigationViewSafeTextSchema,
    requested_by_ref: PolicyAdmissionSafeRefSchema,
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

    if (input.governed_run_ref.tenant_id !== input.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "tenant scope mismatch.",
        path: ["governed_run_ref", "tenant_id"],
      });
    }

    if (
      input.run_id !== undefined &&
      input.governed_run_ref.run_id !== undefined &&
      input.governed_run_ref.run_id !== input.run_id
    ) {
      context.addIssue({
        code: "custom",
        message: "run scope mismatch.",
        path: ["governed_run_ref", "run_id"],
      });
    }

    if (
      input.correlation_id !== undefined &&
      input.governed_run_ref.correlation_id !== undefined &&
      input.governed_run_ref.correlation_id !== input.correlation_id
    ) {
      context.addIssue({
        code: "custom",
        message: "correlation scope mismatch.",
        path: ["governed_run_ref", "correlation_id"],
      });
    }

    input.lifecycle_decisions.forEach((decision, index) => {
      if (decision.tenant_id !== input.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "tenant scope mismatch.",
          path: ["lifecycle_decisions", index, "tenant_id"],
        });
      }
    });

    if (input.policy_admission_decision.tenant_id !== input.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "tenant scope mismatch.",
        path: ["policy_admission_decision", "tenant_id"],
      });
    }

    if (
      input.approval_gate_decision !== undefined &&
      input.approval_gate_decision.tenant_id !== input.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "tenant scope mismatch.",
        path: ["approval_gate_decision", "tenant_id"],
      });
    }

    input.audit_boundary_decisions.forEach((decision, index) => {
      if (decision.tenant_id !== input.tenant_id) {
        context.addIssue({
          code: "custom",
          message: "tenant scope mismatch.",
          path: ["audit_boundary_decisions", index, "tenant_id"],
        });
      }
    });

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

export type InvestigationViewModelV1Input = z.infer<
  typeof InvestigationViewModelV1InputSchema
>;

export type InvestigationViewModelV1InputCandidate = z.input<
  typeof InvestigationViewModelV1InputSchema
>;

export const InvestigationViewModelV1DenialCodeSchema = z.enum([
  "INVESTIGATION_VIEW_INPUT_REQUIRED",
  "INVESTIGATION_VIEW_INPUT_INVALID",
  "INVESTIGATION_VIEW_TENANT_REQUIRED",
  "INVESTIGATION_VIEW_SCOPE_REQUIRED",
  "INVESTIGATION_VIEW_GOVERNED_RUN_REF_REQUIRED",
  "INVESTIGATION_VIEW_LIFECYCLE_REQUIRED",
  "INVESTIGATION_VIEW_POLICY_ADMISSION_REQUIRED",
  "INVESTIGATION_VIEW_APPROVAL_REQUIRED",
  "INVESTIGATION_VIEW_AUDIT_COVERAGE_REQUIRED",
  "INVESTIGATION_VIEW_TENANT_MISMATCH",
  "INVESTIGATION_VIEW_UNSAFE_METADATA",
]);

export type InvestigationViewModelV1DenialCode = z.infer<
  typeof InvestigationViewModelV1DenialCodeSchema
>;

export const InvestigationFindingV1Schema = z
  .object({
    severity: InvestigationFindingSeveritySchema,
    code: PolicyAdmissionSafeRefSchema,
    safe_summary: InvestigationViewSafeTextSchema,
    related_section: InvestigationViewSectionSchema,
  })
  .strict();

export type InvestigationFindingV1 = z.infer<
  typeof InvestigationFindingV1Schema
>;

export const InvestigationTimelineEntryV1Schema = z
  .object({
    sequence: z.number().int().positive(),
    source_type: InvestigationTimelineSourceTypeSchema,
    source_ref: PolicyAdmissionSafeRefSchema,
    title: InvestigationViewSafeTextSchema,
    safe_summary: InvestigationViewSafeTextSchema,
    section: InvestigationViewSectionSchema,
  })
  .strict();

export type InvestigationTimelineEntryV1 = z.infer<
  typeof InvestigationTimelineEntryV1Schema
>;

export const InvestigationViewSectionDescriptorSchema = z
  .object({
    section: InvestigationViewSectionSchema,
    title: InvestigationViewSafeTextSchema,
    safe_summary: InvestigationViewSafeTextSchema,
  })
  .strict();

export type InvestigationViewSectionDescriptor = z.infer<
  typeof InvestigationViewSectionDescriptorSchema
>;

export const InvestigationViewModelV1Schema = z
  .object({
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
    governed_run_ref: PolicyAdmissionSafeRefSchema,
    section_keys: z.array(InvestigationViewSectionSchema).length(10),
    sections: z.array(InvestigationViewSectionDescriptorSchema).length(10),
    timeline: z.array(InvestigationTimelineEntryV1Schema),
    policy_outcome: PolicyAdmissionV1DecisionSchema.shape.outcome,
    current_state: GovernedRunLifecycleStateSchema,
    persistence_records: z.array(InvestigationViewPersistenceRecordNameSchema),
    audit_moments: z.array(AuditCommitMomentSchema),
    boundary_status: z.literal("descriptor view only"),
  })
  .strict();

export type InvestigationViewModelV1 = z.infer<
  typeof InvestigationViewModelV1Schema
>;

export const InvestigationViewModelV1DecisionSchema = z
  .object({
    investigation_view: InvestigationViewModelV1Schema,
    findings: z.array(InvestigationFindingV1Schema),
    completeness_status: InvestigationCompletenessStatusSchema,
    safe_summary: InvestigationViewSafeTextSchema,
    source_descriptor_refs: z.array(PolicyAdmissionSafeRefSchema),
    limitation_notes: z.array(InvestigationViewSafeTextSchema),
  })
  .strict();

export type InvestigationViewModelV1Decision = z.infer<
  typeof InvestigationViewModelV1DecisionSchema
>;

export const InvestigationViewModelV1DenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    code: InvestigationViewModelV1DenialCodeSchema,
    message: z.literal("The investigation view model input is not accepted."),
    safe_reason: InvestigationViewSafeTextSchema,
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export type InvestigationViewModelV1Denial = z.infer<
  typeof InvestigationViewModelV1DenialSchema
>;

export type InvestigationViewModelV1Definition = {
  readonly phase: typeof INVESTIGATION_VIEW_MODEL_V1_PHASE;
  readonly name: typeof INVESTIGATION_VIEW_MODEL_V1_NAME;
  readonly status: typeof INVESTIGATION_VIEW_MODEL_V1_STATUS;
  readonly sections: readonly InvestigationViewSection[];
  readonly finding_severities: readonly InvestigationFindingSeverity[];
  readonly completeness_statuses: readonly InvestigationCompletenessStatus[];
  readonly core_required_descriptors: readonly string[];
  readonly timeline_sources: readonly InvestigationTimelineSourceType[];
  readonly module_alignment: readonly string[];
  readonly explicitly_out_of_scope: readonly string[];
  readonly safety_boundary: readonly string[];
};

export const INVESTIGATION_VIEW_MODEL_V1_CORE_REQUIRED_DESCRIPTORS = [
  "governed run reference",
  "lifecycle decision descriptors",
  "policy/admission decision descriptor",
  "audit boundary descriptor for POLICY_EVALUATED",
  "audit boundary descriptor for ADMISSION_DECIDED",
] as const;

export const INVESTIGATION_VIEW_MODEL_V1_MODULE_ALIGNMENT = [
  "src/mycelia/domain-contracts/investigation-bundle/",
  "src/mycelia/domain-contracts/audit-timeline/",
  "src/mycelia/domain-contracts/audit-record/",
  "src/mycelia/runtime-logic/audit-commit-boundary/",
  "src/mycelia/runtime-logic/approval-gate-v1/",
  "src/mycelia/runtime-logic/policy-admission-v1/",
  "src/mycelia/runtime-logic/governed-run-lifecycle/",
  "src/mycelia/persistence/runtime-persistence-model/",
  "src/mycelia/planning/runtime-slice-technical-plan/",
] as const;

export const INVESTIGATION_VIEW_MODEL_V1_EXPLICITLY_OUT_OF_SCOPE = [
  "no runtime execution",
  "no persistence",
  "no DB reads",
  "no migrations",
  "no repository/service layer",
  "no API",
  "no auth",
  "no UI",
  "no event emission",
  "no audit writing",
  "no append log writing",
  "no workflow execution",
  "no replay execution",
  "no external integrations",
  "no tool execution",
  "no raw document content",
  "no export/PDF/download",
] as const;

export const INVESTIGATION_VIEW_MODEL_V1_SAFETY_BOUNDARY = [
  "this module assembles investigation descriptors in memory only",
  "this module accepts safe bounded references only",
  "this module denies missing core descriptors",
  "this module does not infer hidden facts from absent descriptors",
  "this module does not mutate input",
  "this module does not persist data",
  "this module does not query storage",
  "this module does not emit events",
  "this module does not write audit records",
  "this module does not call APIs or external integrations",
] as const;

export const INVESTIGATION_VIEW_MODEL_V1 = {
  phase: INVESTIGATION_VIEW_MODEL_V1_PHASE,
  name: INVESTIGATION_VIEW_MODEL_V1_NAME,
  status: INVESTIGATION_VIEW_MODEL_V1_STATUS,
  sections: InvestigationViewSections,
  finding_severities: InvestigationFindingSeverities,
  completeness_statuses: InvestigationCompletenessStatuses,
  core_required_descriptors:
    INVESTIGATION_VIEW_MODEL_V1_CORE_REQUIRED_DESCRIPTORS,
  timeline_sources: InvestigationTimelineSourceTypes,
  module_alignment: INVESTIGATION_VIEW_MODEL_V1_MODULE_ALIGNMENT,
  explicitly_out_of_scope:
    INVESTIGATION_VIEW_MODEL_V1_EXPLICITLY_OUT_OF_SCOPE,
  safety_boundary: INVESTIGATION_VIEW_MODEL_V1_SAFETY_BOUNDARY,
} as const satisfies InvestigationViewModelV1Definition;

const terminalStateSet = new Set<GovernedRunLifecycleState>(
  GovernedRunLifecycleTerminalStates,
);

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

function hasOwn(input: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

export function failClosedInvestigationViewModelV1Denial(
  input?: unknown,
  code: InvestigationViewModelV1DenialCode =
    "INVESTIGATION_VIEW_INPUT_INVALID",
): InvestigationViewModelV1Denial {
  const safeReasonByCode: Record<InvestigationViewModelV1DenialCode, string> = {
    INVESTIGATION_VIEW_INPUT_REQUIRED:
      "An investigation view model input is required.",
    INVESTIGATION_VIEW_INPUT_INVALID:
      "The investigation view model input is invalid or unsafe.",
    INVESTIGATION_VIEW_TENANT_REQUIRED:
      "A tenant identity is required.",
    INVESTIGATION_VIEW_SCOPE_REQUIRED:
      "A run or correlation scope is required.",
    INVESTIGATION_VIEW_GOVERNED_RUN_REF_REQUIRED:
      "A governed run reference is required.",
    INVESTIGATION_VIEW_LIFECYCLE_REQUIRED:
      "Lifecycle decision descriptors are required.",
    INVESTIGATION_VIEW_POLICY_ADMISSION_REQUIRED:
      "A policy admission decision descriptor is required.",
    INVESTIGATION_VIEW_APPROVAL_REQUIRED:
      "An approval descriptor is required for approval outcomes.",
    INVESTIGATION_VIEW_AUDIT_COVERAGE_REQUIRED:
      "Required audit boundary coverage is missing.",
    INVESTIGATION_VIEW_TENANT_MISMATCH:
      "Descriptor tenant scope does not match.",
    INVESTIGATION_VIEW_UNSAFE_METADATA:
      "The investigation metadata is unsafe.",
  };

  return InvestigationViewModelV1DenialSchema.parse({
    outcome: "DENIED",
    code,
    message: "The investigation view model input is not accepted.",
    safe_reason: safeReasonByCode[code],
    correlation_id: correlationIdFromInput(input),
    safe: true,
  });
}

function denialForInvalidInput(input: unknown): InvestigationViewModelV1Denial {
  if (!isRecord(input)) {
    return failClosedInvestigationViewModelV1Denial(
      input,
      "INVESTIGATION_VIEW_INPUT_REQUIRED",
    );
  }

  if (input.tenant_id === undefined) {
    return failClosedInvestigationViewModelV1Denial(
      input,
      "INVESTIGATION_VIEW_TENANT_REQUIRED",
    );
  }

  if (input.run_id === undefined && input.correlation_id === undefined) {
    return failClosedInvestigationViewModelV1Denial(
      input,
      "INVESTIGATION_VIEW_SCOPE_REQUIRED",
    );
  }

  if (!hasOwn(input, "governed_run_ref")) {
    return failClosedInvestigationViewModelV1Denial(
      input,
      "INVESTIGATION_VIEW_GOVERNED_RUN_REF_REQUIRED",
    );
  }

  if (
    !Array.isArray(input.lifecycle_decisions) ||
    input.lifecycle_decisions.length === 0
  ) {
    return failClosedInvestigationViewModelV1Denial(
      input,
      "INVESTIGATION_VIEW_LIFECYCLE_REQUIRED",
    );
  }

  if (!hasOwn(input, "policy_admission_decision")) {
    return failClosedInvestigationViewModelV1Denial(
      input,
      "INVESTIGATION_VIEW_POLICY_ADMISSION_REQUIRED",
    );
  }

  if (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  ) {
    return failClosedInvestigationViewModelV1Denial(
      input,
      "INVESTIGATION_VIEW_UNSAFE_METADATA",
    );
  }

  return failClosedInvestigationViewModelV1Denial(input);
}

function hasAuditMoment(
  input: InvestigationViewModelV1Input,
  moment: AuditCommitMoment,
): boolean {
  return input.audit_boundary_decisions.some(
    (decision) => decision.decision.moment === moment,
  );
}

function validateCoreCoverage(
  input: InvestigationViewModelV1Input,
): InvestigationViewModelV1Denial | undefined {
  if (
    input.policy_admission_decision.decision.requires_approval &&
    input.approval_gate_decision === undefined
  ) {
    return failClosedInvestigationViewModelV1Denial(
      input,
      "INVESTIGATION_VIEW_APPROVAL_REQUIRED",
    );
  }

  if (
    !hasAuditMoment(input, "POLICY_EVALUATED") ||
    !hasAuditMoment(input, "ADMISSION_DECIDED")
  ) {
    return failClosedInvestigationViewModelV1Denial(
      input,
      "INVESTIGATION_VIEW_AUDIT_COVERAGE_REQUIRED",
    );
  }

  return undefined;
}

function titleForLifecycleDecision(
  decision: GovernedRunLifecycleDecision,
): string {
  return `Lifecycle ${decision.current_state} to ${decision.next_state}`;
}

function summaryForLifecycleDecision(
  decision: GovernedRunLifecycleDecision,
): string {
  return `Intent ${decision.intent} moved state to ${decision.next_state}.`;
}

function titleForPolicyDecision(decision: PolicyAdmissionV1Decision): string {
  return `Policy admission ${decision.outcome}`;
}

function summaryForPolicyDecision(decision: PolicyAdmissionV1Decision): string {
  return `Risk ${decision.risk_level} produced outcome ${decision.outcome}.`;
}

function titleForApprovalDecision(decision: ApprovalGateV1Decision): string {
  return `Approval ${decision.next_status}`;
}

function summaryForApprovalDecision(decision: ApprovalGateV1Decision): string {
  return `Approval moved from ${decision.previous_status} to ${decision.next_status}.`;
}

function titleForAuditDecision(decision: AuditCommitBoundaryDecision): string {
  return `Audit boundary ${decision.moment}`;
}

function summaryForAuditDecision(
  decision: AuditCommitBoundaryDecision,
): string {
  return `Audit requirement ${decision.requirement} for ${decision.moment}.`;
}

function timelineRank(sourceType: InvestigationTimelineSourceType): number {
  const ranks: Record<InvestigationTimelineSourceType, number> = {
    LIFECYCLE: 1,
    POLICY_ADMISSION: 2,
    APPROVAL_GATE: 3,
    AUDIT_BOUNDARY: 4,
  };

  return ranks[sourceType];
}

function createTimeline(
  input: InvestigationViewModelV1Input,
): InvestigationTimelineEntryV1[] {
  const lifecycleEntries = input.lifecycle_decisions.map((entry) =>
    InvestigationTimelineEntryV1Schema.parse({
      sequence: entry.sequence,
      source_type: "LIFECYCLE",
      source_ref: entry.descriptor_ref,
      title: titleForLifecycleDecision(entry.decision),
      safe_summary: summaryForLifecycleDecision(entry.decision),
      section: "runStatus",
    }),
  );

  const policyEntry = InvestigationTimelineEntryV1Schema.parse({
    sequence: input.policy_admission_decision.sequence,
    source_type: "POLICY_ADMISSION",
    source_ref: input.policy_admission_decision.descriptor_ref,
    title: titleForPolicyDecision(input.policy_admission_decision.decision),
    safe_summary: summaryForPolicyDecision(
      input.policy_admission_decision.decision,
    ),
    section: "policyAdmission",
  });

  const approvalEntries =
    input.approval_gate_decision === undefined
      ? []
      : [
          InvestigationTimelineEntryV1Schema.parse({
            sequence: input.approval_gate_decision.sequence,
            source_type: "APPROVAL_GATE",
            source_ref: input.approval_gate_decision.descriptor_ref,
            title: titleForApprovalDecision(
              input.approval_gate_decision.decision,
            ),
            safe_summary: summaryForApprovalDecision(
              input.approval_gate_decision.decision,
            ),
            section: "approval",
          }),
        ];

  const auditEntries = input.audit_boundary_decisions.map((entry) =>
    InvestigationTimelineEntryV1Schema.parse({
      sequence: entry.sequence,
      source_type: "AUDIT_BOUNDARY",
      source_ref: entry.descriptor_ref,
      title: titleForAuditDecision(entry.decision),
      safe_summary: summaryForAuditDecision(entry.decision),
      section: "auditCoverage",
    }),
  );

  return [
    ...lifecycleEntries,
    policyEntry,
    ...approvalEntries,
    ...auditEntries,
  ].sort((left, right) => {
    if (left.sequence !== right.sequence) {
      return left.sequence - right.sequence;
    }

    return timelineRank(left.source_type) - timelineRank(right.source_type);
  });
}

function latestLifecycleDecision(
  input: InvestigationViewModelV1Input,
): GovernedRunLifecycleDecision {
  return input.lifecycle_decisions
    .slice()
    .sort((left, right) => right.sequence - left.sequence)[0].decision;
}

function hasTerminalLifecycleDecision(
  input: InvestigationViewModelV1Input,
): boolean {
  return input.lifecycle_decisions.some((entry) =>
    terminalStateSet.has(entry.decision.next_state),
  );
}

function createFindings(
  input: InvestigationViewModelV1Input,
): InvestigationFindingV1[] {
  const findings: InvestigationFindingV1[] = [
    InvestigationFindingV1Schema.parse({
      severity: "INFO",
      code: "INVESTIGATION_REPLAY_PLANNED_LATER",
      safe_summary:
        "Investigation and replay preparation remain descriptor planning only.",
      related_section: "limitations",
    }),
  ];

  if (!hasTerminalLifecycleDecision(input)) {
    findings.push(
      InvestigationFindingV1Schema.parse({
        severity: "WARNING",
        code: "LIFECYCLE_NOT_TERMINAL",
        safe_summary:
          "Lifecycle coverage does not include a terminal run state.",
        related_section: "runStatus",
      }),
    );
  }

  return findings;
}

function completenessForFindings(
  findings: readonly InvestigationFindingV1[],
): InvestigationCompletenessStatus {
  if (findings.some((finding) => finding.severity === "BLOCKER")) {
    return "BLOCKED";
  }

  if (findings.some((finding) => finding.severity === "WARNING")) {
    return "INCOMPLETE";
  }

  return "COMPLETE";
}

function sortedUniquePersistenceRecords(
  input: InvestigationViewModelV1Input,
): RuntimePersistenceRecordName[] {
  const records = new Set<RuntimePersistenceRecordName>(
    input.persistence_record_refs.map((record) => record.record),
  );

  return RUNTIME_PERSISTENCE_RECORD_NAMES.filter((record) =>
    records.has(record),
  );
}

function sortedUniqueAuditMoments(
  input: InvestigationViewModelV1Input,
): AuditCommitMoment[] {
  const moments = new Set<AuditCommitMoment>(
    input.audit_boundary_decisions.map((decision) => decision.decision.moment),
  );

  return input.audit_boundary_decisions
    .map((decision) => decision.decision.moment)
    .filter((moment, index, allMoments) => allMoments.indexOf(moment) === index)
    .sort((left, right) => {
      const leftIndex = Array.from(moments).indexOf(left);
      const rightIndex = Array.from(moments).indexOf(right);

      return leftIndex - rightIndex;
    });
}

function sourceDescriptorRefs(
  input: InvestigationViewModelV1Input,
): string[] {
  return [
    input.governed_run_ref.ref,
    ...input.lifecycle_decisions.map((decision) => decision.descriptor_ref),
    input.policy_admission_decision.descriptor_ref,
    ...(input.approval_gate_decision === undefined
      ? []
      : [input.approval_gate_decision.descriptor_ref]),
    ...input.audit_boundary_decisions.map((decision) => decision.descriptor_ref),
    ...input.persistence_record_refs.map((record) => record.ref),
  ];
}

function sectionSummary(
  section: InvestigationViewSection,
  input: InvestigationViewModelV1Input,
  timeline: readonly InvestigationTimelineEntryV1[],
): string {
  const latestDecision = latestLifecycleDecision(input);
  const policyDecision = input.policy_admission_decision.decision;
  const persistenceRecords = sortedUniquePersistenceRecords(input);
  const auditMoments = sortedUniqueAuditMoments(input);

  const summaries: Record<InvestigationViewSection, string> = {
    overview: "Investigation view assembled from provided descriptors.",
    runStatus: `Current run state is ${latestDecision.next_state}.`,
    timeline: `Timeline contains ${timeline.length} provided descriptor entries.`,
    policyAdmission: `Policy admission outcome is ${policyDecision.outcome}.`,
    approval:
      input.approval_gate_decision === undefined
        ? "Approval descriptor is not required for this policy outcome."
        : `Approval status is ${input.approval_gate_decision.decision.next_status}.`,
    auditCoverage: `Audit boundary coverage includes ${auditMoments.length} moments.`,
    persistenceRefs: `Persistence reference set includes ${persistenceRecords.length} record types.`,
    openQuestions: "Open findings are represented without hidden inference.",
    limitations:
      "Descriptor view only, without runtime execution or storage queries.",
    nextActions: "Use this model to guide future investigation UI planning.",
  };

  return summaries[section];
}

function sectionTitle(section: InvestigationViewSection): string {
  const titles: Record<InvestigationViewSection, string> = {
    overview: "Overview",
    runStatus: "Run status",
    timeline: "Timeline",
    policyAdmission: "Policy admission",
    approval: "Approval",
    auditCoverage: "Audit coverage",
    persistenceRefs: "Persistence refs",
    openQuestions: "Open questions",
    limitations: "Limitations",
    nextActions: "Next actions",
  };

  return titles[section];
}

function createSections(
  input: InvestigationViewModelV1Input,
  timeline: readonly InvestigationTimelineEntryV1[],
): InvestigationViewSectionDescriptor[] {
  return InvestigationViewSections.map((section) =>
    InvestigationViewSectionDescriptorSchema.parse({
      section,
      title: sectionTitle(section),
      safe_summary: sectionSummary(section, input, timeline),
    }),
  );
}

function createInvestigationView(
  input: InvestigationViewModelV1Input,
  timeline: readonly InvestigationTimelineEntryV1[],
): InvestigationViewModelV1 {
  const latestDecision = latestLifecycleDecision(input);

  return InvestigationViewModelV1Schema.parse({
    tenant_id: input.tenant_id,
    run_id: input.run_id,
    correlation_id: input.correlation_id,
    governed_run_ref: input.governed_run_ref.ref,
    section_keys: InvestigationViewSections,
    sections: createSections(input, timeline),
    timeline,
    policy_outcome: input.policy_admission_decision.decision.outcome,
    current_state: latestDecision.next_state,
    persistence_records: sortedUniquePersistenceRecords(input),
    audit_moments: sortedUniqueAuditMoments(input),
    boundary_status: "descriptor view only",
  });
}

function createDecision(
  input: InvestigationViewModelV1Input,
): InvestigationViewModelV1Decision {
  const timeline = createTimeline(input);
  const findings = createFindings(input);

  return InvestigationViewModelV1DecisionSchema.parse({
    investigation_view: createInvestigationView(input, timeline),
    findings,
    completeness_status: completenessForFindings(findings),
    safe_summary:
      "Investigation view model assembled from safe provided descriptors.",
    source_descriptor_refs: sourceDescriptorRefs(input),
    limitation_notes: [
      "This view does not query databases.",
      "This view does not infer missing events.",
      "This view does not write audit records.",
      "This view does not execute runtime.",
    ],
  });
}

export function evaluateInvestigationViewModelV1(
  input: unknown,
): Result<InvestigationViewModelV1Decision, InvestigationViewModelV1Denial> {
  const parsed = InvestigationViewModelV1InputSchema.safeParse(input);

  if (!parsed.success) {
    const tenantMismatch = parsed.error.issues.some((issue) =>
      issue.message.toLowerCase().includes("tenant scope mismatch"),
    );

    if (tenantMismatch) {
      return err(
        failClosedInvestigationViewModelV1Denial(
          input,
          "INVESTIGATION_VIEW_TENANT_MISMATCH",
        ),
      );
    }

    return err(denialForInvalidInput(input));
  }

  const coreCoverageDenial = validateCoreCoverage(parsed.data);

  if (coreCoverageDenial !== undefined) {
    return err(coreCoverageDenial);
  }

  return ok(createDecision(parsed.data));
}

export function assertInvestigationViewModelV1(
  input: unknown,
): InvestigationViewModelV1Decision {
  const result = evaluateInvestigationViewModelV1(input);

  if (!result.ok) {
    throw new Error("Investigation view model v1 decision denied.");
  }

  return result.value;
}

export function getInvestigationViewModelV1Definition():
  InvestigationViewModelV1Definition {
  return INVESTIGATION_VIEW_MODEL_V1;
}
