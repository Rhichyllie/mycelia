import { describe, expect, it } from "vitest";

import {
  assertDemoScenarioValid,
  createDemoScenarioDenial,
  failClosedDemoScenario,
  isDemoScenarioOrdered,
  validateDemoScenario,
  validateDemoScenarioKind,
  validateDemoScenarioLink,
  validateDemoScenarioStep,
} from ".";
import type { DemoScenarioInput } from "./demo-scenario";
import type { DemoScenarioLinkInput } from "./demo-scenario-link";
import type { DemoScenarioStepInput } from "./demo-scenario-step";

const STEP_KINDS = [
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

function validStep(
  order: number,
  overrides: Partial<DemoScenarioStepInput> = {},
): DemoScenarioStepInput {
  const stepKind = STEP_KINDS[order - 1] ?? "REPLAY_PLAN_PREPARED";

  return {
    demo_scenario_step_id: `demo_scenario_step_${order}`,
    tenant_id: "tenant_001",
    step_order: order,
    step_kind: stepKind,
    title: `Demo step ${order}`,
    description: `Safe descriptor summary ${order}.`,
    descriptor_ref: `descriptor_ref_${order}`,
    data_classification: "INTERNAL",
    occurred_at: `2026-06-01T00:${String(order).padStart(2, "0")}:00.000Z`,
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validLink(
  fromOrder: number,
  toOrder: number,
  overrides: Partial<DemoScenarioLinkInput> = {},
): DemoScenarioLinkInput {
  return {
    demo_scenario_link_id: `demo_scenario_link_${fromOrder}_${toOrder}`,
    tenant_id: "tenant_001",
    from_step_id: `demo_scenario_step_${fromOrder}`,
    to_step_id: `demo_scenario_step_${toOrder}`,
    link_kind: "PREPARES_NEXT",
    reason_code: "DEMO_STEP_PREPARES_NEXT",
    data_classification: "INTERNAL",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function governedOperationSteps(): DemoScenarioStepInput[] {
  return STEP_KINDS.map((_, index) => validStep(index + 1));
}

function governedOperationLinks(): DemoScenarioLinkInput[] {
  return STEP_KINDS.slice(1).map((_, index) =>
    validLink(index + 1, index + 2),
  );
}

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
    steps: governedOperationSteps(),
    links: governedOperationLinks(),
    data_classification: "INTERNAL",
    created_at: "2026-06-01T00:20:00.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

describe("DemoScenario", () => {
  it("accepts a valid governed operation happy path scenario", () => {
    const result = validateDemoScenario(validScenario());

    expect(result.ok).toBe(true);
    expect(assertDemoScenarioValid(validScenario()).ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("GOVERNED_OPERATION_HAPPY_PATH");
      expect(result.value.steps).toHaveLength(12);
      expect(result.value.links).toHaveLength(11);
    }
  });

  it("accepts a valid replay planning scenario", () => {
    const result = validateDemoScenario(
      validScenario({
        demo_scenario_id: "demo_scenario_replay_001",
        kind: "REPLAY_PLANNING_PATH",
        title: "Replay planning demo",
        description: "Safe descriptor story for replay planning.",
        steps: [
          validStep(1, {
            step_kind: "INVESTIGATION_BUNDLE_PREPARED",
            descriptor_ref: "investigation_bundle_001",
          }),
          validStep(2, {
            step_kind: "REPLAY_PLAN_PREPARED",
            descriptor_ref: "replay_plan_001",
          }),
        ],
        links: [validLink(1, 2)],
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe("REPLAY_PLANNING_PATH");
      expect(result.value.steps[1]?.step_kind).toBe("REPLAY_PLAN_PREPARED");
    }
  });

  it("rejects missing tenant_id", () => {
    const scenario = validScenario() as Record<string, unknown>;
    delete scenario.tenant_id;
    scenario.metadata = {
      display: "alice@example.com",
    };

    const result = validateDemoScenario(scenario);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects project_id without workspace_id", () => {
    const result = validateDemoScenario(
      validScenario({
        workspace_id: undefined,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_SCENARIO_SCOPE_INVALID");
    }
  });

  it("rejects empty steps", () => {
    const result = validateDemoScenario(
      validScenario({
        steps: [],
        links: [],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_SCENARIO_STEPS_REQUIRED");
    }
  });

  it("rejects invalid scenario kind", () => {
    expect(validateDemoScenarioKind("NOT_A_KIND").ok).toBe(false);

    const scenario = validScenario() as Record<string, unknown>;
    scenario.kind = "NOT_A_KIND";

    const result = validateDemoScenario(scenario);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_SCENARIO_KIND_INVALID");
    }
  });

  it("rejects invalid step kind", () => {
    const result = validateDemoScenarioStep({
      ...validStep(1),
      step_kind: "EXECUTE_RUNTIME",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_SCENARIO_STEP_KIND_INVALID");
    }
  });

  it("rejects non-positive step_order", () => {
    const result = validateDemoScenarioStep(
      validStep(1, {
        step_order: 0,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_SCENARIO_STEP_ORDER_INVALID");
    }
  });

  it("rejects unordered steps", () => {
    const result = validateDemoScenario(
      validScenario({
        steps: [validStep(2), validStep(1)],
        links: [validLink(1, 2)],
      }),
    );

    expect(isDemoScenarioOrdered([
      { step_order: 2 },
      { step_order: 1 },
    ])).toBe(false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_SCENARIO_STEP_ORDER_INVALID");
    }
  });

  it("rejects duplicate step_order", () => {
    const result = validateDemoScenario(
      validScenario({
        steps: [
          validStep(1, { demo_scenario_step_id: "demo_scenario_step_a" }),
          validStep(1, { demo_scenario_step_id: "demo_scenario_step_b" }),
        ],
        links: [],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_SCENARIO_STEP_ORDER_INVALID");
    }
  });

  it("rejects unsafe descriptor_ref values", () => {
    const unsafeRefs = [
      "https://example.test/descriptor",
      "C:\\demo\\descriptor",
      "token_ref_001",
      "credential_ref_001",
      "select * from demo",
      "connection_string_001",
      "descriptor_ref_001 && run",
    ];

    for (const descriptor_ref of unsafeRefs) {
      const result = validateDemoScenarioStep(
        validStep(1, { descriptor_ref }),
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("DEMO_SCENARIO_STEP_REF_INVALID");
      }
    }
  });

  it("rejects unsafe title and description", () => {
    const unsafeTitle = validateDemoScenarioStep(
      validStep(1, {
        title: "Safe title with secret token",
      }),
    );
    const unsafeDescription = validateDemoScenario(
      validScenario({
        description: "This descriptor includes policy_internals.",
      }),
    );

    expect(unsafeTitle.ok).toBe(false);
    if (!unsafeTitle.ok) {
      expect(unsafeTitle.error.code).toBe("UNSAFE_DEMO_SCENARIO_TEXT");
    }

    expect(unsafeDescription.ok).toBe(false);
    if (!unsafeDescription.ok) {
      expect(unsafeDescription.error.code).toBe("UNSAFE_DEMO_SCENARIO_TEXT");
    }
  });

  it("rejects invalid timestamp", () => {
    const result = validateDemoScenarioStep(
      validStep(1, {
        occurred_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_SCENARIO_STEP_TIMESTAMP_INVALID");
    }
  });

  it("rejects step tenant mismatch", () => {
    const result = validateDemoScenario(
      validScenario({
        steps: [
          validStep(1, {
            tenant_id: "tenant_002",
          }),
        ],
        links: [],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_SCENARIO_STEP_TENANT_MISMATCH");
    }
  });

  it("rejects link tenant mismatch", () => {
    const result = validateDemoScenario(
      validScenario({
        steps: [validStep(1), validStep(2)],
        links: [
          validLink(1, 2, {
            tenant_id: "tenant_002",
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_SCENARIO_LINK_TENANT_MISMATCH");
    }
  });

  it("rejects links referencing missing steps", () => {
    const result = validateDemoScenario(
      validScenario({
        steps: [validStep(1)],
        links: [
          validLink(1, 2, {
            to_step_id: "demo_scenario_step_missing",
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_SCENARIO_LINK_STEP_REFERENCE_INVALID",
      );
    }
  });

  it("rejects self-links", () => {
    const result = validateDemoScenarioLink(
      validLink(1, 1, {
        to_step_id: "demo_scenario_step_1",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_SCENARIO_LINK_SELF_REFERENCE_INVALID",
      );
    }
  });

  it("rejects unsafe reason_code", () => {
    const result = validateDemoScenarioLink(
      validLink(1, 2, {
        reason_code: "unsafe reason",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_DEMO_SCENARIO_REASON_CODE");
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateDemoScenario(
      validScenario({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_DEMO_SCENARIO_METADATA");
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const scenario = validScenario() as Record<string, unknown>;
    delete scenario.tenant_id;
    scenario.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateDemoScenario(scenario);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("keeps demo scenarios descriptor-only without runtime, replay, reconstruction, persistence, events, UI or tools", () => {
    const result = validateDemoScenario(validScenario());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty("executed_at");
      expect(result.value).not.toHaveProperty("simulation_result");
      expect(result.value).not.toHaveProperty("reconstructed_state");
      expect(result.value).not.toHaveProperty("persisted_at");
      expect(result.value).not.toHaveProperty("emitted_event_id");
      expect(result.value).not.toHaveProperty("ui_component");
      expect(result.value).not.toHaveProperty("tool_invocation_id");
    }
  });

  it("fails closed for malformed or missing scenarios", () => {
    const missing = validateDemoScenario(undefined);
    const malformed = validateDemoScenario({
      demo_scenario_id: "demo_scenario_001",
    });
    const failClosed = failClosedDemoScenario();

    expect(missing.ok).toBe(false);
    expect(malformed.ok).toBe(false);
    expect(failClosed.code).toBe("DEMO_SCENARIO_NOT_VALID");
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createDemoScenarioDenial({
      code: "DEMO_SCENARIO_INVALID",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("run_internals");
    expect(serialized).not.toContain("policy_internals");
    expect(serialized).not.toContain("audit_internals");
    expect(serialized).not.toContain("event_internals");
    expect(serialized).not.toContain("investigation_internals");
    expect(serialized).not.toContain("replay_internals");
    expect(serialized).not.toContain("descriptor_internals");
    expect(serialized).not.toContain("secret-token");
  });
});
