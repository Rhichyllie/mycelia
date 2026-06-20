import type { DemoRiskLevel } from "./classify";

export type AdmissionOutcome =
  | "ADMITTED"
  | "APPROVAL_REQUIRED"
  | "DENIED"
  | "FAILED_SAFE";

export type AdmissionDecision = {
  readonly outcome: AdmissionOutcome;
  readonly lifecycleIntentHint: string;
  readonly safeSummary: string;
  readonly reasonCode: string;
};

export function admitGovernedRequest(
  riskLevel: DemoRiskLevel,
): AdmissionDecision {
  if (riskLevel === "MEDIUM") {
    return {
      outcome: "APPROVAL_REQUIRED",
      lifecycleIntentHint: "WAITING_APPROVAL",
      safeSummary:
        "Medium risk fixture requires human approval before continuation.",
      reasonCode: "POLICY_REQUIRES_APPROVAL",
    };
  }

  if (riskLevel === "LOW") {
    return {
      outcome: "ADMITTED",
      lifecycleIntentHint: "COMPLETED",
      safeSummary: "Low risk fixture can proceed without approval.",
      reasonCode: "POLICY_ADMITTED_LOW_RISK",
    };
  }

  if (riskLevel === "HIGH") {
    return {
      outcome: "DENIED",
      lifecycleIntentHint: "REJECTED",
      safeSummary: "High risk fixture is denied before continuation.",
      reasonCode: "POLICY_DENIED_HIGH_RISK",
    };
  }

  return {
    outcome: "FAILED_SAFE",
    lifecycleIntentHint: "FAILED_SAFE",
    safeSummary: "Unknown risk fixture failed safe before continuation.",
    reasonCode: "POLICY_FAILED_SAFE_UNKNOWN_RISK",
  };
}
