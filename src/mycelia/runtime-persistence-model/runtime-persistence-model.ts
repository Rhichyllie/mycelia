import { z } from "zod";

import { INITIAL_USE_CASE_NAME } from "../initial-use-case-freeze";
import { RUNTIME_SLICE_TECHNICAL_PLAN_NAME } from "../runtime-slice-technical-plan";
import {
  CorrelationIdSchema,
  DataClassificationSchema,
  ProjectIdSchema,
  RequestIdSchema,
  RunIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../shared-kernel";
import {
  PolicyActionSchema,
  PolicyDecisionOutcomeSchema,
  PolicyObligationSchema,
  PolicyPurposeSchema,
  PolicyResourceTypeSchema,
} from "../policy-decision-gateway";
import { AuditRecordKindSchema, AuditOpaqueReferenceSchema } from "../audit-record";

export const RUNTIME_PERSISTENCE_MODEL_PHASE = "2R";

export const RUNTIME_PERSISTENCE_MODEL_NAME =
  "Minimal Persistent Model Scaffold";

export const RUNTIME_PERSISTENCE_MODEL_STATUS =
  "persistence model scaffold only";

export const RUNTIME_PERSISTENCE_RECORD_NAMES = [
  "GovernedRun",
  "RuntimeStateSnapshot",
  "PolicyDecisionRecord",
  "AdmissionDecisionRecord",
  "ApprovalRequest",
  "AuditRecord",
] as const;

export type RuntimePersistenceRecordName =
  (typeof RUNTIME_PERSISTENCE_RECORD_NAMES)[number];

export type RuntimePersistenceRecordDescriptor = {
  readonly name: RuntimePersistenceRecordName;
  readonly purpose: string;
  readonly tenant_scope: string;
  readonly correlation_run_linkage: string;
  readonly minimal_conceptual_fields: readonly string[];
  readonly related_existing_source_modules: readonly string[];
  readonly required_safety_properties: readonly string[];
  readonly first_slice_status: "FIRST_SLICE_SCAFFOLD_ONLY";
};

export type RuntimePersistenceModel = {
  readonly phase: typeof RUNTIME_PERSISTENCE_MODEL_PHASE;
  readonly name: typeof RUNTIME_PERSISTENCE_MODEL_NAME;
  readonly linked_plan: typeof RUNTIME_SLICE_TECHNICAL_PLAN_NAME;
  readonly linked_use_case: typeof INITIAL_USE_CASE_NAME;
  readonly status: typeof RUNTIME_PERSISTENCE_MODEL_STATUS;
  readonly persistent_records: readonly RuntimePersistenceRecordDescriptor[];
  readonly shared_invariants: readonly string[];
  readonly prisma_scaffold_status: readonly string[];
  readonly typescript_descriptor_status: readonly string[];
  readonly module_mapping: readonly {
    readonly record: RuntimePersistenceRecordName;
    readonly maps_to: readonly string[];
  }[];
  readonly explicitly_out_of_scope: readonly string[];
  readonly next_implementation_sequence: readonly string[];
  readonly safety_boundary: readonly string[];
};

export const RuntimePersistenceRunStates = [
  "CREATED",
  "CONTEXT_RESOLVED",
  "POLICY_EVALUATED",
  "ADMISSION_GRANTED",
  "WAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "RUNNING",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
] as const;

export const RuntimePersistenceRiskLevels = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "MISSING_CONTEXT",
  "UNKNOWN",
  "UNSAFE",
] as const;

export const RuntimePersistenceAdmissionStatuses = [
  "NOT_EVALUATED",
  "ADMITTED",
  "DENIED",
  "REQUIRES_APPROVAL",
] as const;

export const RuntimePersistenceApprovalStatuses = [
  "NOT_REQUIRED",
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "TIMED_OUT",
  "CANCELLED",
] as const;

export const RuntimePersistenceApprovalDecisions = [
  "APPROVE",
  "REJECT",
  "TIMEOUT",
  "CANCEL",
] as const;

export type RuntimePersistenceRunState =
  (typeof RuntimePersistenceRunStates)[number];
export type RuntimePersistenceRiskLevel =
  (typeof RuntimePersistenceRiskLevels)[number];
export type RuntimePersistenceAdmissionStatus =
  (typeof RuntimePersistenceAdmissionStatuses)[number];
export type RuntimePersistenceApprovalStatus =
  (typeof RuntimePersistenceApprovalStatuses)[number];
export type RuntimePersistenceApprovalDecision =
  (typeof RuntimePersistenceApprovalDecisions)[number];

