import { INITIAL_USE_CASE_NAME } from "../initial-use-case-freeze";
import { PILOT_OFFER_PILOT_PACKAGE } from "../pilot-offer-package";

export const RUNTIME_SLICE_TECHNICAL_PLAN_PHASE = "2Q";

export const RUNTIME_SLICE_TECHNICAL_PLAN_NAME =
  "Runtime Slice Technical Plan";

export const RUNTIME_SLICE_TECHNICAL_PLAN_STATUS =
  "technical plan for next implementation phases";

export type RuntimeSlicePersistentEntityTiming =
  | "FIRST_PERSISTENCE_SLICE"
  | "LATER_SLICE";

export type RuntimeSlicePersistentEntityPlan = {
  readonly entity: string;
  readonly purpose: string;
  readonly minimal_fields_conceptual: readonly string[];
  readonly source_modules: readonly string[];
  readonly frozen_use_case_need: string;
  readonly persistence_timing: RuntimeSlicePersistentEntityTiming;
};

export type RuntimeSliceStatePlan = {
  readonly state: string;
  readonly meaning: string;
  readonly allowed_next_states: readonly string[];
  readonly audit_requirement: string;
  readonly approval_relevant: boolean;
};

export type RuntimeSlicePolicyAdmissionRule = {
  readonly condition: string;
  readonly policy_behavior: string;
  readonly admission_behavior: string;
  readonly justification: string;
};

export type RuntimeSliceImplementationPhase = {
  readonly phase: string;
  readonly objective: string;
  readonly why_order: string;
  readonly likely_modules_files: readonly string[];
  readonly risk: string;
  readonly value: string;
};

export type RuntimeSliceTechnicalPlan = {
  readonly phase: typeof RUNTIME_SLICE_TECHNICAL_PLAN_PHASE;
  readonly name: typeof RUNTIME_SLICE_TECHNICAL_PLAN_NAME;
  readonly linked_use_case: typeof INITIAL_USE_CASE_NAME;
  readonly linked_offer: typeof PILOT_OFFER_PILOT_PACKAGE.name;
  readonly status: typeof RUNTIME_SLICE_TECHNICAL_PLAN_STATUS;
  readonly runtime_slice_goal: readonly string[];
  readonly minimal_runtime_flow: readonly string[];
  readonly future_persistent_entities:
    readonly RuntimeSlicePersistentEntityPlan[];
  readonly state_lifecycle: readonly RuntimeSliceStatePlan[];
  readonly policy_admission_v1: {
    readonly behavior: readonly RuntimeSlicePolicyAdmissionRule[];
    readonly inputs_needed: readonly string[];
    readonly outputs_needed: readonly string[];
    readonly fail_closed_rule: string;
    readonly relation_to_existing_modules: readonly string[];
  };
  readonly approval_gate_v1: {
    readonly required_when: readonly string[];
    readonly approval_request_contains: readonly string[];
    readonly allowed_outcomes: readonly string[];
    readonly conceptual_approvers: readonly string[];
    readonly audit_records_required: readonly string[];
    readonly result_handling: readonly string[];
  };
  readonly audit_commit_boundary: {
    readonly lifecycle_moments: readonly string[];
    readonly evidence_references: readonly string[];
    readonly immutable_later: readonly string[];
    readonly not_implemented_yet: readonly string[];
  };
  readonly investigation_view_v1: {
    readonly reads: readonly string[];
    readonly must_show: readonly string[];
    readonly must_not_infer: readonly string[];
    readonly relates_to: readonly string[];
  };
  readonly replay_dry_run_v1: {
    readonly definition: string;
    readonly guarantees: readonly string[];
    readonly differs_from_real_replay: readonly string[];
  };
  readonly next_implementation_sequence:
    readonly RuntimeSliceImplementationPhase[];
  readonly explicitly_out_of_scope: readonly string[];
  readonly safety_boundary: readonly string[];
};

export const RUNTIME_SLICE_GOAL = [
  "The first runtime slice must prove one narrow governed compliance/document review flow.",
  "It must transform existing descriptors and contracts into one controlled operational lifecycle.",
  "It must not become a general-purpose workflow platform yet.",
  "It must support future assessment and pilot delivery for the frozen commercial wedge.",
] as const;

