import {
  DEMO_SCENARIO_SEED_PACKAGE_NAME,
  DEMO_SCENARIO_SEED_PACKAGE_PHASE,
  DemoScenarioSeedAllowedRoutes,
  DemoScenarioSeedRequiredFields,
  DemoScenarioSeedSchema,
  DemoScenarioSeedStepKinds,
  type DemoScenarioRouteStep,
  type DemoScenarioSeed,
  type DemoScenarioSeedPresentedModel,
  type DemoScenarioSeedStatus,
  type DemoScenarioSeedWarning,
} from "./demo-scenario-seed-contract";
import { DEFAULT_DEMO_SCENARIO_SEED } from "./demo-scenario-seed-fixtures";

const allowedRoutes = new Set<string>(DemoScenarioSeedAllowedRoutes);
const supportedStepKinds = new Set<string>(DemoScenarioSeedStepKinds);

const unsafeFieldNamePattern =
  /^(rawDocument|documentContent|rawContent|fileBlob|binary|payload)$/i;

const requiredRoutePaths = [
  "/mycelia/request/new",
  "/mycelia/approval/decision",
  "/mycelia/investigation",
] as const;

const failedSafeScenario = {
  demoScenarioId: "demo_seed_failed_safe",
  scenarioName: "Failed safe demo seed",
  scenarioPurpose:
    "Demo scenario seed could not be normalized safely for presentation.",
  targetBuyerContext: "Internal pilot reviewer",
  requestSeed: {
    requestRef: "request_seed_failed_safe",
    tenantRef: null,
    requesterRef: null,
    resourceRef: null,
    requestPurpose: null,
    actionType: null,
    riskHint: "UNSAFE",
    safeSummary: "Request seed failed safe before presentation.",
  },
  policyAdmissionExpectation: {
    riskLevel: "UNSAFE",
    policyOutcome: "DENY",
    admissionOutcome: "DENY",
    reasonCode: "FAILED_SAFE",
    lifecycleHint: "REJECT",
    safeSummary:
      "Policy and admission expectation failed safe before presentation.",
  },
  approvalExpectation: {
    approvalRequired: false,
    approvalPreviewRef: null,
    selectedDecisionPreview: null,
    expectedApprovalStatus: "UNKNOWN",
    expectedLifecycleResult: "FAILED_SAFE",
    expectedApprovalRole: null,
    safeSummary: "Approval expectation failed safe before presentation.",
  },
  investigationExpectation: {
    expectedState: "FAILED_SAFE",
    expectedCompleteness: "FAILED_SAFE",
    expectedFindings: ["DEMO_SCENARIO_FAILED_SAFE"],
    safeSummary: "Investigation expectation failed safe before presentation.",
  },
  auditExpectation: {
    expectedMoments: [],
    missingMoments: [],
    safeSummary: "Audit expectation failed safe before presentation.",
  },
  routeSequence: [],
  presenterNotes: [
    "Remove unsafe fields and retry with safe references and summaries only.",
  ],
  safetyWarnings: [],
  demoReadinessStatus: "DEMO_SCENARIO_FAILED_SAFE",
  nextSteps: [
    "Replace the unsafe seed with bounded scenario descriptors.",
    "Keep live runtime execution outside this demo seed package.",
  ],
} as const satisfies DemoScenarioSeed;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function unsafeFieldNames(input: unknown): string[] {
  if (!isRecord(input)) {
    return [];
  }

  return Object.keys(input).filter((key) => unsafeFieldNamePattern.test(key));
}

function warning(
  code: string,
  severity: DemoScenarioSeedWarning["severity"],
  safeSummary: string,
): DemoScenarioSeedWarning {
  return { code, severity, safeSummary };
}

function missingCoreWarnings(
  scenario: DemoScenarioSeed,
): DemoScenarioSeedWarning[] {
  const warnings: DemoScenarioSeedWarning[] = [];

  if (!scenario.demoScenarioId) {
    warnings.push(
      warning(
        "DEMO_SCENARIO_ID_MISSING",
        "BLOCKER",
        "Demo scenario identifier is required.",
      ),
    );
  }

  if (!scenario.scenarioName) {
    warnings.push(
      warning(
        "DEMO_SCENARIO_NAME_MISSING",
        "WARNING",
        "Demo scenario name is missing.",
      ),
    );
  }

  if (!scenario.scenarioPurpose) {
    warnings.push(
      warning(
        "DEMO_SCENARIO_PURPOSE_MISSING",
        "WARNING",
        "Demo scenario purpose is missing.",
      ),
    );
  }

  if (!scenario.targetBuyerContext) {
    warnings.push(
      warning(
        "TARGET_BUYER_CONTEXT_MISSING",
        "WARNING",
        "Target buyer context is missing.",
      ),
    );
  }

  return warnings;
}