export const RuntimePersistenceRunStateSchema = z.enum(
  RuntimePersistenceRunStates,
);
export const RuntimePersistenceRiskLevelSchema = z.enum(
  RuntimePersistenceRiskLevels,
);
export const RuntimePersistenceAdmissionStatusSchema = z.enum(
  RuntimePersistenceAdmissionStatuses,
);
export const RuntimePersistenceApprovalStatusSchema = z.enum(
  RuntimePersistenceApprovalStatuses,
);
export const RuntimePersistenceApprovalDecisionSchema = z.enum(
  RuntimePersistenceApprovalDecisions,
);

const MAX_RUNTIME_PERSISTENCE_REF_LENGTH = 160;
const MAX_RUNTIME_PERSISTENCE_REASON_LENGTH = 240;
const RUNTIME_PERSISTENCE_UNSAFE_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|credential|display[_-]?name|external[_-]?id|password|path|permission|policy[_-]?internals|private[_-]?key|raw|secret|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name|prefix)/i;

export const RuntimePersistenceOpaqueRefSchema = z
  .string()
  .min(1, "persistence reference must be non-empty.")
  .max(
    MAX_RUNTIME_PERSISTENCE_REF_LENGTH,
    `persistence reference must not exceed ${MAX_RUNTIME_PERSISTENCE_REF_LENGTH} characters.`,
  )
  .refine(
    (value) => !RUNTIME_PERSISTENCE_UNSAFE_TEXT_PATTERN.test(value),
    "persistence reference must be opaque and safe.",
  );

export const RuntimePersistenceSafeReasonSchema = z
  .string()
  .min(1, "reason is required.")
  .max(
    MAX_RUNTIME_PERSISTENCE_REASON_LENGTH,
    `reason must not exceed ${MAX_RUNTIME_PERSISTENCE_REASON_LENGTH} characters.`,
  )
  .refine(
    (value) => !RUNTIME_PERSISTENCE_UNSAFE_TEXT_PATTERN.test(value),
    "reason must be safe and bounded.",
  );

export function isRuntimePersistenceIsoDateTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return false;
  }

  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

const RuntimePersistenceDateTimeSchema = z
  .string()
  .refine(
    isRuntimePersistenceIsoDateTime,
    "timestamp must be an ISO datetime string.",
  );

function requireWorkspaceWhenProjectIsPresent(
  scope: { readonly workspace_id?: unknown; readonly project_id?: unknown },
  context: z.RefinementCtx,
): void {
  if (scope.project_id !== undefined && scope.workspace_id === undefined) {
    context.addIssue({
      code: "custom",
      message: "project_id requires workspace_id.",
      path: ["project_id"],
    });
  }
}

export const GovernedRunPersistenceRecordSchema = z
  .object({
    id: RuntimePersistenceOpaqueRefSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    request_id: RequestIdSchema.optional(),
    correlation_id: CorrelationIdSchema.optional(),
    use_case_name: z.literal(INITIAL_USE_CASE_NAME),
    status: RuntimePersistenceRunStateSchema,
    current_state: RuntimePersistenceRunStateSchema,
    risk_level: RuntimePersistenceRiskLevelSchema,
    admission_status: RuntimePersistenceAdmissionStatusSchema,
    approval_status: RuntimePersistenceApprovalStatusSchema,
    data_classification: DataClassificationSchema,
    created_at: RuntimePersistenceDateTimeSchema,
    updated_at: RuntimePersistenceDateTimeSchema,
  })
  .strict()
  .superRefine((record, context) => {
    requireWorkspaceWhenProjectIsPresent(record, context);

    if (
      record.request_id === undefined &&
      record.correlation_id === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "request_id or correlation_id is required.",
        path: ["request_id"],
      });
    }
  });

export const RuntimeStateSnapshotPersistenceRecordSchema = z
  .object({
    id: RuntimePersistenceOpaqueRefSchema,
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema,
    state: RuntimePersistenceRunStateSchema,
    sequence: z
      .number()
      .int("sequence must be an integer.")
      .positive("sequence must be positive."),
    reason: RuntimePersistenceSafeReasonSchema,
    created_at: RuntimePersistenceDateTimeSchema,
    correlation_id: CorrelationIdSchema,
  })
  .strict();

export const PolicyDecisionRecordPersistenceRecordSchema = z
  .object({
    id: RuntimePersistenceOpaqueRefSchema,
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema,
    policy_action: PolicyActionSchema,
    resource: PolicyResourceTypeSchema,
    purpose: PolicyPurposeSchema,
    risk_level: RuntimePersistenceRiskLevelSchema,
    decision: PolicyDecisionOutcomeSchema,
    reason: RuntimePersistenceSafeReasonSchema,
    obligations: z.array(PolicyObligationSchema).max(16),
    created_at: RuntimePersistenceDateTimeSchema,
  })
  .strict();

