import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  isDemoScenarioOrdered,
  validateDemoScenario,
} from "../../domain-contracts/demo-scenario";
import {
  validateDemoScenarioFixture,
  validateDemoScenarioFixtureManifest,
} from "../../domain-contracts/demo-scenario-fixture";
import { validateDemoReadinessReport } from "../../domain-contracts/demo-readiness-report";
import {
  isStaticDemoArtifactExposureCompatible,
  isStaticDemoArtifactOrdered,
  validateStaticDemoArtifact,
} from "../../domain-contracts/static-demo-artifact";

import {
  firstStaticDemoArtifact,
  firstStaticDemoFixture,
  firstStaticDemoFixtureManifest,
  firstStaticDemoReadinessReport,
  firstStaticDemoScenario,
  validateFirstStaticDemoDescriptors,
} from "./first-static-demo-descriptor";

const UNSAFE_DESCRIPTOR_STRING_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|connection[_-]?string|credential|password|private[_-]?key|select\s|insert\s|update\s|delete\s|drop\s|sql|token)/i;

const DESCRIPTOR_ONLY_FORBIDDEN_KEYS = [
  "download_url",
  "emitted_event_id",
  "execute",
  "executed_at",
  "export_path",
  "generated_pdf",
  "json_fixture_path",
  "persisted_at",
  "rendered_at",
  "seed_data",
  "simulation_result",
  "tool_invocation_id",
  "ui_component",
] as const;

function collectStrings(input: unknown): string[] {
  if (typeof input === "string") {
    return [input];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => collectStrings(item));
  }

  if (typeof input === "object" && input !== null) {
    return Object.entries(input).flatMap(([key, value]) => [
      key,
      ...collectStrings(value),
    ]);
  }

  return [];
}

function collectKeys(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.flatMap((item) => collectKeys(item));
  }

  if (typeof input === "object" && input !== null) {
    return Object.entries(input).flatMap(([key, value]) => [
      key,
      ...collectKeys(value),
    ]);
  }

  return [];
}

function allExportedDescriptors(): readonly unknown[] {
  return [
    firstStaticDemoScenario,
    firstStaticDemoFixture,
    firstStaticDemoFixtureManifest,
    firstStaticDemoReadinessReport,
    firstStaticDemoArtifact,
  ];
}

describe("first static demo descriptor set", () => {
  it("validates all exported descriptors successfully", () => {
    expect(validateDemoScenario(firstStaticDemoScenario).ok).toBe(true);
    expect(validateDemoScenarioFixture(firstStaticDemoFixture).ok).toBe(true);
    expect(
      validateDemoScenarioFixtureManifest(
        firstStaticDemoFixtureManifest,
      ).ok,
    ).toBe(true);
    expect(
      validateDemoReadinessReport(firstStaticDemoReadinessReport).ok,
    ).toBe(true);
    expect(validateStaticDemoArtifact(firstStaticDemoArtifact).ok).toBe(
      true,
    );
  });

  it("validates the DemoScenario descriptor successfully", () => {
    const result = validateDemoScenario(firstStaticDemoScenario);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("GOVERNED_OPERATION_HAPPY_PATH");
      expect(result.value.steps).toHaveLength(12);
      expect(result.value.links).toHaveLength(11);
    }
  });

  it("validates the DemoScenarioFixture descriptor successfully", () => {
    const result = validateDemoScenarioFixture(firstStaticDemoFixture);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.scenario?.demo_scenario_id).toBe(
        firstStaticDemoScenario.demo_scenario_id,
      );
      expect(result.value.expected_scenario_kind).toBe(
        "GOVERNED_OPERATION_HAPPY_PATH",
      );
    }
  });

  it("validates the DemoScenarioFixtureManifest descriptor successfully", () => {
    const result = validateDemoScenarioFixtureManifest(
      firstStaticDemoFixtureManifest,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fixtures).toHaveLength(1);
      expect(result.value.manifest_version).toBe(1);
    }
  });

  it("validates the DemoReadinessReport descriptor successfully", () => {
    const result = validateDemoReadinessReport(
      firstStaticDemoReadinessReport,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("READY");
      expect(result.value.findings.every((finding) =>
        finding.severity !== "BLOCKER"
      )).toBe(true);
    }
  });

  it("validates the StaticDemoArtifact descriptor successfully", () => {
    const result = validateStaticDemoArtifact(firstStaticDemoArtifact);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.exposure).toBe("CUSTOMER_SAFE");
      expect(result.value.sections).toHaveLength(7);
    }
  });

  it("validates the descriptor set helper successfully", () => {
    const result = validateFirstStaticDemoDescriptors();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.scenario.tenant_id).toBe(
        result.value.static_demo_artifact.tenant_id,
      );
    }
  });

  it("keeps all descriptors on the same tenant_id", () => {
    const tenantIds = new Set([
      firstStaticDemoScenario.tenant_id,
      firstStaticDemoFixture.tenant_id,
      firstStaticDemoFixtureManifest.tenant_id,
      firstStaticDemoReadinessReport.tenant_id,
      firstStaticDemoArtifact.tenant_id,
    ]);

    expect(tenantIds.size).toBe(1);
  });

  it("keeps static artifact exposure compatible with classification", () => {
    expect(
      isStaticDemoArtifactExposureCompatible(firstStaticDemoArtifact.exposure, [
        firstStaticDemoArtifact.data_classification,
        ...firstStaticDemoArtifact.sections.map(
          (section) => section.data_classification,
        ),
      ]),
    ).toBe(true);
  });

  it("keeps scenario steps ordered", () => {
    expect(isDemoScenarioOrdered(firstStaticDemoScenario.steps)).toBe(true);
  });

  it("keeps artifact sections ordered", () => {
    expect(isStaticDemoArtifactOrdered(firstStaticDemoArtifact.sections)).toBe(
      true,
    );
  });

  it("keeps readiness report READY with no BLOCKER findings", () => {
    expect(firstStaticDemoReadinessReport.status).toBe("READY");
    expect(
      firstStaticDemoReadinessReport.findings.some(
        (finding) => finding.severity === "BLOCKER",
      ),
    ).toBe(false);
  });

  it("includes the limitations and non-goals section", () => {
    const limitations = firstStaticDemoArtifact.sections.find(
      (section) => section.section_kind === "LIMITATIONS_AND_NON_GOALS",
    );

    expect(limitations).toBeDefined();
    expect(limitations?.summary).toContain("No runtime execution");
    expect(limitations?.summary).toContain("external service calls");
  });

  it("does not contain unsafe URL, path, email, token, credential, query, connection-string or shell-like strings", () => {
    const unsafeStrings = allExportedDescriptors()
      .flatMap((descriptor) => collectStrings(descriptor))
      .filter((value) => UNSAFE_DESCRIPTOR_STRING_PATTERN.test(value));

    expect(unsafeStrings).toEqual([]);
  });

  it("keeps descriptor-only guarantees across exported descriptors", () => {
    const keys = allExportedDescriptors().flatMap((descriptor) =>
      collectKeys(descriptor),
    );

    for (const forbiddenKey of DESCRIPTOR_ONLY_FORBIDDEN_KEYS) {
      expect(keys).not.toContain(forbiddenKey);
    }
  });

  it("does not modify pnpm-lock.yaml", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(status.trim()).toBe("");
  });
});
