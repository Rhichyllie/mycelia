import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  AuditCommitBoundaryInputSchema,
  AuditCommitMoments,
  AuditCommitRequirements,
  assertAuditCommitBoundary,
  evaluateAuditCommitBoundary,
  failClosedAuditCommitBoundaryDenial,
  getAuditCommitBoundary,
  type AuditCommitBoundaryInputCandidate,
  type AuditCommitMoment,
  type AuditCommitRequirement,
  type AuditCommitRelatedRecord,
} from ".";

const EXPECTED_MOMENTS = [
  "REQUEST_CREATED",
  "CONTEXT_RESOLVED",
  "TENANT_BOUNDARY_CHECKED",
  "POLICY_EVALUATED",
  "ADMISSION_DECIDED",
  "APPROVAL_REQUESTED",
  "APPROVAL_DECIDED",
  "LIFECYCLE_TRANSITIONED",
  "RUN_COMPLETED",
  "RUN_REJECTED",
  "RUN_CANCELLED",
  "RUN_FAILED",
  "INVESTIGATION_PREPARED",
  "REPLAY_DRY_RUN_PREPARED",
] as const;

const VALID_INPUT: AuditCommitBoundaryInputCandidate = {
  tenant_id: "tenant_01",
  run_id: "run_01",
  correlation_id: "correlation_01",
  moment: "REQUEST_CREATED",
  source_module: "governed-run-lifecycle",
  subject_ref: "subject_ref_01",
  actor_ref: "actor_ref_01",
  evidence_ref: "evidence_ref_01",
  reason_code: "REQUEST_CREATED",
  safe_summary: "Governed request entered the controlled lifecycle.",
  metadata: {
    scenario: "pilot",
  },
};

function inputWith(
  overrides: Partial<AuditCommitBoundaryInputCandidate>,
): AuditCommitBoundaryInputCandidate {
  return {
    ...VALID_INPUT,
    ...overrides,
  };
}

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

function expectRequirement(
  moment: AuditCommitMoment,
  requirement: AuditCommitRequirement,
  relatedRecords: readonly AuditCommitRelatedRecord[],
): void {
  const result = evaluateAuditCommitBoundary(inputWith({ moment }));

  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error("Expected audit commit boundary decision.");
  }

  expect(result.value.moment).toBe(moment);
  expect(result.value.requirement).toBe(requirement);
  expect(result.value.reason_code).toBe("REQUEST_CREATED");
  expect(result.value.safe_reason).toBeTruthy();
  expect(result.value.audit_record_kind).toBeTruthy();
  expect(result.value.persistence_mapping.audit_record).toBe("AuditRecord");
  expect(result.value.persistence_mapping.related_first_slice_records).toEqual(
    relatedRecords,
  );
  expect(result.value.emission_mapping).toBe("not emitted in this phase");
  expect(result.value.immutability_note).toBe(
    "future audit records should be append-only",
  );
  expect(result.value.boundary_status).toBe("descriptor requirement only");
}

