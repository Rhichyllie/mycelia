import {
  DEMO_SCENARIO_SEED_PACKAGE_NAME,
  DEMO_SCENARIO_SEED_PACKAGE_PHASE,
  DEMO_SCENARIO_SEED_PACKAGE_STATUS,
  DemoScenarioSeedAllowedRoutes,
  DemoScenarioSeedStepKinds,
  type DemoScenarioSeedPackage,
} from "./demo-scenario-seed-contract";
import { DEMO_SCENARIO_SEED_FIXTURES } from "./demo-scenario-seed-fixtures";
import { presentDemoScenarioSeed } from "./demo-scenario-seed-presenter";

const safetyBoundary = [
  "Scenario seeds do not execute runtime work.",
  "Scenario seeds do not persist or mutate data.",
  "Scenario seeds do not create API routes, auth or RBAC behavior.",
  "Scenario seeds do not execute replay, workflow actions or tools.",
  "Scenario seeds do not create export, download or PDF artifacts.",
  "Scenario seeds do not call external services.",
  "Scenario seeds use safe references and safe summaries only.",
] as const;

export function getDemoScenarioSeedPackage(): DemoScenarioSeedPackage {
  return {
    phase: DEMO_SCENARIO_SEED_PACKAGE_PHASE,
    name: DEMO_SCENARIO_SEED_PACKAGE_NAME,
    status: DEMO_SCENARIO_SEED_PACKAGE_STATUS,
    scenarios: Object.values(DEMO_SCENARIO_SEED_FIXTURES).map((scenario) =>
      presentDemoScenarioSeed(scenario),
    ),
    allowedRoutes: DemoScenarioSeedAllowedRoutes,
    stepKinds: DemoScenarioSeedStepKinds,
    safetyBoundary,
    safeSummary:
      "Phase 3J connects request, approval and investigation surfaces into deterministic non-executing demo seeds.",
  };
}