export const RUNTIME_SLICE_MINIMAL_RUNTIME_FLOW = [
  "Create governed request",
  "Resolve organizational context",
  "Check tenant/context boundary",
  "Classify risk/policy",
  "Decide admission",
  "Pause for approval when required",
  "Resume after approval",
  "Transition run state",
  "Commit audit record",
  "Prepare investigation view",
  "Prepare replay dry-run descriptor",
  "Mark run completed or rejected",
] as const;

export const RUNTIME_SLICE_FUTURE_PERSISTENT_ENTITIES = [
  {
    entity: "GovernedRun",
    purpose: "Root record for one governed compliance/document review request.",
    minimal_fields_conceptual: [
      "run_id",
      "tenant_id",
      "request_id",
      "status",
      "declared_purpose",
      "data_classification",
      "created_at",
      "correlation_id",
    ],
    source_modules: ["src/mycelia/governed-run/"],
    frozen_use_case_need:
      "Provides the durable anchor for admission, approval, state, audit, investigation and replay planning.",
    persistence_timing: "FIRST_PERSISTENCE_SLICE",
  },
  {
    entity: "RuntimeStateSnapshot",
    purpose: "Versioned state snapshot for the governed run lifecycle.",
    minimal_fields_conceptual: [
      "state_id",
      "run_id",
      "tenant_id",
      "state",
      "version",
      "recorded_at",
      "previous_state_id",
      "correlation_id",
    ],
    source_modules: [
      "src/mycelia/runtime-state/",
      "src/mycelia/state-transition/",
    ],
    frozen_use_case_need:
      "Makes the narrow run lifecycle inspectable and resumable in later implementation phases.",
    persistence_timing: "FIRST_PERSISTENCE_SLICE",
  },
  {
    entity: "PolicyDecisionRecord",
    purpose: "Recorded deterministic policy outcome for the request.",
    minimal_fields_conceptual: [
      "decision_id",
      "run_id",
      "tenant_id",
      "risk_classification",
      "outcome",
      "reason_code",
      "decided_at",
    ],
    source_modules: ["src/mycelia/policy-decision-gateway/"],
    frozen_use_case_need:
      "Explains whether the document review is low, medium, high, missing-context or unknown-risk.",
    persistence_timing: "FIRST_PERSISTENCE_SLICE",
  },
  {
    entity: "AdmissionDecisionRecord",
    purpose: "Recorded runtime admission decision derived from policy.",
    minimal_fields_conceptual: [
      "admission_decision_id",
      "run_id",
      "tenant_id",
      "outcome",
      "reason_code",
      "decided_at",
      "policy_decision_id",
    ],
    source_modules: ["src/mycelia/runtime-admission-gateway/"],
    frozen_use_case_need:
      "Separates policy classification from the operational decision to admit, deny or require approval.",
    persistence_timing: "FIRST_PERSISTENCE_SLICE",
  },
  {
    entity: "ApprovalRequest",
    purpose: "Approval gate record for medium or uncertain risk.",
    minimal_fields_conceptual: [
      "approval_request_id",
      "run_id",
      "tenant_id",
      "requested_reason",
      "status",
      "requested_at",
      "decided_at",
      "decision",
    ],
    source_modules: [
      "src/mycelia/policy-decision-gateway/",
      "src/mycelia/runtime-admission-gateway/",
    ],
    frozen_use_case_need:
      "Allows the first pilot flow to pause before unsafe operational side effects.",
    persistence_timing: "FIRST_PERSISTENCE_SLICE",
  },
  {
    entity: "AuditRecord",
    purpose: "Immutable evidence descriptor for key lifecycle decisions.",
    minimal_fields_conceptual: [
      "audit_record_id",
      "tenant_id",
      "kind",
      "actor_ref",
      "subject_ref",
      "evidence_ref",
      "outcome",
      "recorded_at",
      "correlation_id",
    ],
    source_modules: [
      "src/mycelia/audit-record/",
      "src/mycelia/audit-recorder/",
    ],
    frozen_use_case_need:
      "Captures request framing, policy/admission, approval, state transition and completion evidence.",
    persistence_timing: "FIRST_PERSISTENCE_SLICE",
  },
  {
    entity: "InvestigationCase or InvestigationBundleView",
    purpose: "Read model that groups the run, decisions, approval and audit evidence.",
    minimal_fields_conceptual: [
      "investigation_view_id",
      "run_id",
      "tenant_id",
      "audit_record_refs",
      "decision_refs",
      "approval_refs",
      "created_at",
    ],
    source_modules: ["src/mycelia/investigation-bundle/"],
    frozen_use_case_need:
      "Gives stakeholders a coherent way to inspect what happened without reconstructing context manually.",
    persistence_timing: "LATER_SLICE",
  },
  {
    entity: "ReplayDryRunPlan",
    purpose: "Descriptor-only reconstruction plan for the completed or rejected run.",
    minimal_fields_conceptual: [
      "replay_plan_id",
      "run_id",
      "tenant_id",
      "ordered_step_refs",
      "unavailable_context_notes",
      "created_at",
    ],
    source_modules: ["src/mycelia/replay-plan/"],
    frozen_use_case_need:
      "Explains how a future replay system could inspect the run without executing side effects.",
    persistence_timing: "LATER_SLICE",
  },
] as const satisfies readonly RuntimeSlicePersistentEntityPlan[];

