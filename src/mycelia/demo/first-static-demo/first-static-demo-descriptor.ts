import {
  err,
  ok,
  type Result,
} from "../../foundation/shared-kernel";
import {
  validateDemoScenario,
  type DemoScenario,
  type DemoScenarioDenial,
  type DemoScenarioInput,
  type DemoScenarioLinkInput,
  type DemoScenarioStepInput,
} from "../../domain-contracts/demo-scenario";
import {
  validateDemoScenarioFixture,
  validateDemoScenarioFixtureManifest,
  type DemoScenarioFixture,
  type DemoScenarioFixtureDenial,
  type DemoScenarioFixtureInput,
  type DemoScenarioFixtureManifest,
  type DemoScenarioFixtureManifestInput,
} from "../../domain-contracts/demo-scenario-fixture";
import {
  validateDemoReadinessReport,
  type DemoReadinessDenial,
  type DemoReadinessFindingInput,
  type DemoReadinessReport,
  type DemoReadinessReportInput,
} from "../../domain-contracts/demo-readiness-report";
import {
  validateStaticDemoArtifact,
  type StaticDemoArtifact,
  type StaticDemoArtifactDenial,
  type StaticDemoArtifactInput,
  type StaticDemoArtifactSectionInput,
} from "../../domain-contracts/static-demo-artifact";

const TENANT_ID = "tenant_demo_public_001";
const WORKSPACE_ID = "workspace_demo_public_001";
const PROJECT_ID = "project_demo_public_001";
const CORRELATION_ID = "correlation_demo_public_001";
const CAUSATION_ID = "causation_demo_public_001";
const SOURCE_EVENT_ID = "event_demo_public_001";

const SCENARIO_STEP_KINDS = [
  "REQUEST_RECEIVED",
  "IDENTITY_RESOLVED",
  "POLICY_DECIDED",
  "RUNTIME_ENVELOPE_PREPARED",
  "ADMISSION_DECIDED",
  "GOVERNED_RUN_REGISTERED",
  "RUNTIME_STATE_DESCRIBED",
  "STATE_TRANSITION_VALIDATED",
  "AUDIT_RECORD_PREPARED",
  "AUDIT_TIMELINE_DESCRIBED",
  "INVESTIGATION_BUNDLE_PREPARED",
  "REPLAY_PLAN_PREPARED",
] as const;

const SCENARIO_STEP_TEXT: ReadonlyArray<{
  readonly title: string;
  readonly description: string;
  readonly descriptor_ref: string;
}> = [
  {
    title: "Request received",
    description: "A safe operational request descriptor is received.",
    descriptor_ref: "request_descriptor_demo_public_001",
  },
  {
    title: "Identity resolved",
    description: "A runtime identity descriptor is associated.",
    descriptor_ref: "identity_descriptor_demo_public_001",
  },
  {
    title: "Policy decided",
    description: "A policy decision descriptor allows review.",
    descriptor_ref: "policy_decision_descriptor_demo_public_001",
  },
  {
    title: "Envelope prepared",
    description: "A runtime envelope descriptor is prepared.",
    descriptor_ref: "runtime_envelope_descriptor_demo_public_001",
  },
  {
    title: "Admission decided",
    description: "A runtime admission descriptor is accepted.",
    descriptor_ref: "admission_descriptor_demo_public_001",
  },
  {
    title: "Run registered",
    description: "A governed run shell descriptor is registered.",
    descriptor_ref: "governed_run_descriptor_demo_public_001",
  },
  {
    title: "State described",
    description: "A runtime state descriptor captures the shell.",
    descriptor_ref: "runtime_state_descriptor_demo_public_001",
  },
  {
    title: "Transition validated",
    description: "A transition descriptor is validated.",
    descriptor_ref: "transition_descriptor_demo_public_001",
  },
  {
    title: "Audit prepared",
    description: "Audit record descriptors are prepared.",
    descriptor_ref: "audit_record_descriptor_demo_public_001",
  },
  {
    title: "Timeline described",
    description: "An audit timeline descriptor is described.",
    descriptor_ref: "audit_timeline_descriptor_demo_public_001",
  },
  {
    title: "Investigation prepared",
    description: "An investigation bundle descriptor is prepared.",
    descriptor_ref: "investigation_bundle_descriptor_demo_public_001",
  },
  {
    title: "Replay plan prepared",
    description: "A replay plan descriptor is prepared.",
    descriptor_ref: "replay_plan_descriptor_demo_public_001",
  },
];

