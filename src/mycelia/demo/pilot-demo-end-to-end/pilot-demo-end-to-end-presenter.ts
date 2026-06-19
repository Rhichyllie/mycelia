import {
  DEMO_SCENARIO_SEED_FIXTURES,
  DemoScenarioSeedAllowedRoutes,
  DemoScenarioSeedStepKinds,
  presentDemoScenarioSeed,
  type DemoScenarioRouteStep,
  type DemoScenarioSeed,
  type DemoScenarioSeedAllowedRoute,
  type DemoScenarioSeedStepKind,
  type DemoScenarioSeedWarning,
} from "../../demo/demo-scenario-seed-package";
import {
  PILOT_DEMO_END_TO_END_NAME,
  PILOT_DEMO_END_TO_END_PHASE,
  PilotDemoEndToEndRequiredFields,
  type PilotDemoEndToEndModel,
  type PilotDemoEndToEndStatus,
  type PilotDemoPresenterScriptItem,
  type PilotDemoRouteLink,
  type PilotDemoStepCard,
} from "./pilot-demo-end-to-end-contract";

const allowedRoutes = new Set<string>(DemoScenarioSeedAllowedRoutes);
const supportedStepKinds = new Set<string>(DemoScenarioSeedStepKinds);

const unsafeFieldNamePattern =
  /^(rawDocument|documentContent|rawContent|fileBlob|binary|payload)$/i;

const safetyBoundary = [
  "No runtime execution is performed by this walkthrough.",
  "No database write or persistence mutation occurs.",
  "No API route, auth, RBAC or session behavior is created.",
  "No replay, workflow action or tool execution is available.",
  "No export, download or PDF artifact is created.",
  "No external service call is made.",
] as const;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasUnsafeFieldName(input: unknown): boolean {
  if (Array.isArray(input)) {
    return input.some((item) => hasUnsafeFieldName(item));
  }

  if (!isRecord(input)) {
    return false;
  }

  return Object.entries(input).some(
    ([key, value]) =>
      unsafeFieldNamePattern.test(key) || hasUnsafeFieldName(value),
  );
}

function warning(
  code: string,
  severity: DemoScenarioSeedWarning["severity"],
  safeSummary: string,
): DemoScenarioSeedWarning {
  return { code, severity, safeSummary };
}

function statusFromScenarioStatus(status: string): PilotDemoEndToEndStatus {
  if (status === "DEMO_SCENARIO_READY") {
    return "PILOT_DEMO_READY";
  }

  if (status === "DEMO_SCENARIO_INCOMPLETE") {
    return "PILOT_DEMO_INCOMPLETE";
  }

  if (status === "DEMO_SCENARIO_BLOCKED") {
    return "PILOT_DEMO_BLOCKED";
  }

  return "PILOT_DEMO_FAILED_SAFE";
}

function statusFromWarnings(
  warnings: readonly DemoScenarioSeedWarning[],
  fallback: PilotDemoEndToEndStatus,
): PilotDemoEndToEndStatus {
  if (
    warnings.some((item) =>
      item.code === "UNSAFE_RAW_FIELD_NAME" ||
      item.code === "PILOT_DEMO_SCHEMA_FAILED_SAFE"
    )
  ) {
    return "PILOT_DEMO_FAILED_SAFE";
  }

  if (warnings.some((item) => item.severity === "BLOCKER")) {
    return "PILOT_DEMO_BLOCKED";
  }

  if (warnings.some((item) => item.severity === "WARNING")) {
    return "PILOT_DEMO_INCOMPLETE";
  }

  return fallback;
}

function titleForStep(stepKind: string | null | undefined): string {
  const titles: Record<DemoScenarioSeedStepKind, string> = {
    REQUEST_CREATION: "Request creation",
    POLICY_ADMISSION: "Policy and admission",
    APPROVAL_DECISION: "Approval decision preview",
    AUDIT_EXPECTATION: "Audit expectation",
    INVESTIGATION_REVIEW: "Investigation review",
  };

  if (stepKind !== null && stepKind !== undefined && stepKind in titles) {
    return titles[stepKind as DemoScenarioSeedStepKind];
  }

  return "Unsupported demo step";
}

