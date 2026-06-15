export const INITIAL_USE_CASE_PHASE = "2N";

export const INITIAL_USE_CASE_NAME =
  "Governed compliance/document review flow";

export const INITIAL_USE_CASE_DECISION_STATUS =
  "frozen for next runtime planning";

export type InitialUseCaseFlowStep = {
  readonly step_order: number;
  readonly title: string;
  readonly description: string;
};

export type InitialUseCaseCommercialPackage = {
  readonly name: string;
  readonly recommended_duration: string;
  readonly planning_price_range_brl: string;
  readonly deliverables: readonly string[];
  readonly success_criteria: readonly string[];
};

export type InitialUseCaseCommercialOffer = {
  readonly caveat: string;
  readonly assessment_blueprint_package: InitialUseCaseCommercialPackage;
  readonly pilot_package: InitialUseCaseCommercialPackage;
};

export type InitialUseCaseFreeze = {
  readonly phase: typeof INITIAL_USE_CASE_PHASE;
  readonly name: typeof INITIAL_USE_CASE_NAME;
  readonly short_name: string;
  readonly product_framing: string;
  readonly decision_status: typeof INITIAL_USE_CASE_DECISION_STATUS;
  readonly buyer_and_icp: {
    readonly primary_buyer_personas: readonly string[];
    readonly first_icp: readonly string[];
    readonly non_icp_for_now: readonly string[];
  };
  readonly operational_pain: readonly string[];
  readonly frozen_flow: readonly InitialUseCaseFlowStep[];
  readonly in_scope_runtime_slice: readonly string[];
  readonly out_of_scope_runtime_slice: readonly string[];
  readonly first_commercial_offer: InitialUseCaseCommercialOffer;
  readonly success_metrics: readonly string[];
  readonly runtime_implications: readonly string[];
  readonly safety_boundary: readonly string[];
};

export const INITIAL_USE_CASE_BUYER_PERSONAS = [
  "Head of Operations",
  "Compliance/Risk leader",
  "Legal Operations leader",
  "Digital Transformation leader",
] as const;

export const INITIAL_USE_CASE_FIRST_ICP = [
  "regulated backoffice",
  "document-heavy operations",
  "compliance-sensitive workflows",
  "banks, insurers, legal operations, financial operations or regulated service operations",
] as const;

export const INITIAL_USE_CASE_NON_ICP = [
  "generic chatbot buyers",
  "broad workflow automation buyers",
  "pure developer tooling buyers",
  "teams wanting fully autonomous agents with no human approval",
] as const;

export const INITIAL_USE_CASE_OPERATIONAL_PAIN = [
  "Automation and AI create operational risk when sensitive actions are not governed before execution.",
  "Regulated teams need policy, approval, auditability, investigation and replayability around operational decisions.",
  "Current tools may automate tasks, but often do not make governed execution the central unit of control.",
  "MYCELIA should prove control before scale by starting with a narrow, compliance-sensitive document review flow.",
] as const;

export const INITIAL_USE_CASE_FROZEN_FLOW = [
  {
    step_order: 1,
    title: "Sensitive request intake",
    description:
      "A compliance-sensitive document review request is framed as a governed operational request.",
  },
  {
    step_order: 2,
    title: "Identity/context resolution",
    description:
      "The actor, request context and relevant organizational scope are represented explicitly.",
  },
  {
    step_order: 3,
    title: "Tenant/context boundary check",
    description:
      "The request is checked against an explicit tenant and context boundary before any runtime action is allowed.",
  },
  {
    step_order: 4,
    title: "Risk/policy classification",
    description:
      "A deterministic policy and risk classification assigns the request to a controlled admission path.",
  },
  {
    step_order: 5,
    title: "Runtime admission decision",
    description:
      "Admission determines whether the governed run may proceed, must wait for approval or must be denied.",
  },
  {
    step_order: 6,
    title: "Human approval if required",
    description:
      "Higher-risk requests pause at a human approval gate before any unsafe side effect can occur.",
  },
  {
    step_order: 7,
    title: "Governed run state transition",
    description:
      "The governed run moves through an explicit lifecycle with validated state transitions.",
  },
  {
    step_order: 8,
    title: "Audit record creation",
    description:
      "The decision path creates an audit trail describing request, policy, approval and state decisions.",
  },
  {
    step_order: 9,
    title: "Investigation view preparation",
    description:
      "Investigation descriptors group the evidence needed to inspect the governed decision path.",
  },
  {
    step_order: 10,
    title: "Replay dry-run plan without side effects",
    description:
      "A replay dry-run descriptor explains how the flow could be inspected later without executing side effects.",
  },
] as const satisfies readonly InitialUseCaseFlowStep[];

export const INITIAL_USE_CASE_IN_SCOPE_RUNTIME_SLICE = [
  "one request type",
  "one deterministic policy/risk classifier",
  "one admission decision flow",
  "one human approval gate",
  "one state lifecycle",
  "one audit trail",
  "one investigation view",
  "one replay dry-run descriptor",
  "one fake or local adapter only if needed later, with no external side effects in this phase",
] as const;

