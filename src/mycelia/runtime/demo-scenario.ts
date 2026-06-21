export type LiveDemoScenario = {
  readonly scenarioKey: string;
  readonly title: string;
  readonly resourceRef: string;
  readonly requesterRef: string;
  readonly purpose: string;
  readonly policyRef: string;
  readonly fixtureSummary: string;
  readonly choiceSummary: string;
};

export const LIVE_DEMO_LOW_RISK_SCENARIO = {
  scenarioKey: "low-risk-internal-data-export-review",
  title: "Routine internal data export review",
  resourceRef: "fixture://documents/internal-data-export-review",
  requesterRef: "demo://actor/requester",
  purpose: "governed review of routine internal data export fixture",
  policyRef: "fixture://policy/internal-data-export-low-risk",
  fixtureSummary:
    "Fixture metadata only. No real document content is stored or processed.",
  choiceSummary: "Low risk -- expected to complete automatically.",
} as const satisfies LiveDemoScenario;

export const LIVE_DEMO_SCENARIO = {
  scenarioKey: "medium-risk-vendor-contract-review",
  title: "Medium-risk vendor contract review",
  resourceRef: "fixture://documents/vendor-contract-review",
  requesterRef: "demo://actor/requester",
  purpose: "governed review of vendor contract fixture",
  policyRef: "fixture://policy/vendor-contract-review-medium-risk",
  fixtureSummary:
    "Fixture metadata only. No real document content is stored or processed.",
  choiceSummary: "Medium risk -- approval is required before it can continue.",
} as const satisfies LiveDemoScenario;

export const LIVE_DEMO_HIGH_RISK_SCENARIO = {
  scenarioKey: "high-risk-cross-border-sensitive-data-transfer",
  title: "Cross-border sensitive data transfer request",
  resourceRef: "fixture://documents/cross-border-sensitive-data-transfer",
  requesterRef: "demo://actor/requester",
  purpose: "governed review of cross-border sensitive data transfer fixture",
  policyRef: "fixture://policy/cross-border-sensitive-data-high-risk",
  fixtureSummary:
    "Fixture metadata only. No real document content is stored or processed.",
  choiceSummary: "High risk -- expected to be denied automatically.",
} as const satisfies LiveDemoScenario;

export const LIVE_DEMO_SCENARIOS = [
  LIVE_DEMO_LOW_RISK_SCENARIO,
  LIVE_DEMO_SCENARIO,
  LIVE_DEMO_HIGH_RISK_SCENARIO,
] as const;

export type LiveDemoScenarioKey =
  (typeof LIVE_DEMO_SCENARIOS)[number]["scenarioKey"];

export function findLiveDemoScenarioByKey(
  scenarioKey: string | null | undefined,
): (typeof LIVE_DEMO_SCENARIOS)[number] | null {
  return (
    LIVE_DEMO_SCENARIOS.find((scenario) => scenario.scenarioKey === scenarioKey) ??
    null
  );
}

export function findLiveDemoScenarioByResourceRef(
  resourceRef: string | null | undefined,
): (typeof LIVE_DEMO_SCENARIOS)[number] | null {
  return (
    LIVE_DEMO_SCENARIOS.find((scenario) => scenario.resourceRef === resourceRef) ??
    null
  );
}
