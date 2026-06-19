import { z } from "zod";

export const RUNTIME_SLICE_CONSISTENCY_AUDIT_PHASE = "2Z";

export const RUNTIME_SLICE_CONSISTENCY_AUDIT_NAME =
  "Runtime Slice Consistency Audit";

export const RUNTIME_SLICE_CONSISTENCY_AUDIT_STATUS =
  "static descriptor-level audit only";

export const RuntimeSliceConsistencyAuditVerdicts = [
  "GREEN",
  "YELLOW",
  "RED",
] as const;

export type RuntimeSliceConsistencyAuditVerdict =
  (typeof RuntimeSliceConsistencyAuditVerdicts)[number];

export const RuntimeSliceConsistencyFindingSeverities = [
  "INFO",
  "WARNING",
  "BLOCKER",
] as const;

export type RuntimeSliceConsistencyFindingSeverity =
  (typeof RuntimeSliceConsistencyFindingSeverities)[number];

export const RuntimeSliceConsistencyAuditSections = [
  "scope",
  "moduleInventory",
  "flowConsistency",
  "orchestratorDecisionPaths",
  "safetyBoundary",
  "sideEffectBoundary",
  "documentationAlignment",
  "persistenceReadiness",
  "phase3AReadiness",
  "risks",
  "requiredNextActions",
] as const;

export type RuntimeSliceConsistencyAuditSection =
  (typeof RuntimeSliceConsistencyAuditSections)[number];

export const RuntimeSliceConsistencyRuntimeModules = [
  "runtime-slice-technical-plan",
  "runtime-persistence-model",
  "governed-run-lifecycle",
  "policy-admission-v1",
  "audit-commit-boundary",
  "approval-gate-v1",
  "investigation-view-model-v1",
  "replay-dry-run-descriptor-v1",
  "internal-runtime-orchestrator-v1",
] as const;

export type RuntimeSliceConsistencyRuntimeModule =
  (typeof RuntimeSliceConsistencyRuntimeModules)[number];

export const RuntimeSliceConsistencyCheckStatusSchema = z.enum([
  "PASS",
  "TRACK",
  "FAIL",
]);

export type RuntimeSliceConsistencyCheckStatus = z.infer<
  typeof RuntimeSliceConsistencyCheckStatusSchema
>;

export const RuntimeSliceConsistencyAuditVerdictSchema = z.enum(
  RuntimeSliceConsistencyAuditVerdicts,
);

export const RuntimeSliceConsistencyFindingSeveritySchema = z.enum(
  RuntimeSliceConsistencyFindingSeverities,
);

export const RuntimeSliceConsistencyAuditSectionSchema = z.enum(
  RuntimeSliceConsistencyAuditSections,
);

export const RuntimeSliceConsistencyRuntimeModuleSchema = z.enum(
  RuntimeSliceConsistencyRuntimeModules,
);

export const RuntimeSliceConsistencyFindingSchema = z
  .object({
    severity: RuntimeSliceConsistencyFindingSeveritySchema,
    code: z.string().min(1).max(120),
    section: RuntimeSliceConsistencyAuditSectionSchema,
    safe_summary: z.string().min(1).max(320),
    required_action: z.string().min(1).max(320),
  })
  .strict();

export type RuntimeSliceConsistencyFinding = z.infer<
  typeof RuntimeSliceConsistencyFindingSchema
>;

export const RuntimeSliceConsistencyCheckSchema = z
  .object({
    id: z.string().min(1).max(120),
    section: RuntimeSliceConsistencyAuditSectionSchema,
    subject: z.string().min(1).max(160),
    status: RuntimeSliceConsistencyCheckStatusSchema,
    safe_summary: z.string().min(1).max(320),
  })
  .strict();

export type RuntimeSliceConsistencyCheck = z.infer<
  typeof RuntimeSliceConsistencyCheckSchema
>;

