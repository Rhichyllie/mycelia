import { describe, expect, it } from "vitest";

import type { AuditRecordInput } from "../../domain-contracts/audit-record";
import type {
  AuditTimelineEntryInput,
  AuditTimelineInput,
} from "../../domain-contracts/audit-timeline";
import type {
  InvestigationBundleInput,
  InvestigationBundleItemInput,
  InvestigationBundleSummaryInput,
} from "../../domain-contracts/investigation-bundle";

import {
  assertReplayPlanValid,
  createReplayPlanDenial,
  failClosedReplayPlan,
  isReplayPlanOrdered,
  validateReplayPlan,
  validateReplayPlanStep,
} from ".";
import type { ReplayPlanInput } from "./replay-plan";
import type { ReplayPlanStepInput } from "./replay-plan-step";

function validActorRef(tenant_id = "tenant_001") {
  return {
    actor_type: "RUNTIME_ACTOR",
    actor_ref_id: "runtime_actor_ref_001",
    tenant_id,
    actor_id: "actor_001",
    runtime_identity_id: "runtime_identity_001",
    correlation_id: "correlation_001",
    metadata: {
      source: "runtime",
    },
  } as const;
}

function validSubjectRef(tenant_id = "tenant_001") {
  return {
    subject_type: "POLICY_DECISION",
    subject_ref_id: "policy_decision_ref_001",
    tenant_id,
    workspace_id: "workspace_001",
    project_id: "project_001",
    run_id: "run_001",
    request_id: "request_001",
    event_id: "event_001",
    correlation_id: "correlation_001",
    metadata: {
      source: "descriptor",
    },
  } as const;
}

function validEvidenceRef(tenant_id = "tenant_001") {
  return {
    evidence_ref_id: "policy_decision_evidence_ref_001",
    tenant_id,
    evidence_kind: "DECISION_RESULT",
    created_at: "2026-06-01T00:00:01.000Z",
    data_classification: "INTERNAL",
    correlation_id: "correlation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
  } as const;
}

function validAuditRecord(
  overrides: Partial<AuditRecordInput> = {},
  tenant_id = "tenant_001",
): AuditRecordInput {
  return {
    audit_record_id: "audit_record_001",
    tenant_id,
    kind: "POLICY_DECISION",
    actor_ref: validActorRef(tenant_id),
    subject_ref: validSubjectRef(tenant_id),
    evidence_ref: validEvidenceRef(tenant_id),
    outcome: "RECORDED",
    reason_code: "AUDIT_RECORDED",
    message: "The audit descriptor is recorded.",
    data_classification: "INTERNAL",
    recorded_at: "2026-06-01T00:00:02.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      phase: "one_q",
    },
    ...overrides,
  };
}

