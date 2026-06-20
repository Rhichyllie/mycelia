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
  AuditRecordKindSchema,
  AuditReasonCodeSchema,
  SafeAuditMetadataSchema,
} from "../../domain-contracts/audit-record";
import { RUNTIME_SLICE_AUDIT_COMMIT_BOUNDARY } from "../../planning/runtime-slice-technical-plan";

export const AUDIT_COMMIT_BOUNDARY_PHASE = "2U";

export const AUDIT_COMMIT_BOUNDARY_NAME = "Audit Commit Boundary";

export const AUDIT_COMMIT_BOUNDARY_STATUS =
  "pure TypeScript audit requirement boundary only";

export const AuditCommitMoments = [
  "REQUEST_CREATED",
  "CONTEXT_RESOLVED",
  "TENANT_BOUNDARY_CHECKED",
  "POLICY_EVALUATED",
  "ADMISSION_DECIDED",
  "APPROVAL_REQUESTED",
  "APPROVAL_DECIDED",
  "LIFECYCLE_TRANSITIONED",
  "RUN_COMPLETED",
  "RUN_REJECTED",
  "RUN_CANCELLED",
  "RUN_FAILED",
  "INVESTIGATION_PREPARED",
  "REPLAY_DRY_RUN_PREPARED",
] as const;

export type AuditCommitMoment = (typeof AuditCommitMoments)[number];

export const AuditCommitRequirements = [
  "REQUIRED",
  "REQUIRED_LATER",
  "NOT_REQUIRED",
] as const;

export type AuditCommitRequirement =
  (typeof AuditCommitRequirements)[number];

export const AuditCommitSourceModules = [
  "runtime-slice-technical-plan",
  "runtime-persistence-model",
  "governed-run-lifecycle",
  "policy-admission-v1",
  "audit-record",
  "audit-recorder",
  "future-approval-gate",
  "future-investigation-view",
  "future-replay-dry-run",
] as const;

export type AuditCommitSourceModule =
  (typeof AuditCommitSourceModules)[number];

export const AuditCommitRelatedRecords = [
  "GovernedRun",
  "RuntimeStateSnapshot",
  "PolicyDecisionRecord",
  "AdmissionDecisionRecord",
  "ApprovalRequest",
  "AuditRecord",
] as const;

export type AuditCommitRelatedRecord =
  (typeof AuditCommitRelatedRecords)[number];

export const AuditCommitRecordKindHints = [
  "POLICY_DECISION",
  "RUNTIME_ADMISSION",
  "GOVERNED_RUN",
  "RUNTIME_STATE",
  "STATE_TRANSITION",
  "TENANT_BOUNDARY",
  "SYSTEM_VALIDATION",
  "APPROVAL_DECISION",
  "INVESTIGATION_DESCRIPTOR",
  "REPLAY_PLAN_DESCRIPTOR",
] as const;

export type AuditCommitRecordKindHint =
  (typeof AuditCommitRecordKindHints)[number];

export const AuditCommitMomentSchema = z.enum(AuditCommitMoments);

export const AuditCommitRequirementSchema = z.enum(AuditCommitRequirements);

export const AuditCommitSourceModuleSchema = z.enum(AuditCommitSourceModules);

export const AuditCommitRelatedRecordSchema = z.enum(
  AuditCommitRelatedRecords,
);

export const AuditCommitRecordKindHintSchema = z
  .enum(AuditCommitRecordKindHints)
  .refine(
    (kind) =>
      AuditRecordKindSchema.safeParse(kind).success ||
      kind === "APPROVAL_DECISION" ||
      kind === "INVESTIGATION_DESCRIPTOR" ||
      kind === "REPLAY_PLAN_DESCRIPTOR",
    "audit record kind hint must be safe.",
  );

const MAX_AUDIT_COMMIT_REF_LENGTH = 160;
const MAX_AUDIT_COMMIT_SUMMARY_LENGTH = 240;
const AUDIT_COMMIT_UNSAFE_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|blob|connection[_-]?string|credential|display[_-]?name|download|email|event[_-]?internals|external[_-]?id|password|path|permission|policy[_-]?internals|private[_-]?key|query|raw|secret|shell|sql|sudo|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name|prefix)/i;

