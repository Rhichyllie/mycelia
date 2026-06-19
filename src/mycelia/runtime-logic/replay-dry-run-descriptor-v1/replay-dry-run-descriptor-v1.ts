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
import { type AuditCommitMoment } from "../../runtime-logic/audit-commit-boundary";
import { SafeAuditMetadataSchema } from "../../domain-contracts/audit-record";
import {
  InvestigationAuditBoundaryDecisionRefSchema,
  InvestigationApprovalGateDecisionRefSchema,
  InvestigationPersistenceRecordRefSchema,
  InvestigationPolicyAdmissionDecisionRefSchema,
  InvestigationTimelineEntryV1Schema,
  InvestigationViewModelV1DecisionSchema,
  InvestigationViewSafeTextSchema,
  type InvestigationAuditBoundaryDecisionRef,
  type InvestigationTimelineEntryV1,
} from "../../runtime-logic/investigation-view-model-v1";
import { PolicyAdmissionSafeRefSchema } from "../../runtime-logic/policy-admission-v1";

export const REPLAY_DRY_RUN_DESCRIPTOR_V1_PHASE = "2X";

export const REPLAY_DRY_RUN_DESCRIPTOR_V1_NAME =
  "Replay Dry-Run Descriptor v1";

export const REPLAY_DRY_RUN_DESCRIPTOR_V1_STATUS =
  "pure TypeScript replay dry-run descriptor only";

export const ReplayDryRunReplayabilityStatuses = [
  "REPLAYABLE",
  "PARTIALLY_REPLAYABLE",
  "NOT_REPLAYABLE",
  "BLOCKED",
] as const;

export type ReplayDryRunReplayabilityStatus =
  (typeof ReplayDryRunReplayabilityStatuses)[number];

export const ReplayDryRunSideEffectPolicyMarkers = [
  "NO_SIDE_EFFECTS",
  "DESCRIPTOR_ONLY",
  "NO_TOOL_EXECUTION",
  "NO_EXTERNAL_CALLS",
  "NO_STATE_MUTATION",
] as const;

export type ReplayDryRunSideEffectPolicy =
  (typeof ReplayDryRunSideEffectPolicyMarkers)[number];

export const ReplayDryRunDescriptorSections = [
  "overview",
  "sourceRefs",
  "replayability",
  "dryRunSteps",
  "sideEffectPolicy",
  "blockedActions",
  "requiredEvidence",
  "limitations",
  "nextActions",
] as const;

export type ReplayDryRunDescriptorSection =
  (typeof ReplayDryRunDescriptorSections)[number];

export const ReplayDryRunBlockedActions = [
  "TOOL_EXECUTION",
  "EXTERNAL_CALLS",
  "STATE_MUTATION",
  "DB_READS",
  "AUDIT_WRITING",
  "EVENT_EMISSION",
] as const;

export type ReplayDryRunBlockedAction =
  (typeof ReplayDryRunBlockedActions)[number];

export const ReplayDryRunStepKinds = [
  "INSPECT_GOVERNED_RUN_REFERENCE",
  "INSPECT_LIFECYCLE_TIMELINE",
  "INSPECT_POLICY_ADMISSION_DECISION",
  "INSPECT_APPROVAL_GATE_DECISION",
  "INSPECT_AUDIT_BOUNDARY_COVERAGE",
  "INSPECT_PERSISTENCE_REFERENCES",
  "PRODUCE_RECONSTRUCTION_SUMMARY",
] as const;

export type ReplayDryRunStepKind = (typeof ReplayDryRunStepKinds)[number];

export const ReplayDryRunReplayabilityStatusSchema = z.enum(
  ReplayDryRunReplayabilityStatuses,
);

export const ReplayDryRunSideEffectPolicySchema = z.enum(
  ReplayDryRunSideEffectPolicyMarkers,
);

export const ReplayDryRunDescriptorSectionSchema = z.enum(
  ReplayDryRunDescriptorSections,
);