function staticMetadata() {
  return {
    descriptor: "only",
    static: true,
  };
}

function scenarioStep(
  index: number,
): DemoScenarioStepInput {
  const order = index + 1;
  const text = SCENARIO_STEP_TEXT[index];

  return {
    demo_scenario_step_id: `first_static_demo_step_${String(order).padStart(
      2,
      "0",
    )}`,
    tenant_id: TENANT_ID,
    step_order: order,
    step_kind: SCENARIO_STEP_KINDS[index],
    title: text.title,
    description: text.description,
    descriptor_ref: text.descriptor_ref,
    data_classification: "PUBLIC",
    occurred_at: `2026-06-01T00:${String(order).padStart(2, "0")}:00.000Z`,
    correlation_id: CORRELATION_ID,
    causation_id: CAUSATION_ID,
    source_event_id: SOURCE_EVENT_ID,
    metadata: staticMetadata(),
  };
}

function scenarioLink(
  fromOrder: number,
  toOrder: number,
): DemoScenarioLinkInput {
  return {
    demo_scenario_link_id: `first_static_demo_link_${String(
      fromOrder,
    ).padStart(2, "0")}_${String(toOrder).padStart(2, "0")}`,
    tenant_id: TENANT_ID,
    from_step_id: `first_static_demo_step_${String(fromOrder).padStart(
      2,
      "0",
    )}`,
    to_step_id: `first_static_demo_step_${String(toOrder).padStart(
      2,
      "0",
    )}`,
    link_kind: "PREPARES_NEXT",
    reason_code: "DEMO_STEP_PREPARES_NEXT",
    data_classification: "PUBLIC",
    metadata: staticMetadata(),
  };
}

export const firstStaticDemoScenario: DemoScenarioInput = {
  demo_scenario_id: "first_static_demo_scenario_001",
  tenant_id: TENANT_ID,
  workspace_id: WORKSPACE_ID,
  project_id: PROJECT_ID,
  kind: "GOVERNED_OPERATION_HAPPY_PATH",
  title: "Governed operation demo",
  description: "A safe static story for a governed operation.",
  steps: SCENARIO_STEP_KINDS.map((_, index) => scenarioStep(index)),
  links: SCENARIO_STEP_KINDS.slice(1).map((_, index) =>
    scenarioLink(index + 1, index + 2),
  ),
  data_classification: "PUBLIC",
  created_at: "2026-06-01T00:13:00.000Z",
  correlation_id: CORRELATION_ID,
  causation_id: CAUSATION_ID,
  source_event_id: SOURCE_EVENT_ID,
  metadata: staticMetadata(),
};

export const firstStaticDemoFixture: DemoScenarioFixtureInput = {
  demo_scenario_fixture_id: "first_static_demo_fixture_001",
  tenant_id: TENANT_ID,
  workspace_id: WORKSPACE_ID,
  project_id: PROJECT_ID,
  fixture_kind: "GOVERNED_OPERATION_HAPPY_PATH_FIXTURE",
  title: "Governed operation fixture",
  description: "Safe descriptor fixture for the static story.",
  scenario: firstStaticDemoScenario,
  expected_scenario_kind: "GOVERNED_OPERATION_HAPPY_PATH",
  data_classification: "PUBLIC",
  created_at: "2026-06-01T00:14:00.000Z",
  correlation_id: CORRELATION_ID,
  causation_id: CAUSATION_ID,
  source_event_id: SOURCE_EVENT_ID,
  metadata: staticMetadata(),
};

export const firstStaticDemoFixtureManifest:
  DemoScenarioFixtureManifestInput = {
    demo_scenario_fixture_manifest_id:
      "first_static_demo_fixture_manifest_001",
    tenant_id: TENANT_ID,
    fixtures: [firstStaticDemoFixture],
    manifest_version: 1,
    data_classification: "PUBLIC",
    created_at: "2026-06-01T00:15:00.000Z",
    metadata: staticMetadata(),
  };