function expectedOutcomeFor(
  stepKind: string | null | undefined,
  model: ReturnType<typeof presentDemoScenarioSeed>,
): string {
  if (stepKind === "REQUEST_CREATION") {
    return model.requestSeedSummary;
  }

  if (stepKind === "POLICY_ADMISSION") {
    return model.policyAdmissionSummary;
  }

  if (stepKind === "APPROVAL_DECISION") {
    return model.approvalSummary;
  }

  if (stepKind === "AUDIT_EXPECTATION") {
    return model.auditSummary;
  }

  if (stepKind === "INVESTIGATION_REVIEW") {
    return model.investigationSummary;
  }

  return "Unsupported step cannot be used for the pilot walkthrough.";
}

function scriptForStepKind(
  stepKind: DemoScenarioSeedStepKind,
): PilotDemoPresenterScriptItem {
  const scripts: Record<DemoScenarioSeedStepKind, PilotDemoPresenterScriptItem> = {
    REQUEST_CREATION: {
      stepKind,
      whatToSay:
        "This starts as a controlled request draft, not a submitted live operation.",
      whatNotToClaim:
        "Do not claim the request was persisted or executed from this surface.",
    },
    POLICY_ADMISSION: {
      stepKind,
      whatToSay:
        "Policy and admission expectations show why the run is governed before work proceeds.",
      whatNotToClaim:
        "Do not claim a production policy engine or live admission service is active.",
    },
    APPROVAL_DECISION: {
      stepKind,
      whatToSay:
        "The approval preview frames the human decision path without submitting it.",
      whatNotToClaim:
        "Do not claim a live approval action, RBAC workflow or inbox exists here.",
    },
    AUDIT_EXPECTATION: {
      stepKind,
      whatToSay:
        "The demo identifies expected audit moments so evidence gaps are visible.",
      whatNotToClaim:
        "Do not claim broad audit sealing, event store or export behavior exists.",
    },
    INVESTIGATION_REVIEW: {
      stepKind,
      whatToSay:
        "The investigation surface explains what happened using safe read-only descriptors.",
      whatNotToClaim:
        "Do not claim replay execution, mutation or case-management workflow exists.",
    },
  };

  return scripts[stepKind];
}

function whatToSayForStep(stepKind: string | null | undefined): string {
  if (stepKind !== null && stepKind !== undefined && supportedStepKinds.has(stepKind)) {
    return scriptForStepKind(stepKind as DemoScenarioSeedStepKind).whatToSay;
  }

  return "Unsupported step should be treated as blocked before presentation.";
}

function whatNotToClaimForStep(stepKind: string | null | undefined): string {
  if (stepKind !== null && stepKind !== undefined && supportedStepKinds.has(stepKind)) {
    return scriptForStepKind(stepKind as DemoScenarioSeedStepKind).whatNotToClaim;
  }

  return "Do not claim unsupported workflow behavior exists.";
}

function stepStatus(
  step: DemoScenarioRouteStep,
  demoStatus: PilotDemoEndToEndStatus,
): PilotDemoEndToEndStatus {
  if (!step.kind || !supportedStepKinds.has(step.kind)) {
    return "PILOT_DEMO_BLOCKED";
  }

  if (!step.route || !allowedRoutes.has(step.route)) {
    return "PILOT_DEMO_BLOCKED";
  }

  return demoStatus;
}

function buildStepCards(
  routeSequence: readonly DemoScenarioRouteStep[],
  scenarioModel: ReturnType<typeof presentDemoScenarioSeed>,
  demoStatus: PilotDemoEndToEndStatus,
): readonly PilotDemoStepCard[] {
  return routeSequence.map((step) => ({
    stepKind: step.kind ?? "UNKNOWN_STEP",
    title: step.label ?? titleForStep(step.kind),
    safeSummary: step.safeSummary ?? "No safe step summary was supplied.",
    routePath: step.route ?? "UNKNOWN_ROUTE",
    status: stepStatus(step, demoStatus),
    expectedOutcome: expectedOutcomeFor(step.kind, scenarioModel),
    whatToSay: whatToSayForStep(step.kind),
    whatNotToClaim: whatNotToClaimForStep(step.kind),
  }));
}

function buildRouteLinks(
  routeSequence: readonly DemoScenarioRouteStep[],
): readonly PilotDemoRouteLink[] {
  const seen = new Set<string>();
  const links: PilotDemoRouteLink[] = [];

  for (const step of routeSequence) {
    if (!step.route || !allowedRoutes.has(step.route) || seen.has(step.route)) {
      continue;
    }

    seen.add(step.route);
    links.push({
      label: step.label ?? titleForStep(step.kind),
      routePath: step.route as DemoScenarioSeedAllowedRoute,
      safeSummary: step.safeSummary ?? "Controlled MYCELIA route.",
    });
  }

  return links;
}

