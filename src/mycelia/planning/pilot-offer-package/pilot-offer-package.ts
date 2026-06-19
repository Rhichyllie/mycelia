import {
  INITIAL_USE_CASE_BUYER_PERSONAS,
  INITIAL_USE_CASE_FIRST_ICP,
  INITIAL_USE_CASE_NAME,
} from "../../planning/initial-use-case-freeze";

export const PILOT_OFFER_PACKAGE_PHASE = "2O";

export const PILOT_OFFER_PACKAGE_NAME =
  "Pilot Offer and Discovery Package";

export const PILOT_OFFER_PACKAGE_STATUS =
  "internal planning package";

export type PilotOfferPackageScope = {
  readonly name: string;
  readonly duration: string;
  readonly internal_planning_price_range_brl: string;
  readonly target_buyer: readonly string[];
  readonly goals: readonly string[];
  readonly deliverables: readonly string[];
  readonly activities: readonly string[];
  readonly success_criteria: readonly string[];
  readonly non_deliverables: readonly string[];
};

export type PilotOfferDiscoveryQuestionGroup = {
  readonly group: string;
  readonly questions: readonly string[];
};

export type PilotOfferGoNoGoCriteria = {
  readonly good_fit_signals: readonly string[];
  readonly bad_fit_signals: readonly string[];
  readonly deal_breakers: readonly string[];
  readonly pilot_readiness_checklist: readonly string[];
};

export type PilotOfferPackage = {
  readonly phase: typeof PILOT_OFFER_PACKAGE_PHASE;
  readonly name: typeof PILOT_OFFER_PACKAGE_NAME;
  readonly linked_use_case: typeof INITIAL_USE_CASE_NAME;
  readonly status: typeof PILOT_OFFER_PACKAGE_STATUS;
  readonly first_icp: readonly string[];
  readonly price_range_caveat: string;
  readonly positioning: readonly string[];
  readonly assessment_package: PilotOfferPackageScope;
  readonly pilot_package: PilotOfferPackageScope;
  readonly prospect_qualification_fields: readonly string[];
  readonly discovery_question_groups:
    readonly PilotOfferDiscoveryQuestionGroup[];
  readonly go_no_go_criteria: PilotOfferGoNoGoCriteria;
  readonly success_metrics: {
    readonly assessment: readonly string[];
    readonly pilot: readonly string[];
  };
  readonly offer_boundaries: readonly string[];
  readonly next_phase_implications: readonly string[];
  readonly safety_boundary: readonly string[];
};

export const PILOT_OFFER_POSITIONING = [
  "MYCELIA helps regulated operations adopt AI-assisted workflows without losing policy control, approval, auditability, investigation and replay planning.",
  "This is a pilot and assessment offer, not a mature SaaS platform claim.",
  "The package translates the governed compliance/document review flow into founder-led discovery, assessment and controlled pilot planning.",
] as const;

export const PILOT_OFFER_PRICE_RANGE_CAVEAT =
  "The BRL price ranges are internal planning assumptions only. They are not guaranteed pricing and should not be presented as buyer-facing commitments.";

export const PILOT_OFFER_ASSESSMENT_PACKAGE = {
  name: "Governed Operations Assessment",
  duration: "2 weeks",
  internal_planning_price_range_brl: "R$ 15k to R$ 35k",
  target_buyer: INITIAL_USE_CASE_BUYER_PERSONAS,
  goals: [
    "qualify a regulated, document-heavy process for a narrow governed pilot",
    "map current decision, approval, audit and investigation pain",
    "identify policy and admission rules that can be made deterministic",
    "decide whether the prospect is ready for a controlled pilot",
  ],
  deliverables: [
    "process map",
    "risk/control map",
    "governed run blueprint",
    "policy/admission matrix",
    "approval points",
    "audit/investigation requirements",
    "pilot recommendation",
    "go/no-go decision",
  ],
  activities: [
    "stakeholder interviews",
    "current process walkthrough",
    "risk and control mapping",
    "approval path mapping",
    "audit evidence review",
    "pilot scope workshop",
  ],
  success_criteria: [
    "target process is narrow enough for a controlled pilot",
    "risk, policy and approval boundaries are explicit",
    "buyer agrees on success metrics and no-go conditions",
    "pilot recommendation is clear enough for next-phase planning",
  ],
  non_deliverables: [
    "production runtime",
    "public API",
    "billing system",
    "full auth platform",
    "external integrations",
    "autonomous agent execution",
    "broad workflow builder",
  ],
} as const satisfies PilotOfferPackageScope;