export const AdmissionDecisionRecordPersistenceRecordSchema = z
  .object({
    id: RuntimePersistenceOpaqueRefSchema,
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema,
    admission_status: RuntimePersistenceAdmissionStatusSchema,
    reason: RuntimePersistenceSafeReasonSchema,
    requires_approval: z.boolean(),
    policy_decision_id: RuntimePersistenceOpaqueRefSchema,
    created_at: RuntimePersistenceDateTimeSchema,
  })
  .strict();

export const ApprovalRequestPersistenceRecordSchema = z
  .object({
    id: RuntimePersistenceOpaqueRefSchema,
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema,
    admission_decision_id: RuntimePersistenceOpaqueRefSchema,
    approval_status: RuntimePersistenceApprovalStatusSchema,
    requested_role: RuntimePersistenceSafeReasonSchema,
    decision: RuntimePersistenceApprovalDecisionSchema.optional(),
    decision_reason: RuntimePersistenceSafeReasonSchema.optional(),
    requested_at: RuntimePersistenceDateTimeSchema,
    decided_at: RuntimePersistenceDateTimeSchema.optional(),
  })
  .strict();

export const AuditRecordPersistenceRecordSchema = z
  .object({
    id: RuntimePersistenceOpaqueRefSchema,
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema,
    kind: AuditRecordKindSchema,
    subject_ref: AuditOpaqueReferenceSchema,
    actor_ref: AuditOpaqueReferenceSchema,
    evidence_ref: AuditOpaqueReferenceSchema,
    correlation_id: CorrelationIdSchema,
    created_at: RuntimePersistenceDateTimeSchema,
  })
  .strict();

export type GovernedRunPersistenceRecord = z.infer<
  typeof GovernedRunPersistenceRecordSchema
>;
export type RuntimeStateSnapshotPersistenceRecord = z.infer<
  typeof RuntimeStateSnapshotPersistenceRecordSchema
>;
export type PolicyDecisionRecordPersistenceRecord = z.infer<
  typeof PolicyDecisionRecordPersistenceRecordSchema
>;
export type AdmissionDecisionRecordPersistenceRecord = z.infer<
  typeof AdmissionDecisionRecordPersistenceRecordSchema
>;
export type ApprovalRequestPersistenceRecord = z.infer<
  typeof ApprovalRequestPersistenceRecordSchema
>;
export type AuditRecordPersistenceRecord = z.infer<
  typeof AuditRecordPersistenceRecordSchema
>;

export const RuntimePersistenceRecordSchemas = {
  GovernedRun: GovernedRunPersistenceRecordSchema,
  RuntimeStateSnapshot: RuntimeStateSnapshotPersistenceRecordSchema,
  PolicyDecisionRecord: PolicyDecisionRecordPersistenceRecordSchema,
  AdmissionDecisionRecord: AdmissionDecisionRecordPersistenceRecordSchema,
  ApprovalRequest: ApprovalRequestPersistenceRecordSchema,
  AuditRecord: AuditRecordPersistenceRecordSchema,
} as const;