function expectationWarnings(
  scenario: DemoScenarioSeed,
): DemoScenarioSeedWarning[] {
  const warnings: DemoScenarioSeedWarning[] = [];

  if (scenario.requestSeed === null || scenario.requestSeed === undefined) {
    warnings.push(
      warning("REQUEST_SEED_MISSING", "WARNING", "Request seed is missing."),
    );
  }

  if (
    scenario.policyAdmissionExpectation === null ||
    scenario.policyAdmissionExpectation === undefined
  ) {
    warnings.push(
      warning(
        "POLICY_ADMISSION_EXPECTATION_MISSING",
        "WARNING",
        "Policy/admission expectation is missing.",
      ),
    );
  }

  if (
    scenario.approvalExpectation === null ||
    scenario.approvalExpectation === undefined
  ) {
    warnings.push(
      warning(
        "APPROVAL_EXPECTATION_MISSING",
        "WARNING",
        "Approval expectation is missing.",
      ),
    );
  }

  if (
    scenario.investigationExpectation === null ||
    scenario.investigationExpectation === undefined
  ) {
    warnings.push(
      warning(
        "INVESTIGATION_EXPECTATION_MISSING",
        "WARNING",
        "Investigation expectation is missing.",
      ),
    );
  }

  if (
    scenario.auditExpectation === null ||
    scenario.auditExpectation === undefined
  ) {
    warnings.push(
      warning(
        "AUDIT_EXPECTATION_MISSING",
        "WARNING",
        "Audit expectation is missing.",
      ),
    );
  }

  if (
    scenario.auditExpectation?.expectedMoments === undefined ||
    scenario.auditExpectation.expectedMoments.length === 0
  ) {
    warnings.push(
      warning(
        "AUDIT_EXPECTED_MOMENTS_MISSING",
        "WARNING",
        "Expected audit moments are missing from the scenario.",
      ),
    );
  }

  if (
    scenario.auditExpectation?.missingMoments !== undefined &&
    scenario.auditExpectation.missingMoments.length > 0
  ) {
    warnings.push(
      warning(
        "INCOMPLETE_AUDIT_EVIDENCE",
        "WARNING",
        "Scenario intentionally contains missing audit evidence.",
      ),
    );
  }

  return warnings;
}

function routeWarnings(
  routeSequence: readonly DemoScenarioRouteStep[] | undefined,
): DemoScenarioSeedWarning[] {
  const warnings: DemoScenarioSeedWarning[] = [];

  if (routeSequence === undefined || routeSequence.length === 0) {
    return [
      warning(
        "ROUTE_SEQUENCE_MISSING",
        "WARNING",
        "Route sequence is missing from the demo scenario.",
      ),
    ];
  }

  const routePaths = new Set<string>();

  for (const step of routeSequence) {
    if (!step.kind || !supportedStepKinds.has(step.kind)) {
      warnings.push(
        warning(
          "UNSUPPORTED_STEP_KIND",
          "BLOCKER",
          "Route sequence includes an unsupported demo step kind.",
        ),
      );
    }

    if (!step.route || !allowedRoutes.has(step.route)) {
      warnings.push(
        warning(
          "INVALID_ROUTE_PATH",
          "BLOCKER",
          "Route sequence includes a path outside the controlled MYCELIA demo routes.",
        ),
      );
    } else {
      routePaths.add(step.route);
    }
  }

  for (const requiredRoute of requiredRoutePaths) {
    if (!routePaths.has(requiredRoute)) {
      warnings.push(
        warning(
          "REQUIRED_ROUTE_MISSING",
          "WARNING",
          "Route sequence does not include every controlled demo surface.",
        ),
      );
    }
  }

  return warnings;
}

function declaredStatusWarnings(
  status: DemoScenarioSeed["demoReadinessStatus"],
): DemoScenarioSeedWarning[] {
  if (status === "DEMO_SCENARIO_INCOMPLETE") {
    return [
      warning(
        "DECLARED_INCOMPLETE",
        "WARNING",
        "Scenario is explicitly marked incomplete for demo review.",
      ),
    ];
  }

  if (status === "DEMO_SCENARIO_BLOCKED") {
    return [
      warning(
        "DECLARED_BLOCKED",
        "BLOCKER",
        "Scenario is explicitly marked blocked.",
      ),
    ];
  }

  if (status === "DEMO_SCENARIO_FAILED_SAFE") {
    return [
      warning(
        "DECLARED_FAILED_SAFE",
        "BLOCKER",
        "Scenario is explicitly marked failed safe.",
      ),
    ];
  }

  return [];
}