export const PILOT_OFFER_PILOT_PACKAGE = {
  name: "Governed Compliance Flow Pilot",
  duration: "6 to 8 weeks",
  internal_planning_price_range_brl: "R$ 80k to R$ 180k",
  target_buyer: INITIAL_USE_CASE_BUYER_PERSONAS,
  goals: [
    "prove one governed compliance/document review flow",
    "make policy, admission and approval decisions inspectable",
    "produce a practical audit and investigation evidence trail design",
    "create a next-runtime backlog from a narrow controlled pilot",
  ],
  deliverables: [
    "one sensitive request flow",
    "deterministic policy/admission v1 design",
    "one human approval gate design",
    "governed run lifecycle design",
    "audit trail design",
    "investigation view design",
    "replay dry-run plan",
    "success metrics report",
    "implementation backlog for the next runtime slice",
  ],
  activities: [
    "pilot kickoff and scope confirmation",
    "request and policy model workshop",
    "approval gate design session",
    "state lifecycle and audit design",
    "investigation and replay dry-run planning",
    "success metrics review",
    "next-runtime backlog workshop",
  ],
  success_criteria: [
    "one request flow is described end to end",
    "policy/admission decisions are deterministic enough to implement",
    "human approval gate is explicit",
    "audit and investigation requirements are testable",
    "next runtime slice is scoped without broad platform promises",
  ],
  non_deliverables: [
    "mature SaaS platform",
    "production runtime by default",
    "public API",
    "SaaS billing",
    "full auth platform",
    "enterprise-wide multi-tenant isolation",
    "external integrations",
    "fully autonomous agents",
    "general workflow builder",
  ],
} as const satisfies PilotOfferPackageScope;

export const PILOT_OFFER_PROSPECT_QUALIFICATION_FIELDS = [
  "industry",
  "process type",
  "regulatory/compliance pressure",
  "document volume",
  "decision risk",
  "approval requirements",
  "audit pain",
  "investigation/reconstruction pain",
  "AI adoption urgency",
  "stakeholder access",
  "data sensitivity",
  "integration complexity",
  "budget range",
  "timeline urgency",
] as const;

export const PILOT_OFFER_DISCOVERY_QUESTION_GROUPS = [
  {
    group: "business pain",
    questions: [
      "Which document-heavy operational decision is most painful today?",
      "What business consequence occurs when that decision is delayed or wrong?",
      "Which team owns the outcome of this process?",
    ],
  },
  {
    group: "current process",
    questions: [
      "How does the request enter the process today?",
      "Which steps are manual, duplicated or unclear?",
      "Where does context usually get lost between teams?",
    ],
  },
  {
    group: "risk and compliance",
    questions: [
      "Which compliance obligations shape this process?",
      "Which decisions create the highest operational or regulatory risk?",
      "What must be controlled before AI assistance can be trusted?",
    ],
  },
  {
    group: "approvals",
    questions: [
      "Which actions require human approval today?",
      "Who is allowed to approve exceptions?",
      "What evidence does an approver need before deciding?",
    ],
  },
  {
    group: "audit and evidence",
    questions: [
      "What evidence is required to explain a decision after the fact?",
      "Where is audit evidence captured today?",
      "Which audit gaps cause the most concern?",
    ],
  },
  {
    group: "investigation and replay",
    questions: [
      "How long does it take to reconstruct what happened in a disputed case?",
      "Which parts of the decision path are hardest to inspect later?",
      "What would a useful replay dry-run need to show without executing side effects?",
    ],
  },
  {
    group: "data and systems",
    questions: [
      "Which systems contain the request context?",
      "What sensitive data must be excluded from the first pilot?",
      "Can the pilot start with synthetic or controlled local data?",
    ],
  },
  {
    group: "buying process",
    questions: [
      "Who owns the budget for improving this process?",
      "Who must approve an assessment or pilot?",
      "What timeline would make a controlled pilot useful?",
    ],
  },
  {
    group: "success metrics",
    questions: [
      "How many requests should be governed during a pilot?",
      "What would make the audit trail feel complete enough?",
      "How should stakeholder confidence be measured at the end?",
    ],
  },
] as const satisfies readonly PilotOfferDiscoveryQuestionGroup[];

