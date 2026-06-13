import { describe, expect, it } from "vitest";

import {
  assertDemoScenarioFixtureManifestValid,
  assertDemoScenarioFixtureValid,
  createDemoScenarioFixtureDenial,
  failClosedDemoScenarioFixture,
  validateDemoScenarioFixture,
  validateDemoScenarioFixtureKind,
  validateDemoScenarioFixtureManifest,
} from ".";
import type { DemoScenarioInput } from "../demo-scenario";
import type { DemoScenarioFixtureInput } from "./demo-scenario-fixture";
import type { DemoScenarioFixtureManifestInput } from "./demo-scenario-fixture-manifest";

function validScenario(
  overrides: Partial<DemoScenarioInput> = {},
): DemoScenarioInput {
  return {
    demo_scenario_id: "demo_scenario_001",
    tenant_id: "tenant_001",
    workspace_id: "workspace_001",
    project_id: "project_001",
    kind: "GOVERNED_OPERATION_HAPPY_PATH",
    title: "Governed operation demo",
    description: "Safe descriptor story for a governed operation.",
    steps: [
      {
        demo_scenario_step_id: "demo_scenario_step_001",
        tenant_id: "tenant_001",
        step_order: 1,
        step_kind: "REQUEST_RECEIVED",
        title: "Request received",
        description: "Safe request descriptor.",
        descriptor_ref: "request_descriptor_001",
        data_classification: "INTERNAL",
        occurred_at: "2026-06-01T00:01:00.000Z",
        correlation_id: "correlation_001",
        causation_id: "causation_001",
        source_event_id: "event_001",
        metadata: {
          descriptor: "only",
        },
      },
      {
        demo_scenario_step_id: "demo_scenario_step_002",
        tenant_id: "tenant_001",
        step_order: 2,
        step_kind: "REPLAY_PLAN_PREPARED",
        title: "Descriptor prepared",
        description: "Safe planning descriptor.",
        descriptor_ref: "plan_descriptor_001",
        data_classification: "INTERNAL",
        occurred_at: "2026-06-01T00:02:00.000Z",
        correlation_id: "correlation_001",
        causation_id: "causation_001",
        source_event_id: "event_001",
        metadata: {
          descriptor: "only",
        },
      },
    ],
    links: [
      {
        demo_scenario_link_id: "demo_scenario_link_001",
        tenant_id: "tenant_001",
        from_step_id: "demo_scenario_step_001",
        to_step_id: "demo_scenario_step_002",
        link_kind: "PREPARES_NEXT",
        reason_code: "DEMO_STEP_PREPARES_NEXT",
        data_classification: "INTERNAL",
        metadata: {
          descriptor: "only",
        },
      },
    ],
    data_classification: "INTERNAL",
    created_at: "2026-06-01T00:03:00.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validFixture(
  overrides: Partial<DemoScenarioFixtureInput> = {},
): DemoScenarioFixtureInput {
  return {
    demo_scenario_fixture_id: "demo_scenario_fixture_001",
    tenant_id: "tenant_001",
    workspace_id: "workspace_001",
    project_id: "project_001",
    fixture_kind: "GOVERNED_OPERATION_HAPPY_PATH_FIXTURE",
    title: "Governed operation fixture",
    description: "Safe fixture descriptor.",
    scenario: validScenario(),
    expected_scenario_kind: "GOVERNED_OPERATION_HAPPY_PATH",
    data_classification: "INTERNAL",
    created_at: "2026-06-01T00:04:00.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validManifest(
  overrides: Partial<DemoScenarioFixtureManifestInput> = {},
): DemoScenarioFixtureManifestInput {
  return {
    demo_scenario_fixture_manifest_id:
      "demo_scenario_fixture_manifest_001",
    tenant_id: "tenant_001",
    fixtures: [validFixture()],
    manifest_version: 1,
    data_classification: "INTERNAL",
    created_at: "2026-06-01T00:05:00.000Z",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

describe("DemoScenarioFixture", () => {
  it("accepts a valid governed operation fixture with embedded DemoScenario", () => {
    const result = validateDemoScenarioFixture(validFixture());

    expect(result.ok).toBe(true);
    expect(assertDemoScenarioFixtureValid(validFixture()).ok).toBe(true);
    if (result.ok) {
      expect(result.value.fixture_kind).toBe(
        "GOVERNED_OPERATION_HAPPY_PATH_FIXTURE",
      );
      expect(result.value.scenario?.kind).toBe(
        "GOVERNED_OPERATION_HAPPY_PATH",
      );
    }
  });

  it("accepts a valid replay planning fixture with opaque scenario_ref", () => {
    const result = validateDemoScenarioFixture(
      validFixture({
        demo_scenario_fixture_id: "demo_scenario_fixture_replay_001",
        fixture_kind: "REPLAY_PLANNING_FIXTURE",
        title: "Replay planning fixture",
        description: "Safe replay planning descriptor.",
        scenario: undefined,
        scenario_ref: "demo_scenario_replay_ref_001",
        expected_scenario_kind: "REPLAY_PLANNING_PATH",
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.scenario).toBeUndefined();
      expect(result.value.scenario_ref).toBe("demo_scenario_replay_ref_001");
    }
  });

  it("rejects missing tenant_id", () => {
    const fixture = validFixture() as Record<string, unknown>;
    delete fixture.tenant_id;
    fixture.metadata = {
      display: "alice@example.com",
    };

    const result = validateDemoScenarioFixture(fixture);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects project_id without workspace_id", () => {
    const result = validateDemoScenarioFixture(
      validFixture({
        workspace_id: undefined,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_SCENARIO_FIXTURE_SCOPE_INVALID",
      );
    }
  });

  it("rejects invalid fixture kind", () => {
    expect(validateDemoScenarioFixtureKind("NOT_A_FIXTURE").ok).toBe(false);

    const fixture = validFixture() as Record<string, unknown>;
    fixture.fixture_kind = "EXECUTABLE_FIXTURE";

    const result = validateDemoScenarioFixture(fixture);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_SCENARIO_FIXTURE_KIND_INVALID",
      );
    }
  });

  it("rejects missing both scenario and scenario_ref", () => {
    const result = validateDemoScenarioFixture(
      validFixture({
        scenario: undefined,
        scenario_ref: undefined,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_SCENARIO_FIXTURE_SCENARIO_REQUIRED",
      );
    }
  });

  it("rejects embedded scenario tenant mismatch", () => {
    const result = validateDemoScenarioFixture(
      validFixture({
        scenario: validScenario({
          tenant_id: "tenant_002",
          steps: [
            {
              ...validScenario().steps[0],
              tenant_id: "tenant_002",
            },
          ],
          links: [],
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_SCENARIO_FIXTURE_SCENARIO_TENANT_MISMATCH",
      );
    }
  });

  it("rejects embedded scenario kind mismatch", () => {
    const result = validateDemoScenarioFixture(
      validFixture({
        scenario: validScenario({
          kind: "REPLAY_PLANNING_PATH",
        }),
        expected_scenario_kind: "GOVERNED_OPERATION_HAPPY_PATH",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_SCENARIO_FIXTURE_SCENARIO_KIND_MISMATCH",
      );
    }
  });

  it("rejects unsafe scenario_ref values", () => {
    const unsafeRefs = [
      "https://example.test/scenario",
      "C:\\fixture\\scenario",
      "token_fixture_ref",
      "credential_fixture_ref",
      "select * from scenario",
      "connection_string_001",
      "fixture_ref && run",
    ];

    for (const scenario_ref of unsafeRefs) {
      const result = validateDemoScenarioFixture(
        validFixture({
          scenario: undefined,
          scenario_ref,
        }),
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(
          "DEMO_SCENARIO_FIXTURE_SCENARIO_REF_INVALID",
        );
      }
    }
  });

  it("rejects unsafe title and description", () => {
    const unsafeTitle = validateDemoScenarioFixture(
      validFixture({
        title: "Fixture secret token",
      }),
    );
    const unsafeDescription = validateDemoScenarioFixture(
      validFixture({
        description: "Descriptor reveals replay_internals.",
      }),
    );

    expect(unsafeTitle.ok).toBe(false);
    if (!unsafeTitle.ok) {
      expect(unsafeTitle.error.code).toBe(
        "UNSAFE_DEMO_SCENARIO_FIXTURE_TEXT",
      );
    }

    expect(unsafeDescription.ok).toBe(false);
    if (!unsafeDescription.ok) {
      expect(unsafeDescription.error.code).toBe(
        "UNSAFE_DEMO_SCENARIO_FIXTURE_TEXT",
      );
    }
  });

  it("rejects invalid expected_scenario_kind", () => {
    const fixture = validFixture() as Record<string, unknown>;
    fixture.expected_scenario_kind = "NOT_A_SCENARIO_KIND";

    const result = validateDemoScenarioFixture(fixture);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_SCENARIO_FIXTURE_EXPECTED_KIND_INVALID",
      );
    }
  });

  it("rejects invalid created_at", () => {
    const result = validateDemoScenarioFixture(
      validFixture({
        created_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INVALID_DEMO_SCENARIO_FIXTURE_TIMESTAMP",
      );
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateDemoScenarioFixture(
      validFixture({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "UNSAFE_DEMO_SCENARIO_FIXTURE_METADATA",
      );
    }
  });

  it("accepts a valid fixture manifest", () => {
    const result = validateDemoScenarioFixtureManifest(validManifest());

    expect(result.ok).toBe(true);
    expect(assertDemoScenarioFixtureManifestValid(validManifest()).ok).toBe(
      true,
    );
    if (result.ok) {
      expect(result.value.fixtures).toHaveLength(1);
      expect(result.value.manifest_version).toBe(1);
    }
  });

  it("rejects empty fixture manifest", () => {
    const result = validateDemoScenarioFixtureManifest(
      validManifest({
        fixtures: [],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_SCENARIO_FIXTURE_MANIFEST_FIXTURES_REQUIRED",
      );
    }
  });

  it("rejects manifest tenant mismatch", () => {
    const result = validateDemoScenarioFixtureManifest(
      validManifest({
        fixtures: [
          validFixture({
            demo_scenario_fixture_id: "demo_scenario_fixture_002",
            tenant_id: "tenant_002",
            scenario: validScenario({
              tenant_id: "tenant_002",
              steps: [
                {
                  ...validScenario().steps[0],
                  tenant_id: "tenant_002",
                },
              ],
              links: [],
            }),
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_SCENARIO_FIXTURE_MANIFEST_TENANT_MISMATCH",
      );
    }
  });

  it("rejects non-positive manifest_version", () => {
    const result = validateDemoScenarioFixtureManifest(
      validManifest({
        manifest_version: 0,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_SCENARIO_FIXTURE_MANIFEST_VERSION_INVALID",
      );
    }
  });

  it("rejects duplicate fixture ID", () => {
    const result = validateDemoScenarioFixtureManifest(
      validManifest({
        fixtures: [
          validFixture(),
          validFixture({
            scenario: validScenario({
              demo_scenario_id: "demo_scenario_002",
            }),
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_SCENARIO_FIXTURE_DUPLICATE_ID");
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const fixture = validFixture() as Record<string, unknown>;
    delete fixture.tenant_id;
    fixture.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateDemoScenarioFixture(fixture);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("keeps fixtures descriptor-only without seed data, execution, replay, persistence, events, UI or tools", () => {
    const result = validateDemoScenarioFixture(validFixture());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty("seed_data");
      expect(result.value).not.toHaveProperty("execute");
      expect(result.value).not.toHaveProperty("executed_at");
      expect(result.value).not.toHaveProperty("simulation_result");
      expect(result.value).not.toHaveProperty("persisted_at");
      expect(result.value).not.toHaveProperty("emitted_event_id");
      expect(result.value).not.toHaveProperty("ui_component");
      expect(result.value).not.toHaveProperty("tool_invocation_id");
    }
  });

  it("fails closed for malformed or missing fixtures", () => {
    const missing = validateDemoScenarioFixture(undefined);
    const malformed = validateDemoScenarioFixture({
      demo_scenario_fixture_id: "demo_scenario_fixture_001",
    });
    const failClosed = failClosedDemoScenarioFixture();

    expect(missing.ok).toBe(false);
    expect(malformed.ok).toBe(false);
    expect(failClosed.code).toBe("DEMO_SCENARIO_FIXTURE_NOT_VALID");
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createDemoScenarioFixtureDenial({
      code: "DEMO_SCENARIO_FIXTURE_INVALID",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("scenario_internals");
    expect(serialized).not.toContain("fixture_internals");
    expect(serialized).not.toContain("policy_internals");
    expect(serialized).not.toContain("audit_internals");
    expect(serialized).not.toContain("replay_internals");
    expect(serialized).not.toContain("descriptor_internals");
    expect(serialized).not.toContain("secret-token");
  });
});