export const RuntimeSliceConsistencyModuleInventorySchema = z
  .object({
    module: RuntimeSliceConsistencyRuntimeModuleSchema,
    source_module: z.string().min(1).max(160),
    phase_introduced: z.string().min(2).max(4),
    role: z.string().min(1).max(320),
    expected_boundary: z.string().min(1).max(320),
    pure_typescript: z.boolean(),
    inactive_persistence_runtime_api: z.boolean(),
  })
  .strict();

export type RuntimeSliceConsistencyModuleInventory = z.infer<
  typeof RuntimeSliceConsistencyModuleInventorySchema
>;

export const RuntimeSliceConsistencyOrchestratorPathSchema = z
  .object({
    path: z.string().min(1).max(160),
    expected_result: z.string().min(1).max(160),
    check_status: RuntimeSliceConsistencyCheckStatusSchema,
    safe_summary: z.string().min(1).max(320),
  })
  .strict();

export type RuntimeSliceConsistencyOrchestratorPath = z.infer<
  typeof RuntimeSliceConsistencyOrchestratorPathSchema
>;

export const RuntimeSliceConsistencyBoundaryResultSchema = z
  .object({
    boundary: z.string().min(1).max(160),
    status: RuntimeSliceConsistencyCheckStatusSchema,
    safe_summary: z.string().min(1).max(320),
  })
  .strict();

export type RuntimeSliceConsistencyBoundaryResult = z.infer<
  typeof RuntimeSliceConsistencyBoundaryResultSchema
>;

export const RuntimeSliceConsistencyDocumentationResultSchema = z
  .object({
    requirement: z.string().min(1).max(220),
    status: RuntimeSliceConsistencyCheckStatusSchema,
    safe_summary: z.string().min(1).max(320),
  })
  .strict();

export type RuntimeSliceConsistencyDocumentationResult = z.infer<
  typeof RuntimeSliceConsistencyDocumentationResultSchema
>;

export const RuntimeSliceConsistencyPhase3AReadinessSchema = z
  .object({
    recommendation: z.literal("GO"),
    next_phase: z.literal("Phase 3A Minimal Persistence Activation"),
    go_no_go_statement: z.string().min(1).max(360),
    required_guardrails: z.array(z.string().min(1).max(260)).min(1),
  })
  .strict();

export type RuntimeSliceConsistencyPhase3AReadiness = z.infer<
  typeof RuntimeSliceConsistencyPhase3AReadinessSchema
>;

export const RuntimeSliceConsistencyAuditSchema = z
  .object({
    phase: z.literal(RUNTIME_SLICE_CONSISTENCY_AUDIT_PHASE),
    name: z.literal(RUNTIME_SLICE_CONSISTENCY_AUDIT_NAME),
    status: z.literal(RUNTIME_SLICE_CONSISTENCY_AUDIT_STATUS),
    verdict: RuntimeSliceConsistencyAuditVerdictSchema,
    safe_summary: z.string().min(1).max(420),
    sections: z.array(RuntimeSliceConsistencyAuditSectionSchema).length(11),
    module_inventory: z
      .array(RuntimeSliceConsistencyModuleInventorySchema)
      .length(9),
    flow_order: z.array(RuntimeSliceConsistencyRuntimeModuleSchema).length(9),
    checks: z.array(RuntimeSliceConsistencyCheckSchema).min(1),
    findings: z.array(RuntimeSliceConsistencyFindingSchema).min(1),
    orchestrator_decision_paths: z
      .array(RuntimeSliceConsistencyOrchestratorPathSchema)
      .min(9),
    side_effect_boundary_results: z
      .array(RuntimeSliceConsistencyBoundaryResultSchema)
      .min(1),
    documentation_alignment_results: z
      .array(RuntimeSliceConsistencyDocumentationResultSchema)
      .min(1),
    persistence_readiness: z.array(RuntimeSliceConsistencyCheckSchema).min(1),
    phase3a_readiness: RuntimeSliceConsistencyPhase3AReadinessSchema,
    risks: z.array(z.string().min(1).max(260)).min(1),
    required_next_actions: z.array(z.string().min(1).max(260)).min(1),
    explicitly_not_active: z.array(z.string().min(1).max(180)).min(1),
  })
  .strict();