export const PILOT_OFFER_GO_NO_GO_CRITERIA = {
  good_fit_signals: [
    "regulated or compliance-heavy process",
    "manual reconstruction pain",
    "approval or exception handling",
    "document-heavy workflow",
    "buyer acknowledges governance risk",
    "access to process owner",
    "willingness to start narrow",
  ],
  bad_fit_signals: [
    "wants generic chatbot only",
    "wants full autonomous agent execution with no approval",
    "refuses narrow pilot",
    "no process owner",
    "no budget",
    "unclear compliance pain",
  ],
  deal_breakers: [
    "demands production runtime before assessment",
    "requires broad platform promises",
    "requires external integrations in this planning phase",
    "requires handling real sensitive data before controls exist",
    "demands SaaS billing or public API immediately",
  ],
  pilot_readiness_checklist: [
    "process owner is available",
    "request type is narrow",
    "approval path can be described",
    "audit pain is concrete",
    "pilot can avoid uncontrolled sensitive data",
    "buyer accepts descriptor-level planning before runtime activation",
  ],
} as const satisfies PilotOfferGoNoGoCriteria;

export const PILOT_OFFER_SUCCESS_METRICS = {
  assessment: [
    "time to map current process",
    "number of risks/control gaps identified",
    "number of approval points clarified",
    "number of policy/admission rules defined",
    "pilot go/no-go decision quality",
    "reduction in ambiguity around AI-assisted execution",
  ],
  pilot: [
    "audit trail completeness",
    "investigation reconstruction time",
    "stakeholder confidence score",
    "number of governed requests described",
    "percentage of requests requiring approval",
    "number of policy/admission denials identified",
  ],
} as const;

export const PILOT_OFFER_BOUNDARIES = [
  "assessment is planning and blueprint only",
  "pilot is narrow and controlled",
  "neither offer is a claim of mature SaaS",
  "neither offer includes production runtime by default",
  "neither offer includes public API, billing, full auth, enterprise multi-tenancy, external integrations, autonomous agents or broad workflow builder",
] as const;

export const PILOT_OFFER_NEXT_PHASE_IMPLICATIONS = [
  "repository truth alignment",
  "runtime slice technical plan",
  "minimal persistent model",
  "governed run lifecycle",
  "policy/admission v1",
  "audit commit boundary",
  "approval gate",
  "investigation view",
] as const;

export const PILOT_OFFER_SAFETY_BOUNDARY = [
  "this phase does not execute a pilot",
  "this phase does not create sales automation",
  "this phase does not persist data",
  "this phase does not call APIs",
  "this phase does not call external services",
  "this phase does not create auth",
  "this phase does not create runtime",
  "this phase only defines the commercial planning package",
] as const;

export const PILOT_OFFER_PACKAGE = {
  phase: PILOT_OFFER_PACKAGE_PHASE,
  name: PILOT_OFFER_PACKAGE_NAME,
  linked_use_case: INITIAL_USE_CASE_NAME,
  status: PILOT_OFFER_PACKAGE_STATUS,
  first_icp: INITIAL_USE_CASE_FIRST_ICP,
  price_range_caveat: PILOT_OFFER_PRICE_RANGE_CAVEAT,
  positioning: PILOT_OFFER_POSITIONING,
  assessment_package: PILOT_OFFER_ASSESSMENT_PACKAGE,
  pilot_package: PILOT_OFFER_PILOT_PACKAGE,
  prospect_qualification_fields: PILOT_OFFER_PROSPECT_QUALIFICATION_FIELDS,
  discovery_question_groups: PILOT_OFFER_DISCOVERY_QUESTION_GROUPS,
  go_no_go_criteria: PILOT_OFFER_GO_NO_GO_CRITERIA,
  success_metrics: PILOT_OFFER_SUCCESS_METRICS,
  offer_boundaries: PILOT_OFFER_BOUNDARIES,
  next_phase_implications: PILOT_OFFER_NEXT_PHASE_IMPLICATIONS,
  safety_boundary: PILOT_OFFER_SAFETY_BOUNDARY,
} as const satisfies PilotOfferPackage;

export function getPilotOfferPackage(): PilotOfferPackage {
  return PILOT_OFFER_PACKAGE;
}
