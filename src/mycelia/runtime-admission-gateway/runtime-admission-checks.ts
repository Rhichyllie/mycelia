import {
  err,
  ok,
  type Result,
} from "../shared-kernel";
import {
  type PolicyDecision,
  validatePolicyDecision,
} from "../policy-decision-gateway";
import {
  ensureRuntimeEnvelopeAllowsProductionSideEffects,
  validateRuntimeEnvelope,
} from "../runtime-envelope";

import {
  RuntimeAdmissionDecisionSchema,
  type RuntimeAdmissionDecision,
} from "./runtime-admission-decision";
import {
  createRuntimeAdmissionDenial,
  type RuntimeAdmissionDenial,
} from "./runtime-admission-denial";
import {
  RuntimeAdmissionRequestSchema,
  SafeRuntimeAdmissionMetadataSchema,
  isRuntimeAdmissionIsoDateTime,
  type RuntimeAdmissionRequest,
} from "./runtime-admission-request";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function createDecisionId(
  request: RuntimeAdmissionRequest,
  suffix: "admit" | "deny" | "approval",
): string {
  return `${request.admission_request_id}.${suffix}`;
}

function createAdmissionDecision(
  request: RuntimeAdmissionRequest,
  input: {
    readonly outcome: RuntimeAdmissionDecision["outcome"];
    readonly reason_code: RuntimeAdmissionDecision["reason_code"];
    readonly message: RuntimeAdmissionDecision["message"];
    readonly policy_decision?: PolicyDecision;
  },
): RuntimeAdmissionDecision {
  const suffix =
    input.outcome === "ADMIT"
      ? "admit"
      : input.outcome === "REQUIRE_APPROVAL"
        ? "approval"
        : "deny";

  return RuntimeAdmissionDecisionSchema.parse({
    admission_decision_id: createDecisionId(request, suffix),
    admission_request_id: request.admission_request_id,
    tenant_id: request.tenant_id,
    outcome: input.outcome,
    decided_at: request.created_at,
    reason_code: input.reason_code,
    message: input.message,
    correlation_id: request.correlation_id,
    obligations: input.policy_decision?.obligations,
  });
}