const firstStaticDemoReadinessFindings:
  readonly DemoReadinessFindingInput[] = [
    {
      demo_readiness_finding_id: "first_static_demo_finding_001",
      tenant_id: TENANT_ID,
      severity: "INFO",
      finding_code: "DEMO_DESCRIPTOR_CHAIN_READY",
      message: "Descriptor chain validates successfully.",
      data_classification: "PUBLIC",
      observed_at: "2026-06-01T00:16:00.000Z",
      descriptor_ref: "first_static_demo_fixture_manifest_001",
      metadata: staticMetadata(),
    },
    {
      demo_readiness_finding_id: "first_static_demo_finding_002",
      tenant_id: TENANT_ID,
      severity: "INFO",
      finding_code: "DEMO_READY_DESCRIPTOR_ONLY",
      message:
        "Ready means descriptor level readiness, not execution or deployment.",
      data_classification: "PUBLIC",
      observed_at: "2026-06-01T00:17:00.000Z",
      descriptor_ref: "first_static_demo_artifact_001",
      metadata: staticMetadata(),
    },
    {
      demo_readiness_finding_id: "first_static_demo_finding_003",
      tenant_id: TENANT_ID,
      severity: "INFO",
      finding_code: "DEMO_STATIC_LIMITS_CONFIRMED",
      message:
        "Static descriptor has no rendering, persistence, export, or deployment.",
      data_classification: "PUBLIC",
      observed_at: "2026-06-01T00:18:00.000Z",
      descriptor_ref: "first_static_demo_artifact_001",
      metadata: staticMetadata(),
    },
  ];

export const firstStaticDemoReadinessReport: DemoReadinessReportInput = {
  demo_readiness_report_id: "first_static_demo_readiness_report_001",
  tenant_id: TENANT_ID,
  workspace_id: WORKSPACE_ID,
  project_id: PROJECT_ID,
  status: "READY",
  subject_kind: "DEMO_SCENARIO_FIXTURE_MANIFEST",
  manifest: firstStaticDemoFixtureManifest,
  findings: [...firstStaticDemoReadinessFindings],
  data_classification: "PUBLIC",
  generated_at: "2026-06-01T00:19:00.000Z",
  correlation_id: CORRELATION_ID,
  causation_id: CAUSATION_ID,
  source_event_id: SOURCE_EVENT_ID,
  metadata: staticMetadata(),
};

const firstStaticDemoArtifactSections:
  readonly StaticDemoArtifactSectionInput[] = [
    {
      static_demo_artifact_section_id:
        "first_static_demo_artifact_section_001",
      tenant_id: TENANT_ID,
      section_order: 1,
      section_kind: "SCENARIO_OVERVIEW",
      title: "Scenario overview",
      summary: "A safe governed operation story is presented.",
      descriptor_ref: "first_static_demo_scenario_001",
      data_classification: "PUBLIC",
      metadata: staticMetadata(),
    },
    {
      static_demo_artifact_section_id:
        "first_static_demo_artifact_section_002",
      tenant_id: TENANT_ID,
      section_order: 2,
      section_kind: "FIXTURE_SUMMARY",
      title: "Fixture summary",
      summary: "The fixture manifest groups one safe scenario.",
      descriptor_ref: "first_static_demo_fixture_manifest_001",
      data_classification: "PUBLIC",
      metadata: staticMetadata(),
    },
    {
      static_demo_artifact_section_id:
        "first_static_demo_artifact_section_003",
      tenant_id: TENANT_ID,
      section_order: 3,
      section_kind: "READINESS_SUMMARY",
      title: "Readiness summary",
      summary: "Readiness is confirmed at descriptor level.",
      descriptor_ref: "first_static_demo_readiness_report_001",
      data_classification: "PUBLIC",
      metadata: staticMetadata(),
    },
    {
      static_demo_artifact_section_id:
        "first_static_demo_artifact_section_004",
      tenant_id: TENANT_ID,
      section_order: 4,
      section_kind: "GOVERNANCE_TRACE",
      title: "Governance trace",
      summary: "Policy and admission descriptors explain governance.",
      descriptor_ref: "policy_decision_descriptor_demo_public_001",
      data_classification: "PUBLIC",
      metadata: staticMetadata(),
    },
    {
      static_demo_artifact_section_id:
        "first_static_demo_artifact_section_005",
      tenant_id: TENANT_ID,
      section_order: 5,
      section_kind: "AUDIT_TRACE",
      title: "Audit trace",
      summary: "Audit and timeline descriptors explain evidence.",
      descriptor_ref: "audit_timeline_descriptor_demo_public_001",
      data_classification: "PUBLIC",
      metadata: staticMetadata(),
    },
    {
      static_demo_artifact_section_id:
        "first_static_demo_artifact_section_006",
      tenant_id: TENANT_ID,
      section_order: 6,
      section_kind: "REPLAY_PLAN_SUMMARY",
      title: "Replay plan summary",
      summary: "Replay planning is represented by descriptors only.",
      descriptor_ref: "replay_plan_descriptor_demo_public_001",
      data_classification: "PUBLIC",
      metadata: staticMetadata(),
    },
    {
      static_demo_artifact_section_id:
        "first_static_demo_artifact_section_007",
      tenant_id: TENANT_ID,
      section_order: 7,
      section_kind: "LIMITATIONS_AND_NON_GOALS",
      title: "Limitations and non goals",
      summary:
        "No runtime execution, replay simulation, persistence, UI rendering, export, tool calls, or external service calls.",
      descriptor_ref: "first_static_demo_limitations_001",
      data_classification: "PUBLIC",
      metadata: staticMetadata(),
    },
  ];