export const AuditCommitSafeRefSchema = z
  .string()
  .min(1, "audit commit reference is required.")
  .max(
    MAX_AUDIT_COMMIT_REF_LENGTH,
    `audit commit reference must not exceed ${MAX_AUDIT_COMMIT_REF_LENGTH} characters.`,
  )
  .refine(
    (value) => value.trim() === value,
    "audit commit reference must not contain leading or trailing whitespace.",
  )
  .refine(
    (value) => !AUDIT_COMMIT_UNSAFE_TEXT_PATTERN.test(value),
    "audit commit reference must be opaque and safe.",
  );

export const AuditCommitSafeSummarySchema = z
  .string()
  .min(1, "safe summary is required.")
  .max(
    MAX_AUDIT_COMMIT_SUMMARY_LENGTH,
    `safe summary must not exceed ${MAX_AUDIT_COMMIT_SUMMARY_LENGTH} characters.`,
  )
  .refine(
    (value) => value.trim() === value,
    "safe summary must not contain leading or trailing whitespace.",
  )
  .refine(
    (value) => !AUDIT_COMMIT_UNSAFE_TEXT_PATTERN.test(value),
    "safe summary must be bounded and non-enumerating.",
  );

export const AuditCommitBoundaryInputSchema = z
  .object({
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
    moment: AuditCommitMomentSchema,
    source_module: AuditCommitSourceModuleSchema,
    subject_ref: AuditCommitSafeRefSchema,
    actor_ref: AuditCommitSafeRefSchema.optional(),
    evidence_ref: AuditCommitSafeRefSchema.optional(),
    reason_code: AuditReasonCodeSchema,
    safe_summary: AuditCommitSafeSummarySchema,
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

export type AuditCommitBoundaryInput = z.infer<
  typeof AuditCommitBoundaryInputSchema
>;

export type AuditCommitBoundaryInputCandidate = z.input<
  typeof AuditCommitBoundaryInputSchema
>;

export const AuditCommitBoundaryDenialCodeSchema = z.enum([
  "AUDIT_COMMIT_BOUNDARY_INPUT_REQUIRED",
  "AUDIT_COMMIT_BOUNDARY_INPUT_INVALID",
  "AUDIT_COMMIT_BOUNDARY_TENANT_REQUIRED",
  "AUDIT_COMMIT_BOUNDARY_SCOPE_REQUIRED",
  "AUDIT_COMMIT_BOUNDARY_MOMENT_INVALID",
  "AUDIT_COMMIT_BOUNDARY_UNSAFE_METADATA",
]);

export type AuditCommitBoundaryDenialCode = z.infer<
  typeof AuditCommitBoundaryDenialCodeSchema
>;

export const AuditCommitBoundaryPersistenceMappingSchema = z
  .object({
    audit_record: z.literal("AuditRecord"),
    related_first_slice_records: z.array(AuditCommitRelatedRecordSchema),
  })
  .strict();

export type AuditCommitBoundaryPersistenceMapping = z.infer<
  typeof AuditCommitBoundaryPersistenceMappingSchema
>;

export const AuditCommitBoundaryDecisionSchema = z
  .object({
    moment: AuditCommitMomentSchema,
    requirement: AuditCommitRequirementSchema,
    reason_code: AuditReasonCodeSchema,
    safe_reason: z.string().min(1).max(240),
    audit_record_kind: AuditCommitRecordKindHintSchema,
    persistence_mapping: AuditCommitBoundaryPersistenceMappingSchema,
    emission_mapping: z.literal("not emitted in this phase"),
    immutability_note: z.literal(
      "future audit records should be append-only",
    ),
    boundary_status: z.literal("descriptor requirement only"),
  })
  .strict();

export type AuditCommitBoundaryDecision = z.infer<
  typeof AuditCommitBoundaryDecisionSchema
>;

export const AuditCommitBoundaryDenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    code: AuditCommitBoundaryDenialCodeSchema,
    message: z.literal("The audit commit boundary input is not accepted."),
    safe_reason: z.string().min(1).max(240),
    correlation_id: CorrelationIdSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export type AuditCommitBoundaryDenial = z.infer<
  typeof AuditCommitBoundaryDenialSchema
>;

type AuditCommitMomentRule = {
  readonly moment: AuditCommitMoment;
  readonly requirement: AuditCommitRequirement;
  readonly audit_record_kind: AuditCommitRecordKindHint;
  readonly related_first_slice_records: readonly AuditCommitRelatedRecord[];
  readonly safe_reason: string;
};

export const AUDIT_COMMIT_BOUNDARY_MOMENT_RULES = [
  {
    moment: "REQUEST_CREATED",
    requirement: "REQUIRED",
    audit_record_kind: "GOVERNED_RUN",
    related_first_slice_records: ["GovernedRun"],
    safe_reason: "Governed request creation must be audit-addressable.",
  },
  {
    moment: "CONTEXT_RESOLVED",
    requirement: "REQUIRED",
    audit_record_kind: "SYSTEM_VALIDATION",
    related_first_slice_records: ["GovernedRun", "RuntimeStateSnapshot"],
    safe_reason: "Context resolution must be audit-addressable.",
  },
  {
    moment: "TENANT_BOUNDARY_CHECKED",
    requirement: "REQUIRED",
    audit_record_kind: "TENANT_BOUNDARY",
    related_first_slice_records: ["GovernedRun"],
    safe_reason: "Tenant boundary checks must be audit-addressable.",
  },
  {
    moment: "POLICY_EVALUATED",
    requirement: "REQUIRED",
    audit_record_kind: "POLICY_DECISION",
    related_first_slice_records: ["PolicyDecisionRecord"],
    safe_reason: "Policy evaluation must be audit-addressable.",
  },
  {
    moment: "ADMISSION_DECIDED",
    requirement: "REQUIRED",
    audit_record_kind: "RUNTIME_ADMISSION",
    related_first_slice_records: [
      "PolicyDecisionRecord",
      "AdmissionDecisionRecord",
    ],
    safe_reason: "Runtime admission decisions must be audit-addressable.",
  },
  {
    moment: "APPROVAL_REQUESTED",
    requirement: "REQUIRED",
    audit_record_kind: "APPROVAL_DECISION",
    related_first_slice_records: ["ApprovalRequest"],
    safe_reason: "Approval requests must be audit-addressable.",
  },
  {
    moment: "APPROVAL_DECIDED",
    requirement: "REQUIRED",
    audit_record_kind: "APPROVAL_DECISION",
    related_first_slice_records: ["ApprovalRequest"],
    safe_reason: "Approval decisions must be audit-addressable.",
  },
  {
    moment: "LIFECYCLE_TRANSITIONED",
    requirement: "REQUIRED",
    audit_record_kind: "STATE_TRANSITION",
    related_first_slice_records: ["GovernedRun", "RuntimeStateSnapshot"],
    safe_reason: "Lifecycle transitions must be audit-addressable.",
  },
  {
    moment: "RUN_COMPLETED",
    requirement: "REQUIRED",
    audit_record_kind: "GOVERNED_RUN",
    related_first_slice_records: ["GovernedRun", "RuntimeStateSnapshot"],
    safe_reason: "Run completion must be audit-addressable.",
  },
  {
    moment: "RUN_REJECTED",
    requirement: "REQUIRED",
    audit_record_kind: "GOVERNED_RUN",
    related_first_slice_records: ["GovernedRun", "RuntimeStateSnapshot"],
    safe_reason: "Run rejection must be audit-addressable.",
  },
  {
    moment: "RUN_CANCELLED",
    requirement: "REQUIRED",
    audit_record_kind: "GOVERNED_RUN",
    related_first_slice_records: ["GovernedRun", "RuntimeStateSnapshot"],
    safe_reason: "Run cancellation must be audit-addressable.",
  },
  {
    moment: "RUN_FAILED",
    requirement: "REQUIRED",
    audit_record_kind: "GOVERNED_RUN",
    related_first_slice_records: ["GovernedRun", "RuntimeStateSnapshot"],
    safe_reason: "Run failure must be audit-addressable.",
  },
  {
    moment: "INVESTIGATION_PREPARED",
    requirement: "REQUIRED_LATER",
    audit_record_kind: "INVESTIGATION_DESCRIPTOR",
    related_first_slice_records: ["AuditRecord"],
    safe_reason: "Investigation preparation becomes required in a later slice.",
  },
  {
    moment: "REPLAY_DRY_RUN_PREPARED",
    requirement: "REQUIRED_LATER",
    audit_record_kind: "REPLAY_PLAN_DESCRIPTOR",
    related_first_slice_records: ["AuditRecord"],
    safe_reason: "Replay dry-run preparation becomes required in a later slice.",
  },
] as const satisfies readonly AuditCommitMomentRule[];

export const AUDIT_COMMIT_BOUNDARY_MODULE_ALIGNMENT = [
  "src/mycelia/domain-contracts/audit-record/",
  "src/mycelia/domain-contracts/audit-recorder/",
  "src/mycelia/domain-contracts/audit-emission/",
  "src/mycelia/domain-contracts/audit-timeline/",
  "src/mycelia/runtime-logic/governed-run-lifecycle/",
  "src/mycelia/runtime-logic/policy-admission-v1/",
  "src/mycelia/persistence/runtime-persistence-model/",
  "future approval gate",
] as const;

export const AUDIT_COMMIT_BOUNDARY_EXPLICITLY_OUT_OF_SCOPE = [
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
  "no signing",
  "no sealing",
  "no hash-chain",
  "no workflow execution",
  "no replay execution",
  "no external integrations",
  "no tool execution",
  "no raw document content",
  "no export/PDF/download",
] as const;

export const AUDIT_COMMIT_BOUNDARY_SAFETY_BOUNDARY = [
  "this module classifies audit requirements in memory only",
  "this module accepts safe bounded references only",
  "this module returns deterministic requirement descriptors or safe denials",
  "this module does not mutate input",
  "this module does not persist data",
  "this module does not emit events",
  "this module does not write audit records",
  "this module does not append audit logs",
  "this module does not call APIs or external services",
] as const;

export type AuditCommitBoundary = {
  readonly phase: typeof AUDIT_COMMIT_BOUNDARY_PHASE;
  readonly name: typeof AUDIT_COMMIT_BOUNDARY_NAME;
  readonly status: typeof AUDIT_COMMIT_BOUNDARY_STATUS;
  readonly moments: readonly AuditCommitMoment[];
  readonly requirements: readonly AuditCommitRequirement[];
  readonly moment_rules: readonly AuditCommitMomentRule[];
  readonly module_alignment: readonly string[];
  readonly plan_alignment: readonly string[];
  readonly explicitly_out_of_scope: readonly string[];
  readonly safety_boundary: readonly string[];
};

export const AUDIT_COMMIT_BOUNDARY = {
  phase: AUDIT_COMMIT_BOUNDARY_PHASE,
  name: AUDIT_COMMIT_BOUNDARY_NAME,
  status: AUDIT_COMMIT_BOUNDARY_STATUS,
  moments: AuditCommitMoments,
  requirements: AuditCommitRequirements,
  moment_rules: AUDIT_COMMIT_BOUNDARY_MOMENT_RULES,
  module_alignment: AUDIT_COMMIT_BOUNDARY_MODULE_ALIGNMENT,
  plan_alignment: RUNTIME_SLICE_AUDIT_COMMIT_BOUNDARY.lifecycle_moments,
  explicitly_out_of_scope: AUDIT_COMMIT_BOUNDARY_EXPLICITLY_OUT_OF_SCOPE,
  safety_boundary: AUDIT_COMMIT_BOUNDARY_SAFETY_BOUNDARY,
} as const satisfies AuditCommitBoundary;

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

function ruleForMoment(moment: AuditCommitMoment): AuditCommitMomentRule {
  const rule = AUDIT_COMMIT_BOUNDARY_MOMENT_RULES.find(
    (candidate) => candidate.moment === moment,
  );

  if (rule === undefined) {
    throw new Error("Audit commit boundary rule is missing.");
  }

  return rule;
}

function createDecision(
  input: AuditCommitBoundaryInput,
): AuditCommitBoundaryDecision {
  const rule = ruleForMoment(input.moment);

  return AuditCommitBoundaryDecisionSchema.parse({
    moment: rule.moment,
    requirement: rule.requirement,
    reason_code: input.reason_code,
    safe_reason: rule.safe_reason,
    audit_record_kind: rule.audit_record_kind,
    persistence_mapping: {
      audit_record: "AuditRecord",
      related_first_slice_records: rule.related_first_slice_records,
    },
    emission_mapping: "not emitted in this phase",
    immutability_note: "future audit records should be append-only",
    boundary_status: "descriptor requirement only",
  });
}

export function failClosedAuditCommitBoundaryDenial(
  input?: unknown,
  code: AuditCommitBoundaryDenialCode =
    "AUDIT_COMMIT_BOUNDARY_INPUT_INVALID",
): AuditCommitBoundaryDenial {
  const safeReasonByCode: Record<AuditCommitBoundaryDenialCode, string> = {
    AUDIT_COMMIT_BOUNDARY_INPUT_REQUIRED:
      "An audit commit boundary input is required.",
    AUDIT_COMMIT_BOUNDARY_INPUT_INVALID:
      "The audit commit boundary input is invalid or unsafe.",
    AUDIT_COMMIT_BOUNDARY_TENANT_REQUIRED:
      "A tenant identity is required.",
    AUDIT_COMMIT_BOUNDARY_SCOPE_REQUIRED:
      "A run or correlation scope is required.",
    AUDIT_COMMIT_BOUNDARY_MOMENT_INVALID:
      "The audit commit moment is not recognized.",
    AUDIT_COMMIT_BOUNDARY_UNSAFE_METADATA:
      "The audit commit metadata is unsafe.",
  };

  return AuditCommitBoundaryDenialSchema.parse({
    outcome: "DENIED",
    code,
    message: "The audit commit boundary input is not accepted.",
    safe_reason: safeReasonByCode[code],
    correlation_id: correlationIdFromInput(input),
    safe: true,
  });
}

function denialForInvalidInput(input: unknown): AuditCommitBoundaryDenial {
  if (!isRecord(input)) {
    return failClosedAuditCommitBoundaryDenial(
      input,
      "AUDIT_COMMIT_BOUNDARY_INPUT_REQUIRED",
    );
  }

  if (input.tenant_id === undefined) {
    return failClosedAuditCommitBoundaryDenial(
      input,
      "AUDIT_COMMIT_BOUNDARY_TENANT_REQUIRED",
    );
  }

  if (input.run_id === undefined && input.correlation_id === undefined) {
    return failClosedAuditCommitBoundaryDenial(
      input,
      "AUDIT_COMMIT_BOUNDARY_SCOPE_REQUIRED",
    );
  }

  if (!AuditCommitMomentSchema.safeParse(input.moment).success) {
    return failClosedAuditCommitBoundaryDenial(
      input,
      "AUDIT_COMMIT_BOUNDARY_MOMENT_INVALID",
    );
  }

  if (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  ) {
    return failClosedAuditCommitBoundaryDenial(
      input,
      "AUDIT_COMMIT_BOUNDARY_UNSAFE_METADATA",
    );
  }

  return failClosedAuditCommitBoundaryDenial(input);
}

export function evaluateAuditCommitBoundary(
  input: unknown,
): Result<AuditCommitBoundaryDecision, AuditCommitBoundaryDenial> {
  const parsed = AuditCommitBoundaryInputSchema.safeParse(input);

  if (!parsed.success) {
    return err(denialForInvalidInput(input));
  }

  return ok(createDecision(parsed.data));
}

export function assertAuditCommitBoundary(
  input: unknown,
): Result<AuditCommitBoundaryDecision, AuditCommitBoundaryDenial> {
  return evaluateAuditCommitBoundary(input);
}

export function getAuditCommitBoundary(): AuditCommitBoundary {
  return AUDIT_COMMIT_BOUNDARY;
}