describe("audit commit boundary", () => {
  it("exports the deterministic model and functions", () => {
    const model = getAuditCommitBoundary();

    expect(model.phase).toBe("2U");
    expect(model.name).toBe("Audit Commit Boundary");
    expect(model.status).toBe(
      "pure TypeScript audit requirement boundary only",
    );
    expect(typeof evaluateAuditCommitBoundary).toBe("function");
    expect(typeof assertAuditCommitBoundary).toBe("function");
    expect(typeof failClosedAuditCommitBoundaryDenial).toBe("function");
  });

  it("defines exact audit commit moments", () => {
    expect(AuditCommitMoments).toEqual(EXPECTED_MOMENTS);
    expect(getAuditCommitBoundary().moments).toEqual(EXPECTED_MOMENTS);
  });

  it("defines exact requirement levels", () => {
    expect(AuditCommitRequirements).toEqual([
      "REQUIRED",
      "REQUIRED_LATER",
      "NOT_REQUIRED",
    ]);
  });

  it("marks lifecycle moments as REQUIRED", () => {
    expectRequirement("REQUEST_CREATED", "REQUIRED", ["GovernedRun"]);
    expectRequirement("CONTEXT_RESOLVED", "REQUIRED", [
      "GovernedRun",
      "RuntimeStateSnapshot",
    ]);
    expectRequirement("TENANT_BOUNDARY_CHECKED", "REQUIRED", [
      "GovernedRun",
    ]);
    expectRequirement("LIFECYCLE_TRANSITIONED", "REQUIRED", [
      "GovernedRun",
      "RuntimeStateSnapshot",
    ]);
  });

  it("marks policy and admission moments as REQUIRED", () => {
    expectRequirement("POLICY_EVALUATED", "REQUIRED", [
      "PolicyDecisionRecord",
    ]);
    expectRequirement("ADMISSION_DECIDED", "REQUIRED", [
      "PolicyDecisionRecord",
      "AdmissionDecisionRecord",
    ]);
  });

  it("marks approval moments as REQUIRED", () => {
    expectRequirement("APPROVAL_REQUESTED", "REQUIRED", ["ApprovalRequest"]);
    expectRequirement("APPROVAL_DECIDED", "REQUIRED", ["ApprovalRequest"]);
  });

  it("marks terminal run moments as REQUIRED", () => {
    for (const moment of [
      "RUN_COMPLETED",
      "RUN_REJECTED",
      "RUN_CANCELLED",
      "RUN_FAILED",
    ] as const) {
      expectRequirement(moment, "REQUIRED", [
        "GovernedRun",
        "RuntimeStateSnapshot",
      ]);
    }
  });

  it("marks investigation and replay preparation as REQUIRED_LATER", () => {
    expectRequirement("INVESTIGATION_PREPARED", "REQUIRED_LATER", [
      "AuditRecord",
    ]);
    expectRequirement("REPLAY_DRY_RUN_PREPARED", "REQUIRED_LATER", [
      "AuditRecord",
    ]);
  });

  it("returns safe denial for invalid or unknown input", () => {
    const missing = evaluateAuditCommitBoundary(undefined);
    const unknownMoment = evaluateAuditCommitBoundary({
      ...VALID_INPUT,
      moment: "UNKNOWN_MOMENT",
    });

    expect(missing.ok).toBe(false);
    expect(unknownMoment.ok).toBe(false);

    if (missing.ok || unknownMoment.ok) {
      throw new Error("Expected audit commit boundary denials.");
    }

    expect(missing.error).toMatchObject({
      outcome: "DENIED",
      code: "AUDIT_COMMIT_BOUNDARY_INPUT_REQUIRED",
      message: "The audit commit boundary input is not accepted.",
      safe: true,
    });
    expect(unknownMoment.error).toMatchObject({
      outcome: "DENIED",
      code: "AUDIT_COMMIT_BOUNDARY_MOMENT_INVALID",
      message: "The audit commit boundary input is not accepted.",
      safe: true,
    });
  });

  it("does not mutate input", () => {
    const input = Object.freeze(inputWith({ moment: "POLICY_EVALUATED" }));
    const before = { ...input };

    const result = evaluateAuditCommitBoundary(input);

    expect(result.ok).toBe(true);
    expect(input).toEqual(before);
  });

  it("decision includes required descriptor fields", () => {
    const result = evaluateAuditCommitBoundary(
      inputWith({ moment: "ADMISSION_DECIDED" }),
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected audit commit boundary decision.");
    }

    expect(result.value).toMatchObject({
      moment: "ADMISSION_DECIDED",
      requirement: "REQUIRED",
      reason_code: "REQUEST_CREATED",
      audit_record_kind: "RUNTIME_ADMISSION",
      emission_mapping: "not emitted in this phase",
      immutability_note: "future audit records should be append-only",
    });
    expect(result.value.safe_reason).toBeTruthy();
    expect(result.value.persistence_mapping.audit_record).toBe("AuditRecord");
  });

  it("maps relevant moments to first-slice records", () => {
    expectRequirement("POLICY_EVALUATED", "REQUIRED", [
      "PolicyDecisionRecord",
    ]);
    expectRequirement("ADMISSION_DECIDED", "REQUIRED", [
      "PolicyDecisionRecord",
      "AdmissionDecisionRecord",
    ]);
    expectRequirement("APPROVAL_REQUESTED", "REQUIRED", ["ApprovalRequest"]);
    expectRequirement("LIFECYCLE_TRANSITIONED", "REQUIRED", [
      "GovernedRun",
      "RuntimeStateSnapshot",
    ]);
    expectRequirement("RUN_COMPLETED", "REQUIRED", [
      "GovernedRun",
      "RuntimeStateSnapshot",
    ]);
  });

  it("does not claim records were written or events emitted", () => {
    const result = evaluateAuditCommitBoundary(
      inputWith({ moment: "POLICY_EVALUATED" }),
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected audit commit boundary decision.");
    }

    const text = collectStrings(result.value).join("\n").toLowerCase();

    expect(text).not.toContain("audit record was written");
    expect(text).not.toContain("audit record written");
    expect(text).not.toContain("event was emitted");
    expect(text).not.toContain("event emitted");
    expect(text).toContain("not emitted in this phase");
  });

  it("denials are safe and non-enumerating", () => {
    const denial = failClosedAuditCommitBoundaryDenial(
      {
        correlation_id: "correlation_01",
        raw_document_content: "Sensitive body",
      },
      "AUDIT_COMMIT_BOUNDARY_INPUT_INVALID",
    );
    const text = collectStrings(denial).join("\n").toLowerCase();

    expect(denial.safe).toBe(true);
    expect(denial.message).toBe(
      "The audit commit boundary input is not accepted.",
    );
    expect(text).not.toContain("sensitive body");
    expect(text).not.toContain("raw_document_content");
    expect(text).not.toContain("tenant exists");
  });

  it("schemas reject raw payload-like fields and unsafe metadata", () => {
    expect(
      AuditCommitBoundaryInputSchema.safeParse({
        ...VALID_INPUT,
        raw_document_content: "Sensitive body",
      }).success,
    ).toBe(false);

    expect(
      AuditCommitBoundaryInputSchema.safeParse({
        ...VALID_INPUT,
        subject_ref: "https://example.invalid/subject",
      }).success,
    ).toBe(false);

    expect(
      AuditCommitBoundaryInputSchema.safeParse({
        ...VALID_INPUT,
        metadata: {
          raw_payload: "unsafe",
        },
      }).success,
    ).toBe(false);
  });

  it("assert helper returns the same fail-closed Result style", () => {
    const accepted = assertAuditCommitBoundary(VALID_INPUT);
    const denied = assertAuditCommitBoundary(undefined);

    expect(accepted.ok).toBe(true);
    expect(denied.ok).toBe(false);
  });

  it("model preserves out-of-scope boundaries and source alignment", () => {
    const model = getAuditCommitBoundary();
    const text = collectStrings(model).join("\n").toLowerCase();

    expect(model.module_alignment).toContain("src/mycelia/audit-record/");
    expect(model.module_alignment).toContain("src/mycelia/audit-recorder/");
    expect(model.module_alignment).toContain(
      "src/mycelia/governed-run-lifecycle/",
    );
    expect(model.module_alignment).toContain(
      "src/mycelia/policy-admission-v1/",
    );
    expect(text).toContain("no runtime execution");
    expect(text).toContain("no persistence");
    expect(text).toContain("no audit record writing");
    expect(text).toContain("no append log writing");
    expect(text).not.toContain("runtime execution is active");
    expect(text).not.toContain("active persistence exists");
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