export type RuntimeSliceConsistencyAudit = z.infer<
  typeof RuntimeSliceConsistencyAuditSchema
>;

const MODULE_INVENTORY = [
  {
    module: "runtime-slice-technical-plan",
    source_module: "src/mycelia/planning/runtime-slice-technical-plan/",
    phase_introduced: "2Q",
    role: "Defines the technical plan and intended order for the minimal governed runtime slice.",
    expected_boundary:
      "Static plan only; no runtime execution, storage, schema, API or auth activation.",
    pure_typescript: true,
    inactive_persistence_runtime_api: true,
  },
  {
    module: "runtime-persistence-model",
    source_module: "src/mycelia/persistence/runtime-persistence-model/",
    phase_introduced: "2R",
    role: "Defines the first six persistence record descriptors and schemas as a scaffold.",
    expected_boundary:
      "Persistence model scaffold only; no storage reads, writes, migrations or repository layer.",
    pure_typescript: true,
    inactive_persistence_runtime_api: true,
  },
  {
    module: "governed-run-lifecycle",
    source_module: "src/mycelia/runtime-logic/governed-run-lifecycle/",
    phase_introduced: "2S",
    role: "Evaluates fail-closed governed run lifecycle transitions in memory.",
    expected_boundary:
      "Pure transition logic only; no state mutation, persistence, events or audit writing.",
    pure_typescript: true,
    inactive_persistence_runtime_api: true,
  },
  {
    module: "policy-admission-v1",
    source_module: "src/mycelia/runtime-logic/policy-admission-v1/",
    phase_introduced: "2T",
    role: "Evaluates deterministic policy/admission outcomes for the frozen use case.",
    expected_boundary:
      "Pure decision logic only; no policy engine service, approval queue, persistence or runtime execution.",
    pure_typescript: true,
    inactive_persistence_runtime_api: true,
  },
  {
    module: "audit-commit-boundary",
    source_module: "src/mycelia/runtime-logic/audit-commit-boundary/",
    phase_introduced: "2U",
    role: "Classifies audit-addressable moments and future audit requirements.",
    expected_boundary:
      "Pure boundary classification only; no audit writing, append log, event emission or storage.",
    pure_typescript: true,
    inactive_persistence_runtime_api: true,
  },
  {
    module: "approval-gate-v1",
    source_module: "src/mycelia/runtime-logic/approval-gate-v1/",
    phase_introduced: "2V",
    role: "Evaluates deterministic approval outcomes for approval-required policy decisions.",
    expected_boundary:
      "Pure approval decision logic only; no approval UI, queue, storage, audit writing or events.",
    pure_typescript: true,
    inactive_persistence_runtime_api: true,
  },
  {
    module: "investigation-view-model-v1",
    source_module: "src/mycelia/runtime-logic/investigation-view-model-v1/",
    phase_introduced: "2W",
    role: "Assembles a safe investigation read-model descriptor from supplied descriptors.",
    expected_boundary:
      "Pure read-model assembly only; no UI, storage reads, inference of missing evidence or persistence.",
    pure_typescript: true,
    inactive_persistence_runtime_api: true,
  },
  {
    module: "replay-dry-run-descriptor-v1",
    source_module: "src/mycelia/runtime-logic/replay-dry-run-descriptor-v1/",
    phase_introduced: "2X",
    role: "Assembles safe replay dry-run descriptors from supplied investigation and governance descriptors.",
    expected_boundary:
      "Descriptor dry-run only; no replay execution, tools, external calls, storage reads or state mutation.",
    pure_typescript: true,
    inactive_persistence_runtime_api: true,
  },
  {
    module: "internal-runtime-orchestrator-v1",
    source_module: "src/mycelia/runtime-logic/internal-runtime-orchestrator-v1/",
    phase_introduced: "2Y",
    role: "Composes the pure runtime-slice layers into one deterministic in-memory descriptor flow.",
    expected_boundary:
      "Pure orchestration descriptor only; no runtime execution, replay execution, storage, API or events.",
    pure_typescript: true,
    inactive_persistence_runtime_api: true,
  },
] as const satisfies readonly RuntimeSliceConsistencyModuleInventory[];

