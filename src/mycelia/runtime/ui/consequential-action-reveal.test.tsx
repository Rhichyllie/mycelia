import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  buildConsequentialActionRevealStages,
  ConsequentialActionReveal,
  isConsequentialSuccessStatus,
} from "./consequential-action-reveal";

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

describe("consequential action reveal", () => {
  it("builds a real three-stage run creation reveal from persisted data", () => {
    const stages = buildConsequentialActionRevealStages({
      kind: "RUN_CREATED",
      scenarioTitle: "Cross-border sensitive data transfer request",
      policyReasonCode: "SENSITIVE_TRANSFER_HIGH_RISK",
      admissionReasonCode: "POLICY_DENIED_HIGH_RISK",
      finalState: "REJECTED",
      riskLevel: "HIGH",
    });

    expect(stages).toHaveLength(3);
    expect(stages.map((stage) => stage.label)).toEqual([
      "Request recorded",
      "Risk level: HIGH",
      "Outcome: rejected",
    ]);
    expect(stages.map((stage) => stage.detail).join(" ")).toContain(
      "The policy check found this sensitive transfer fixture to be high risk.",
    );
    expect(stages.map((stage) => stage.detail).join(" ")).toContain(
      "This request is blocked by policy.",
    );
    expect(stages.map((stage) => stage.detail).join(" ")).not.toMatch(
      /placeholder|simulated|fake/i,
    );
  });

  it("renders the final state immediately when reduced motion is requested", () => {
    const markup = renderToStaticMarkup(
      <ConsequentialActionReveal
        input={{
          kind: "RUN_CREATED",
          scenarioTitle: "Routine internal data export review",
          policyReasonCode: "INTERNAL_DATA_EXPORT_LOW_RISK",
          admissionReasonCode: "POLICY_ADMITTED_LOW_RISK",
          finalState: "COMPLETED",
          riskLevel: "LOW",
        }}
        reducedMotionMode="reduce"
      />,
    );

    expect(markup).toContain("Outcome: completed");
    expect(markup).toContain(
      "The policy check cleared the low-risk request without approval.",
    );
    expect(markup).toContain("Step 3 of 3");
  });

  it("does not opt in for failed outcomes", () => {
    expect(isConsequentialSuccessStatus("FAILED_SAFE")).toBe(false);
    expect(isConsequentialSuccessStatus("DEMO_MODE_DISABLED")).toBe(false);
    expect(isConsequentialSuccessStatus(null)).toBe(false);
    expect(isConsequentialSuccessStatus("RUN_CREATED")).toBe(true);
    expect(isConsequentialSuccessStatus("APPROVAL_DECIDED")).toBe(true);
  });

  it("does not introduce looping or bounce-like motion", () => {
    const source = readFileSync(
      repoPath(
        "src",
        "mycelia",
        "runtime",
        "ui",
        "consequential-action-reveal.tsx",
      ),
      "utf8",
    );

    expect(source).not.toMatch(/animationIterationCount|infinite|@keyframes/i);
    expect(source).not.toMatch(/bounce|elastic|spring/i);
    expect(source).not.toMatch(/animation\s*:/i);
  });
});
