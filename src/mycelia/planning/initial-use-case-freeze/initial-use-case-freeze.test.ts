import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  INITIAL_USE_CASE_BUYER_PERSONAS,
  INITIAL_USE_CASE_FIRST_ICP,
  INITIAL_USE_CASE_FROZEN_FLOW,
  INITIAL_USE_CASE_IN_SCOPE_RUNTIME_SLICE,
  INITIAL_USE_CASE_NAME,
  INITIAL_USE_CASE_NON_ICP,
  INITIAL_USE_CASE_OUT_OF_SCOPE_RUNTIME_SLICE,
  INITIAL_USE_CASE_PHASE,
  INITIAL_USE_CASE_RUNTIME_IMPLICATIONS,
  INITIAL_USE_CASE_SAFETY_BOUNDARY,
  INITIAL_USE_CASE_SUCCESS_METRICS,
  getInitialUseCaseFreeze,
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

describe("initial use case freeze", () => {
  it("builds the deterministic use-case freeze model successfully", () => {
    const model = getInitialUseCaseFreeze();

    expect(model.phase).toBe(INITIAL_USE_CASE_PHASE);
    expect(model.name).toBe(INITIAL_USE_CASE_NAME);
    expect(model.decision_status).toBe(
      "frozen for next runtime planning",
    );
    expect(model.short_name).toBe("Governed document review");
  });

  it("freezes Phase 2N and the governed compliance/document review flow", () => {
    const model = getInitialUseCaseFreeze();

    expect(model.phase).toBe("2N");
    expect(model.name).toBe(
      "Governed compliance/document review flow",
    );
    expect(model.product_framing).toContain(
      "compliance-sensitive documents",
    );
  });

  it("includes buyer personas", () => {
    const model = getInitialUseCaseFreeze();

    expect(model.buyer_and_icp.primary_buyer_personas).toEqual(
      INITIAL_USE_CASE_BUYER_PERSONAS,
    );
    expectIncludesAll(model.buyer_and_icp.primary_buyer_personas, [
      "Head of Operations",
      "Compliance/Risk leader",
      "Legal Operations leader",
      "Digital Transformation leader",
    ]);
  });

  it("includes the first ICP", () => {
    const model = getInitialUseCaseFreeze();

    expect(model.buyer_and_icp.first_icp).toEqual(
      INITIAL_USE_CASE_FIRST_ICP,
    );
    expectIncludesAll(model.buyer_and_icp.first_icp, [
      "regulated backoffice",
      "document-heavy operations",
      "compliance-sensitive workflows",
      "banks, insurers, legal operations, financial operations or regulated service operations",
    ]);
  });

  it("includes the explicit non-ICP", () => {
    const model = getInitialUseCaseFreeze();

    expect(model.buyer_and_icp.non_icp_for_now).toEqual(
      INITIAL_USE_CASE_NON_ICP,
    );
    expectIncludesAll(model.buyer_and_icp.non_icp_for_now, [
      "generic chatbot buyers",
      "broad workflow automation buyers",
      "pure developer tooling buyers",
      "teams wanting fully autonomous agents with no human approval",
    ]);
  });

  it("includes all frozen flow steps in order", () => {
    const model = getInitialUseCaseFreeze();

    expect(model.frozen_flow).toEqual(INITIAL_USE_CASE_FROZEN_FLOW);
    expect(model.frozen_flow.map((step) => step.step_order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(model.frozen_flow.map((step) => step.title)).toEqual([
      "Sensitive request intake",
      "Identity/context resolution",
      "Tenant/context boundary check",
      "Risk/policy classification",
      "Runtime admission decision",
      "Human approval if required",
      "Governed run state transition",
      "Audit record creation",
      "Investigation view preparation",
      "Replay dry-run plan without side effects",
    ]);
  });

  it("includes in-scope runtime slice items", () => {
    const model = getInitialUseCaseFreeze();

    expect(model.in_scope_runtime_slice).toEqual(
      INITIAL_USE_CASE_IN_SCOPE_RUNTIME_SLICE,
    );
    expectIncludesAll(model.in_scope_runtime_slice, [
      "one request type",
      "one deterministic policy/risk classifier",
      "one admission decision flow",
      "one human approval gate",
      "one state lifecycle",
      "one audit trail",
      "one investigation view",
      "one replay dry-run descriptor",
      "one fake or local adapter only if needed later, with no external side effects in this phase",
    ]);
  });

  it("includes out-of-scope items", () => {
    const model = getInitialUseCaseFreeze();

    expect(model.out_of_scope_runtime_slice).toEqual(
      INITIAL_USE_CASE_OUT_OF_SCOPE_RUNTIME_SLICE,
    );
    expectIncludesAll(model.out_of_scope_runtime_slice, [
      "workflow builder",
      "public API",
      "SaaS billing",
      "full auth platform",
      "full multi-tenant enterprise isolation",
      "general-purpose agent orchestration",
      "multiple integrations",
      "SDK",
      "white-label",
      "benchmark framework",
      "advanced observability",
      "real replay execution",
      "autonomous side effects",
    ]);
  });

  it("includes commercial offer planning ranges", () => {
    const offer = getInitialUseCaseFreeze().first_commercial_offer;

    expect(
      offer.assessment_blueprint_package.planning_price_range_brl,
    ).toBe("R$ 15k to R$ 35k");
    expect(offer.pilot_package.planning_price_range_brl).toBe(
      "R$ 80k to R$ 180k",
    );
    expect(offer.caveat).toContain("internal planning assumptions only");
    expect(offer.caveat).toContain("not guaranteed pricing");
    expect(offer.caveat).toContain("buyer-facing commitments");
  });

  it("includes success metrics", () => {
    const model = getInitialUseCaseFreeze();

    expect(model.success_metrics).toEqual(INITIAL_USE_CASE_SUCCESS_METRICS);
    expectIncludesAll(model.success_metrics, [
      "number of governed requests processed in pilot",
      "percentage of requests requiring approval",
      "audit trail completeness",
      "time to investigate a run",
      "number of policy/admission denials",
      "stakeholder confidence score or qualitative feedback",
      "reduction in manual reconstruction effort",
      "number of identified process risks",
    ]);
  });

  it("includes runtime implications", () => {
    const model = getInitialUseCaseFreeze();

    expect(model.runtime_implications).toEqual(
      INITIAL_USE_CASE_RUNTIME_IMPLICATIONS,
    );
    expectIncludesAll(model.runtime_implications, [
      "minimal persistent GovernedRun",
      "minimal RuntimeState persistence",
      "deterministic policy/admission v1",
      "approval gate",
      "audit commit boundary",
      "investigation view",
      "replay dry-run descriptor",
      "eventual tenant context enforcement",
    ]);
  });

  it("includes the safety boundary", () => {
    const model = getInitialUseCaseFreeze();

    expect(model.safety_boundary).toEqual(INITIAL_USE_CASE_SAFETY_BOUNDARY);
    expectIncludesAll(model.safety_boundary, [
      "this phase does not execute the use case",
      "this phase does not persist data",
      "this phase does not call APIs",
      "this phase does not call external services",
      "this phase does not create auth",
      "this phase does not create runtime",
      "this phase only freezes the first buyer-oriented use case and runtime direction",
    ]);
  });

  it("does not imply runtime execution exists", () => {
    const model = getInitialUseCaseFreeze();
    const text = collectStrings(model).join("\n").toLowerCase();

    expect(model.safety_boundary).toContain(
      "this phase does not execute the use case",
    );
    expect(text).not.toContain("runtime execution is available");
    expect(text).not.toContain("runtime is active");
    expect(text).not.toContain("executes the use case");
  });

  it("does not imply persistence exists", () => {
    const model = getInitialUseCaseFreeze();
    const text = collectStrings(model).join("\n").toLowerCase();

    expect(model.safety_boundary).toContain(
      "this phase does not persist data",
    );
    expect(text).not.toContain("persistence is available");
    expect(text).not.toContain("data is persisted");
    expect(text).not.toContain("stores production data");
  });

  it("does not imply API or auth exists", () => {
    const model = getInitialUseCaseFreeze();
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

  it("does not modify pnpm-lock.yaml", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(status.trim()).toBe("");
  });
});