const ORCHESTRATOR_PATHS = [
  {
    path: "low-risk input",
    expected_result: "COMPLETED_DESCRIPTOR",
    check_status: "PASS",
    safe_summary:
      "Low risk with resolved context and matched tenant boundary completes descriptor flow.",
  },
  {
    path: "medium-risk without approval",
    expected_result: "WAITING_APPROVAL",
    check_status: "PASS",
    safe_summary:
      "Medium risk requires approval and pauses as descriptor-only waiting approval.",
  },
  {
    path: "medium-risk approved",
    expected_result: "COMPLETED_DESCRIPTOR",
    check_status: "PASS",
    safe_summary:
      "Approved medium risk resumes descriptor flow and reaches completed descriptor status.",
  },
  {
    path: "medium-risk rejected",
    expected_result: "REJECTED_DESCRIPTOR",
    check_status: "PASS",
    safe_summary:
      "Rejected approval maps to rejected descriptor status without runtime execution.",
  },
  {
    path: "medium-risk timeout",
    expected_result: "FAILED_DESCRIPTOR",
    check_status: "PASS",
    safe_summary:
      "Timed-out approval maps to failed descriptor status without side effects.",
  },
  {
    path: "high-risk input",
    expected_result: "REJECTED_DESCRIPTOR",
    check_status: "PASS",
    safe_summary: "High risk denies and maps to rejected descriptor status.",
  },
  {
    path: "missing context",
    expected_result: "REJECTED_DESCRIPTOR",
    check_status: "PASS",
    safe_summary:
      "Missing required context fails closed through policy/admission denial.",
  },
  {
    path: "tenant boundary mismatch",
    expected_result: "REJECTED_DESCRIPTOR",
    check_status: "PASS",
    safe_summary:
      "Tenant boundary mismatch fails closed through policy/admission denial.",
  },
  {
    path: "cross-tenant descriptor mismatch",
    expected_result: "BLOCKED",
    check_status: "PASS",
    safe_summary:
      "Cross-tenant descriptor references return a safe blocked denial.",
  },
  {
    path: "invalid input",
    expected_result: "BLOCKED",
    check_status: "PASS",
    safe_summary: "Invalid input returns safe denial with blocked status.",
  },
] as const satisfies readonly RuntimeSliceConsistencyOrchestratorPath[];

const SIDE_EFFECT_BOUNDARIES = [
  "runtime execution",
  "replay execution",
  "persistence",
  "storage reads",
  "storage writes",
  "API routes",
  "auth activation",
  "UI rendering",
  "external calls",
  "event emission",
  "audit writing",
  "append log writing",
  "tool execution",
  "random behavior",
  "timestamp generation",
  "downloadable artifacts",
] as const;

function sideEffectBoundaryResults(): RuntimeSliceConsistencyBoundaryResult[] {
  return SIDE_EFFECT_BOUNDARIES.map((boundary) =>
    RuntimeSliceConsistencyBoundaryResultSchema.parse({
      boundary,
      status: "PASS",
      safe_summary: `${boundary} remains absent from the runtime slice implementation.`,
    }),
  );
}

const DOCUMENTATION_ALIGNMENT_RESULTS = [
  {
    requirement: "runtime execution is not active",
    status: "PASS",
    safe_summary: "Product and architecture docs keep runtime execution inactive.",
  },
  {
    requirement: "persistence is not active",
    status: "PASS",
    safe_summary: "Docs distinguish the persistence scaffold from active storage.",
  },
  {
    requirement: "API and auth are not active",
    status: "PASS",
    safe_summary: "Docs keep API routes and auth out of the current runtime slice.",
  },
  {
    requirement: "storage reads and writes are not active",
    status: "PASS",
    safe_summary: "Docs keep storage access out until Phase 3A.",
  },
  {
    requirement: "replay execution is not active",
    status: "PASS",
    safe_summary: "Replay remains dry-run descriptor-only.",
  },
  {
    requirement: "audit writing is not active",
    status: "PASS",
    safe_summary: "Audit commit boundary remains classification only.",
  },
  {
    requirement: "3A is the next persistence activation phase",
    status: "PASS",
    safe_summary:
      "Audit recommendation points to Phase 3A Minimal Persistence Activation.",
  },
] as const satisfies readonly RuntimeSliceConsistencyDocumentationResult[];

