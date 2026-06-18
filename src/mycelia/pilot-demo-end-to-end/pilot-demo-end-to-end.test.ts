import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  DEMO_SCENARIO_SEED_FIXTURES,
  DEMO_SCENARIO_SEED_INVALID_ROUTE_ATTEMPT,
  DEMO_SCENARIO_SEED_UNSAFE_RAW_CONTENT_ATTEMPT,
  DEMO_SCENARIO_SEED_UNSUPPORTED_STEP_KIND_ATTEMPT,
} from "../demo-scenario-seed-package";
import {
  PILOT_DEMO_END_TO_END_NAME,
  PilotDemoEndToEndRequiredFields,
  PilotDemoEndToEndStatuses,
  PilotDemoEndToEndSurface,
  presentPilotDemoEndToEnd,
} from ".";

function htmlForScenario(scenario?: unknown): string {
  return renderToStaticMarkup(
    createElement(PilotDemoEndToEndSurface, { scenario }),
  );
}

describe("pilot demo end-to-end", () => {
  it("exports module contract, presenter and renderer", () => {
    expect(PILOT_DEMO_END_TO_END_NAME).toBe("Pilot Demo End-to-End");
    expect(PilotDemoEndToEndStatuses).toEqual([
      "PILOT_DEMO_READY",
      "PILOT_DEMO_INCOMPLETE",
      "PILOT_DEMO_BLOCKED",
      "PILOT_DEMO_FAILED_SAFE",
    ]);
    expect(typeof presentPilotDemoEndToEnd).toBe("function");
    expect(isValidElement(createElement(PilotDemoEndToEndSurface))).toBe(true);
  });

  it("defines the required pilot demo contract fields", () => {
    expect(PilotDemoEndToEndRequiredFields).toEqual([
      "pilotDemoId",
      "selectedScenarioId",
      "demoTitle",
      "targetAudience",
      "demoThesis",
      "scenarioSummary",
      "stepCards",
      "routeLinks",
      "expectedGovernancePath",
      "safetyBoundary",
      "demoReadiness",
      "presenterScript",
      "nextActions",
    ]);
  });

  it("uses the medium-risk approval-required scenario as the default ready demo", () => {
    const model = presentPilotDemoEndToEnd();
    const html = htmlForScenario();

    expect(model.status).toBe("PILOT_DEMO_READY");
    expect(model.selectedScenarioId).toBe(
      "demo_seed_medium_risk_approval_required",
    );
    expect(model.stepCards.map((step) => step.stepKind)).toEqual(
      expect.arrayContaining([
        "REQUEST_CREATION",
        "POLICY_ADMISSION",
        "APPROVAL_DECISION",
        "AUDIT_EXPECTATION",
        "INVESTIGATION_REVIEW",
      ]),
    );
    expect(html).toContain(
      "Governed AI operations, from request to approval to investigation.",
    );
    expect(html).toContain(
      "See how MYCELIA controls an AI-assisted operational request before it can affect the business.",
    );
    expect(html).toContain("Controlled pilot demo");
    expect(html).toContain("Read-only");
    expect(html).toContain("No live execution");
    expect(html).toContain("MYCELIA pilot walkthrough");
    expect(html).toContain("/mycelia/request/new");
    expect(html).toContain("/mycelia/approval/decision");
    expect(html).toContain("/mycelia/investigation");
  });

  it("renders scenario cards for the main customer pilot paths", () => {
    const html = htmlForScenario();

    expect(html).toContain("Scenario selector");
    expect(html).toContain("Medium-risk approval required");
    expect(html).toContain("Rejected approval");
    expect(html).toContain("High-risk blocked");
    expect(html).toContain("Incomplete evidence");
    expect(html).toContain("Selected demo path");
  });

  it("renders a visual operational timeline with customer-facing explanation", () => {
    const html = htmlForScenario();

    for (const step of [
      "Request Draft",
      "Policy / Admission",
      "Approval Decision",
      "Audit Moment",
      "Investigation",
    ]) {
      expect(html).toContain(step);
    }

    expect(html).toContain("What MYCELIA decides or prepares");
    expect(html).toContain("What the human sees");
    expect(html).toContain("What is auditable");
    expect(html).toContain("What the client should understand");
    expect(html).toContain("Prevents ungoverned AI-assisted actions");
    expect(html).toContain("Demo outcome");
  });

  it("renders rejected approval and high-risk blocked/rejected demo paths", () => {
    const rejected = presentPilotDemoEndToEnd(
      DEMO_SCENARIO_SEED_FIXTURES.mediumRiskRejectedDecision,
    );
    const highRisk = presentPilotDemoEndToEnd(
      DEMO_SCENARIO_SEED_FIXTURES.highRiskBlockedRejectedPath,
    );
    const rejectedHtml = htmlForScenario(
      DEMO_SCENARIO_SEED_FIXTURES.mediumRiskRejectedDecision,
    );
    const highRiskHtml = htmlForScenario(
      DEMO_SCENARIO_SEED_FIXTURES.highRiskBlockedRejectedPath,
    );

    expect(rejected.status).toBe("PILOT_DEMO_READY");
    expect(rejectedHtml).toContain("rejected");
    expect(highRisk.status).toBe("PILOT_DEMO_READY");
    expect(highRiskHtml).toContain("High risk");
    expect(highRiskHtml).toContain("deny");
  });

  it("returns incomplete for incomplete evidence path", () => {
    const model = presentPilotDemoEndToEnd(
      DEMO_SCENARIO_SEED_FIXTURES.incompleteEvidencePath,
    );
    const html = htmlForScenario(DEMO_SCENARIO_SEED_FIXTURES.incompleteEvidencePath);

    expect(model.status).toBe("PILOT_DEMO_INCOMPLETE");
    expect(model.demoReadiness.missingPieces).toEqual(
      expect.arrayContaining([
        "INCOMPLETE_EVIDENCE_EXPECTED",
        "INCOMPLETE_AUDIT_EVIDENCE",
      ]),
    );
    expect(html).toContain("PILOT_DEMO_INCOMPLETE");
  });

  it("blocks invalid routes and unsupported step kinds", () => {
    const invalidRoute = presentPilotDemoEndToEnd(
      DEMO_SCENARIO_SEED_INVALID_ROUTE_ATTEMPT,
    );
    const unsupportedStep = presentPilotDemoEndToEnd(
      DEMO_SCENARIO_SEED_UNSUPPORTED_STEP_KIND_ATTEMPT,
    );

    expect(invalidRoute.status).toBe("PILOT_DEMO_BLOCKED");
    expect(invalidRoute.demoReadiness.missingPieces).toContain(
      "INVALID_ROUTE_PATH",
    );
    expect(unsupportedStep.status).toBe("PILOT_DEMO_BLOCKED");
    expect(unsupportedStep.demoReadiness.missingPieces).toContain(
      "UNSUPPORTED_STEP_KIND",
    );
  });

  it("fails safe for unsafe raw-content-like fields without exposing values", () => {
    const model = presentPilotDemoEndToEnd(
      DEMO_SCENARIO_SEED_UNSAFE_RAW_CONTENT_ATTEMPT,
    );
    const html = htmlForScenario(DEMO_SCENARIO_SEED_UNSAFE_RAW_CONTENT_ATTEMPT);

    expect(model.status).toBe("PILOT_DEMO_FAILED_SAFE");
    expect(html).toContain("UNSAFE_RAW_FIELD_NAME");
    expect(html).not.toContain("unsafe source material is never accepted");
  });

  it("does not mutate scenario seed inputs", () => {
    const scenario = DEMO_SCENARIO_SEED_FIXTURES.mediumRiskApprovalRequired;
    const before = JSON.stringify(scenario);

    presentPilotDemoEndToEnd(scenario);

    expect(JSON.stringify(scenario)).toBe(before);
  });

  it("renders all required UI sections", () => {
    const html = htmlForScenario();

    for (const heading of [
      "Demo overview",
      "End-to-end path",
      "Governance story",
      "Presenter mode",
      "Safety boundary",
      "Demo readiness",
    ]) {
      expect(html).toContain(heading);
    }
  });

  it("does not render raw sensitive fields, SQL details or stack traces", () => {
    const combinedHtml = [
      ...Object.values(DEMO_SCENARIO_SEED_FIXTURES).map((scenario) =>
        htmlForScenario(scenario),
      ),
      htmlForScenario(DEMO_SCENARIO_SEED_UNSAFE_RAW_CONTENT_ATTEMPT),
    ].join("\n");

    expect(combinedHtml).not.toMatch(
      /rawDocument|documentContent|rawContent|fileBlob|binary|payload/i,
    );
    expect(combinedHtml).not.toMatch(/SQLITE|stack trace|private key|secret/i);
  });

  it("does not present fake runtime execution affordances", () => {
    const html = htmlForScenario();

    expect(html).not.toMatch(/<form\b/i);
    expect(html).not.toMatch(/<button\b/i);
    expect(html).not.toMatch(/<input\b/i);
    expect(html).not.toMatch(/<textarea\b/i);
    expect(html).not.toMatch(/<select\b/i);
    expect(html).not.toContain("onSubmit");
    expect(html).not.toContain("action=");
  });

  it("keeps lockfile, schema and migration unchanged", () => {
    const packageStatus = execFileSync(
      "git",
      ["status", "--short", "--", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );
    const schemaDiff = execFileSync(
      "git",
      [
        "diff",
        "--name-only",
        "--",
        "prisma/schema.prisma",
        "prisma/migrations/000001_minimal_runtime_slice/migration.sql",
      ],
      { encoding: "utf8" },
    );

    expect(packageStatus.trim()).toBe("");
    expect(schemaDiff.trim()).toBe("");
  });

  it("does not create generated database files in the repository", () => {
    const forbiddenDbFiles = [
      join(process.cwd(), "dev.db"),
      join(process.cwd(), "prisma", "dev.db"),
      join(process.cwd(), "mycelia.sqlite"),
      join(process.cwd(), "prisma", "mycelia.sqlite"),
    ];

    for (const file of forbiddenDbFiles) {
      expect(existsSync(file), `${file} should not exist`).toBe(false);
    }
  });
});