export function validateRuntimeAdmissionRequest(
  input: unknown,
): Result<RuntimeAdmissionRequest, RuntimeAdmissionDenial> {
  if (!isRecord(input)) {
    return err(
      createRuntimeAdmissionDenial({
        code: "RUNTIME_ADMISSION_REQUEST_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createRuntimeAdmissionDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (input.runtime_envelope === undefined) {
    return err(
      createRuntimeAdmissionDenial({ code: "RUNTIME_ENVELOPE_REQUIRED" }),
    );
  }

  const envelope = validateRuntimeEnvelope(input.runtime_envelope);

  if (!envelope.ok) {
    return err(
      createRuntimeAdmissionDenial({
        code: "INVALID_RUNTIME_ENVELOPE",
        correlation_id: envelope.error.correlation_id,
      }),
    );
  }

  if (
    typeof input.created_at !== "string" ||
    !isRuntimeAdmissionIsoDateTime(input.created_at)
  ) {
    return err(
      createRuntimeAdmissionDenial({
        code: "INVALID_RUNTIME_ADMISSION_TIMESTAMP",
        correlation_id: envelope.value.correlation_id,
      }),
    );
  }

  if (
    input.metadata !== undefined &&
    !SafeRuntimeAdmissionMetadataSchema.safeParse(input.metadata).success
  ) {
    return err(
      createRuntimeAdmissionDenial({
        code: "UNSAFE_RUNTIME_ADMISSION_METADATA",
        correlation_id: envelope.value.correlation_id,
      }),
    );
  }

  const parsed = RuntimeAdmissionRequestSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const issuePath = firstIssue?.path.join(".");
    const issueMessage = firstIssue?.message ?? "";

    if (issuePath?.includes("runtime_envelope.tenant_id")) {
      return err(
        createRuntimeAdmissionDenial({
          code: "RUNTIME_ADMISSION_TENANT_MISMATCH",
          correlation_id: envelope.value.correlation_id,
        }),
      );
    }

    if (
      issuePath === "runtime_identity_id" ||
      issueMessage.toLowerCase().includes("runtime identity")
    ) {
      return err(
        createRuntimeAdmissionDenial({
          code: "RUNTIME_IDENTITY_SCOPE_MISMATCH",
          correlation_id: envelope.value.correlation_id,
        }),
      );
    }

    if (
      issuePath?.startsWith("policy_decision") &&
      issueMessage.toLowerCase().includes("reference")
    ) {
      return err(
        createRuntimeAdmissionDenial({
          code: "POLICY_DECISION_REQUIRED",
          correlation_id: envelope.value.correlation_id,
        }),
      );
    }

    return err(
      createRuntimeAdmissionDenial({
        code: "RUNTIME_ADMISSION_REQUEST_INVALID",
        correlation_id: envelope.value.correlation_id,
      }),
    );
  }

  return ok(parsed.data);
}

export function validateRuntimeAdmissionDecision(
  input: unknown,
): Result<RuntimeAdmissionDecision, RuntimeAdmissionDenial> {
  if (input === undefined || input === null) {
    return err(
      createRuntimeAdmissionDenial({
        code: "RUNTIME_ADMISSION_DECISION_REQUIRED",
      }),
    );
  }

  const parsed = RuntimeAdmissionDecisionSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createRuntimeAdmissionDenial({
        code: "RUNTIME_ADMISSION_DECISION_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function ensureAdmissionTenantMatchesEnvelope(
  request: RuntimeAdmissionRequest,
): Result<true, RuntimeAdmissionDenial> {
  if (request.runtime_envelope.tenant_id !== request.tenant_id) {
    return err(
      createRuntimeAdmissionDenial({
        code: "RUNTIME_ADMISSION_TENANT_MISMATCH",
        correlation_id: request.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureAdmissionPolicyAllows(
  request: RuntimeAdmissionRequest,
): Result<true, RuntimeAdmissionDenial> {
  const policyDecision = validatePolicyDecision(request.policy_decision);

  if (!policyDecision.ok) {
    return err(
      createRuntimeAdmissionDenial({
        code:
          policyDecision.error.code === "POLICY_DECISION_REQUIRED"
            ? "POLICY_DECISION_REQUIRED"
            : "POLICY_DECISION_INVALID",
        correlation_id: request.correlation_id,
      }),
    );
  }

  if (policyDecision.value.tenant_id !== request.tenant_id) {
    return err(
      createRuntimeAdmissionDenial({
        code: "POLICY_DECISION_TENANT_MISMATCH",
        correlation_id: request.correlation_id,
      }),
    );
  }

  if (
    policyDecision.value.outcome === "ABSTAIN" ||
    policyDecision.value.outcome === "NOT_APPLICABLE"
  ) {
    return err(
      createRuntimeAdmissionDenial({
        code: "POLICY_DECISION_INCONCLUSIVE",
        correlation_id: request.correlation_id,
      }),
    );
  }

  if (policyDecision.value.outcome === "REQUIRE_APPROVAL") {
    return err(
      createRuntimeAdmissionDenial({
        code: "POLICY_APPROVAL_REQUIRED",
        correlation_id: request.correlation_id,
      }),
    );
  }

  if (policyDecision.value.outcome !== "ALLOW") {
    return err(
      createRuntimeAdmissionDenial({
        code: "POLICY_DECISION_NOT_ALLOWED",
        correlation_id: request.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function failClosedRuntimeAdmissionDecision(
  request: RuntimeAdmissionRequest,
): RuntimeAdmissionDecision {
  return createAdmissionDecision(request, {
    outcome: "DENY",
    reason_code: "RUNTIME_ADMISSION_FAIL_CLOSED",
    message: "The operation is denied before admission.",
  });
}

export function evaluateRuntimeAdmission(
  input: unknown,
): Result<RuntimeAdmissionDecision, RuntimeAdmissionDenial> {
  const request = validateRuntimeAdmissionRequest(input);

  if (!request.ok) {
    return request;
  }

  const tenantMatch = ensureAdmissionTenantMatchesEnvelope(request.value);

  if (!tenantMatch.ok) {
    return tenantMatch;
  }

  const productionAllowed = ensureRuntimeEnvelopeAllowsProductionSideEffects(
    request.value.runtime_envelope,
  );

  if (!productionAllowed.ok) {
    return ok(
      createAdmissionDecision(request.value, {
        outcome: "DENY",
        reason_code: "PRODUCTION_SIDE_EFFECT_ADMISSION_DENIED",
        message: "The operation is denied before admission.",
      }),
    );
  }

  const policyDecision = validatePolicyDecision(request.value.policy_decision);

  if (!policyDecision.ok) {
    return ok(failClosedRuntimeAdmissionDecision(request.value));
  }

  if (policyDecision.value.tenant_id !== request.value.tenant_id) {
    return err(
      createRuntimeAdmissionDenial({
        code: "POLICY_DECISION_TENANT_MISMATCH",
        correlation_id: request.value.correlation_id,
      }),
    );
  }

  if (policyDecision.value.outcome === "ALLOW") {
    return ok(
      createAdmissionDecision(request.value, {
        outcome: "ADMIT",
        reason_code: "POLICY_ALLOWED",
        message: "The operation is admitted.",
        policy_decision: policyDecision.value,
      }),
    );
  }

  if (policyDecision.value.outcome === "REQUIRE_APPROVAL") {
    return ok(
      createAdmissionDecision(request.value, {
        outcome: "REQUIRE_APPROVAL",
        reason_code: "POLICY_APPROVAL_REQUIRED",
        message: "The operation requires approval before admission.",
        policy_decision: policyDecision.value,
      }),
    );
  }

  return ok(
    createAdmissionDecision(request.value, {
      outcome: "DENY",
      reason_code:
        policyDecision.value.outcome === "DENY"
          ? "POLICY_DENIED"
          : "POLICY_FAIL_CLOSED",
      message: "The operation is denied before admission.",
      policy_decision: policyDecision.value,
    }),
  );
}

export function isRuntimeAdmissionAdmitted(input: unknown): boolean {
  const decision = validateRuntimeAdmissionDecision(input);

  return decision.ok && decision.value.outcome === "ADMIT";
}

export function isRuntimeAdmissionDenied(input: unknown): boolean {
  const decision = validateRuntimeAdmissionDecision(input);

  return !decision.ok || decision.value.outcome === "DENY";
}

export function requiresRuntimeAdmissionApproval(input: unknown): boolean {
  const decision = validateRuntimeAdmissionDecision(input);

  return decision.ok && decision.value.outcome === "REQUIRE_APPROVAL";
}

export function assertRuntimeAdmissionAdmitted(
  input: unknown,
): Result<true, RuntimeAdmissionDenial> {
  const decision = validateRuntimeAdmissionDecision(input);

  if (!decision.ok) {
    return decision;
  }

  if (decision.value.outcome === "REQUIRE_APPROVAL") {
    return err(
      createRuntimeAdmissionDenial({
        code: "POLICY_APPROVAL_REQUIRED",
        correlation_id: decision.value.correlation_id,
      }),
    );
  }

  if (decision.value.outcome !== "ADMIT") {
    return err(
      createRuntimeAdmissionDenial({
        code: "RUNTIME_ADMISSION_NOT_ADMITTED",
        correlation_id: decision.value.correlation_id,
      }),
    );
  }

  return ok(true);
}
