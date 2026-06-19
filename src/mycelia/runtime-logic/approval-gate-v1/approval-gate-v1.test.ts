import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  ApprovalGateDecisionOutcomes,
  ApprovalGateRequestStatuses,
  ApprovalGateV1InputSchema,
  assertApprovalGateV1,
  evaluateApprovalGateV1,
  failClosedApprovalGateV1Denial,
  getApprovalGateV1,
  type ApprovalGateDecisionOutcome,
  type ApprovalGateRequestStatus,
  type ApprovalGateV1InputCandidate,
} from ".";

const VALID_INPUT: ApprovalGateV1InputCandidate = {
  tenant_id: "tenant_01",
  run_id: "run_01",
  correlation_id: "correlation_01",
  approval_request_id: "approval_request_01",
  requested_role: "compliance reviewer",
  requester_ref: "requester_ref_01",
  approver_ref: "approver_ref_01",
  current_status: "PENDING",
  decision_outcome: "APPROVE",
  decision_reason_code: "APPROVAL_DECIDED",
  safe_decision_summary: "Approval gate decision accepted.",
  policy_admission_outcome: "REQUIRE_APPROVAL",
  risk_level: "MEDIUM",
  metadata: {
    scenario: "pilot",
  },
};

function inputWith(
  overrides: Partial<ApprovalGateV1InputCandidate>,
): ApprovalGateV1InputCandidate {
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

function expectApprovalDecision(
  decision_outcome: ApprovalGateDecisionOutcome,
  expected: {
    readonly next_status: ApprovalGateRequestStatus;
    readonly lifecycle_intent_hint: string;
    readonly reason_code: string;
  },
): void {
  const result = evaluateApprovalGateV1(inputWith({ decision_outcome }));

  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error("Expected approval gate decision.");
  }

  expect(result.value.approval_request_id).toBe("approval_request_01");
  expect(result.value.previous_status).toBe("PENDING");
  expect(result.value.next_status).toBe(expected.next_status);
  expect(result.value.decision_outcome).toBe(decision_outcome);
  expect(result.value.reason_code).toBe(expected.reason_code);
  expect(result.value.safe_reason).toBeTruthy();
  expect(result.value.lifecycle_intent_hint).toBe(
    expected.lifecycle_intent_hint,
  );
  expect(result.value.audit_boundary_moments).toContain(
    "APPROVAL_REQUESTED",
  );
  expect(result.value.audit_boundary_moments).toContain("APPROVAL_DECIDED");
  expect(result.value.persistence_mapping.approval_request).toBe(
    "ApprovalRequest",
  );
  expect(result.value.persistence_mapping.admission_decision_record).toBe(
    "AdmissionDecisionRecord",
  );
  expect(result.value.persistence_mapping.governed_run).toBe("GovernedRun");
  expect(result.value.persistence_mapping.runtime_state_snapshot).toBe(
    "RuntimeStateSnapshot",
  );
  expect(result.value.persistence_mapping.audit_record).toBe(
    "AuditRecord later",
  );
}

