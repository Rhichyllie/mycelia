import { describe, expect, it } from "vitest";

import { PolicyDecisionSchema, type PolicyDecisionInput } from "./policy-decision";

export function validDecision(
  overrides: Partial<PolicyDecisionInput> = {},
): PolicyDecisionInput {
  const decision: PolicyDecisionInput = {
    decision_id: "policy_decision_01",
    decision_request_id: "policy_decision_request_01",
    tenant_id: "tenant_policy_01",
    outcome: "ALLOW",
    obligations: [
      {
        obligation_type: "EMIT_AUDIT",
        severity: "REQUIRED",
        reason_code: "GOVERNANCE_AUDIT_REQUIRED",
      },
      {
        obligation_type: "CAPTURE_EVIDENCE",
        severity: "ADVISORY",
      },
    ],
    policy_basis_ref: "policy_basis_01",
    decided_at: "2026-06-06T12:00:01.000Z",
    reason_code: "POLICY_ALLOWED",
    message: "The policy decision allows the operation.",
  };

  return { ...decision, ...overrides };
}

describe("PolicyDecisionSchema", () => {
  it("accepts typed obligations without executing them", () => {
    const parsed = PolicyDecisionSchema.parse(validDecision());

    expect(parsed.obligations).toHaveLength(2);
    expect(parsed.obligations[0]?.obligation_type).toBe("EMIT_AUDIT");
  });

  it("accepts ABSTAIN and NOT_APPLICABLE as explicit fail-closed outcomes", () => {
    expect(
      PolicyDecisionSchema.safeParse(validDecision({ outcome: "ABSTAIN" }))
        .success,
    ).toBe(true);
    expect(
      PolicyDecisionSchema.safeParse(
        validDecision({ outcome: "NOT_APPLICABLE" }),
      ).success,
    ).toBe(true);
  });

  it("rejects unsafe decision messages", () => {
    expect(
      PolicyDecisionSchema.safeParse(
        validDecision({
          message: "Role admin permission tool.invoke.request was missing.",
        }),
      ).success,
    ).toBe(false);
  });
});
