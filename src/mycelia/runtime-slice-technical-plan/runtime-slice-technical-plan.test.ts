import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { INITIAL_USE_CASE_NAME } from "../initial-use-case-freeze";
import { PILOT_OFFER_PILOT_PACKAGE } from "../pilot-offer-package";

import {
  RUNTIME_SLICE_EXPLICITLY_OUT_OF_SCOPE,
  RUNTIME_SLICE_FUTURE_PERSISTENT_ENTITIES,
  RUNTIME_SLICE_MINIMAL_RUNTIME_FLOW,
  RUNTIME_SLICE_NEXT_IMPLEMENTATION_SEQUENCE,
  RUNTIME_SLICE_SAFETY_BOUNDARY,
  RUNTIME_SLICE_STATE_LIFECYCLE,
  RUNTIME_SLICE_TECHNICAL_PLAN_PHASE,
  getRuntimeSliceTechnicalPlan,
} from ".";

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

function expectIncludesAll(
  actual: readonly string[],
  expected: readonly string[],
): void {
  for (const item of expected) {
    expect(actual).toContain(item);
  }
}

describe("runtime slice technical plan", () => {
  it("builds the deterministic technical plan model successfully", () => {
    const model = getRuntimeSliceTechnicalPlan();

    expect(model.phase).toBe(RUNTIME_SLICE_TECHNICAL_PLAN_PHASE);
    expect(model.name).toBe("Runtime Slice Technical Plan");
    expect(model.status).toBe(
      "technical plan for next implementation phases",
    );
  });

  it("links to the frozen use case and pilot offer", () => {
    const model = getRuntimeSliceTechnicalPlan();

    expect(model.phase).toBe("2Q");
    expect(model.linked_use_case).toBe(INITIAL_USE_CASE_NAME);
    expect(model.linked_use_case).toBe(
      "Governed compliance/document review flow",
    );
    expect(model.linked_offer).toBe(PILOT_OFFER_PILOT_PACKAGE.name);
    expect(model.linked_offer).toBe("Governed Compliance Flow Pilot");
  });

  it("states the runtime slice goal without becoming a general workflow platform", () => {
    const goal = getRuntimeSliceTechnicalPlan().runtime_slice_goal.join("\n");

    expect(goal).toContain(
      "one narrow governed compliance/document review flow",
    );
    expect(goal).toContain("one controlled operational lifecycle");
    expect(goal).toContain("must not become a general-purpose workflow platform");
    expect(goal).toContain("assessment and pilot delivery");
  });

  it("includes the ordered minimal runtime flow", () => {
    const model = getRuntimeSliceTechnicalPlan();

    expect(model.minimal_runtime_flow).toEqual(
      RUNTIME_SLICE_MINIMAL_RUNTIME_FLOW,
    );
    expect(model.minimal_runtime_flow).toEqual([
      "Create governed request",
      "Resolve organizational context",
      "Check tenant/context boundary",
      "Classify risk/policy",
      "Decide admission",
      "Pause for approval when required",
      "Resume after approval",
      "Transition run state",
      "Commit audit record",
      "Prepare investigation view",
      "Prepare replay dry-run descriptor",
      "Mark run completed or rejected",
    ]);
  });

  it("includes all required future persistent entities", () => {
    const model = getRuntimeSliceTechnicalPlan();
    const entityNames = model.future_persistent_entities.map(
      (entity) => entity.entity,
    );

    expect(model.future_persistent_entities).toEqual(
      RUNTIME_SLICE_FUTURE_PERSISTENT_ENTITIES,
    );
    expect(entityNames).toEqual([
      "GovernedRun",
      "RuntimeStateSnapshot",
      "PolicyDecisionRecord",
      "AdmissionDecisionRecord",
      "ApprovalRequest",
      "AuditRecord",
      "InvestigationCase or InvestigationBundleView",
      "ReplayDryRunPlan",
    ]);
  });

  it("marks first persistence slice and later entity timing", () => {
    const model = getRuntimeSliceTechnicalPlan();
    const firstSlice = model.future_persistent_entities
      .filter(
        (entity) => entity.persistence_timing === "FIRST_PERSISTENCE_SLICE",
      )
      .map((entity) => entity.entity);
    const laterSlice = model.future_persistent_entities
      .filter((entity) => entity.persistence_timing === "LATER_SLICE")
      .map((entity) => entity.entity);

    expect(firstSlice).toEqual([
      "GovernedRun",
      "RuntimeStateSnapshot",
      "PolicyDecisionRecord",
      "AdmissionDecisionRecord",
      "ApprovalRequest",
      "AuditRecord",
    ]);
    expect(laterSlice).toEqual([
      "InvestigationCase or InvestigationBundleView",
      "ReplayDryRunPlan",
    ]);
  });

  it("describes each future entity with purpose, fields, module relation and use-case need", () => {
    const entities = getRuntimeSliceTechnicalPlan().future_persistent_entities;

    for (const entity of entities) {
      expect(entity.purpose).toBeTruthy();
      expect(entity.minimal_fields_conceptual.length).toBeGreaterThan(0);
      expect(entity.source_modules.length).toBeGreaterThan(0);
      expect(entity.frozen_use_case_need).toBeTruthy();
      expect([
        "FIRST_PERSISTENCE_SLICE",
        "LATER_SLICE",
      ]).toContain(entity.persistence_timing);
    }
  });

  it("includes state lifecycle states", () => {
    const model = getRuntimeSliceTechnicalPlan();

    expect(model.state_lifecycle).toEqual(RUNTIME_SLICE_STATE_LIFECYCLE);
    expect(model.state_lifecycle.map((state) => state.state)).toEqual([
      "CREATED",
      "CONTEXT_RESOLVED",
      "POLICY_EVALUATED",
      "ADMISSION_GRANTED",
      "WAITING_APPROVAL",
      "APPROVED",
      "REJECTED",
      "RUNNING",
      "COMPLETED",
      "CANCELLED",
      "FAILED",
    ]);
  });

  it("includes allowed next states for each lifecycle state", () => {
    const states = getRuntimeSliceTechnicalPlan().state_lifecycle;

    for (const state of states) {
      expect(state.meaning).toBeTruthy();
      expect(Array.isArray(state.allowed_next_states)).toBe(true);
      expect(state.audit_requirement).toBeTruthy();
    }

    expect(
      states.find((state) => state.state === "CREATED")
        ?.allowed_next_states,
    ).toContain("CONTEXT_RESOLVED");
    expect(
      states.find((state) => state.state === "WAITING_APPROVAL")
        ?.allowed_next_states,
    ).toEqual(["APPROVED", "REJECTED", "CANCELLED", "FAILED"]);
    expect(
      states.find((state) => state.state === "COMPLETED")
        ?.allowed_next_states,
    ).toEqual([]);
  });

  it("includes policy/admission v1 behavior", () => {
    const policy = getRuntimeSliceTechnicalPlan().policy_admission_v1;
    const conditions = policy.behavior.map((rule) => rule.condition);

    expect(conditions).toEqual([
      "low risk",
      "medium risk",
      "high risk",
      "missing context",
      "tenant/context mismatch",
      "unsafe/unknown classification",
    ]);
    expect(policy.outputs_needed).toContain("admission outcome");
    expect(policy.fail_closed_rule).toContain("fails closed");
    expect(policy.relation_to_existing_modules).toContain(
      "src/mycelia/policy-decision-gateway/",
    );
    expect(policy.relation_to_existing_modules).toContain(
      "src/mycelia/runtime-admission-gateway/",
    );
  });

  it("includes approval gate v1", () => {
    const approval = getRuntimeSliceTechnicalPlan().approval_gate_v1;

    expect(approval.required_when).toContain(
      "admission outcome is REQUIRE_APPROVAL",
    );
    expect(approval.approval_request_contains).toContain("run_id");
    expect(approval.allowed_outcomes).toEqual([
      "APPROVE",
      "REJECT",
      "TIMEOUT",
      "CANCEL",
    ]);
    expect(approval.audit_records_required).toContain("approval requested");
    expect(approval.result_handling).toContain(
      "approve resumes the run toward RUNNING",
    );
  });

  it("includes audit commit boundary", () => {
    const audit = getRuntimeSliceTechnicalPlan().audit_commit_boundary;

    expect(audit.lifecycle_moments).toContain("governed request created");
    expect(audit.lifecycle_moments).toContain("approval decided");
    expect(audit.lifecycle_moments).toContain("run completed");
    expect(audit.evidence_references).toContain("policy decision reference");
    expect(audit.immutable_later).toContain("audit record identity");
    expect(audit.not_implemented_yet).toContain("hash-chain");
    expect(audit.not_implemented_yet).toContain("signing");
    expect(audit.not_implemented_yet).toContain("sealing");
  });

  it("includes investigation view v1", () => {
    const investigation = getRuntimeSliceTechnicalPlan().investigation_view_v1;

    expect(investigation.reads).toContain("GovernedRun");
    expect(investigation.must_show).toContain("policy/admission outcome");
    expect(investigation.must_show).toContain("state lifecycle history");
    expect(investigation.must_not_infer).toContain("tenant context");
    expect(investigation.relates_to).toContain(
      "src/mycelia/investigation-bundle/",
    );
  });

  it("includes replay dry-run v1", () => {
    const replay = getRuntimeSliceTechnicalPlan().replay_dry_run_v1;

    expect(replay.definition).toContain("descriptor reconstruction");
    expect(replay.guarantees).toContain("no side effects");
    expect(replay.guarantees).toContain("no tool execution");
    expect(replay.guarantees).toContain("no external calls");
    expect(replay.differs_from_real_replay).toContain(
      "real replay would execute a replay engine over event history",
    );
  });

  it("includes the next implementation sequence", () => {
    const model = getRuntimeSliceTechnicalPlan();

    expect(model.next_implementation_sequence).toEqual(
      RUNTIME_SLICE_NEXT_IMPLEMENTATION_SEQUENCE,
    );
    expect(model.next_implementation_sequence.map((phase) => phase.phase))
      .toEqual([
        "2R Minimal Persistent Model Plan/Scaffold",
        "2S Minimal Governed Run Lifecycle",
        "2T Policy/Admission v1",
        "2U Audit Commit Boundary",
        "2V Approval Gate v1",
        "2W Investigation View v1",
        "2X Replay Dry-Run Descriptor v1",
        "2Y Internal Runtime Service Boundary",
        "2Z Runtime Slice Consistency Audit",
      ]);

    for (const phase of model.next_implementation_sequence) {
      expect(phase.objective).toBeTruthy();
      expect(phase.why_order).toBeTruthy();
      expect(phase.likely_modules_files.length).toBeGreaterThan(0);
      expect(phase.risk).toBeTruthy();
      expect(phase.value).toBeTruthy();
    }
  });

  it("includes explicit out-of-scope items", () => {
    const model = getRuntimeSliceTechnicalPlan();

    expect(model.explicitly_out_of_scope).toEqual(
      RUNTIME_SLICE_EXPLICITLY_OUT_OF_SCOPE,
    );
    expectIncludesAll(model.explicitly_out_of_scope, [
      "public API",
      "auth",
      "SaaS billing",
      "workflow builder",
      "general-purpose orchestration",
      "multiple integrations",
      "autonomous agents",
      "SDK",
      "external services",
      "production deployment",
      "enterprise multi-tenancy",
      "full replay execution",
      "hash-chain/signing/sealing",
      "export/PDF/downloads",
    ]);
  });

  it("includes the safety boundary", () => {
    const model = getRuntimeSliceTechnicalPlan();

    expect(model.safety_boundary).toEqual(RUNTIME_SLICE_SAFETY_BOUNDARY);
    expectIncludesAll(model.safety_boundary, [
      "this phase does not execute runtime",
      "this phase does not persist data",
      "this phase does not call APIs",
      "this phase does not call external services",
      "this phase does not create auth",
      "this phase does not create DB schema",
      "this phase does not create Prisma migrations",
      "this phase only defines the technical plan",
    ]);
  });

  it("does not imply runtime execution exists", () => {
    const model = getRuntimeSliceTechnicalPlan();
    const text = collectStrings(model).join("\n").toLowerCase();

    expect(model.safety_boundary).toContain(
      "this phase does not execute runtime",
    );
    expect(text).not.toContain("runtime execution is available");
    expect(text).not.toContain("runtime is active");
    expect(text).not.toContain("executes runtime");
  });

  it("does not imply persistence exists", () => {
    const model = getRuntimeSliceTechnicalPlan();
    const text = collectStrings(model).join("\n").toLowerCase();

    expect(model.safety_boundary).toContain(
      "this phase does not persist data",
    );
    expect(text).not.toContain("persistence is available");
    expect(text).not.toContain("data is persisted");
    expect(text).not.toContain("stores production data");
  });

  it("does not imply API or auth exists", () => {
    const model = getRuntimeSliceTechnicalPlan();
    const text = collectStrings(model).join("\n").toLowerCase();

    expect(model.safety_boundary).toContain(
      "this phase does not call APIs",
    );
    expect(model.safety_boundary).toContain(
      "this phase does not create auth",
    );
    expect(text).not.toContain("api is available");
    expect(text).not.toContain("auth is available");
    expect(text).not.toContain("authentication is active");
  });

  it("does not include Prisma schema text", () => {
    const text = collectStrings(getRuntimeSliceTechnicalPlan()).join("\n");

    expect(text).not.toContain("model GovernedRun");
    expect(text).not.toContain("datasource");
    expect(text).not.toContain("generator client");
    expect(text).not.toContain("@relation");
    expect(text).not.toContain("@@id");
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