describe("approval gate v1", () => {
  it("exports the deterministic model and functions", () => {
    const model = getApprovalGateV1();

    expect(model.phase).toBe("2V");
    expect(model.name).toBe("Approval Gate v1");
    expect(model.status).toBe(
      "pure TypeScript deterministic approval gate logic only",
    );
    expect(typeof evaluateApprovalGateV1).toBe("function");
    expect(typeof assertApprovalGateV1).toBe("function");
    expect(typeof failClosedApprovalGateV1Denial).toBe("function");
  });

  it("defines exact approval request statuses", () => {
    expect(ApprovalGateRequestStatuses).toEqual([
      "PENDING",
      "APPROVED",
      "REJECTED",
      "TIMED_OUT",
      "CANCELLED",
    ]);
  });

  it("defines exact approval decision outcomes", () => {
    expect(ApprovalGateDecisionOutcomes).toEqual([
      "APPROVE",
      "REJECT",
      "TIMEOUT",
      "CANCEL",
    ]);
  });

  it("approves from PENDING with REQUIRE_APPROVAL", () => {
    expectApprovalDecision("APPROVE", {
      next_status: "APPROVED",
      lifecycle_intent_hint: "APPROVE",
      reason_code: "APPROVAL_ACCEPTED",
    });
  });

  it("rejects from PENDING with REQUIRE_APPROVAL", () => {
    expectApprovalDecision("REJECT", {
      next_status: "REJECTED",
      lifecycle_intent_hint: "REJECT",
      reason_code: "APPROVAL_REJECTED",
    });
  });

  it("times out from PENDING as operational failure", () => {
    expectApprovalDecision("TIMEOUT", {
      next_status: "TIMED_OUT",
      lifecycle_intent_hint: "FAIL_RUN",
      reason_code: "APPROVAL_TIMED_OUT",
    });

    const result = evaluateApprovalGateV1(
      inputWith({ decision_outcome: "TIMEOUT" }),
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected approval gate timeout decision.");
    }

    expect(result.value.safe_reason.toLowerCase()).toContain(
      "operational failure",
    );
  });

  it("cancels from PENDING", () => {
    expectApprovalDecision("CANCEL", {
      next_status: "CANCELLED",
      lifecycle_intent_hint: "CANCEL_RUN",
      reason_code: "APPROVAL_CANCELLED",
    });
  });

  it("denies transitions from non-PENDING statuses", () => {
    for (const current_status of [
      "APPROVED",
      "REJECTED",
      "TIMED_OUT",
      "CANCELLED",
    ] as const) {
      const result = evaluateApprovalGateV1(inputWith({ current_status }));

      expect(result.ok).toBe(false);

      if (result.ok) {
        throw new Error("Expected approval gate denial.");
      }

      expect(result.error.code).toBe("APPROVAL_GATE_STATUS_NOT_PENDING");
      expect(result.error.message).toBe(
        "The approval gate input is not accepted.",
      );
      expect(result.error.safe).toBe(true);
    }
  });

  it("denies when policy/admission outcome is not REQUIRE_APPROVAL", () => {
    for (const policy_admission_outcome of ["ADMIT", "DENY"] as const) {
      const result = evaluateApprovalGateV1(
        inputWith({ policy_admission_outcome }),
      );

      expect(result.ok).toBe(false);

      if (result.ok) {
        throw new Error("Expected approval gate denial.");
      }

      expect(result.error.code).toBe(
        "APPROVAL_GATE_POLICY_ADMISSION_NOT_APPROVAL",
      );
      expect(result.error.safe_reason).toBe(
        "Approval gate resolution requires an approval-required admission outcome.",
      );
    }
  });

  it("returns safe denial for invalid input", () => {
    const result = evaluateApprovalGateV1(undefined);

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected approval gate denial.");
    }

    expect(result.error).toMatchObject({
      outcome: "DENIED",
      code: "APPROVAL_GATE_INPUT_REQUIRED",
      message: "The approval gate input is not accepted.",
      safe: true,
    });
    expect(result.error.safe_reason).toBe(
      "An approval gate input is required.",
    );
  });

  it("does not mutate input", () => {
    const input = Object.freeze(inputWith({ decision_outcome: "REJECT" }));
    const before = { ...input };

    const result = evaluateApprovalGateV1(input);

    expect(result.ok).toBe(true);
    expect(input).toEqual(before);
  });

  it("decision includes required descriptor fields", () => {
    const result = evaluateApprovalGateV1(VALID_INPUT);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected approval gate decision.");
    }

    expect(result.value).toMatchObject({
      approval_request_id: "approval_request_01",
      previous_status: "PENDING",
      next_status: "APPROVED",
      decision_outcome: "APPROVE",
      reason_code: "APPROVAL_ACCEPTED",
      lifecycle_intent_hint: "APPROVE",
      boundary_status: "descriptor decision only",
    });
    expect(result.value.safe_reason).toBeTruthy();
    expect(result.value.audit_boundary_moments).toEqual([
      "APPROVAL_REQUESTED",
      "APPROVAL_DECIDED",
    ]);
    expect(result.value.persistence_mapping.approval_request).toBe(
      "ApprovalRequest",
    );
  });

  it("maps approval statuses to governed-run-lifecycle intents", () => {
    expectApprovalDecision("APPROVE", {
      next_status: "APPROVED",
      lifecycle_intent_hint: "APPROVE",
      reason_code: "APPROVAL_ACCEPTED",
    });
    expectApprovalDecision("REJECT", {
      next_status: "REJECTED",
      lifecycle_intent_hint: "REJECT",
      reason_code: "APPROVAL_REJECTED",
    });
    expectApprovalDecision("TIMEOUT", {
      next_status: "TIMED_OUT",
      lifecycle_intent_hint: "FAIL_RUN",
      reason_code: "APPROVAL_TIMED_OUT",
    });
    expectApprovalDecision("CANCEL", {
      next_status: "CANCELLED",
      lifecycle_intent_hint: "CANCEL_RUN",
      reason_code: "APPROVAL_CANCELLED",
    });
  });

  it("maps to audit boundary moments and persistence records", () => {
    const result = evaluateApprovalGateV1(VALID_INPUT);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected approval gate decision.");
    }

    expect(result.value.audit_boundary_moments).toContain(
      "APPROVAL_REQUESTED",
    );
    expect(result.value.audit_boundary_moments).toContain("APPROVAL_DECIDED");
    expect(result.value.persistence_mapping).toEqual({
      approval_request: "ApprovalRequest",
      admission_decision_record: "AdmissionDecisionRecord",
      governed_run: "GovernedRun",
      runtime_state_snapshot: "RuntimeStateSnapshot",
      audit_record: "AuditRecord later",
    });
  });

  it("does not include raw document content in decisions", () => {
    const result = evaluateApprovalGateV1(VALID_INPUT);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected approval gate decision.");
    }

    const text = collectStrings(result.value).join("\n").toLowerCase();

    expect(text).not.toContain("document content");
    expect(text).not.toContain("raw payload");
    expect(text).not.toContain("credential");
    expect(text).not.toContain("token");
  });

  it("schemas reject unbounded or raw payload-like fields", () => {
    expect(
      ApprovalGateV1InputSchema.safeParse({
        ...VALID_INPUT,
        raw_document_content: "Sensitive body",
      }).success,
    ).toBe(false);

    expect(
      ApprovalGateV1InputSchema.safeParse({
        ...VALID_INPUT,
        metadata: {
          raw_payload: "unsafe",
        },
      }).success,
    ).toBe(false);

    expect(
      ApprovalGateV1InputSchema.safeParse({
        ...VALID_INPUT,
        safe_decision_summary:
          "This summary is intentionally made longer than the bounded safe reference length for the approval gate decision summary so validation rejects it because approval summaries must remain compact, safe, and non-enumerating.",
      }).success,
    ).toBe(false);
  });

  it("denials are safe and non-enumerating", () => {
    const denial = failClosedApprovalGateV1Denial(
      {
        correlation_id: "correlation_01",
        raw_document_content: "Sensitive body",
      },
      "APPROVAL_GATE_INPUT_INVALID",
    );
    const text = collectStrings(denial).join("\n").toLowerCase();

    expect(denial.safe).toBe(true);
    expect(denial.message).toBe("The approval gate input is not accepted.");
    expect(text).not.toContain("sensitive body");
    expect(text).not.toContain("raw_document_content");
    expect(text).not.toContain("tenant exists");
  });

  it("assertion helper throws a safe generic error only", () => {
    expect(() => assertApprovalGateV1(VALID_INPUT)).not.toThrow();
    expect(() => assertApprovalGateV1(undefined)).toThrow(
      "Approval gate v1 decision denied.",
    );
  });

  it("model preserves out-of-scope boundaries and source alignment", () => {
    const model = getApprovalGateV1();
    const text = collectStrings(model).join("\n").toLowerCase();

    expect(model.module_alignment).toContain(
      "src/mycelia/runtime-logic/policy-admission-v1/",
    );
    expect(model.module_alignment).toContain(
      "src/mycelia/runtime-logic/governed-run-lifecycle/",
    );
    expect(model.module_alignment).toContain(
      "src/mycelia/runtime-logic/audit-commit-boundary/",
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
