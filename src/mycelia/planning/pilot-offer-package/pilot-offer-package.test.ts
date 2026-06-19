import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { INITIAL_USE_CASE_NAME } from "../../planning/initial-use-case-freeze";

import {
  PILOT_OFFER_BOUNDARIES,
  PILOT_OFFER_GO_NO_GO_CRITERIA,
  PILOT_OFFER_NEXT_PHASE_IMPLICATIONS,
  PILOT_OFFER_PACKAGE_PHASE,
  PILOT_OFFER_PROSPECT_QUALIFICATION_FIELDS,
  PILOT_OFFER_SAFETY_BOUNDARY,
  getPilotOfferPackage,
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

describe("pilot offer package", () => {
  it("builds the deterministic package model successfully", () => {
    const model = getPilotOfferPackage();

    expect(model.phase).toBe(PILOT_OFFER_PACKAGE_PHASE);
    expect(model.name).toBe("Pilot Offer and Discovery Package");
    expect(model.status).toBe("internal planning package");
  });

  it("links to the governed compliance/document review use case", () => {
    const model = getPilotOfferPackage();

    expect(model.phase).toBe("2O");
    expect(model.linked_use_case).toBe(INITIAL_USE_CASE_NAME);
    expect(model.linked_use_case).toBe(
      "Governed compliance/document review flow",
    );
  });

  it("defines buyer-facing positioning without mature SaaS claims", () => {
    const model = getPilotOfferPackage();
    const positioning = model.positioning.join("\n");

    expect(positioning).toContain("regulated operations");
    expect(positioning).toContain("policy control");
    expect(positioning).toContain("auditability");
    expect(positioning).toContain("not a mature SaaS platform claim");
  });

  it("defines the assessment package with duration, price range, deliverables and non-deliverables", () => {
    const assessment = getPilotOfferPackage().assessment_package;

    expect(assessment.name).toBe("Governed Operations Assessment");
    expect(assessment.duration).toBe("2 weeks");
    expect(assessment.internal_planning_price_range_brl).toBe(
      "R$ 15k to R$ 35k",
    );
    expectIncludesAll(assessment.deliverables, [
      "process map",
      "risk/control map",
      "governed run blueprint",
      "policy/admission matrix",
      "approval points",
      "audit/investigation requirements",
      "pilot recommendation",
      "go/no-go decision",
    ]);
    expectIncludesAll(assessment.non_deliverables, [
      "production runtime",
      "public API",
      "billing system",
      "full auth platform",
      "external integrations",
      "autonomous agent execution",
      "broad workflow builder",
    ]);
  });

  it("defines the pilot package with duration, price range, deliverables and non-deliverables", () => {
    const pilot = getPilotOfferPackage().pilot_package;

    expect(pilot.name).toBe("Governed Compliance Flow Pilot");
    expect(pilot.duration).toBe("6 to 8 weeks");
    expect(pilot.internal_planning_price_range_brl).toBe(
      "R$ 80k to R$ 180k",
    );
    expectIncludesAll(pilot.deliverables, [
      "one sensitive request flow",
      "deterministic policy/admission v1 design",
      "one human approval gate design",
      "governed run lifecycle design",
      "audit trail design",
      "investigation view design",
      "replay dry-run plan",
      "success metrics report",
      "implementation backlog for the next runtime slice",
    ]);
    expectIncludesAll(pilot.non_deliverables, [
      "mature SaaS platform",
      "production runtime by default",
      "public API",
      "SaaS billing",
      "full auth platform",
      "enterprise-wide multi-tenant isolation",
      "external integrations",
      "fully autonomous agents",
      "general workflow builder",
    ]);
  });

  it("includes prospect qualification fields", () => {
    const model = getPilotOfferPackage();

    expect(model.prospect_qualification_fields).toEqual(
      PILOT_OFFER_PROSPECT_QUALIFICATION_FIELDS,
    );
    expectIncludesAll(model.prospect_qualification_fields, [
      "industry",
      "process type",
      "regulatory/compliance pressure",
      "document volume",
      "decision risk",
      "approval requirements",
      "audit pain",
      "investigation/reconstruction pain",
      "AI adoption urgency",
      "stakeholder access",
      "data sensitivity",
      "integration complexity",
      "budget range",
      "timeline urgency",
    ]);
  });

  it("includes at least 25 grouped discovery questions", () => {
    const groups = getPilotOfferPackage().discovery_question_groups;
    const questionCount = groups.reduce(
      (count, group) => count + group.questions.length,
      0,
    );

    expect(groups.map((group) => group.group)).toEqual([
      "business pain",
      "current process",
      "risk and compliance",
      "approvals",
      "audit and evidence",
      "investigation and replay",
      "data and systems",
      "buying process",
      "success metrics",
    ]);
    expect(questionCount).toBeGreaterThanOrEqual(25);
  });

  it("keeps discovery questions grouped with non-empty questions", () => {
    const groups = getPilotOfferPackage().discovery_question_groups;

    for (const group of groups) {
      expect(group.group).toBeTruthy();
      expect(group.questions.length).toBeGreaterThan(0);
      for (const question of group.questions) {
        expect(question.endsWith("?")).toBe(true);
      }
    }
  });

  it("includes go/no-go criteria", () => {
    const criteria = getPilotOfferPackage().go_no_go_criteria;

    expect(criteria).toEqual(PILOT_OFFER_GO_NO_GO_CRITERIA);
    expect(criteria.good_fit_signals.length).toBeGreaterThan(0);
    expect(criteria.bad_fit_signals.length).toBeGreaterThan(0);
    expect(criteria.deal_breakers.length).toBeGreaterThan(0);
    expect(criteria.pilot_readiness_checklist.length).toBeGreaterThan(0);
  });

  it("includes good-fit signals", () => {
    expectIncludesAll(
      getPilotOfferPackage().go_no_go_criteria.good_fit_signals,
      [
        "regulated or compliance-heavy process",
        "manual reconstruction pain",
        "approval or exception handling",
        "document-heavy workflow",
        "buyer acknowledges governance risk",
        "access to process owner",
        "willingness to start narrow",
      ],
    );
  });

  it("includes bad-fit signals", () => {
    expectIncludesAll(
      getPilotOfferPackage().go_no_go_criteria.bad_fit_signals,
      [
        "wants generic chatbot only",
        "wants full autonomous agent execution with no approval",
        "refuses narrow pilot",
        "no process owner",
        "no budget",
        "unclear compliance pain",
      ],
    );
  });

  it("includes deal-breakers", () => {
    expectIncludesAll(getPilotOfferPackage().go_no_go_criteria.deal_breakers, [
      "demands production runtime before assessment",
      "requires broad platform promises",
      "requires external integrations in this planning phase",
      "requires handling real sensitive data before controls exist",
      "demands SaaS billing or public API immediately",
    ]);
  });

  it("includes success metrics", () => {
    const metrics = getPilotOfferPackage().success_metrics;

    expectIncludesAll(metrics.assessment, [
      "time to map current process",
      "number of risks/control gaps identified",
      "number of approval points clarified",
      "number of policy/admission rules defined",
      "pilot go/no-go decision quality",
      "reduction in ambiguity around AI-assisted execution",
    ]);
    expectIncludesAll(metrics.pilot, [
      "audit trail completeness",
      "investigation reconstruction time",
      "stakeholder confidence score",
      "number of governed requests described",
      "percentage of requests requiring approval",
      "number of policy/admission denials identified",
    ]);
  });

  it("includes offer boundaries", () => {
    const model = getPilotOfferPackage();

    expect(model.offer_boundaries).toEqual(PILOT_OFFER_BOUNDARIES);
    expectIncludesAll(model.offer_boundaries, [
      "assessment is planning and blueprint only",
      "pilot is narrow and controlled",
      "neither offer is a claim of mature SaaS",
      "neither offer includes production runtime by default",
      "neither offer includes public API, billing, full auth, enterprise multi-tenancy, external integrations, autonomous agents or broad workflow builder",
    ]);
  });

  it("includes next-phase implications", () => {
    const model = getPilotOfferPackage();

    expect(model.next_phase_implications).toEqual(
      PILOT_OFFER_NEXT_PHASE_IMPLICATIONS,
    );
    expectIncludesAll(model.next_phase_implications, [
      "repository truth alignment",
      "runtime slice technical plan",
      "minimal persistent model",
      "governed run lifecycle",
      "policy/admission v1",
      "audit commit boundary",
      "approval gate",
      "investigation view",
    ]);
  });

  it("includes the safety boundary", () => {
    const model = getPilotOfferPackage();

    expect(model.safety_boundary).toEqual(PILOT_OFFER_SAFETY_BOUNDARY);
    expectIncludesAll(model.safety_boundary, [
      "this phase does not execute a pilot",
      "this phase does not create sales automation",
      "this phase does not persist data",
      "this phase does not call APIs",
      "this phase does not call external services",
      "this phase does not create auth",
      "this phase does not create runtime",
      "this phase only defines the commercial planning package",
    ]);
  });

  it("does not imply runtime execution exists", () => {
    const model = getPilotOfferPackage();
    const text = collectStrings(model).join("\n").toLowerCase();

    expect(model.safety_boundary).toContain(
      "this phase does not execute a pilot",
    );
    expect(text).not.toContain("runtime execution is available");
    expect(text).not.toContain("runtime is active");
    expect(text).not.toContain("executes a pilot");
  });

  it("does not imply persistence exists", () => {
    const model = getPilotOfferPackage();
    const text = collectStrings(model).join("\n").toLowerCase();

    expect(model.safety_boundary).toContain(
      "this phase does not persist data",
    );
    expect(text).not.toContain("persistence is available");
    expect(text).not.toContain("data is persisted");
    expect(text).not.toContain("stores production data");
  });

  it("does not imply API or auth exists", () => {
    const model = getPilotOfferPackage();
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

  it("labels price ranges as internal planning assumptions, not guaranteed pricing", () => {
    const model = getPilotOfferPackage();

    expect(model.price_range_caveat).toContain(
      "internal planning assumptions only",
    );
    expect(model.price_range_caveat).toContain("not guaranteed pricing");
    expect(model.assessment_package.internal_planning_price_range_brl).toBe(
      "R$ 15k to R$ 35k",
    );
    expect(model.pilot_package.internal_planning_price_range_brl).toBe(
      "R$ 80k to R$ 180k",
    );
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