function buildExpectedGovernancePath(
  scenarioModel: ReturnType<typeof presentDemoScenarioSeed>,
): readonly string[] {
  return [
    scenarioModel.requestSeedSummary,
    scenarioModel.policyAdmissionSummary,
    scenarioModel.approvalSummary,
    scenarioModel.auditSummary,
    scenarioModel.investigationSummary,
  ];
}

function buildPresenterScript(): readonly PilotDemoPresenterScriptItem[] {
  return DemoScenarioSeedStepKinds.map((stepKind) => scriptForStepKind(stepKind));
}

function missingPiecesFromWarnings(
  warnings: readonly DemoScenarioSeedWarning[],
): readonly string[] {
  return warnings
    .filter((item) => item.severity !== "INFO")
    .map((item) => item.code);
}

function demoTitleFor(scenarioName: string | null | undefined): string {
  return scenarioName
    ? `MYCELIA pilot walkthrough: ${scenarioName}`
    : "MYCELIA pilot walkthrough";
}

function failedSafeModel(
  reason: DemoScenarioSeedWarning,
): PilotDemoEndToEndModel {
  return {
    phase: PILOT_DEMO_END_TO_END_PHASE,
    name: PILOT_DEMO_END_TO_END_NAME,
    status: "PILOT_DEMO_FAILED_SAFE",
    requiredFields: PilotDemoEndToEndRequiredFields,
    pilotDemoId: "pilot_demo_failed_safe",
    selectedScenarioId: "demo_seed_failed_safe",
    demoTitle: "MYCELIA pilot walkthrough failed safe",
    targetAudience: "Internal pilot reviewer",
    demoThesis:
      "The pilot demo cannot be rendered from unsafe scenario input.",
    scenarioSummary: "Unsafe scenario seed was rejected before presentation.",
    stepCards: [],
    routeLinks: [],
    expectedGovernancePath: [],
    safetyBoundary,
    demoReadiness: {
      status: "PILOT_DEMO_FAILED_SAFE",
      missingPieces: [reason.code],
      warnings: [reason],
    },
    presenterScript: buildPresenterScript(),
    nextActions: [
      "Replace unsafe demo input with deterministic safe scenario seeds.",
      "Keep runtime execution outside the pilot walkthrough surface.",
    ],
  };
}

export function presentPilotDemoEndToEnd(
  scenarioInput: unknown =
    DEMO_SCENARIO_SEED_FIXTURES.mediumRiskApprovalRequired,
): PilotDemoEndToEndModel {
  if (hasUnsafeFieldName(scenarioInput)) {
    return failedSafeModel(
      warning(
        "UNSAFE_RAW_FIELD_NAME",
        "BLOCKER",
        "Unsafe raw-content-like field names are not accepted in pilot demos.",
      ),
    );
  }

  const scenarioModel = presentDemoScenarioSeed(scenarioInput);
  const initialStatus = statusFromScenarioStatus(scenarioModel.status);
  const warnings = [...scenarioModel.safetyWarnings];
  const status = statusFromWarnings(warnings, initialStatus);
  const scenario = scenarioModel.scenario as DemoScenarioSeed;
  const routeSequence = scenarioModel.routeSequence;

  return {
    phase: PILOT_DEMO_END_TO_END_PHASE,
    name: PILOT_DEMO_END_TO_END_NAME,
    status,
    requiredFields: PilotDemoEndToEndRequiredFields,
    pilotDemoId: "pilot_demo_end_to_end",
    selectedScenarioId: scenario.demoScenarioId ?? "unknown_demo_seed",
    demoTitle: demoTitleFor(scenario.scenarioName),
    targetAudience:
      scenario.targetBuyerContext ?? "Compliance operations pilot reviewer",
    demoThesis:
      "Show how a governed request moves from controlled request draft to approval framing and investigation review without executing runtime work.",
    scenarioSummary: scenarioModel.scenarioSummary,
    stepCards: buildStepCards(routeSequence, scenarioModel, status),
    routeLinks: buildRouteLinks(routeSequence),
    expectedGovernancePath: buildExpectedGovernancePath(scenarioModel),
    safetyBoundary,
    demoReadiness: {
      status,
      missingPieces: missingPiecesFromWarnings(warnings),
      warnings,
    },
    presenterScript: buildPresenterScript(),
    nextActions: scenarioModel.nextSteps,
  };
}
