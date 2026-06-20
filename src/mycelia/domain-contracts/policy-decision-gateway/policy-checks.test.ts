import { describe, expect, it } from "vitest";

import {
  assertPolicyAllows,
  ensurePolicyDecisionIsConclusive,
  ensurePolicyDecisionTenantMatchesRequest,
  failClosedPolicyDecision,
  isPolicyAllowed,
  isPolicyDenied,
  requiresPolicyApproval,
  validatePolicyDecision,
  validatePolicyDecisionRequest,
} from "./policy-checks";
import {
  PolicyDecisionRequestSchema,
  type PolicyDecisionRequestInput,
} from "./policy-decision-request";
import { PolicyDecisionSchema, type PolicyDecisionInput } from "./policy-decision";

function requestInput(
  overrides: Partial<PolicyDecisionRequestInput> = {},
): PolicyDecisionRequestInput {
  return {
    decision_request_id: "policy_decision_request_01",
    tenant_id: "tenant_policy_01",
    workspace_id: "workspace_policy_01",
    project_id: "project_policy_01",
    action: "tool.invoke.request",
    resource: {
      resource_type: "tool.invocation",
      scope: "PROJECT",
      tenant_id: "tenant_policy_01",
      workspace_id: "workspace_policy_01",
      project_id: "project_policy_01",
    },
    runtime_identity_id: "runtime_identity_policy_01",
    origin: "SERVICE_INTERNAL",
    declared_purpose: "govern tool invocation request",
    data_classification: "CONFIDENTIAL",
    created_at: "2026-06-06T12:00:00.000Z",
    correlation_id: "correlation_policy_01",
    ...overrides,
  };
}

function decisionInput(
  overrides: Partial<PolicyDecisionInput> = {},
): PolicyDecisionInput {
  return {
    decision_id: "policy_decision_01",
    decision_request_id: "policy_decision_request_01",
    tenant_id: "tenant_policy_01",
    outcome: "ALLOW",
    obligations: [],
    policy_basis_ref: "policy_basis_01",
    decided_at: "2026-06-06T12:00:01.000Z",
    reason_code: "POLICY_ALLOWED",
    message: "The policy decision allows the operation.",
    ...overrides,
  };
}

function parsedRequest(overrides: Partial<PolicyDecisionRequestInput> = {}) {
  return PolicyDecisionRequestSchema.parse(requestInput(overrides));
}

function parsedDecision(overrides: Partial<PolicyDecisionInput> = {}) {
  return PolicyDecisionSchema.parse(decisionInput(overrides));
}

describe("policy checks", () => {
  it("accepts ALLOW only when tenant matches request and decision is conclusive", () => {
    const request = parsedRequest();
    const decision = parsedDecision({ outcome: "ALLOW" });

    expect(isPolicyAllowed(decision)).toBe(true);
    expect(ensurePolicyDecisionTenantMatchesRequest(request, decision).ok).toBe(
      true,
    );
    expect(ensurePolicyDecisionIsConclusive(decision).ok).toBe(true);
    expect(assertPolicyAllows(request, decision).ok).toBe(true);
  });

  it("blocks DENY decisions", () => {
    const result = assertPolicyAllows(
      parsedRequest(),
      parsedDecision({
        outcome: "DENY",
        reason_code: "POLICY_DENIED",
        message: "The policy decision does not allow the operation.",
      }),
    );

    expect(isPolicyDenied(parsedDecision({ outcome: "DENY" }))).toBe(true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("POLICY_DECISION_NOT_ALLOWED");
    }
  });

  it("does not treat REQUIRE_APPROVAL as ALLOW", () => {
    const decision = parsedDecision({
      outcome: "REQUIRE_APPROVAL",
      reason_code: "POLICY_APPROVAL_REQUIRED",
      message: "The operation requires approval before proceeding.",
    });
    const result = assertPolicyAllows(parsedRequest(), decision);

    expect(requiresPolicyApproval(decision)).toBe(true);
    expect(isPolicyAllowed(decision)).toBe(false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("POLICY_APPROVAL_REQUIRED");
    }
  });

  it("fails closed when decision is missing", () => {
    const result = assertPolicyAllows(parsedRequest(), undefined);

    expect(isPolicyDenied(undefined)).toBe(true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("POLICY_DECISION_REQUIRED");
    }
  });

  it("fails closed for ABSTAIN and NOT_APPLICABLE", () => {
    for (const outcome of ["ABSTAIN", "NOT_APPLICABLE"] as const) {
      const decision = parsedDecision({
        outcome,
        reason_code: "POLICY_INCONCLUSIVE",
        message: "The policy decision is not conclusive for this operation.",
      });
      const result = assertPolicyAllows(parsedRequest(), decision);

      expect(isPolicyDenied(decision)).toBe(true);
      expect(ensurePolicyDecisionIsConclusive(decision).ok).toBe(false);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("POLICY_DECISION_INCONCLUSIVE");
      }
    }
  });

  it("fails closed for malformed decision-like outcomes", () => {
    const malformedDecision = { outcome: "MAYBE" };

    expect(isPolicyDenied(malformedDecision)).toBe(true);
    expect(ensurePolicyDecisionIsConclusive(malformedDecision).ok).toBe(false);
  });

  it("rejects tenant mismatches between request and decision", () => {
    const result = assertPolicyAllows(
      parsedRequest(),
      parsedDecision({ tenant_id: "tenant_policy_02" }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("POLICY_DECISION_TENANT_MISMATCH");
    }
  });

  it("creates a deny decision for fail-closed fallback", () => {
    const decision = failClosedPolicyDecision(parsedRequest());

    expect(decision.outcome).toBe("DENY");
    expect(decision.obligations[0]?.obligation_type).toBe("EMIT_AUDIT");
  });

  it("validates decision requests and decisions through Result helpers", () => {
    expect(validatePolicyDecisionRequest(requestInput()).ok).toBe(true);
    expect(validatePolicyDecision(decisionInput()).ok).toBe(true);
    expect(validatePolicyDecision(undefined).ok).toBe(false);
  });
});
