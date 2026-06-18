import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEMO_SCENARIO_SEED_FIXTURES,
  DEMO_SCENARIO_SEED_INVALID_ROUTE_ATTEMPT,
  DEMO_SCENARIO_SEED_PACKAGE_NAME,
  DEMO_SCENARIO_SEED_UNSAFE_RAW_CONTENT_ATTEMPT,
  DEMO_SCENARIO_SEED_UNSUPPORTED_STEP_KIND_ATTEMPT,
  DEFAULT_DEMO_SCENARIO_SEED,
  DemoScenarioSeedAllowedRoutes,
  DemoScenarioSeedRequiredFields,
  DemoScenarioSeedStatuses,
  DemoScenarioSeedStepKinds,
  getDemoScenarioSeedPackage,
  presentDemoScenarioSeed,
} from ".";

const readyScenarioNames = [
  "lowRiskDirectCompletion",
  "mediumRiskApprovalRequired",
  "mediumRiskRejectedDecision",
  "cancelledApprovalPath",
  "timedOutApprovalPath",
] as const;

describe("demo scenario seed package", () => {
  it("exports module contract, fixtures, presenter and package descriptor", () => {
    expect(DEMO_SCENARIO_SEED_PACKAGE_NAME).toBe("Demo Scenario Seed Package");
    expect(DemoScenarioSeedStatuses).toEqual([
      "DEMO_SCENARIO_READY",
      "DEMO_SCENARIO_INCOMPLETE",
      "DEMO_SCENARIO_BLOCKED",
      "DEMO_SCENARIO_FAILED_SAFE",
    ]);
    expect(DemoScenarioSeedStepKinds).toEqual([
      "REQUEST_CREATION",
      "POLICY_ADMISSION",
      "APPROVAL_DECISION",
      "AUDIT_EXPECTATION",
      "INVESTIGATION_REVIEW",
    ]);
    expect(DemoScenarioSeedAllowedRoutes).toEqual([
      "/mycelia/request/new",
      "/mycelia/approval/decision",
      "/mycelia/investigation",
    ]);
    expect(typeof presentDemoScenarioSeed).toBe("function");
    expect(typeof getDemoScenarioSeedPackage).toBe("function");
  });

  it("defines the required scenario contract fields", () => {
    expect(DemoScenarioSeedRequiredFields).toEqual([
      "demoScenarioId",
      "scenarioName",
      "scenarioPurpose",
      "targetBuyerContext",
      "requestSeed",
      "policyAdmissionExpectation",
      "approvalExpectation",
      "investigationExpectation",
      "auditExpectation",
      "routeSequence",
      "presenterNotes",
      "safetyWarnings",
      "demoReadinessStatus",
      "nextSteps",
    ]);
  });

  it("marks low-risk direct completion and medium-risk approval scenarios ready", () => {
    for (const name of readyScenarioNames) {
      const model = presentDemoScenarioSeed(DEMO_SCENARIO_SEED_FIXTURES[name]);

      expect(model.status).toBe("DEMO_SCENARIO_READY");
      expect(model.routeSequence.length).toBeGreaterThanOrEqual(5);
      expect(model.scenarioSummary).toContain(
        DEMO_SCENARIO_SEED_FIXTURES[name].scenarioName,
      );
    }
  });

  it("marks high-risk blocked or rejected scenario ready by design", () => {
    const model = presentDemoScenarioSeed(
      DEMO_SCENARIO_SEED_FIXTURES.highRiskBlockedRejectedPath,
    );

    expect(model.status).toBe("DEMO_SCENARIO_READY");
    expect(model.policyAdmissionSummary).toContain("deny");
    expect(model.safetyWarnings.some((item) => item.severity === "INFO")).toBe(
      true,
    );
  });

  it("returns incomplete with warnings for incomplete evidence", () => {
    const model = presentDemoScenarioSeed(
      DEMO_SCENARIO_SEED_FIXTURES.incompleteEvidencePath,
    );

    expect(model.status).toBe("DEMO_SCENARIO_INCOMPLETE");
    expect(model.safetyWarnings.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "INCOMPLETE_EVIDENCE_EXPECTED",
        "INCOMPLETE_AUDIT_EVIDENCE",
        "DECLARED_INCOMPLETE",
      ]),
    );
  });

  it("fails safe for unsafe raw-content attempts without exposing the unsafe value", () => {
    const model = presentDemoScenarioSeed(
      DEMO_SCENARIO_SEED_UNSAFE_RAW_CONTENT_ATTEMPT,
    );
    const serialized = JSON.stringify(model);

    expect(model.status).toBe("DEMO_SCENARIO_FAILED_SAFE");
    expect(serialized).toContain("UNSAFE_RAW_FIELD_NAME");
    expect(serialized).not.toContain("unsafe source material is never accepted");
  });

  it("blocks unsupported step kinds", () => {
    const model = presentDemoScenarioSeed(
      DEMO_SCENARIO_SEED_UNSUPPORTED_STEP_KIND_ATTEMPT,
    );

    expect(model.status).toBe("DEMO_SCENARIO_BLOCKED");
    expect(model.safetyWarnings.map((item) => item.code)).toContain(
      "UNSUPPORTED_STEP_KIND",
    );
  });

  it("blocks invalid route paths", () => {
    const model = presentDemoScenarioSeed(
      DEMO_SCENARIO_SEED_INVALID_ROUTE_ATTEMPT,
    );

    expect(model.status).toBe("DEMO_SCENARIO_BLOCKED");
    expect(model.safetyWarnings.map((item) => item.code)).toContain(
      "INVALID_ROUTE_PATH",
    );
  });

  it("normalizes missing fields without mutating the input", () => {
    const incomplete = {
      demoScenarioId: "demo_seed_missing_fields",
      scenarioName: "Missing fields",
    } as const;
    const before = JSON.stringify(incomplete);
    const model = presentDemoScenarioSeed(incomplete);
    const after = JSON.stringify(incomplete);

    expect(model.status).toBe("DEMO_SCENARIO_INCOMPLETE");
    expect(model.safetyWarnings.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "DEMO_SCENARIO_PURPOSE_MISSING",
        "REQUEST_SEED_MISSING",
        "ROUTE_SEQUENCE_MISSING",
      ]),
    );
    expect(after).toBe(before);
  });

  it("keeps route sequence limited to allowed MYCELIA surfaces", () => {
    const allowedRoutes = new Set(DemoScenarioSeedAllowedRoutes);

    for (const fixture of Object.values(DEMO_SCENARIO_SEED_FIXTURES)) {
      for (const step of fixture.routeSequence ?? []) {
        expect(allowedRoutes.has(step.route ?? "")).toBe(true);
      }
    }
  });

  it("does not expose raw sensitive fields, SQL details or stack traces", () => {
    const combined = [
      ...Object.values(DEMO_SCENARIO_SEED_FIXTURES).map((fixture) =>
        JSON.stringify(presentDemoScenarioSeed(fixture)),
      ),
      JSON.stringify(
        presentDemoScenarioSeed(DEMO_SCENARIO_SEED_UNSAFE_RAW_CONTENT_ATTEMPT),
      ),
    ].join("\n");

    expect(combined).not.toMatch(
      /rawDocument|documentContent|rawContent|fileBlob|binary|payload/i,
    );
    expect(combined).not.toMatch(/SQLITE|stack trace|private key|secret/i);
  });

  it("builds a deterministic package descriptor for all valid scenario seeds", () => {
    const seedPackage = getDemoScenarioSeedPackage();

    expect(seedPackage.scenarios).toHaveLength(
      Object.keys(DEMO_SCENARIO_SEED_FIXTURES).length,
    );
    expect(seedPackage.allowedRoutes).toEqual(DemoScenarioSeedAllowedRoutes);
    expect(seedPackage.stepKinds).toEqual(DemoScenarioSeedStepKinds);
    expect(seedPackage.scenarios[0].phase).toBe("3J");
    expect(DEFAULT_DEMO_SCENARIO_SEED.demoScenarioId).toBe(
      "demo_seed_medium_risk_approval_required",
    );
  });

  it("keeps package files, schema and migration unchanged", () => {
    const packageStatus = execFileSync(
      "git",
      ["status", "--short", "--", "package.json", "pnpm-lock.yaml"],
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
