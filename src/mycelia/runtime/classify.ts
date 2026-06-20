export type DemoRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

export type ClassificationInput = {
  readonly resourceRef: string;
  readonly purpose: string;
};

export type ClassificationResult = {
  readonly riskLevel: DemoRiskLevel;
  readonly reasonCode: string;
  readonly safeSummary: string;
};

export function classifyGovernedRequest(
  input: ClassificationInput,
): ClassificationResult {
  if (input.resourceRef === "fixture://documents/vendor-contract-review") {
    return {
      riskLevel: "MEDIUM",
      reasonCode: "VENDOR_CONTRACT_MEDIUM_RISK",
      safeSummary:
        "Fixture metadata indicates a medium risk vendor contract review.",
    };
  }

  return {
    riskLevel: "UNKNOWN",
    reasonCode: "UNKNOWN_FIXTURE_RISK",
    safeSummary:
      "Fixture metadata did not match a deterministic risk classification.",
  };
}
