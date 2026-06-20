export const LIVE_DEMO_SCENARIO = {
  scenarioKey: "medium-risk-vendor-contract-review",
  title: "Medium-risk vendor contract review",
  resourceRef: "fixture://documents/vendor-contract-review",
  requesterRef: "demo://actor/requester",
  purpose: "governed review of vendor contract fixture",
  policyRef: "fixture://policy/vendor-contract-review-medium-risk",
  fixtureSummary:
    "Fixture metadata only. No real document content is stored or processed.",
} as const;