function statusForWarnings(
  warnings: readonly DemoScenarioSeedWarning[],
): DemoScenarioSeedStatus {
  if (
    warnings.some((item) =>
      item.code === "UNSAFE_RAW_FIELD_NAME" ||
      item.code === "DEMO_SCENARIO_SCHEMA_INVALID" ||
      item.code === "DECLARED_FAILED_SAFE"
    )
  ) {
    return "DEMO_SCENARIO_FAILED_SAFE";
  }

  if (warnings.some((item) => item.severity === "BLOCKER")) {
    return "DEMO_SCENARIO_BLOCKED";
  }

  if (warnings.some((item) => item.severity === "WARNING")) {
    return "DEMO_SCENARIO_INCOMPLETE";
  }

  return "DEMO_SCENARIO_READY";
}

function summaryOrFallback(
  value: string | null | undefined,
  fallback: string,
): string {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return value;
}

function scenarioSummary(scenario: DemoScenarioSeed): string {
  const name = summaryOrFallback(
    scenario.scenarioName,
    "Unnamed demo scenario",
  );
  const purpose = summaryOrFallback(
    scenario.scenarioPurpose,
    "No safe scenario purpose was supplied.",
  );

  return `${name}: ${purpose}`;
}

function routeSequenceFor(
  scenario: DemoScenarioSeed,
): readonly DemoScenarioRouteStep[] {
  return scenario.routeSequence ?? [];
}

function normalizePresenterNotes(
  scenario: DemoScenarioSeed,
): readonly string[] {
  if (scenario.presenterNotes !== undefined && scenario.presenterNotes.length > 0) {
    return scenario.presenterNotes;
  }

  return ["No presenter notes were supplied for this scenario."];
}

function normalizeNextSteps(scenario: DemoScenarioSeed): readonly string[] {
  if (scenario.nextSteps !== undefined && scenario.nextSteps.length > 0) {
    return scenario.nextSteps;
  }

  return [
    "Complete missing scenario expectations before using this seed in a demo.",
  ];
}

function presentValidScenario(
  scenario: DemoScenarioSeed,
  warnings: readonly DemoScenarioSeedWarning[],
): DemoScenarioSeedPresentedModel {
  const status = statusForWarnings(warnings);

  return {
    phase: DEMO_SCENARIO_SEED_PACKAGE_PHASE,
    name: DEMO_SCENARIO_SEED_PACKAGE_NAME,
    status,
    requiredFields: DemoScenarioSeedRequiredFields,
    stepKinds: DemoScenarioSeedStepKinds,
    allowedRoutes: DemoScenarioSeedAllowedRoutes,
    scenario,
    scenarioSummary: scenarioSummary(scenario),
    routeSequence: routeSequenceFor(scenario),
    requestSeedSummary: summaryOrFallback(
      scenario.requestSeed?.safeSummary,
      "Request seed summary is missing.",
    ),
    policyAdmissionSummary: summaryOrFallback(
      scenario.policyAdmissionExpectation?.safeSummary,
      "Policy/admission expectation summary is missing.",
    ),
    approvalSummary: summaryOrFallback(
      scenario.approvalExpectation?.safeSummary,
      "Approval expectation summary is missing.",
    ),
    auditSummary: summaryOrFallback(
      scenario.auditExpectation?.safeSummary,
      "Audit expectation summary is missing.",
    ),
    investigationSummary: summaryOrFallback(
      scenario.investigationExpectation?.safeSummary,
      "Investigation expectation summary is missing.",
    ),
    presenterNotes: normalizePresenterNotes(scenario),
    safetyWarnings: warnings,
    nextSteps: normalizeNextSteps(scenario),
  };
}

function failedSafeModel(
  reason: DemoScenarioSeedWarning,
): DemoScenarioSeedPresentedModel {
  return presentValidScenario(failedSafeScenario, [reason]);
}

export function presentDemoScenarioSeed(
  input: unknown = DEFAULT_DEMO_SCENARIO_SEED,
): DemoScenarioSeedPresentedModel {
  const unsafeKeys = unsafeFieldNames(input);

  if (unsafeKeys.length > 0) {
    return failedSafeModel(
      warning(
        "UNSAFE_RAW_FIELD_NAME",
        "BLOCKER",
        "Unsafe raw-content-like field names are not accepted.",
      ),
    );
  }

  const parsed = DemoScenarioSeedSchema.safeParse(input);

  if (!parsed.success) {
    return failedSafeModel(
      warning(
        "DEMO_SCENARIO_SCHEMA_INVALID",
        "BLOCKER",
        "Demo scenario seed could not be normalized safely.",
      ),
    );
  }

  const scenario = parsed.data;
  const warnings = [
    ...(scenario.safetyWarnings ?? []),
    ...missingCoreWarnings(scenario),
    ...expectationWarnings(scenario),
    ...routeWarnings(scenario.routeSequence),
    ...declaredStatusWarnings(scenario.demoReadinessStatus),
  ];

  return presentValidScenario(scenario, warnings);
}