export const ReplayDryRunBlockedActionSchema = z.enum(
  ReplayDryRunBlockedActions,
);

export const ReplayDryRunStepKindSchema = z.enum(ReplayDryRunStepKinds);

export const ReplayDryRunDescriptorV1InputSchema = z
  .object({
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
    investigation_view: InvestigationViewModelV1DecisionSchema,
    lifecycle_timeline: z.array(InvestigationTimelineEntryV1Schema).min(1),
    policy_admission_decision: InvestigationPolicyAdmissionDecisionRefSchema,
    approval_gate_decision:
      InvestigationApprovalGateDecisionRefSchema.optional(),
    audit_boundary_decisions: z
      .array(InvestigationAuditBoundaryDecisionRefSchema)
      .min(1),
    persistence_record_refs: z
      .array(InvestigationPersistenceRecordRefSchema)
      .min(1),
    replay_purpose: InvestigationViewSafeTextSchema,
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

    if (input.investigation_view.investigation_view.tenant_id !== input.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "tenant scope mismatch.",
        path: ["investigation_view", "investigation_view", "tenant_id"],
      });
    }

    if (
      input.run_id !== undefined &&
      input.investigation_view.investigation_view.run_id !== undefined &&
      input.investigation_view.investigation_view.run_id !== input.run_id
    ) {
      context.addIssue({
        code: "custom",
        message: "run scope mismatch.",
        path: ["investigation_view", "investigation_view", "run_id"],
      });
    }

    if (
      input.correlation_id !== undefined &&
      input.investigation_view.investigation_view.correlation_id !==
        undefined &&
      input.investigation_view.investigation_view.correlation_id !==
        input.correlation_id
    ) {
      context.addIssue({
        code: "custom",
        message: "correlation scope mismatch.",
        path: ["investigation_view", "investigation_view", "correlation_id"],
      });
    }

    input.lifecycle_timeline.forEach((entry, index) => {
      if (entry.source_type !== "LIFECYCLE") {
        context.addIssue({
          code: "custom",
          message: "lifecycle timeline entries must be lifecycle descriptors.",
          path: ["lifecycle_timeline", index, "source_type"],
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

export type ReplayDryRunDescriptorV1Input = z.infer<
  typeof ReplayDryRunDescriptorV1InputSchema
>;

export type ReplayDryRunDescriptorV1InputCandidate = z.input<
  typeof ReplayDryRunDescriptorV1InputSchema
>;

export const ReplayDryRunDescriptorV1DenialCodeSchema = z.enum([
  "REPLAY_DRY_RUN_INPUT_REQUIRED",
  "REPLAY_DRY_RUN_INPUT_INVALID",
  "REPLAY_DRY_RUN_TENANT_REQUIRED",
  "REPLAY_DRY_RUN_SCOPE_REQUIRED",
  "REPLAY_DRY_RUN_INVESTIGATION_VIEW_REQUIRED",
  "REPLAY_DRY_RUN_LIFECYCLE_TIMELINE_REQUIRED",
  "REPLAY_DRY_RUN_POLICY_ADMISSION_REQUIRED",
  "REPLAY_DRY_RUN_AUDIT_BOUNDARY_REQUIRED",
  "REPLAY_DRY_RUN_APPROVAL_REQUIRED",
  "REPLAY_DRY_RUN_TENANT_MISMATCH",
  "REPLAY_DRY_RUN_UNSAFE_METADATA",
]);

export type ReplayDryRunDescriptorV1DenialCode = z.infer<
  typeof ReplayDryRunDescriptorV1DenialCodeSchema
>;

export const ReplayDryRunStepV1Schema = z
  .object({
    step_order: z.number().int().positive(),
    step_kind: ReplayDryRunStepKindSchema,
    title: InvestigationViewSafeTextSchema,
    safe_summary: InvestigationViewSafeTextSchema,
    source_refs: z.array(PolicyAdmissionSafeRefSchema).min(1),
    section: ReplayDryRunDescriptorSectionSchema,
    will_execute: z.literal(false),
    boundary_status: z.literal("descriptor step only"),
  })
  .strict();

export type ReplayDryRunStepV1 = z.infer<typeof ReplayDryRunStepV1Schema>;

export const ReplayDryRunSectionDescriptorSchema = z
  .object({
    section: ReplayDryRunDescriptorSectionSchema,
    title: InvestigationViewSafeTextSchema,
    safe_summary: InvestigationViewSafeTextSchema,
  })
  .strict();

export type ReplayDryRunSectionDescriptor = z.infer<
  typeof ReplayDryRunSectionDescriptorSchema
>;

export const ReplayDryRunRequiredEvidenceSchema = z
  .object({
    evidence: InvestigationViewSafeTextSchema,
    present: z.boolean(),
  })
  .strict();

export type ReplayDryRunRequiredEvidence = z.infer<
  typeof ReplayDryRunRequiredEvidenceSchema
>;

export const ReplayDryRunDescriptorV1Schema = z
  .object({
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
    section_keys: z.array(ReplayDryRunDescriptorSectionSchema).length(9),
    sections: z.array(ReplayDryRunSectionDescriptorSchema).length(9),
    replayability_status: ReplayDryRunReplayabilityStatusSchema,
    side_effect_policy: z.array(ReplayDryRunSideEffectPolicySchema).length(5),
    dry_run_steps: z.array(ReplayDryRunStepV1Schema).min(1),
    blocked_actions: z.array(ReplayDryRunBlockedActionSchema).length(6),
    required_evidence: z.array(ReplayDryRunRequiredEvidenceSchema).min(1),
    source_refs: z.array(PolicyAdmissionSafeRefSchema).min(1),
    limitation_notes: z.array(InvestigationViewSafeTextSchema).min(1),
    boundary_status: z.literal("descriptor dry-run only"),
  })
  .strict();

export type ReplayDryRunDescriptorV1 = z.infer<
  typeof ReplayDryRunDescriptorV1Schema
>;

export const ReplayDryRunDescriptorV1DecisionSchema = z
  .object({
    replay_dry_run_descriptor: ReplayDryRunDescriptorV1Schema,
    replayability_status: ReplayDryRunReplayabilityStatusSchema,
    blocked_actions: z.array(ReplayDryRunBlockedActionSchema).length(6),
    side_effect_policy: z.array(ReplayDryRunSideEffectPolicySchema).length(5),
    safe_summary: InvestigationViewSafeTextSchema,
    source_descriptor_refs: z.array(PolicyAdmissionSafeRefSchema).min(1),
    limitation_notes: z.array(InvestigationViewSafeTextSchema).min(1),
  })
  .strict();

export type ReplayDryRunDescriptorV1Decision = z.infer<
  typeof ReplayDryRunDescriptorV1DecisionSchema
>;

export const ReplayDryRunDescriptorV1DenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    replayability_status: z.literal("BLOCKED"),
    code: ReplayDryRunDescriptorV1DenialCodeSchema,
    message: z.literal("The replay dry-run descriptor input is not accepted."),
    safe_reason: InvestigationViewSafeTextSchema,
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export type ReplayDryRunDescriptorV1Denial = z.infer<
  typeof ReplayDryRunDescriptorV1DenialSchema
>;

export type ReplayDryRunDescriptorV1Definition = {
  readonly phase: typeof REPLAY_DRY_RUN_DESCRIPTOR_V1_PHASE;
  readonly name: typeof REPLAY_DRY_RUN_DESCRIPTOR_V1_NAME;
  readonly status: typeof REPLAY_DRY_RUN_DESCRIPTOR_V1_STATUS;
  readonly replayability_statuses:
    readonly ReplayDryRunReplayabilityStatus[];
  readonly side_effect_policy:
    readonly ReplayDryRunSideEffectPolicy[];
  readonly sections: readonly ReplayDryRunDescriptorSection[];
  readonly blocked_actions: readonly ReplayDryRunBlockedAction[];
  readonly step_kinds: readonly ReplayDryRunStepKind[];
  readonly module_alignment: readonly string[];
  readonly explicitly_out_of_scope: readonly string[];
  readonly safety_boundary: readonly string[];
};

export const REPLAY_DRY_RUN_DESCRIPTOR_V1_MODULE_ALIGNMENT = [
  "src/mycelia/domain-contracts/replay-plan/",
  "src/mycelia/runtime-logic/investigation-view-model-v1/",
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

export const REPLAY_DRY_RUN_DESCRIPTOR_V1_EXPLICITLY_OUT_OF_SCOPE = [
  "no runtime execution",
  "no replay execution",
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
  "no external integrations",
  "no tool execution",
  "no raw document content",
  "no export/PDF/download",
] as const;

export const REPLAY_DRY_RUN_DESCRIPTOR_V1_SAFETY_BOUNDARY = [
  "this module assembles replay dry-run descriptors in memory only",
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

export const REPLAY_DRY_RUN_DESCRIPTOR_V1 = {
  phase: REPLAY_DRY_RUN_DESCRIPTOR_V1_PHASE,
  name: REPLAY_DRY_RUN_DESCRIPTOR_V1_NAME,
  status: REPLAY_DRY_RUN_DESCRIPTOR_V1_STATUS,
  replayability_statuses: ReplayDryRunReplayabilityStatuses,
  side_effect_policy: ReplayDryRunSideEffectPolicyMarkers,
  sections: ReplayDryRunDescriptorSections,
  blocked_actions: ReplayDryRunBlockedActions,
  step_kinds: ReplayDryRunStepKinds,
  module_alignment: REPLAY_DRY_RUN_DESCRIPTOR_V1_MODULE_ALIGNMENT,
  explicitly_out_of_scope:
    REPLAY_DRY_RUN_DESCRIPTOR_V1_EXPLICITLY_OUT_OF_SCOPE,
  safety_boundary: REPLAY_DRY_RUN_DESCRIPTOR_V1_SAFETY_BOUNDARY,
} as const satisfies ReplayDryRunDescriptorV1Definition;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasOwn(input: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function correlationIdFromInput(input: unknown): CorrelationId | undefined {
  if (!isRecord(input)) {
    return undefined;
  }

  const parsed = CorrelationIdSchema.safeParse(input.correlation_id);

  return parsed.success ? parsed.data : undefined;
}

export function failClosedReplayDryRunDescriptorV1Denial(
  input?: unknown,
  code: ReplayDryRunDescriptorV1DenialCode =
    "REPLAY_DRY_RUN_INPUT_INVALID",
): ReplayDryRunDescriptorV1Denial {
  const safeReasonByCode: Record<ReplayDryRunDescriptorV1DenialCode, string> = {
    REPLAY_DRY_RUN_INPUT_REQUIRED:
      "A replay dry-run descriptor input is required.",
    REPLAY_DRY_RUN_INPUT_INVALID:
      "The replay dry-run descriptor input is invalid or unsafe.",
    REPLAY_DRY_RUN_TENANT_REQUIRED:
      "A tenant identity is required.",
    REPLAY_DRY_RUN_SCOPE_REQUIRED:
      "A run or correlation scope is required.",
    REPLAY_DRY_RUN_INVESTIGATION_VIEW_REQUIRED:
      "An investigation view descriptor is required.",
    REPLAY_DRY_RUN_LIFECYCLE_TIMELINE_REQUIRED:
      "A lifecycle timeline descriptor is required.",
    REPLAY_DRY_RUN_POLICY_ADMISSION_REQUIRED:
      "A policy admission descriptor is required.",
    REPLAY_DRY_RUN_AUDIT_BOUNDARY_REQUIRED:
      "Audit boundary descriptors are required.",
    REPLAY_DRY_RUN_APPROVAL_REQUIRED:
      "An approval descriptor is required for approval outcomes.",
    REPLAY_DRY_RUN_TENANT_MISMATCH:
      "Descriptor tenant scope does not match.",
    REPLAY_DRY_RUN_UNSAFE_METADATA:
      "The replay dry-run metadata is unsafe.",
  };

  return ReplayDryRunDescriptorV1DenialSchema.parse({
    outcome: "DENIED",
    replayability_status: "BLOCKED",
    code,
    message: "The replay dry-run descriptor input is not accepted.",
    safe_reason: safeReasonByCode[code],
    correlation_id: correlationIdFromInput(input),
    safe: true,
  });
}

function denialForInvalidInput(input: unknown): ReplayDryRunDescriptorV1Denial {
  if (!isRecord(input)) {
    return failClosedReplayDryRunDescriptorV1Denial(
      input,
      "REPLAY_DRY_RUN_INPUT_REQUIRED",
    );
  }

  if (input.tenant_id === undefined) {
    return failClosedReplayDryRunDescriptorV1Denial(
      input,
      "REPLAY_DRY_RUN_TENANT_REQUIRED",
    );
  }

  if (input.run_id === undefined && input.correlation_id === undefined) {
    return failClosedReplayDryRunDescriptorV1Denial(
      input,
      "REPLAY_DRY_RUN_SCOPE_REQUIRED",
    );
  }

  if (!hasOwn(input, "investigation_view")) {
    return failClosedReplayDryRunDescriptorV1Denial(
      input,
      "REPLAY_DRY_RUN_INVESTIGATION_VIEW_REQUIRED",
    );
  }

  if (
    !Array.isArray(input.lifecycle_timeline) ||
    input.lifecycle_timeline.length === 0
  ) {
    return failClosedReplayDryRunDescriptorV1Denial(
      input,
      "REPLAY_DRY_RUN_LIFECYCLE_TIMELINE_REQUIRED",
    );
  }

  if (!hasOwn(input, "policy_admission_decision")) {
    return failClosedReplayDryRunDescriptorV1Denial(
      input,
      "REPLAY_DRY_RUN_POLICY_ADMISSION_REQUIRED",
    );
  }

  if (
    !Array.isArray(input.audit_boundary_decisions) ||
    input.audit_boundary_decisions.length === 0
  ) {
    return failClosedReplayDryRunDescriptorV1Denial(
      input,
      "REPLAY_DRY_RUN_AUDIT_BOUNDARY_REQUIRED",
    );
  }

  if (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  ) {
    return failClosedReplayDryRunDescriptorV1Denial(
      input,
      "REPLAY_DRY_RUN_UNSAFE_METADATA",
    );
  }

  return failClosedReplayDryRunDescriptorV1Denial(input);
}

function hasAuditMoment(
  input: ReplayDryRunDescriptorV1Input,
  moment: AuditCommitMoment,
): boolean {
  return input.audit_boundary_decisions.some(
    (decision) => decision.decision.moment === moment,
  );
}

function validateCoreReplayEvidence(
  input: ReplayDryRunDescriptorV1Input,
): ReplayDryRunDescriptorV1Denial | undefined {
  if (
    input.policy_admission_decision.decision.requires_approval &&
    input.approval_gate_decision === undefined
  ) {
    return failClosedReplayDryRunDescriptorV1Denial(
      input,
      "REPLAY_DRY_RUN_APPROVAL_REQUIRED",
    );
  }

  if (
    !hasAuditMoment(input, "POLICY_EVALUATED") ||
    !hasAuditMoment(input, "ADMISSION_DECIDED")
  ) {
    return failClosedReplayDryRunDescriptorV1Denial(
      input,
      "REPLAY_DRY_RUN_AUDIT_BOUNDARY_REQUIRED",
    );
  }

  return undefined;
}

function replayabilityStatusForInput(
  input: ReplayDryRunDescriptorV1Input,
): ReplayDryRunReplayabilityStatus {
  if (
    input.policy_admission_decision.decision.outcome === "DENY" ||
    input.investigation_view.investigation_view.current_state === "REJECTED"
  ) {
    return "NOT_REPLAYABLE";
  }

  if (input.investigation_view.completeness_status === "INCOMPLETE") {
    return "PARTIALLY_REPLAYABLE";
  }

  if (input.investigation_view.completeness_status === "BLOCKED") {
    return "NOT_REPLAYABLE";
  }

  return "REPLAYABLE";
}

function orderedLifecycleRefs(
  timeline: readonly InvestigationTimelineEntryV1[],
): string[] {
  return timeline
    .slice()
    .sort((left, right) => left.sequence - right.sequence)
    .map((entry) => entry.source_ref);
}

function refsFromAuditDecisions(
  decisions: readonly InvestigationAuditBoundaryDecisionRef[],
): string[] {
  return decisions
    .slice()
    .sort((left, right) => left.sequence - right.sequence)
    .map((entry) => entry.descriptor_ref);
}

function uniqueRefs(refs: readonly string[]): string[] {
  return refs.filter((ref, index, allRefs) => allRefs.indexOf(ref) === index);
}

function sourceDescriptorRefs(input: ReplayDryRunDescriptorV1Input): string[] {
  return uniqueRefs([
    ...input.investigation_view.source_descriptor_refs,
    ...input.lifecycle_timeline.map((entry) => entry.source_ref),
    input.policy_admission_decision.descriptor_ref,
    ...(input.approval_gate_decision === undefined
      ? []
      : [input.approval_gate_decision.descriptor_ref]),
    ...input.audit_boundary_decisions.map((entry) => entry.descriptor_ref),
    ...input.persistence_record_refs.map((entry) => entry.ref),
  ]);
}

function createDryRunSteps(
  input: ReplayDryRunDescriptorV1Input,
): ReplayDryRunStepV1[] {
  const stepInputs = [
    {
      step_kind: "INSPECT_GOVERNED_RUN_REFERENCE",
      title: "Inspect governed run reference",
      safe_summary:
        "Inspect the governed run reference carried by the investigation view.",
      source_refs: [input.investigation_view.investigation_view.governed_run_ref],
      section: "sourceRefs",
    },
    {
      step_kind: "INSPECT_LIFECYCLE_TIMELINE",
      title: "Inspect lifecycle timeline",
      safe_summary:
        "Inspect supplied lifecycle timeline entries in explicit order.",
      source_refs: orderedLifecycleRefs(input.lifecycle_timeline),
      section: "dryRunSteps",
    },
    {
      step_kind: "INSPECT_POLICY_ADMISSION_DECISION",
      title: "Inspect policy admission decision",
      safe_summary:
        "Inspect the supplied policy admission descriptor and outcome.",
      source_refs: [input.policy_admission_decision.descriptor_ref],
      section: "dryRunSteps",
    },
    ...(input.approval_gate_decision === undefined
      ? []
      : [
          {
            step_kind: "INSPECT_APPROVAL_GATE_DECISION",
            title: "Inspect approval gate decision",
            safe_summary:
              "Inspect the supplied approval descriptor without resolving it.",
            source_refs: [input.approval_gate_decision.descriptor_ref],
            section: "dryRunSteps",
          },
        ]),
    {
      step_kind: "INSPECT_AUDIT_BOUNDARY_COVERAGE",
      title: "Inspect audit boundary coverage",
      safe_summary:
        "Inspect supplied audit boundary descriptors for required coverage.",
      source_refs: refsFromAuditDecisions(input.audit_boundary_decisions),
      section: "requiredEvidence",
    },
    {
      step_kind: "INSPECT_PERSISTENCE_REFERENCES",
      title: "Inspect persistence references",
      safe_summary:
        "Inspect supplied persistence references without reading storage.",
      source_refs: input.persistence_record_refs.map((entry) => entry.ref),
      section: "sourceRefs",
    },
    {
      step_kind: "PRODUCE_RECONSTRUCTION_SUMMARY",
      title: "Produce reconstruction summary",
      safe_summary:
        "Produce a descriptor summary with no runtime action performed.",
      source_refs: [input.investigation_view.investigation_view.governed_run_ref],
      section: "overview",
    },
  ] as const;

  return stepInputs
    .map((step, index) =>
      ReplayDryRunStepV1Schema.parse({
        step_order: index + 1,
        step_kind: step.step_kind,
        title: step.title,
        safe_summary: step.safe_summary,
        source_refs: step.source_refs,
        section: step.section,
        will_execute: false,
        boundary_status: "descriptor step only",
      }),
    )
    .sort((left, right) => left.step_order - right.step_order);
}

function requiredEvidenceForInput(
  input: ReplayDryRunDescriptorV1Input,
): ReplayDryRunRequiredEvidence[] {
  const approvalRequired =
    input.policy_admission_decision.decision.requires_approval;

  return [
    {
      evidence: "Investigation view descriptor",
      present: true,
    },
    {
      evidence: "Lifecycle timeline descriptors",
      present: input.lifecycle_timeline.length > 0,
    },
    {
      evidence: "Policy admission descriptor",
      present: true,
    },
    {
      evidence: "Approval descriptor when required",
      present: !approvalRequired || input.approval_gate_decision !== undefined,
    },
    {
      evidence: "Policy evaluated audit boundary",
      present: hasAuditMoment(input, "POLICY_EVALUATED"),
    },
    {
      evidence: "Admission decided audit boundary",
      present: hasAuditMoment(input, "ADMISSION_DECIDED"),
    },
    {
      evidence: "Persistence reference descriptors",
      present: input.persistence_record_refs.length > 0,
    },
  ].map((entry) => ReplayDryRunRequiredEvidenceSchema.parse(entry));
}

function sectionTitle(section: ReplayDryRunDescriptorSection): string {
  const titles: Record<ReplayDryRunDescriptorSection, string> = {
    overview: "Overview",
    sourceRefs: "Source refs",
    replayability: "Replayability",
    dryRunSteps: "Dry-run steps",
    sideEffectPolicy: "Side-effect policy",
    blockedActions: "Blocked actions",
    requiredEvidence: "Required evidence",
    limitations: "Limitations",
    nextActions: "Next actions",
  };

  return titles[section];
}

function sectionSummary(
  section: ReplayDryRunDescriptorSection,
  input: ReplayDryRunDescriptorV1Input,
  replayabilityStatus: ReplayDryRunReplayabilityStatus,
  dryRunSteps: readonly ReplayDryRunStepV1[],
): string {
  const summaries: Record<ReplayDryRunDescriptorSection, string> = {
    overview: "Replay dry-run descriptor assembled from provided descriptors.",
    sourceRefs: `Source reference set contains ${sourceDescriptorRefs(input).length} descriptors.`,
    replayability: `Replayability status is ${replayabilityStatus}.`,
    dryRunSteps: `Dry-run contains ${dryRunSteps.length} descriptor steps.`,
    sideEffectPolicy: "All side-effect policy markers are enforced.",
    blockedActions: "Tool, external, state, storage, audit and event actions are blocked.",
    requiredEvidence: "Core replay evidence is checked before assembly.",
    limitations: "Descriptor dry-run only, without replay execution.",
    nextActions: "Use this descriptor to guide future replay UI planning.",
  };

  return summaries[section];
}

function createSections(
  input: ReplayDryRunDescriptorV1Input,
  replayabilityStatus: ReplayDryRunReplayabilityStatus,
  dryRunSteps: readonly ReplayDryRunStepV1[],
): ReplayDryRunSectionDescriptor[] {
  return ReplayDryRunDescriptorSections.map((section) =>
    ReplayDryRunSectionDescriptorSchema.parse({
      section,
      title: sectionTitle(section),
      safe_summary: sectionSummary(
        section,
        input,
        replayabilityStatus,
        dryRunSteps,
      ),
    }),
  );
}

function limitationNotesForStatus(
  replayabilityStatus: ReplayDryRunReplayabilityStatus,
): string[] {
  const commonNotes = [
    "This descriptor does not execute replay.",
    "This descriptor does not query databases.",
    "This descriptor does not call tools.",
    "This descriptor does not mutate state.",
  ];

  if (replayabilityStatus === "PARTIALLY_REPLAYABLE") {
    return [
      ...commonNotes,
      "Replayability is partial because non-core evidence remains incomplete.",
    ];
  }

  if (replayabilityStatus === "NOT_REPLAYABLE") {
    return [
      ...commonNotes,
      "Replayability is not available for rejected or denied descriptor state.",
    ];
  }

  return commonNotes;
}

function createDescriptor(
  input: ReplayDryRunDescriptorV1Input,
  replayabilityStatus: ReplayDryRunReplayabilityStatus,
): ReplayDryRunDescriptorV1 {
  const dryRunSteps = createDryRunSteps(input);
  const limitationNotes = limitationNotesForStatus(replayabilityStatus);

  return ReplayDryRunDescriptorV1Schema.parse({
    tenant_id: input.tenant_id,
    run_id: input.run_id,
    correlation_id: input.correlation_id,
    section_keys: ReplayDryRunDescriptorSections,
    sections: createSections(input, replayabilityStatus, dryRunSteps),
    replayability_status: replayabilityStatus,
    side_effect_policy: ReplayDryRunSideEffectPolicyMarkers,
    dry_run_steps: dryRunSteps,
    blocked_actions: ReplayDryRunBlockedActions,
    required_evidence: requiredEvidenceForInput(input),
    source_refs: sourceDescriptorRefs(input),
    limitation_notes: limitationNotes,
    boundary_status: "descriptor dry-run only",
  });
}

function createDecision(
  input: ReplayDryRunDescriptorV1Input,
): ReplayDryRunDescriptorV1Decision {
  const replayabilityStatus = replayabilityStatusForInput(input);
  const descriptor = createDescriptor(input, replayabilityStatus);

  return ReplayDryRunDescriptorV1DecisionSchema.parse({
    replay_dry_run_descriptor: descriptor,
    replayability_status: replayabilityStatus,
    blocked_actions: ReplayDryRunBlockedActions,
    side_effect_policy: ReplayDryRunSideEffectPolicyMarkers,
    safe_summary:
      "Replay dry-run descriptor assembled without runtime action.",
    source_descriptor_refs: descriptor.source_refs,
    limitation_notes: descriptor.limitation_notes,
  });
}

export function evaluateReplayDryRunDescriptorV1(
  input: unknown,
): Result<ReplayDryRunDescriptorV1Decision, ReplayDryRunDescriptorV1Denial> {
  const parsed = ReplayDryRunDescriptorV1InputSchema.safeParse(input);

  if (!parsed.success) {
    const tenantMismatch = parsed.error.issues.some((issue) =>
      issue.message.toLowerCase().includes("tenant scope mismatch"),
    );

    if (tenantMismatch) {
      return err(
        failClosedReplayDryRunDescriptorV1Denial(
          input,
          "REPLAY_DRY_RUN_TENANT_MISMATCH",
        ),
      );
    }

    return err(denialForInvalidInput(input));
  }

  const coreEvidenceDenial = validateCoreReplayEvidence(parsed.data);

  if (coreEvidenceDenial !== undefined) {
    return err(coreEvidenceDenial);
  }

  return ok(createDecision(parsed.data));
}

export function assertReplayDryRunDescriptorV1(
  input: unknown,
): ReplayDryRunDescriptorV1Decision {
  const result = evaluateReplayDryRunDescriptorV1(input);

  if (!result.ok) {
    throw new Error("Replay dry-run descriptor v1 decision denied.");
  }

  return result.value;
}

export function getReplayDryRunDescriptorV1Definition():
  ReplayDryRunDescriptorV1Definition {
  return REPLAY_DRY_RUN_DESCRIPTOR_V1;
}