export const RUNTIME_SLICE_STATE_LIFECYCLE = [
  {
    state: "CREATED",
    meaning: "The governed request has been created but context is not resolved.",
    allowed_next_states: ["CONTEXT_RESOLVED", "CANCELLED", "FAILED"],
    audit_requirement: "Record request creation.",
    approval_relevant: false,
  },
  {
    state: "CONTEXT_RESOLVED",
    meaning: "Organizational and tenant context is explicit.",
    allowed_next_states: ["POLICY_EVALUATED", "REJECTED", "FAILED"],
    audit_requirement: "Record context resolution result.",
    approval_relevant: false,
  },
  {
    state: "POLICY_EVALUATED",
    meaning: "Risk and policy classification has been decided.",
    allowed_next_states: [
      "ADMISSION_GRANTED",
      "WAITING_APPROVAL",
      "REJECTED",
      "FAILED",
    ],
    audit_requirement: "Record policy decision and basis reference.",
    approval_relevant: true,
  },
  {
    state: "ADMISSION_GRANTED",
    meaning: "The run is allowed to proceed without further approval.",
    allowed_next_states: ["RUNNING", "CANCELLED", "FAILED"],
    audit_requirement: "Record admission decision.",
    approval_relevant: false,
  },
  {
    state: "WAITING_APPROVAL",
    meaning: "The run is paused until a human decision is recorded.",
    allowed_next_states: ["APPROVED", "REJECTED", "CANCELLED", "FAILED"],
    audit_requirement: "Record approval request creation.",
    approval_relevant: true,
  },
  {
    state: "APPROVED",
    meaning: "A required human approval was granted.",
    allowed_next_states: ["RUNNING", "CANCELLED", "FAILED"],
    audit_requirement: "Record approval decision.",
    approval_relevant: true,
  },
  {
    state: "REJECTED",
    meaning: "Policy, admission or approval prevented the run.",
    allowed_next_states: [],
    audit_requirement: "Record rejection reason.",
    approval_relevant: true,
  },
  {
    state: "RUNNING",
    meaning: "The controlled runtime slice is processing the approved path.",
    allowed_next_states: ["COMPLETED", "FAILED", "CANCELLED"],
    audit_requirement: "Record run start and significant lifecycle movement.",
    approval_relevant: false,
  },
  {
    state: "COMPLETED",
    meaning: "The narrow governed flow finished successfully.",
    allowed_next_states: [],
    audit_requirement: "Record completion and investigation/replay readiness.",
    approval_relevant: false,
  },
  {
    state: "CANCELLED",
    meaning: "The run was stopped before completion.",
    allowed_next_states: [],
    audit_requirement: "Record cancellation reason.",
    approval_relevant: true,
  },
  {
    state: "FAILED",
    meaning: "The run failed in a controlled, auditable way.",
    allowed_next_states: [],
    audit_requirement: "Record failure reason and available evidence.",
    approval_relevant: false,
  },
] as const satisfies readonly RuntimeSliceStatePlan[];

