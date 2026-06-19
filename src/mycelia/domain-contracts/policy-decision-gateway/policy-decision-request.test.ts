import { describe, expect, it } from "vitest";

import {
  PolicyDecisionRequestSchema,
  type PolicyDecisionRequestInput,
} from "./policy-decision-request";
import { validatePolicyDecisionRequest } from "./policy-checks";

function validRequest(
  overrides: Partial<PolicyDecisionRequestInput> = {},
): PolicyDecisionRequestInput {
  const request: PolicyDecisionRequestInput = {
    decision_request_id: "policy_decision_request_01",
    tenant_id: "tenant_policy_01",
    workspace_id: "workspace_policy_01",
    project_id: "project_policy_01",
    action: "tool.invoke.request",
    resource: {
      resource_type: "tool.invocation",
      resource_id: "tool_invocation_01",
      scope: "PROJECT",
      tenant_id: "tenant_policy_01",
      workspace_id: "workspace_policy_01",
      project_id: "project_policy_01",
    },
    runtime_identity_id: "runtime_identity_policy_01",
    actor_id: "actor_policy_01",
    origin: "HUMAN_UI",
    declared_purpose: "govern tool invocation request",
    data_classification: "CONFIDENTIAL",
    created_at: "2026-06-06T12:00:00.000Z",
    correlation_id: "correlation_policy_01",
    causation_id: "causation_policy_01",
    source_request_id: "request_policy_01",
    source_event_id: "event_policy_01",
    metadata: {
      component: "policy-decision-gateway-test",
    },
  };

  return { ...request, ...overrides };
}

describe("PolicyDecisionRequestSchema", () => {
  it("creates a valid decision request", () => {
    const parsed = PolicyDecisionRequestSchema.safeParse(validRequest());

    expect(parsed.success).toBe(true);
  });

  it("rejects missing tenant_id", () => {
    const result = validatePolicyDecisionRequest(
      validRequest({ tenant_id: undefined }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects resource scope mismatches", () => {
    const result = validatePolicyDecisionRequest(
      validRequest({
        resource: {
          resource_type: "tool.invocation",
          scope: "PROJECT",
          tenant_id: "tenant_policy_02",
          workspace_id: "workspace_policy_01",
          project_id: "project_policy_01",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("POLICY_DECISION_REQUEST_INVALID");
    }
  });

  it("does not infer tenant from metadata, email, URL, prefix, or display name", () => {
    const result = validatePolicyDecisionRequest(
      validRequest({
        tenant_id: undefined,
        metadata: {
          source: "tenant-acme-prefix",
          note: "person@example.com",
          label: "Acme Corporation",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects unsafe policy metadata", () => {
    const result = validatePolicyDecisionRequest(
      validRequest({
        metadata: {
          token: "secret",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_POLICY_METADATA");
    }
  });
});