export const firstStaticDemoArtifact: StaticDemoArtifactInput = {
  static_demo_artifact_id: "first_static_demo_artifact_001",
  tenant_id: TENANT_ID,
  workspace_id: WORKSPACE_ID,
  project_id: PROJECT_ID,
  artifact_kind: "EXECUTIVE_WALKTHROUGH",
  exposure: "CUSTOMER_SAFE",
  title: "First static demo artifact",
  summary: "A customer safe static descriptor for MYCELIA.",
  fixture_manifest: firstStaticDemoFixtureManifest,
  readiness_report: firstStaticDemoReadinessReport,
  sections: [...firstStaticDemoArtifactSections],
  data_classification: "PUBLIC",
  created_at: "2026-06-01T00:20:00.000Z",
  correlation_id: CORRELATION_ID,
  causation_id: CAUSATION_ID,
  source_event_id: SOURCE_EVENT_ID,
  metadata: staticMetadata(),
};

export type FirstStaticDemoDescriptorSet = {
  readonly scenario: DemoScenario;
  readonly fixture: DemoScenarioFixture;
  readonly fixture_manifest: DemoScenarioFixtureManifest;
  readonly readiness_report: DemoReadinessReport;
  readonly static_demo_artifact: StaticDemoArtifact;
};

export type FirstStaticDemoDescriptorValidationError = {
  readonly stage:
    | "DEMO_SCENARIO"
    | "DEMO_SCENARIO_FIXTURE"
    | "DEMO_SCENARIO_FIXTURE_MANIFEST"
    | "DEMO_READINESS_REPORT"
    | "STATIC_DEMO_ARTIFACT";
  readonly error:
    | DemoScenarioDenial
    | DemoScenarioFixtureDenial
    | DemoReadinessDenial
    | StaticDemoArtifactDenial;
};

export function validateFirstStaticDemoDescriptors(): Result<
  FirstStaticDemoDescriptorSet,
  FirstStaticDemoDescriptorValidationError
> {
  const scenario = validateDemoScenario(firstStaticDemoScenario);

  if (!scenario.ok) {
    return err({ stage: "DEMO_SCENARIO", error: scenario.error });
  }

  const fixture = validateDemoScenarioFixture(firstStaticDemoFixture);

  if (!fixture.ok) {
    return err({ stage: "DEMO_SCENARIO_FIXTURE", error: fixture.error });
  }

  const fixtureManifest = validateDemoScenarioFixtureManifest(
    firstStaticDemoFixtureManifest,
  );

  if (!fixtureManifest.ok) {
    return err({
      stage: "DEMO_SCENARIO_FIXTURE_MANIFEST",
      error: fixtureManifest.error,
    });
  }

  const readinessReport = validateDemoReadinessReport(
    firstStaticDemoReadinessReport,
  );

  if (!readinessReport.ok) {
    return err({
      stage: "DEMO_READINESS_REPORT",
      error: readinessReport.error,
    });
  }

  const staticDemoArtifact = validateStaticDemoArtifact(
    firstStaticDemoArtifact,
  );

  if (!staticDemoArtifact.ok) {
    return err({
      stage: "STATIC_DEMO_ARTIFACT",
      error: staticDemoArtifact.error,
    });
  }

  return ok({
    scenario: scenario.value,
    fixture: fixture.value,
    fixture_manifest: fixtureManifest.value,
    readiness_report: readinessReport.value,
    static_demo_artifact: staticDemoArtifact.value,
  });
}