function validTimelineEntry(
  overrides: Partial<AuditTimelineEntryInput> = {},
  tenant_id = "tenant_001",
): AuditTimelineEntryInput {
  return {
    audit_timeline_entry_id: "audit_timeline_entry_001",
    tenant_id,
    entry_kind: "AUDIT_RECORD",
    occurred_at: "2026-06-01T00:00:04.000Z",
    sequence_number: 1,
    data_classification: "INTERNAL",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    run_id: "run_001",
    audit_record: validAuditRecord({}, tenant_id),
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validAuditTimeline(
  overrides: Partial<AuditTimelineInput> = {},
  tenant_id = "tenant_001",
): AuditTimelineInput {
  return {
    audit_timeline_id: "audit_timeline_001",
    tenant_id,
    scope: {
      workspace_id: "workspace_001",
      project_id: "project_001",
      run_id: "run_001",
      correlation_id: "correlation_001",
    },
    entries: [validTimelineEntry({}, tenant_id)],
    created_at: "2026-06-01T00:00:06.000Z",
    data_classification: "INTERNAL",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validInvestigationItem(
  overrides: Partial<InvestigationBundleItemInput> = {},
  tenant_id = "tenant_001",
): InvestigationBundleItemInput {
  return {
    investigation_bundle_item_id: "investigation_bundle_item_001",
    tenant_id,
    item_kind: "AUDIT_RECORD",
    item_ref: "audit_record_001",
    data_classification: "INTERNAL",
    observed_at: "2026-06-01T00:00:04.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validInvestigationSummary(
  overrides: Partial<InvestigationBundleSummaryInput> = {},
  tenant_id = "tenant_001",
): InvestigationBundleSummaryInput {
  return {
    summary_id: "investigation_bundle_summary_001",
    tenant_id,
    item_count: 1,
    earliest_observed_at: "2026-06-01T00:00:04.000Z",
    latest_observed_at: "2026-06-01T00:00:04.000Z",
    data_classification: "INTERNAL",
    generated_at: "2026-06-01T00:00:07.000Z",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validInvestigationBundle(
  overrides: Partial<InvestigationBundleInput> = {},
  tenant_id = "tenant_001",
): InvestigationBundleInput {
  return {
    investigation_bundle_id: "investigation_bundle_001",
    tenant_id,
    scope: {
      tenant_id,
      workspace_id: "workspace_001",
      project_id: "project_001",
      run_id: "run_001",
      correlation_id: "correlation_001",
      causation_id: "causation_001",
      source_event_id: "event_001",
    },
    items: [validInvestigationItem({}, tenant_id)],
    audit_timeline: validAuditTimeline({}, tenant_id),
    summary: validInvestigationSummary({}, tenant_id),
    created_at: "2026-06-01T00:00:08.000Z",
    data_classification: "INTERNAL",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validReplayPlanStep(
  overrides: Partial<ReplayPlanStepInput> = {},
): ReplayPlanStepInput {
  return {
    replay_plan_step_id: "replay_plan_step_001",
    tenant_id: "tenant_001",
    step_kind: "INSPECT_AUDIT_TIMELINE",
    step_order: 1,
    source_ref: "audit_timeline_001",
    data_classification: "INTERNAL",
    planned_at: "2026-06-01T00:00:09.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validReplayPlan(
  overrides: Partial<ReplayPlanInput> = {},
): ReplayPlanInput {
  return {
    replay_plan_id: "replay_plan_001",
    tenant_id: "tenant_001",
    scope: {
      tenant_id: "tenant_001",
      workspace_id: "workspace_001",
      project_id: "project_001",
      run_id: "run_001",
      correlation_id: "correlation_001",
      causation_id: "causation_001",
      source_event_id: "event_001",
    },
    steps: [validReplayPlanStep()],
    investigation_bundle: validInvestigationBundle(),
    data_classification: "INTERNAL",
    created_at: "2026-06-01T00:00:10.000Z",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

describe("ReplayPlan", () => {
  it("accepts a valid replay plan with an embedded investigation bundle", () => {
    const result = validateReplayPlan(validReplayPlan());

    expect(result.ok).toBe(true);
    expect(assertReplayPlanValid(validReplayPlan()).ok).toBe(true);
    if (result.ok) {
      expect(result.value.investigation_bundle?.investigation_bundle_id).toBe(
        "investigation_bundle_001",
      );
      expect(result.value.steps[0]?.step_kind).toBe(
        "INSPECT_AUDIT_TIMELINE",
      );
    }
  });

  it("accepts a valid replay plan with only an opaque investigation bundle ref", () => {
    const result = validateReplayPlan(
      validReplayPlan({
        investigation_bundle: undefined,
        investigation_bundle_ref: "investigation_bundle_ref_001",
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.investigation_bundle).toBeUndefined();
      expect(result.value.investigation_bundle_ref).toBe(
        "investigation_bundle_ref_001",
      );
    }
  });

  it("rejects missing tenant_id", () => {
    const plan = validReplayPlan() as Record<string, unknown>;
    delete plan.tenant_id;
    plan.metadata = {
      display: "alice@example.com",
    };

    const result = validateReplayPlan(plan);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects project_id without workspace_id", () => {
    const result = validateReplayPlan(
      validReplayPlan({
        scope: {
          tenant_id: "tenant_001",
          project_id: "project_001",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_PLAN_SCOPE_INVALID");
    }
  });

  it("rejects empty steps", () => {
    const result = validateReplayPlan(
      validReplayPlan({
        steps: [],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_PLAN_STEPS_REQUIRED");
    }
  });

  it("rejects invalid step kind", () => {
    const result = validateReplayPlanStep({
      ...validReplayPlanStep(),
      step_kind: "EXECUTE_REPLAY",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_PLAN_STEP_KIND_INVALID");
    }
  });

  it("rejects unsafe source_ref values", () => {
    const unsafeRefs = [
      "https://example.test/replay",
      "C:\\replay\\plan",
      "token_ref_001",
      "credential_ref_001",
      "select * from replay",
      "connection_string_001",
      "source_ref_001 && run",
    ];

    for (const source_ref of unsafeRefs) {
      const result = validateReplayPlanStep(
        validReplayPlanStep({ source_ref }),
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("REPLAY_PLAN_STEP_REF_INVALID");
      }
    }
  });

  it("rejects invalid planned_at", () => {
    const result = validateReplayPlanStep(
      validReplayPlanStep({
        planned_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_PLAN_STEP_TIMESTAMP_INVALID");
    }
  });

  it("rejects non-positive step_order", () => {
    const result = validateReplayPlanStep(
      validReplayPlanStep({
        step_order: 0,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_PLAN_STEP_ORDER_INVALID");
    }
  });

  it("rejects step tenant mismatch", () => {
    const result = validateReplayPlan(
      validReplayPlan({
        steps: [
          validReplayPlanStep({
            tenant_id: "tenant_002",
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_PLAN_STEP_TENANT_MISMATCH");
    }
  });

  it("rejects embedded investigation_bundle tenant mismatch", () => {
    const result = validateReplayPlan(
      validReplayPlan({
        investigation_bundle: validInvestigationBundle({}, "tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_PLAN_BUNDLE_TENANT_MISMATCH");
    }
  });

  it("rejects unsafe investigation_bundle_ref", () => {
    const result = validateReplayPlan(
      validReplayPlan({
        investigation_bundle: undefined,
        investigation_bundle_ref: "https://example.test/bundle",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_PLAN_BUNDLE_REF_INVALID");
    }
  });

  it("rejects unordered steps", () => {
    const result = validateReplayPlan(
      validReplayPlan({
        steps: [
          validReplayPlanStep({
            replay_plan_step_id: "replay_plan_step_002",
            step_order: 2,
          }),
          validReplayPlanStep({
            replay_plan_step_id: "replay_plan_step_001",
            step_order: 1,
          }),
        ],
      }),
    );

    expect(isReplayPlanOrdered([
      { step_order: 2 },
      { step_order: 1 },
    ])).toBe(false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_PLAN_STEP_ORDER_INVALID");
    }
  });

  it("rejects duplicate step_order", () => {
    const result = validateReplayPlan(
      validReplayPlan({
        steps: [
          validReplayPlanStep({
            replay_plan_step_id: "replay_plan_step_a",
            step_order: 1,
          }),
          validReplayPlanStep({
            replay_plan_step_id: "replay_plan_step_b",
            step_order: 1,
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("REPLAY_PLAN_STEP_ORDER_INVALID");
    }
  });

  it("rejects invalid created_at", () => {
    const result = validateReplayPlan(
      validReplayPlan({
        created_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_REPLAY_PLAN_TIMESTAMP");
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateReplayPlan(
      validReplayPlan({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_REPLAY_PLAN_METADATA");
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const plan = validReplayPlan() as Record<string, unknown>;
    delete plan.tenant_id;
    plan.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateReplayPlan(plan);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("keeps replay plans descriptor-only without execution, simulation, reconstruction, hydration, storage query, UI or tools", () => {
    const result = validateReplayPlan(validReplayPlan());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty("executed_at");
      expect(result.value).not.toHaveProperty("simulation_result");
      expect(result.value).not.toHaveProperty("reconstructed_state");
      expect(result.value).not.toHaveProperty("hydrated_payload");
      expect(result.value).not.toHaveProperty("query_handle");
      expect(result.value).not.toHaveProperty("ui_component");
      expect(result.value).not.toHaveProperty("tool_invocation_id");
    }
  });

  it("fails closed for malformed or missing replay plans", () => {
    const missing = validateReplayPlan(undefined);
    const malformed = validateReplayPlan({
      replay_plan_id: "replay_plan_001",
    });
    const failClosed = failClosedReplayPlan();

    expect(missing.ok).toBe(false);
    expect(malformed.ok).toBe(false);
    expect(failClosed.code).toBe("REPLAY_PLAN_NOT_VALID");
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createReplayPlanDenial({
      code: "REPLAY_PLAN_BUNDLE_INVALID",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("storage_internals");
    expect(serialized).not.toContain("query_internals");
    expect(serialized).not.toContain("replay_internals");
    expect(serialized).not.toContain("policy_internals");
    expect(serialized).not.toContain("investigation_internals");
    expect(serialized).not.toContain("secret-token");
  });
});