const PERSISTENCE_READINESS_CHECKS = [
  {
    id: "six-record-first-slice",
    section: "persistenceReadiness",
    subject: "first persistence record set",
    status: "PASS",
    safe_summary:
      "The first slice remains GovernedRun, RuntimeStateSnapshot, PolicyDecisionRecord, AdmissionDecisionRecord, ApprovalRequest and AuditRecord.",
  },
  {
    id: "deterministic-orchestrator-paths",
    section: "persistenceReadiness",
    subject: "orchestrator path determinism",
    status: "PASS",
    safe_summary:
      "The in-memory orchestrator has deterministic descriptor paths for admit, approval, reject, failure and blocked input.",
  },
  {
    id: "audit-boundary-present",
    section: "persistenceReadiness",
    subject: "audit boundary",
    status: "PASS",
    safe_summary:
      "Audit commit boundary exists before persistence activation and stays descriptor-only.",
  },
  {
    id: "approval-investigation-replay-present",
    section: "persistenceReadiness",
    subject: "approval investigation replay descriptors",
    status: "PASS",
    safe_summary:
      "Approval, investigation and replay descriptor layers exist before storage activation.",
  },
  {
    id: "prisma-inactive-before-3a",
    section: "persistenceReadiness",
    subject: "Prisma boundary",
    status: "PASS",
    safe_summary:
      "Prisma remains inactive before Phase 3A; no migrations or generated client behavior are required by this audit.",
  },
] as const satisfies readonly RuntimeSliceConsistencyCheck[];

const CHECKS = [
  {
    id: "scope-frozen-use-case",
    section: "scope",
    subject: "frozen use case",
    status: "PASS",
    safe_summary:
      "Runtime slice layers align to governed compliance/document review flow.",
  },
  {
    id: "module-inventory-complete",
    section: "moduleInventory",
    subject: "runtime slice module inventory",
    status: "PASS",
    safe_summary: "All nine runtime-slice modules are represented.",
  },
  {
    id: "flow-order-coherent",
    section: "flowConsistency",
    subject: "2Q through 2Y flow order",
    status: "PASS",
    safe_summary:
      "Plan, scaffold, lifecycle, policy, audit, approval, investigation, replay and orchestrator order is coherent.",
  },
  {
    id: "orchestrator-paths-covered",
    section: "orchestratorDecisionPaths",
    subject: "descriptor path coverage",
    status: "PASS",
    safe_summary:
      "Required orchestrator decision paths are covered as descriptor outcomes.",
  },
  {
    id: "safety-boundary-held",
    section: "safetyBoundary",
    subject: "descriptor-only boundary",
    status: "PASS",
    safe_summary:
      "Runtime slice remains pure TypeScript, deterministic and descriptor-level.",
  },
  {
    id: "side-effects-absent",
    section: "sideEffectBoundary",
    subject: "forbidden behavior scan",
    status: "PASS",
    safe_summary:
      "Source safety tests scan for forbidden runtime, storage, API, event, audit, tool and replay behavior.",
  },
  {
    id: "documentation-aligned",
    section: "documentationAlignment",
    subject: "product and architecture truth",
    status: "PASS",
    safe_summary:
      "Docs consistently describe 2R through 2Y as inactive runtime-slice layers.",
  },
  ...PERSISTENCE_READINESS_CHECKS,
  {
    id: "phase3a-go",
    section: "phase3AReadiness",
    subject: "Phase 3A readiness",
    status: "PASS",
    safe_summary:
      "The slice is ready to plan narrow Phase 3A Minimal Persistence Activation.",
  },
] as const satisfies readonly RuntimeSliceConsistencyCheck[];

