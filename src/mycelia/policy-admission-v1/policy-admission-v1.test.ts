import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  PolicyAdmissionOutcomes,
  PolicyAdmissionRiskLevels,
  PolicyAdmissionV1InputSchema,
  assertPolicyAdmissionV1,
  evaluatePolicyAdmissionV1,
  failClosedPolicyAdmissionV1Denial,
  getPolicyAdmissionV1,
  type PolicyAdmissionContextStatus,
  type PolicyAdmissionTenantBoundaryStatus,
  type PolicyAdmissionV1InputCandidate,
} from ".";

const VALID_INPUT: PolicyAdmissionV1InputCandidate = {
  tenant_id: "tenant_01",
  run_id: "run_01",
  correlation_id: "correlation_01",
  requester_ref: "requester_ref_01",
  resource_ref: "resource_ref_01",
  action: "document.review",
  purpose: "governed compliance review",
  risk_level: "LOW",
  context_status: "RESOLVED",
  tenant_boundary_status: "MATCHED",
  has_required_context: true,
  policy_ref: "policy_ref_01",
  metadata: {
    scenario: "pilot",
  },
};

function inputWith(
  overrides: Partial<PolicyAdmissionV1InputCandidate>,
): PolicyAdmissionV1InputCandidate {
  return {
    ...VALID_INPUT,
    ...overrides,
  };
}

function expectDecision(
  input: PolicyAdmissionV1InputCandidate,
  expected: {
    readonly outcome: "ADMIT" | "REQUIRE_APPROVAL" | "DENY";
    readonly reason_code: string;
    readonly lifecycle_intent_hint:
      | "GRANT_ADMISSION"
      | "REQUIRE_APPROVAL"
      | "REJECT";
    readonly requires_approval: boolean;
  },
): void {
  const result = evaluatePolicyAdmissionV1(input);

  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error("Expected policy/admission decision.");
  }

  expect(result.value.outcome).toBe(expected.outcome);
  expect(result.value.risk_level).toBe(input.risk_level);
  expect(result.value.reason_code).toBe(expected.reason_code);
  expect(result.value.safe_reason).toBeTruthy();
  expect(result.value.requires_approval).toBe(expected.requires_approval);
  expect(result.value.lifecycle_intent_hint).toBe(
    expected.lifecycle_intent_hint,
  );
  expect(result.value.persistence_mapping.policy_decision_record).toBe(
    "PolicyDecisionRecord",
  );
  expect(result.value.persistence_mapping.admission_decision_record).toBe(
    "AdmissionDecisionRecord",
  );
  expect(result.value.persistence_mapping.audit_record).toBe(
    "AuditRecord later",
  );
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