export const RUNTIME_SLICE_POLICY_ADMISSION_V1 = {
  behavior: [
    {
      condition: "low risk",
      policy_behavior: "ALLOW",
      admission_behavior: "ADMIT",
      justification:
        "Low-risk document review can proceed through the controlled lifecycle.",
    },
    {
      condition: "medium risk",
      policy_behavior: "REQUIRE_APPROVAL",
      admission_behavior: "REQUIRE_APPROVAL",
      justification:
        "Medium-risk review needs human authorization before continuation.",
    },
    {
      condition: "high risk",
      policy_behavior: "DENY",
      admission_behavior: "DENY",
      justification:
        "High-risk review is outside the first controlled runtime slice.",
    },
    {
      condition: "missing context",
      policy_behavior: "DENY",
      admission_behavior: "DENY",
      justification:
        "The slice fails closed when organizational context is incomplete.",
    },
    {
      condition: "tenant/context mismatch",
      policy_behavior: "DENY",
      admission_behavior: "DENY",
      justification:
        "Cross-boundary ambiguity is rejected rather than inferred.",
    },
    {
      condition: "unsafe/unknown classification",
      policy_behavior: "REQUIRE_APPROVAL or DENY",
      admission_behavior: "REQUIRE_APPROVAL or DENY",
      justification:
        "Unknown risk must route to human review only when safe, otherwise deny.",
    },
  ],
  inputs_needed: [
    "tenant_id",
    "workspace_id when available",
    "project_id when available",
    "request_id",
    "runtime_identity_id",
    "declared_purpose",
    "data_classification",
    "risk_classification",
    "document_review_context_ref",
  ],
  outputs_needed: [
    "policy decision outcome",
    "policy reason code",
    "policy basis reference",
    "admission outcome",
    "admission reason code",
    "approval requirement when applicable",
  ],
  fail_closed_rule:
    "The slice fails closed: missing, malformed, ambiguous or unsafe inputs must deny or require approval without inferring tenant, workspace, project or risk context.",
  relation_to_existing_modules: [
    "src/mycelia/policy-decision-gateway/",
    "src/mycelia/runtime-admission-gateway/",
  ],
} as const;

export const RUNTIME_SLICE_APPROVAL_GATE_V1 = {
  required_when: [
    "policy outcome is REQUIRE_APPROVAL",
    "admission outcome is REQUIRE_APPROVAL",
    "risk is medium",
    "classification is unknown but safe enough for human review",
  ],
  approval_request_contains: [
    "approval_request_id",
    "run_id",
    "tenant_id",
    "request summary reference",
    "policy decision reference",
    "admission decision reference",
    "risk classification",
    "required approver role concept",
    "safe evidence references",
  ],
  allowed_outcomes: ["APPROVE", "REJECT", "TIMEOUT", "CANCEL"],
  conceptual_approvers: [
    "authorized operations owner",
    "compliance/risk reviewer",
    "legal operations reviewer when the request requires it",
  ],
  audit_records_required: [
    "approval requested",
    "approval granted",
    "approval rejected",
    "approval timed out",
    "approval cancelled",
  ],
  result_handling: [
    "approve resumes the run toward RUNNING",
    "reject marks the run REJECTED",
    "timeout marks the run REJECTED or CANCELLED by configured rule",
    "cancel marks the run CANCELLED",
  ],
} as const;

export const RUNTIME_SLICE_AUDIT_COMMIT_BOUNDARY = {
  lifecycle_moments: [
    "governed request created",
    "context resolved",
    "policy evaluated",
    "admission decided",
    "approval requested",
    "approval decided",
    "state transitioned",
    "run completed",
    "run rejected",
    "run cancelled",
    "run failed",
  ],
  evidence_references: [
    "request descriptor reference",
    "organizational context reference",
    "policy decision reference",
    "admission decision reference",
    "approval request reference",
    "runtime state snapshot reference",
    "state transition reference",
    "investigation bundle reference",
    "replay dry-run plan reference",
  ],
  immutable_later: [
    "audit record identity",
    "tenant_id",
    "subject reference",
    "evidence reference",
    "outcome",
    "recorded_at",
    "correlation_id",
  ],
  not_implemented_yet: [
    "hash-chain",
    "signing",
    "sealing",
    "compliance export",
    "audit storage",
  ],
} as const;