const FINDINGS = [
  {
    severity: "INFO",
    code: "RUNTIME_SLICE_COHERENT",
    section: "scope",
    safe_summary:
      "The 2R through 2Y runtime slice is coherent for the frozen governed compliance/document review flow.",
    required_action:
      "Proceed only with narrow Phase 3A persistence activation planning.",
  },
  {
    severity: "INFO",
    code: "NO_SIDE_EFFECT_BOUNDARY_HELD",
    section: "sideEffectBoundary",
    safe_summary:
      "The runtime slice remains descriptor-only with no active runtime, storage, API, event, audit or replay behavior.",
    required_action:
      "Keep these boundaries in place during Phase 3A scaffolding.",
  },
  {
    severity: "INFO",
    code: "PHASE_3A_READY_WITH_GUARDRAILS",
    section: "phase3AReadiness",
    safe_summary:
      "Phase 3A can begin if it activates only the minimal persistence boundary for the six first-slice records.",
    required_action:
      "Do not expand into API, auth, UI, replay execution, audit storage or external integrations.",
  },
] as const satisfies readonly RuntimeSliceConsistencyFinding[];

const PHASE3A_READINESS = {
  recommendation: "GO",
  next_phase: "Phase 3A Minimal Persistence Activation",
  go_no_go_statement:
    "GO for Phase 3A Minimal Persistence Activation, limited to the planned six-record persistence boundary and preserving descriptor-first safety.",
  required_guardrails: [
    "Keep the first persistence slice limited to the six planned records.",
    "Do not add API routes, auth, UI, external calls, replay execution or audit writing in Phase 3A.",
    "Keep Prisma and storage activation narrow, explicit and test-covered.",
  ],
} as const satisfies RuntimeSliceConsistencyPhase3AReadiness;

export const RUNTIME_SLICE_CONSISTENCY_AUDIT = {
  phase: RUNTIME_SLICE_CONSISTENCY_AUDIT_PHASE,
  name: RUNTIME_SLICE_CONSISTENCY_AUDIT_NAME,
  status: RUNTIME_SLICE_CONSISTENCY_AUDIT_STATUS,
  verdict: "GREEN",
  safe_summary:
    "The minimal governed runtime slice is coherent, deterministic, descriptor-only and ready for narrow Phase 3A persistence activation planning.",
  sections: RuntimeSliceConsistencyAuditSections,
  module_inventory: MODULE_INVENTORY,
  flow_order: RuntimeSliceConsistencyRuntimeModules,
  checks: CHECKS,
  findings: FINDINGS,
  orchestrator_decision_paths: ORCHESTRATOR_PATHS,
  side_effect_boundary_results: sideEffectBoundaryResults(),
  documentation_alignment_results: DOCUMENTATION_ALIGNMENT_RESULTS,
  persistence_readiness: PERSISTENCE_READINESS_CHECKS,
  phase3a_readiness: PHASE3A_READINESS,
  risks: [
    "Phase 3A must remain narrow and should not become API, auth, UI or runtime execution work.",
    "Persistence activation should not add replay execution, audit writing or external integrations.",
  ],
  required_next_actions: [
    "Start Phase 3A Minimal Persistence Activation with explicit storage boundaries.",
    "Preserve deterministic descriptor inputs for lifecycle, policy, approval, audit, investigation and replay layers.",
    "Keep package and dependency boundaries unchanged unless a future phase explicitly approves them.",
  ],
  explicitly_not_active: [
    "runtime execution",
    "replay execution",
    "workflow execution",
    "persistence",
    "storage reads",
    "storage writes",
    "API routes",
    "auth",
    "UI",
    "event emission",
    "audit writing",
    "append log writing",
    "tool execution",
    "external calls",
    "downloads or generated artifacts",
  ],
} as const;

export function getRuntimeSliceConsistencyAudit():
  RuntimeSliceConsistencyAudit {
  return RuntimeSliceConsistencyAuditSchema.parse(
    RUNTIME_SLICE_CONSISTENCY_AUDIT,
  );
}