export const RUNTIME_PERSISTENCE_RECORDS = [
  {
    name: "GovernedRun",
    purpose:
      "Root persistent anchor for one governed compliance/document review request.",
    tenant_scope:
      "tenantId is required; workspaceId and projectId remain optional or planned, with projectId requiring workspaceId.",
    correlation_run_linkage:
      "Root run record; requestId or correlationId links intake to downstream records.",
    minimal_conceptual_fields: [
      "id",
      "tenantId",
      "workspaceId optional or planned",
      "projectId optional or planned",
      "requestId or correlationId",
      "useCaseName",
      "status",
      "currentState",
      "riskLevel",
      "admissionStatus",
      "approvalStatus",
      "createdAt planned",
      "updatedAt planned",
    ],
    related_existing_source_modules: ["src/mycelia/governed-run/"],
    required_safety_properties: [
      "tenant-scoped",
      "safe status values only",
      "no raw sensitive document content",
      "references and safe summaries only",
    ],
    first_slice_status: "FIRST_SLICE_SCAFFOLD_ONLY",
  },
  {
    name: "RuntimeStateSnapshot",
    purpose: "Persistent state point for the narrow governed run lifecycle.",
    tenant_scope: "tenantId is required on every state snapshot.",
    correlation_run_linkage:
      "runId references the governed run; correlationId preserves request lineage.",
    minimal_conceptual_fields: [
      "id",
      "tenantId",
      "runId",
      "state",
      "sequence",
      "reason",
      "createdAt planned",
      "correlationId",
    ],
    related_existing_source_modules: [
      "src/mycelia/runtime-state/",
      "src/mycelia/state-transition/",
    ],
    required_safety_properties: [
      "tenant-scoped",
      "run-linked",
      "future monotonic sequence",
      "safe reason text",
    ],
    first_slice_status: "FIRST_SLICE_SCAFFOLD_ONLY",
  },
  {
    name: "PolicyDecisionRecord",
    purpose: "Persistent policy result for the deterministic v1 classifier.",
    tenant_scope: "tenantId is required on every policy decision record.",
    correlation_run_linkage:
      "runId references the governed run whose policy was evaluated.",
    minimal_conceptual_fields: [
      "id",
      "tenantId",
      "runId",
      "policyAction",
      "resource",
      "purpose",
      "riskLevel",
      "decision",
      "reason",
      "obligations",
      "createdAt planned",
    ],
    related_existing_source_modules: ["src/mycelia/policy-decision-gateway/"],
    required_safety_properties: [
      "tenant-scoped",
      "run-linked",
      "fail-closed decision values",
      "safe non-enumerating reason",
    ],
    first_slice_status: "FIRST_SLICE_SCAFFOLD_ONLY",
  },
  {
    name: "AdmissionDecisionRecord",
    purpose:
      "Persistent admission result derived from policy and runtime context.",
    tenant_scope: "tenantId is required on every admission decision record.",
    correlation_run_linkage:
      "runId references the governed run and policyDecisionId links the policy basis.",
    minimal_conceptual_fields: [
      "id",
      "tenantId",
      "runId",
      "admissionStatus",
      "reason",
      "requiresApproval",
      "policyDecisionId",
      "createdAt planned",
    ],
    related_existing_source_modules: [
      "src/mycelia/runtime-admission-gateway/",
    ],
    required_safety_properties: [
      "tenant-scoped",
      "run-linked",
      "policy decision linked",
      "safe non-enumerating reason",
    ],
    first_slice_status: "FIRST_SLICE_SCAFFOLD_ONLY",
  },
  {
    name: "ApprovalRequest",
    purpose: "Persistent approval gate record for medium or uncertain risk.",
    tenant_scope: "tenantId is required on every approval request.",
    correlation_run_linkage:
      "runId references the governed run and admissionDecisionId links the admission basis.",
    minimal_conceptual_fields: [
      "id",
      "tenantId",
      "runId",
      "admissionDecisionId",
      "approvalStatus",
      "requestedRole",
      "decision",
      "decisionReason",
      "requestedAt planned",
      "decidedAt planned optional",
    ],
    related_existing_source_modules: [
      "future approval gate",
      "src/mycelia/policy-decision-gateway/",
      "src/mycelia/runtime-admission-gateway/",
    ],
    required_safety_properties: [
      "tenant-scoped",
      "run-linked",
      "admission decision linked",
      "safe role concept only",
      "no approver identity inference",
    ],
    first_slice_status: "FIRST_SLICE_SCAFFOLD_ONLY",
  },
  {
    name: "AuditRecord",
    purpose:
      "Persistent audit-addressable evidence reference for lifecycle and governance changes.",
    tenant_scope: "tenantId is required on every audit record.",
    correlation_run_linkage:
      "runId references the governed run and correlationId links audit evidence to request lineage.",
    minimal_conceptual_fields: [
      "id",
      "tenantId",
      "runId",
      "kind",
      "subjectRef",
      "actorRef",
      "evidenceRef",
      "correlationId",
      "createdAt planned",
    ],
    related_existing_source_modules: [
      "src/mycelia/audit-record/",
      "src/mycelia/audit-recorder/",
    ],
    required_safety_properties: [
      "tenant-scoped",
      "run-linked",
      "opaque subject and evidence references",
      "no raw sensitive document content",
      "hash-chain/signing/sealing deferred",
    ],
    first_slice_status: "FIRST_SLICE_SCAFFOLD_ONLY",
  },
] as const satisfies readonly RuntimePersistenceRecordDescriptor[];

export const RUNTIME_PERSISTENCE_SHARED_INVARIANTS = [
  "every persisted record is tenant-scoped",
  "every run-linked record references a governed run",
  "every state snapshot has monotonic sequence in future implementation",
  "every policy/admission/approval lifecycle change must be audit-addressable",
  "no record stores raw sensitive document content in the first slice",
  "records use references and safe summaries instead of raw payloads",
  "no external IDs should be treated as trusted without validation",
  "no cross-tenant relationship is allowed",
] as const;