describe("policy/admission v1", () => {
  it("exports the deterministic model and functions", () => {
    const model = getPolicyAdmissionV1();

    expect(model.phase).toBe("2T");
    expect(model.name).toBe("Policy/Admission v1");
    expect(model.status).toBe(
      "pure TypeScript deterministic policy/admission logic only",
    );
    expect(typeof evaluatePolicyAdmissionV1).toBe("function");
    expect(typeof assertPolicyAdmissionV1).toBe("function");
    expect(typeof failClosedPolicyAdmissionV1Denial).toBe("function");
  });

  it("defines exact risk levels", () => {
    expect(PolicyAdmissionRiskLevels).toEqual([
      "LOW",
      "MEDIUM",
      "HIGH",
      "UNKNOWN",
      "UNSAFE",
    ]);
  });

  it("defines exact admission outcomes", () => {
    expect(PolicyAdmissionOutcomes).toEqual([
      "ADMIT",
      "REQUIRE_APPROVAL",
      "DENY",
    ]);
  });

  it("admits LOW risk with resolved context and matched boundary", () => {
    expectDecision(inputWith({ risk_level: "LOW" }), {
      outcome: "ADMIT",
      reason_code: "LOW_RISK_ADMITTED",
      lifecycle_intent_hint: "GRANT_ADMISSION",
      requires_approval: false,
    });
  });

  it("requires approval for MEDIUM risk with resolved context and matched boundary", () => {
    expectDecision(inputWith({ risk_level: "MEDIUM" }), {
      outcome: "REQUIRE_APPROVAL",
      reason_code: "MEDIUM_RISK_REQUIRES_APPROVAL",
      lifecycle_intent_hint: "REQUIRE_APPROVAL",
      requires_approval: true,
    });
  });

  it("denies HIGH risk", () => {
    expectDecision(inputWith({ risk_level: "HIGH" }), {
      outcome: "DENY",
      reason_code: "HIGH_RISK_DENIED",
      lifecycle_intent_hint: "REJECT",
      requires_approval: false,
    });
  });

  it("requires approval for UNKNOWN risk with resolved context and matched boundary", () => {
    expectDecision(inputWith({ risk_level: "UNKNOWN" }), {
      outcome: "REQUIRE_APPROVAL",
      reason_code: "UNKNOWN_RISK_REQUIRES_APPROVAL",
      lifecycle_intent_hint: "REQUIRE_APPROVAL",
      requires_approval: true,
    });
  });

  it("denies or requires approval for UNKNOWN according to context and boundary rules", () => {
    const cases: readonly [
      PolicyAdmissionContextStatus,
      PolicyAdmissionTenantBoundaryStatus,
      "DENY" | "REQUIRE_APPROVAL",
      string,
    ][] = [
      [
        "RESOLVED",
        "MATCHED",
        "REQUIRE_APPROVAL",
        "UNKNOWN_RISK_REQUIRES_APPROVAL",
      ],
      ["MISSING", "MATCHED", "DENY", "MISSING_CONTEXT_DENIED"],
      [
        "AMBIGUOUS",
        "MATCHED",
        "REQUIRE_APPROVAL",
        "AMBIGUOUS_CONTEXT_REQUIRES_APPROVAL",
      ],
      ["RESOLVED", "MISMATCHED", "DENY", "TENANT_BOUNDARY_MISMATCH_DENIED"],
      ["RESOLVED", "UNKNOWN", "DENY", "TENANT_BOUNDARY_UNKNOWN_DENIED"],
    ];

    for (const [
      context_status,
      tenant_boundary_status,
      outcome,
      reason_code,
    ] of cases) {
      expectDecision(
        inputWith({
          risk_level: "UNKNOWN",
          context_status,
          tenant_boundary_status,
        }),
        {
          outcome,
          reason_code,
          lifecycle_intent_hint:
            outcome === "REQUIRE_APPROVAL" ? "REQUIRE_APPROVAL" : "REJECT",
          requires_approval: outcome === "REQUIRE_APPROVAL",
        },
      );
    }
  });

  it("denies UNSAFE risk", () => {
    expectDecision(inputWith({ risk_level: "UNSAFE" }), {
      outcome: "DENY",
      reason_code: "UNSAFE_RISK_DENIED",
      lifecycle_intent_hint: "REJECT",
      requires_approval: false,
    });
  });

  it("denies when required context is missing", () => {
    expectDecision(inputWith({ has_required_context: false }), {
      outcome: "DENY",
      reason_code: "MISSING_REQUIRED_CONTEXT_DENIED",
      lifecycle_intent_hint: "REJECT",
      requires_approval: false,
    });
  });

  it("denies contextStatus MISSING", () => {
    expectDecision(inputWith({ context_status: "MISSING" }), {
      outcome: "DENY",
      reason_code: "MISSING_CONTEXT_DENIED",
      lifecycle_intent_hint: "REJECT",
      requires_approval: false,
    });
  });

  it("requires approval for AMBIGUOUS context with matched boundary", () => {
    expectDecision(inputWith({ context_status: "AMBIGUOUS" }), {
      outcome: "REQUIRE_APPROVAL",
      reason_code: "AMBIGUOUS_CONTEXT_REQUIRES_APPROVAL",
      lifecycle_intent_hint: "REQUIRE_APPROVAL",
      requires_approval: true,
    });
  });

  it("denies AMBIGUOUS context with unknown or mismatched boundary", () => {
    expectDecision(
      inputWith({
        context_status: "AMBIGUOUS",
        tenant_boundary_status: "UNKNOWN",
      }),
      {
        outcome: "DENY",
        reason_code: "TENANT_BOUNDARY_UNKNOWN_DENIED",
        lifecycle_intent_hint: "REJECT",
        requires_approval: false,
      },
    );

    expectDecision(
      inputWith({
        context_status: "AMBIGUOUS",
        tenant_boundary_status: "MISMATCHED",
      }),
      {
        outcome: "DENY",
        reason_code: "TENANT_BOUNDARY_MISMATCH_DENIED",
        lifecycle_intent_hint: "REJECT",
        requires_approval: false,
      },
    );
  });

  it("denies tenantBoundaryStatus MISMATCHED", () => {
    expectDecision(inputWith({ tenant_boundary_status: "MISMATCHED" }), {
      outcome: "DENY",
      reason_code: "TENANT_BOUNDARY_MISMATCH_DENIED",
      lifecycle_intent_hint: "REJECT",
      requires_approval: false,
    });
  });

  it("denies tenantBoundaryStatus UNKNOWN", () => {
    expectDecision(inputWith({ tenant_boundary_status: "UNKNOWN" }), {
      outcome: "DENY",
      reason_code: "TENANT_BOUNDARY_UNKNOWN_DENIED",
      lifecycle_intent_hint: "REJECT",
      requires_approval: false,
    });
  });

  it("returns safe denial for invalid input", () => {
    const result = evaluatePolicyAdmissionV1(undefined);

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected policy/admission denial.");
    }

    expect(result.error).toMatchObject({
      outcome: "DENIED",
      code: "POLICY_ADMISSION_INPUT_REQUIRED",
      message: "The policy/admission input is not accepted.",
      safe: true,
    });
    expect(result.error.safe_reason).toBe(
      "A policy/admission input is required.",
    );
  });

  it("does not mutate input", () => {
    const input = Object.freeze(inputWith({ risk_level: "MEDIUM" }));
    const before = { ...input };

    const result = evaluatePolicyAdmissionV1(input);

    expect(result.ok).toBe(true);
    expect(input).toEqual(before);
  });

  it("maps outcomes to governed-run-lifecycle intents", () => {
    expectDecision(inputWith({ risk_level: "LOW" }), {
      outcome: "ADMIT",
      reason_code: "LOW_RISK_ADMITTED",
      lifecycle_intent_hint: "GRANT_ADMISSION",
      requires_approval: false,
    });
    expectDecision(inputWith({ risk_level: "MEDIUM" }), {
      outcome: "REQUIRE_APPROVAL",
      reason_code: "MEDIUM_RISK_REQUIRES_APPROVAL",
      lifecycle_intent_hint: "REQUIRE_APPROVAL",
      requires_approval: true,
    });
    expectDecision(inputWith({ risk_level: "HIGH" }), {
      outcome: "DENY",
      reason_code: "HIGH_RISK_DENIED",
      lifecycle_intent_hint: "REJECT",
      requires_approval: false,
    });
  });

  it("includes ApprovalRequest in conceptual mapping only when approval is required", () => {
    const approval = evaluatePolicyAdmissionV1(
      inputWith({ risk_level: "MEDIUM" }),
    );
    const admit = evaluatePolicyAdmissionV1(inputWith({ risk_level: "LOW" }));

    expect(approval.ok).toBe(true);
    expect(admit.ok).toBe(true);

    if (!approval.ok || !admit.ok) {
      throw new Error("Expected policy/admission decisions.");
    }

    expect(approval.value.persistence_mapping.approval_request_record).toBe(
      "ApprovalRequest",
    );
    expect(admit.value.persistence_mapping.approval_request_record).toBe(
      undefined,
    );
  });

  it("does not include raw document content in decisions", () => {
    const result = evaluatePolicyAdmissionV1(inputWith({ risk_level: "LOW" }));

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected policy/admission decision.");
    }

    const text = collectStrings(result.value).join("\n").toLowerCase();

    expect(text).not.toContain("document content");
    expect(text).not.toContain("raw payload");
    expect(text).not.toContain("credential");
    expect(text).not.toContain("token");
  });

  it("schemas reject unbounded or raw payload-like fields", () => {
    expect(
      PolicyAdmissionV1InputSchema.safeParse({
        ...VALID_INPUT,
        raw_document_content: "Sensitive body",
      }).success,
    ).toBe(false);

    expect(
      PolicyAdmissionV1InputSchema.safeParse({
        ...VALID_INPUT,
        metadata: {
          raw_payload: "unsafe",
        },
      }).success,
    ).toBe(false);

    expect(
      PolicyAdmissionV1InputSchema.safeParse({
        ...VALID_INPUT,
        resource_ref: "https://example.invalid/document",
      }).success,
    ).toBe(false);
  });

  it("assertion helper throws a safe generic error only", () => {
    expect(() => assertPolicyAdmissionV1(VALID_INPUT)).not.toThrow();
    expect(() => assertPolicyAdmissionV1(undefined)).toThrow(
      "Policy/admission v1 decision denied.",
    );
  });

  it("model preserves out-of-scope boundaries and source alignment", () => {
    const model = getPolicyAdmissionV1();
    const text = collectStrings(model).join("\n").toLowerCase();

    expect(model.module_alignment).toContain(
      "src/mycelia/policy-decision-gateway/",
    );
    expect(model.module_alignment).toContain(
      "src/mycelia/runtime-admission-gateway/",
    );
    expect(model.module_alignment).toContain(
      "src/mycelia/governed-run-lifecycle/",
    );
    expect(text).toContain("no runtime execution");
    expect(text).toContain("no persistence");
    expect(text).toContain("no db access");
    expect(text).toContain("no audit record writing");
    expect(text).not.toContain("runtime execution is active");
    expect(text).not.toContain("active persistence exists");
  });

  it("does not modify package.json or pnpm-lock.yaml", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "package.json", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(status.trim()).toBe("");
  });
});