export const RUNTIME_SLICE_INVESTIGATION_VIEW_V1 = {
  reads: [
    "GovernedRun",
    "RuntimeStateSnapshot",
    "PolicyDecisionRecord",
    "AdmissionDecisionRecord",
    "ApprovalRequest",
    "AuditRecord",
    "ReplayDryRunPlan when available",
  ],
  must_show: [
    "request identity and tenant scope",
    "policy/admission outcome",
    "approval status and decision",
    "state lifecycle history",
    "audit evidence references",
    "replay dry-run readiness",
  ],
  must_not_infer: [
    "tenant context",
    "workspace context",
    "project context",
    "approver identity",
    "missing policy basis",
    "missing audit evidence",
  ],
  relates_to: [
    "src/mycelia/investigation-bundle/",
    "src/mycelia/audit-record/",
    "src/mycelia/replay-plan/",
  ],
} as const;

export const RUNTIME_SLICE_REPLAY_DRY_RUN_V1 = {
  definition:
    "Replay dry-run v1 is descriptor reconstruction from recorded run, state, decision, approval and audit references.",
  guarantees: [
    "no side effects",
    "no tool execution",
    "no external calls",
    "no real replay engine yet",
    "no state reconstruction beyond recorded descriptors",
  ],
  differs_from_real_replay: [
    "real replay would execute a replay engine over event history",
    "dry-run only lists what would be inspected",
    "dry-run cannot hydrate data",
    "dry-run cannot call tools",
    "dry-run cannot prove runtime determinism",
  ],
} as const;

export const RUNTIME_SLICE_NEXT_IMPLEMENTATION_SEQUENCE = [
  {
    phase: "2R Minimal Persistent Model Plan/Scaffold",
    objective:
      "Define the minimal storage shape for run, state, decisions, approval and audit.",
    why_order:
      "Persistence shape must be understood before lifecycle behavior is implemented.",
    likely_modules_files: [
      "docs/product/runtime-slice-technical-plan.md",
      "future persistence planning files",
    ],
    risk: "Prematurely over-modeling the database.",
    value: "Creates a narrow persistence target for the pilot slice.",
  },
  {
    phase: "2S Minimal Governed Run Lifecycle",
    objective: "Implement the controlled lifecycle around one governed request.",
    why_order:
      "Lifecycle is the backbone for policy, approval and audit attachment.",
    likely_modules_files: [
      "src/mycelia/governed-run/",
      "src/mycelia/runtime-state/",
      "src/mycelia/state-transition/",
    ],
    risk: "Accidentally becoming a general workflow engine.",
    value: "Proves one auditable operational path.",
  },
  {
    phase: "2T Policy/Admission v1",
    objective:
      "Implement deterministic low/medium/high/missing-context admission behavior.",
    why_order:
      "Admission must decide whether the run can continue or requires approval.",
    likely_modules_files: [
      "src/mycelia/policy-decision-gateway/",
      "src/mycelia/runtime-admission-gateway/",
    ],
    risk: "Encoding broad policy engine assumptions too early.",
    value: "Makes governance concrete for the frozen use case.",
  },
  {
    phase: "2U Audit Commit Boundary",
    objective:
      "Define the durable audit commit path for lifecycle and decision moments.",
    why_order:
      "Audit must be committed before investigation and replay dry-run can rely on evidence.",
    likely_modules_files: [
      "src/mycelia/audit-record/",
      "src/mycelia/audit-recorder/",
    ],
    risk: "Confusing descriptor construction with immutable storage guarantees.",
    value: "Creates evidence boundaries for pilot inspection.",
  },
  {
    phase: "2V Approval Gate v1",
    objective: "Implement one approval gate for medium or uncertain risk.",
    why_order:
      "Approval depends on policy/admission and must be audited before resume.",
    likely_modules_files: [
      "future approval module",
      "src/mycelia/runtime-admission-gateway/",
    ],
    risk: "Accidentally creating a full approval queue or UI.",
    value: "Proves human control before unsafe continuation.",
  },
  {
    phase: "2W Investigation View v1",
    objective: "Create a read model for inspecting a governed run result.",
    why_order:
      "Investigation needs persisted run, decision, approval and audit references.",
    likely_modules_files: ["src/mycelia/investigation-bundle/"],
    risk: "Inferring missing evidence or building UI prematurely.",
    value: "Reduces manual reconstruction effort for pilot stakeholders.",
  },
  {
    phase: "2X Replay Dry-Run Descriptor v1",
    objective: "Create descriptor-only replay dry-run reconstruction.",
    why_order:
      "Replay planning should follow available investigation and audit evidence.",
    likely_modules_files: ["src/mycelia/replay-plan/"],
    risk: "Being mistaken for real replay execution.",
    value: "Explains replay readiness without side effects.",
  },
  {
    phase: "2Y Internal Runtime Service Boundary",
    objective: "Define an internal service boundary for the narrow runtime slice.",
    why_order:
      "A boundary is needed before any public API or product activation.",
    likely_modules_files: ["future internal runtime service files"],
    risk: "Creating API surface too early.",
    value: "Keeps runtime behavior isolated and testable.",
  },
  {
    phase: "2Z Runtime Slice Consistency Audit",
    objective:
      "Audit the minimal slice for scope, safety, tenant boundaries and commercial alignment.",
    why_order:
      "A consistency gate should run before expanding product or runtime surface.",
    likely_modules_files: [
      "docs/architecture/implementation-status.md",
      "runtime slice modules",
    ],
    risk: "Missing drift before the next expansion.",
    value: "Preserves constitutional scope discipline.",
  },
] as const satisfies readonly RuntimeSliceImplementationPhase[];

