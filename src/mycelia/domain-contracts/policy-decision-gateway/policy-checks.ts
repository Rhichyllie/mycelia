import {
  err,
  ok,
  type Result,
  type TenantId,
} from "../../foundation/shared-kernel";

import {
  PolicyActionSchema,
} from "./policy-action";
import {
  PolicyDecisionSchema,
  type PolicyDecision,
} from "./policy-decision";
import {
  PolicyDecisionRequestSchema,
  type PolicyDecisionRequest,
} from "./policy-decision-request";
import {
  createPolicyDenial,
  type PolicyDenial,
} from "./policy-denial";
import {
  PolicyPurposeSchema,
  SafePolicyMetadataSchema,
} from "./policy-purpose";
import { PolicyResourceDescriptorSchema } from "./policy-resource";

type PolicyDecisionLike =
  | {
      readonly tenant_id?: TenantId;
      readonly outcome?: string;
    }
  | null
  | undefined;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

export function validatePolicyDecisionRequest(
  input: unknown,
): Result<PolicyDecisionRequest, PolicyDenial> {
  if (!isRecord(input)) {
    return err(
      createPolicyDenial({ code: "POLICY_DECISION_REQUEST_INVALID" }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createPolicyDenial({ code: "TENANT_ID_REQUIRED" }));
  }
  if (input.action === undefined) {
    return err(createPolicyDenial({ code: "ACTION_REQUIRED" }));
  }
  if (input.resource === undefined) {
    return err(createPolicyDenial({ code: "RESOURCE_REQUIRED" }));
  }
  if (input.runtime_identity_id === undefined) {
    return err(createPolicyDenial({ code: "RUNTIME_IDENTITY_REQUIRED" }));
  }
  if (
    typeof input.declared_purpose !== "string" ||
    input.declared_purpose.length === 0
  ) {
    return err(createPolicyDenial({ code: "PURPOSE_REQUIRED" }));
  }
  if (!PolicyActionSchema.safeParse(input.action).success) {
    return err(createPolicyDenial({ code: "INVALID_POLICY_ACTION" }));
  }
  if (!PolicyResourceDescriptorSchema.safeParse(input.resource).success) {
    return err(createPolicyDenial({ code: "INVALID_POLICY_RESOURCE" }));
  }
  if (!PolicyPurposeSchema.safeParse(input.declared_purpose).success) {
    return err(createPolicyDenial({ code: "INVALID_POLICY_PURPOSE" }));
  }
  if (
    input.metadata !== undefined &&
    !SafePolicyMetadataSchema.safeParse(input.metadata).success
  ) {
    return err(createPolicyDenial({ code: "UNSAFE_POLICY_METADATA" }));
  }

  const parsed = PolicyDecisionRequestSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createPolicyDenial({ code: "POLICY_DECISION_REQUEST_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function validatePolicyDecision(
  input: unknown,
): Result<PolicyDecision, PolicyDenial> {
  if (input === undefined || input === null) {
    return err(createPolicyDenial({ code: "POLICY_DECISION_REQUIRED" }));
  }

  const parsed = PolicyDecisionSchema.safeParse(input);

  if (!parsed.success) {
    return err(createPolicyDenial({ code: "POLICY_DECISION_INVALID" }));
  }

  return ok(parsed.data);
}

export function isPolicyAllowed(decision: PolicyDecisionLike): boolean {
  return decision?.outcome === "ALLOW";
}

export function isPolicyDenied(decision: PolicyDecisionLike): boolean {
  return (
    decision === undefined ||
    decision === null ||
    decision.outcome === "DENY" ||
    decision.outcome === "ABSTAIN" ||
    decision.outcome === "NOT_APPLICABLE" ||
    (decision.outcome !== "ALLOW" && decision.outcome !== "REQUIRE_APPROVAL")
  );
}

export function requiresPolicyApproval(decision: PolicyDecisionLike): boolean {
  return decision?.outcome === "REQUIRE_APPROVAL";
}

export function ensurePolicyDecisionTenantMatchesRequest(
  request: PolicyDecisionRequest,
  decision: PolicyDecision,
): Result<true, PolicyDenial> {
  if (decision.tenant_id !== request.tenant_id) {
    return err(
      createPolicyDenial({
        code: "POLICY_DECISION_TENANT_MISMATCH",
        correlation_id: request.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensurePolicyDecisionIsConclusive(
  decision: PolicyDecisionLike,
): Result<PolicyDecisionLike, PolicyDenial> {
  if (
    decision === undefined ||
    decision === null ||
    (decision.outcome !== "ALLOW" &&
      decision.outcome !== "DENY" &&
      decision.outcome !== "REQUIRE_APPROVAL")
  ) {
    return err(createPolicyDenial({ code: "POLICY_DECISION_INCONCLUSIVE" }));
  }

  return ok(decision);
}

export function assertPolicyAllows(
  request: PolicyDecisionRequest,
  decision: PolicyDecision | null | undefined,
): Result<true, PolicyDenial> {
  if (decision === undefined || decision === null) {
    return err(
      createPolicyDenial({
        code: "POLICY_DECISION_REQUIRED",
        correlation_id: request.correlation_id,
      }),
    );
  }

  const tenantMatch = ensurePolicyDecisionTenantMatchesRequest(
    request,
    decision,
  );

  if (!tenantMatch.ok) {
    return tenantMatch;
  }

  const conclusive = ensurePolicyDecisionIsConclusive(decision);

  if (!conclusive.ok) {
    return err(
      createPolicyDenial({
        code: conclusive.error.code,
        correlation_id: request.correlation_id,
      }),
    );
  }

  if (decision.outcome === "REQUIRE_APPROVAL") {
    return err(
      createPolicyDenial({
        code: "POLICY_APPROVAL_REQUIRED",
        correlation_id: request.correlation_id,
      }),
    );
  }

  if (!isPolicyAllowed(decision)) {
    return err(
      createPolicyDenial({
        code: "POLICY_DECISION_NOT_ALLOWED",
        correlation_id: request.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function failClosedPolicyDecision(
  request: PolicyDecisionRequest,
): PolicyDecision {
  return PolicyDecisionSchema.parse({
    decision_id: `${request.decision_request_id}.failclosed`,
    decision_request_id: request.decision_request_id,
    tenant_id: request.tenant_id,
    outcome: "DENY",
    obligations: [
      {
        obligation_type: "EMIT_AUDIT",
        severity: "REQUIRED",
        reason_code: "POLICY_FAIL_CLOSED",
      },
    ],
    policy_basis_ref: "failclosed.policy",
    decided_at: request.created_at,
    reason_code: "POLICY_FAIL_CLOSED",
    message: "The operation is denied by policy.",
  });
}