export const RUNTIME_PERSISTENCE_PRISMA_SCAFFOLD_STATUS = [
  "no active Prisma schema exists in the current repository surface",
  "this phase does not create a full Prisma schema because active Prisma conventions are not present",
  "no migration file is created",
  "Prisma generate is not run",
  "future Prisma modeling should derive from this TypeScript scaffold and product documentation",
] as const;

export const RUNTIME_PERSISTENCE_TYPESCRIPT_DESCRIPTOR_STATUS = [
  "six first-slice record descriptors are defined",
  "six pure Zod schemas describe future persisted record shape",
  "schemas validate tenant scope, run linkage fields, bounded safe text and planned timestamps",
  "schemas do not read, write, connect, migrate or execute runtime",
] as const;

export const RUNTIME_PERSISTENCE_MODULE_MAPPING = [
  {
    record: "GovernedRun",
    maps_to: ["src/mycelia/governed-run/"],
  },
  {
    record: "RuntimeStateSnapshot",
    maps_to: ["src/mycelia/runtime-state/", "src/mycelia/state-transition/"],
  },
  {
    record: "PolicyDecisionRecord",
    maps_to: ["src/mycelia/policy-decision-gateway/"],
  },
  {
    record: "AdmissionDecisionRecord",
    maps_to: ["src/mycelia/runtime-admission-gateway/"],
  },
  {
    record: "ApprovalRequest",
    maps_to: [
      "future approval gate",
      "src/mycelia/policy-decision-gateway/",
      "src/mycelia/runtime-admission-gateway/",
    ],
  },
  {
    record: "AuditRecord",
    maps_to: ["src/mycelia/audit-record/", "src/mycelia/audit-recorder/"],
  },
] as const satisfies RuntimePersistenceModel["module_mapping"];

export const RUNTIME_PERSISTENCE_EXPLICITLY_OUT_OF_SCOPE = [
  "no runtime execution",
  "no DB access",
  "no migrations",
  "no Prisma generate",
  "no repository/service layer",
  "no API",
  "no auth",
  "no UI",
  "no event emission",
  "no replay execution",
  "no external integrations",
  "no sensitive document storage",
  "no hash-chain/signing/sealing yet",
  "no export/PDF/download",
] as const;

export const RUNTIME_PERSISTENCE_NEXT_IMPLEMENTATION_SEQUENCE = [
  "2S Minimal Governed Run Lifecycle",
  "2T Policy/Admission v1",
  "2U Audit Commit Boundary",
  "2V Approval Gate v1",
  "2W Investigation View v1",
] as const;

export const RUNTIME_PERSISTENCE_SAFETY_BOUNDARY = [
  "this phase defines persistence model shape only",
  "this phase does not execute runtime",
  "this phase does not persist data",
  "this phase does not connect to a database",
  "this phase does not create migrations",
  "this phase does not call APIs",
  "this phase does not call external services",
  "this phase does not create auth",
] as const;

export const RUNTIME_PERSISTENCE_MODEL = {
  phase: RUNTIME_PERSISTENCE_MODEL_PHASE,
  name: RUNTIME_PERSISTENCE_MODEL_NAME,
  linked_plan: RUNTIME_SLICE_TECHNICAL_PLAN_NAME,
  linked_use_case: INITIAL_USE_CASE_NAME,
  status: RUNTIME_PERSISTENCE_MODEL_STATUS,
  persistent_records: RUNTIME_PERSISTENCE_RECORDS,
  shared_invariants: RUNTIME_PERSISTENCE_SHARED_INVARIANTS,
  prisma_scaffold_status: RUNTIME_PERSISTENCE_PRISMA_SCAFFOLD_STATUS,
  typescript_descriptor_status:
    RUNTIME_PERSISTENCE_TYPESCRIPT_DESCRIPTOR_STATUS,
  module_mapping: RUNTIME_PERSISTENCE_MODULE_MAPPING,
  explicitly_out_of_scope: RUNTIME_PERSISTENCE_EXPLICITLY_OUT_OF_SCOPE,
  next_implementation_sequence:
    RUNTIME_PERSISTENCE_NEXT_IMPLEMENTATION_SEQUENCE,
  safety_boundary: RUNTIME_PERSISTENCE_SAFETY_BOUNDARY,
} as const satisfies RuntimePersistenceModel;

export function getRuntimePersistenceModel(): RuntimePersistenceModel {
  return RUNTIME_PERSISTENCE_MODEL;
}