export const INITIAL_USE_CASE_OUT_OF_SCOPE_RUNTIME_SLICE = [
  "workflow builder",
  "public API",
  "SaaS billing",
  "full auth platform",
  "full multi-tenant enterprise isolation",
  "general-purpose agent orchestration",
  "multiple integrations",
  "SDK",
  "white-label",
  "benchmark framework",
  "advanced observability",
  "real replay execution",
  "autonomous side effects",
] as const;

export const INITIAL_USE_CASE_SUCCESS_METRICS = [
  "number of governed requests processed in pilot",
  "percentage of requests requiring approval",
  "audit trail completeness",
  "time to investigate a run",
  "number of policy/admission denials",
  "stakeholder confidence score or qualitative feedback",
  "reduction in manual reconstruction effort",
  "number of identified process risks",
] as const;

export const INITIAL_USE_CASE_RUNTIME_IMPLICATIONS = [
  "minimal persistent GovernedRun",
  "minimal RuntimeState persistence",
  "deterministic policy/admission v1",
  "approval gate",
  "audit commit boundary",
  "investigation view",
  "replay dry-run descriptor",
  "eventual tenant context enforcement",
] as const;

export const INITIAL_USE_CASE_SAFETY_BOUNDARY = [
  "this phase does not execute the use case",
  "this phase does not persist data",
  "this phase does not call APIs",
  "this phase does not call external services",
  "this phase does not create auth",
  "this phase does not create runtime",
  "this phase only freezes the first buyer-oriented use case and runtime direction",
] as const;

export const INITIAL_USE_CASE_COMMERCIAL_OFFER = {
  caveat:
    "The BRL ranges below are internal planning assumptions only. They are not guaranteed pricing and should not be presented as buyer-facing commitments.",
  assessment_blueprint_package: {
    name: "Assessment and blueprint package",
    recommended_duration: "2 to 3 weeks",
    planning_price_range_brl: "R$ 15k to R$ 35k",
    deliverables: [
      "use-case map for the compliance/document review flow",
      "governance gap analysis",
      "policy and admission blueprint",
      "approval gate design",
      "audit and investigation readiness plan",
      "runtime slice implementation plan",
    ],
    success_criteria: [
      "buyer agrees on the first governed request type",
      "policy, approval and audit boundaries are explicit",
      "pilot scope is narrow enough to implement safely",
    ],
  },
  pilot_package: {
    name: "Governed document review pilot package",
    recommended_duration: "6 to 10 weeks",
    planning_price_range_brl: "R$ 80k to R$ 180k",
    deliverables: [
      "single governed request flow",
      "deterministic policy/admission v1",
      "human approval gate",
      "governed run lifecycle",
      "audit trail",
      "investigation view",
      "replay dry-run descriptor",
    ],
    success_criteria: [
      "pilot processes governed requests through the approved lifecycle",
      "audit records are complete enough for review",
      "stakeholders can inspect decisions without reconstructing context manually",
      "no autonomous side effects are introduced outside approved scope",
    ],
  },
} as const satisfies InitialUseCaseCommercialOffer;

export const INITIAL_USE_CASE_FREEZE = {
  phase: INITIAL_USE_CASE_PHASE,
  name: INITIAL_USE_CASE_NAME,
  short_name: "Governed document review",
  product_framing:
    "MYCELIA will first prove governed review of compliance-sensitive documents before unsafe operational side effects are allowed.",
  decision_status: INITIAL_USE_CASE_DECISION_STATUS,
  buyer_and_icp: {
    primary_buyer_personas: INITIAL_USE_CASE_BUYER_PERSONAS,
    first_icp: INITIAL_USE_CASE_FIRST_ICP,
    non_icp_for_now: INITIAL_USE_CASE_NON_ICP,
  },
  operational_pain: INITIAL_USE_CASE_OPERATIONAL_PAIN,
  frozen_flow: INITIAL_USE_CASE_FROZEN_FLOW,
  in_scope_runtime_slice: INITIAL_USE_CASE_IN_SCOPE_RUNTIME_SLICE,
  out_of_scope_runtime_slice: INITIAL_USE_CASE_OUT_OF_SCOPE_RUNTIME_SLICE,
  first_commercial_offer: INITIAL_USE_CASE_COMMERCIAL_OFFER,
  success_metrics: INITIAL_USE_CASE_SUCCESS_METRICS,
  runtime_implications: INITIAL_USE_CASE_RUNTIME_IMPLICATIONS,
  safety_boundary: INITIAL_USE_CASE_SAFETY_BOUNDARY,
} as const satisfies InitialUseCaseFreeze;

export function getInitialUseCaseFreeze(): InitialUseCaseFreeze {
  return INITIAL_USE_CASE_FREEZE;
}
