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
  if (input.resourceRef === "fixture://documents/internal-data-export-review") {
    return {
      riskLevel: "LOW",
      reasonCode: "INTERNAL_DATA_EXPORT_LOW_RISK",
      safeSummary:
        "Fixture metadata indicates a low risk internal data export review.",
    };
  }

  if (input.resourceRef === "fixture://documents/vendor-contract-review") {
    return {
      riskLevel: "MEDIUM",
      reasonCode: "VENDOR_CONTRACT_MEDIUM_RISK",
      safeSummary:
        "Fixture metadata indicates a medium risk vendor contract review.",
    };
  }

  if (
    input.resourceRef ===
    "fixture://documents/cross-border-sensitive-data-transfer"
  ) {
    return {
      riskLevel: "HIGH",
      reasonCode: "SENSITIVE_TRANSFER_HIGH_RISK",
      safeSummary:
        "Fixture metadata indicates a high risk cross-border sensitive data transfer.",
    };
  }

  return {
    riskLevel: "UNKNOWN",
    reasonCode: "UNKNOWN_FIXTURE_RISK",
    safeSummary:
      "Fixture metadata did not match a deterministic risk classification.",
  };
}