export const RUNTIME_SLICE_EXPLICITLY_OUT_OF_SCOPE = [
  "public API",
  "auth",
  "SaaS billing",
  "workflow builder",
  "general-purpose orchestration",
  "multiple integrations",
  "autonomous agents",
  "SDK",
  "external services",
  "production deployment",
  "enterprise multi-tenancy",
  "full replay execution",
  "hash-chain/signing/sealing",
  "export/PDF/downloads",
] as const;

export const RUNTIME_SLICE_SAFETY_BOUNDARY = [
  "this phase does not execute runtime",
  "this phase does not persist data",
  "this phase does not call APIs",
  "this phase does not call external services",
  "this phase does not create auth",
  "this phase does not create DB schema",
  "this phase does not create Prisma migrations",
  "this phase only defines the technical plan",
] as const;

export const RUNTIME_SLICE_TECHNICAL_PLAN = {
  phase: RUNTIME_SLICE_TECHNICAL_PLAN_PHASE,
  name: RUNTIME_SLICE_TECHNICAL_PLAN_NAME,
  linked_use_case: INITIAL_USE_CASE_NAME,
  linked_offer: PILOT_OFFER_PILOT_PACKAGE.name,
  status: RUNTIME_SLICE_TECHNICAL_PLAN_STATUS,
  runtime_slice_goal: RUNTIME_SLICE_GOAL,
  minimal_runtime_flow: RUNTIME_SLICE_MINIMAL_RUNTIME_FLOW,
  future_persistent_entities: RUNTIME_SLICE_FUTURE_PERSISTENT_ENTITIES,
  state_lifecycle: RUNTIME_SLICE_STATE_LIFECYCLE,
  policy_admission_v1: RUNTIME_SLICE_POLICY_ADMISSION_V1,
  approval_gate_v1: RUNTIME_SLICE_APPROVAL_GATE_V1,
  audit_commit_boundary: RUNTIME_SLICE_AUDIT_COMMIT_BOUNDARY,
  investigation_view_v1: RUNTIME_SLICE_INVESTIGATION_VIEW_V1,
  replay_dry_run_v1: RUNTIME_SLICE_REPLAY_DRY_RUN_V1,
  next_implementation_sequence: RUNTIME_SLICE_NEXT_IMPLEMENTATION_SEQUENCE,
  explicitly_out_of_scope: RUNTIME_SLICE_EXPLICITLY_OUT_OF_SCOPE,
  safety_boundary: RUNTIME_SLICE_SAFETY_BOUNDARY,
} as const satisfies RuntimeSliceTechnicalPlan;

export function getRuntimeSliceTechnicalPlan(): RuntimeSliceTechnicalPlan {
  return RUNTIME_SLICE_TECHNICAL_PLAN;
}
