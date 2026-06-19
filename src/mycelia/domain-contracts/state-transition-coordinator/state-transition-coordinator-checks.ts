import {
  err,
  ok,
  type Result,
} from "../../foundation/shared-kernel";
import {
  CorrelationIdSchema,
  RunIdSchema,
  TenantIdSchema,
  type CorrelationId,
} from "../../foundation/shared-kernel";
import {
  SafeStateTransitionMetadataSchema,
  StateTransitionResultSchema,
  assertStateTransitionAccepted,
  evaluateStateTransitionIntent,
  isStateTransitionIsoDateTime,
  validateStateTransition,
  validateStateTransitionIntent,
} from "../../domain-contracts/state-transition";
import { validateRuntimeState } from "../../domain-contracts/runtime-state";

import {
  StateTransitionCoordinationRequestSchema,
  StateTransitionCoordinationRequestIdSchema,
  type StateTransitionCoordinationRequest,
} from "./state-transition-coordination-request";
import {
  StateTransitionCoordinationResultSchema,
  type StateTransitionCoordinationResult,
} from "./state-transition-coordination-result";
import {
  createStateTransitionCoordinationDenial,
  type StateTransitionCoordinationDenial,
  type StateTransitionCoordinationDenialCode,
} from "./state-transition-coordination-denial";
import { createStateTransitionDescriptorInput } from "./state-transition-coordinator";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function getSafeCoordinationRequestId(input: unknown): string {
  if (
    isRecord(input) &&
    StateTransitionCoordinationRequestIdSchema.safeParse(
      input.coordination_request_id,
    ).success
  ) {
    return input.coordination_request_id as string;
  }

  return "state_transition_coordination_request_unknown";
}

function getSafeTenantId(input: unknown): string {
  if (isRecord(input) && TenantIdSchema.safeParse(input.tenant_id).success) {
    return input.tenant_id as string;
  }

  return "tenant_unknown";
}

function getSafeRunId(input: unknown): string {
  if (isRecord(input) && RunIdSchema.safeParse(input.run_id).success) {
    return input.run_id as string;
  }

  return "run_unknown";
}

function getSafeCorrelationId(input: unknown): CorrelationId {
  if (
    isRecord(input) &&
    CorrelationIdSchema.safeParse(input.correlation_id).success
  ) {
    return CorrelationIdSchema.parse(input.correlation_id);
  }

  return CorrelationIdSchema.parse("correlation_unknown");
}

function getSafeDecidedAt(input: unknown): string {
  if (
    isRecord(input) &&
    typeof input.requested_at === "string" &&
    isStateTransitionIsoDateTime(input.requested_at)
  ) {
    return input.requested_at;
  }

  return "1970-01-01T00:00:00.000Z";
}

function hasUnsafeMetadata(input: Record<string, unknown>): boolean {
  return (
    input.metadata !== undefined &&
    !SafeStateTransitionMetadataSchema.safeParse(input.metadata).success
  );
}

export function validateStateTransitionCoordinationRequest(
  input: unknown,
): Result<
  StateTransitionCoordinationRequest,
  StateTransitionCoordinationDenial
> {
  if (!isRecord(input)) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "STATE_TRANSITION_COORDINATION_REQUEST_REQUIRED",
      }),
    );
  }

  if (input.coordination_request_id === undefined) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "COORDINATION_REQUEST_ID_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "TENANT_ID_REQUIRED",
      }),
    );
  }

  if (input.run_id === undefined) {
    return err(
      createStateTransitionCoordinationDenial({ code: "RUN_ID_REQUIRED" }),
    );
  }

  if (input.current_state === undefined) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "CURRENT_STATE_REQUIRED",
      }),
    );
  }

  const currentState = validateRuntimeState(input.current_state);

  if (!currentState.ok) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "CURRENT_STATE_INVALID",
      }),
    );
  }

  if (input.transition_intent === undefined) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "TRANSITION_INTENT_REQUIRED",
      }),
    );
  }

  const transitionIntent = validateStateTransitionIntent(
    input.transition_intent,
  );

  if (!transitionIntent.ok) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "TRANSITION_INTENT_INVALID",
      }),
    );
  }

  if (
    typeof input.requested_at !== "string" ||
    !isStateTransitionIsoDateTime(input.requested_at)
  ) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "INVALID_STATE_TRANSITION_COORDINATION_TIMESTAMP",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "UNSAFE_STATE_TRANSITION_COORDINATION_METADATA",
      }),
    );
  }

  const parsed = StateTransitionCoordinationRequestSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const issuePath = firstIssue?.path.join(".");
    const issueMessage = firstIssue?.message ?? "";

    if (issuePath?.includes("tenant_id")) {
      return err(
        createStateTransitionCoordinationDenial({
          code: "STATE_TRANSITION_COORDINATION_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.includes("run_id")) {
      return err(
        createStateTransitionCoordinationDenial({
          code: "STATE_TRANSITION_COORDINATION_RUN_MISMATCH",
        }),
      );
    }

    if (
      issuePath?.includes("from_kind") ||
      issueMessage.toLowerCase().includes("kind")
    ) {
      return err(
        createStateTransitionCoordinationDenial({
          code: "STATE_TRANSITION_COORDINATION_KIND_MISMATCH",
        }),
      );
    }

    if (
      issuePath?.includes("expected_from_version") ||
      issuePath?.includes("from_state_id")
    ) {
      return err(
        createStateTransitionCoordinationDenial({
          code: "STATE_TRANSITION_COORDINATION_VERSION_MISMATCH",
        }),
      );
    }

    return err(
      createStateTransitionCoordinationDenial({
        code: "STATE_TRANSITION_COORDINATION_REQUEST_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateStateTransitionCoordinationResult(
  input: unknown,
): Result<StateTransitionCoordinationResult, StateTransitionCoordinationDenial> {
  if (!isRecord(input)) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "STATE_TRANSITION_COORDINATION_RESULT_REQUIRED",
      }),
    );
  }

  const parsed = StateTransitionCoordinationResultSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "STATE_TRANSITION_COORDINATION_RESULT_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function failClosedStateTransitionCoordinationResult(
  input: unknown,
  code: StateTransitionCoordinationDenialCode =
    "STATE_TRANSITION_COORDINATION_REQUEST_INVALID",
): StateTransitionCoordinationResult {
  const coordination_request_id = getSafeCoordinationRequestId(input);
  const correlation_id = getSafeCorrelationId(input);

  return StateTransitionCoordinationResultSchema.parse({
    coordination_result_id: `${coordination_request_id}.rejected`,
    coordination_request_id,
    tenant_id: getSafeTenantId(input),
    run_id: getSafeRunId(input),
    outcome: "REJECTED",
    reason_code: "STATE_TRANSITION_COORDINATION_REJECTED",
    message: "The state transition coordination is rejected.",
    decided_at: getSafeDecidedAt(input),
    correlation_id,
    denial: createStateTransitionCoordinationDenial({
      code,
      correlation_id,
    }),
  });
}

export function ensureCoordinationTenantMatchesState(
  request: StateTransitionCoordinationRequest,
): Result<true, StateTransitionCoordinationDenial> {
  if (request.current_state.tenant_id !== request.tenant_id) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "STATE_TRANSITION_COORDINATION_TENANT_MISMATCH",
        correlation_id: request.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureCoordinationTenantMatchesIntent(
  request: StateTransitionCoordinationRequest,
): Result<true, StateTransitionCoordinationDenial> {
  if (request.transition_intent.tenant_id !== request.tenant_id) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "STATE_TRANSITION_COORDINATION_TENANT_MISMATCH",
        correlation_id: request.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureCoordinationExpectedVersionMatchesState(
  request: StateTransitionCoordinationRequest,
): Result<true, StateTransitionCoordinationDenial> {
  if (
    request.transition_intent.expected_from_version !==
    request.current_state.version
  ) {
    return err(
      createStateTransitionCoordinationDenial({
        code: "STATE_TRANSITION_COORDINATION_VERSION_MISMATCH",
        correlation_id: request.correlation_id,
      }),
    );
  }

  return ok(true);
}

function createReadyStateTransitionCoordinationResult(
  request: StateTransitionCoordinationRequest,
  transition: StateTransitionCoordinationResult["transition"],
  transition_result: StateTransitionCoordinationResult["transition_result"],
): StateTransitionCoordinationResult {
  return StateTransitionCoordinationResultSchema.parse({
    coordination_result_id: `${request.coordination_request_id}.ready`,
    coordination_request_id: request.coordination_request_id,
    tenant_id: request.tenant_id,
    run_id: request.run_id,
    outcome: "READY",
    reason_code: "STATE_TRANSITION_COORDINATION_READY",
    message:
      "The state transition is ready for a future component to apply.",
    decided_at: request.requested_at,
    correlation_id: request.correlation_id,
    transition,
    transition_result,
    metadata: request.metadata,
  });
}

export function coordinateStateTransition(
  input: unknown,
): Result<StateTransitionCoordinationResult, StateTransitionCoordinationDenial> {
  const request = validateStateTransitionCoordinationRequest(input);

  if (!request.ok) {
    return ok(failClosedStateTransitionCoordinationResult(input, request.error.code));
  }

  const tenantMatchesState = ensureCoordinationTenantMatchesState(request.value);

  if (!tenantMatchesState.ok) {
    return ok(
      failClosedStateTransitionCoordinationResult(
        request.value,
        tenantMatchesState.error.code,
      ),
    );
  }

  const tenantMatchesIntent = ensureCoordinationTenantMatchesIntent(request.value);

  if (!tenantMatchesIntent.ok) {
    return ok(
      failClosedStateTransitionCoordinationResult(
        request.value,
        tenantMatchesIntent.error.code,
      ),
    );
  }

  const versionMatches = ensureCoordinationExpectedVersionMatchesState(
    request.value,
  );

  if (!versionMatches.ok) {
    return ok(
      failClosedStateTransitionCoordinationResult(
        request.value,
        versionMatches.error.code,
      ),
    );
  }

  const transitionIntentResult = evaluateStateTransitionIntent(
    request.value.transition_intent,
  );

  if (!transitionIntentResult.ok) {
    return ok(
      failClosedStateTransitionCoordinationResult(
        request.value,
        "TRANSITION_INTENT_INVALID",
      ),
    );
  }

  if (transitionIntentResult.value.outcome !== "ACCEPTED") {
    return ok(
      failClosedStateTransitionCoordinationResult(
        request.value,
        "STATE_TRANSITION_RULE_DENIED",
      ),
    );
  }

  const transition = validateStateTransition(
    createStateTransitionDescriptorInput(request.value),
  );

  if (!transition.ok) {
    return ok(
      failClosedStateTransitionCoordinationResult(
        request.value,
        "STATE_TRANSITION_DESCRIPTOR_INVALID",
      ),
    );
  }

  const transitionResult = StateTransitionResultSchema.parse({
    transition_result_id: `${transition.value.transition_id}.accepted`,
    transition_id: transition.value.transition_id,
    transition_intent_id:
      request.value.transition_intent.transition_intent_id,
    tenant_id: request.value.tenant_id,
    run_id: request.value.run_id,
    outcome: "ACCEPTED",
    reason_code: "STATE_TRANSITION_CONTRACT_ACCEPTED",
    message: "The state transition contract is accepted.",
    decided_at: request.value.requested_at,
    correlation_id: request.value.correlation_id,
    transition_ref: transition.value.transition_id,
  });
  const accepted = assertStateTransitionAccepted(transitionResult);

  if (!accepted.ok) {
    return ok(
      failClosedStateTransitionCoordinationResult(
        request.value,
        "STATE_TRANSITION_DESCRIPTOR_INVALID",
      ),
    );
  }

  return ok(
    createReadyStateTransitionCoordinationResult(
      request.value,
      transition.value,
      accepted.value,
    ),
  );
}

export function isStateTransitionCoordinationReady(input: unknown): boolean {
  const result = validateStateTransitionCoordinationResult(input);

  return result.ok && result.value.outcome === "READY";
}

export function isStateTransitionCoordinationRejected(input: unknown): boolean {
  const result = validateStateTransitionCoordinationResult(input);

  return !result.ok || result.value.outcome === "REJECTED";
}

export function assertStateTransitionCoordinationReady(
  input: unknown,
): Result<
  StateTransitionCoordinationResult,
  StateTransitionCoordinationDenial
> {
  const result = validateStateTransitionCoordinationResult(input);

  if (!result.ok) {
    return result;
  }

  if (result.value.outcome !== "READY") {
    return err(
      createStateTransitionCoordinationDenial({
        code: "STATE_TRANSITION_COORDINATION_NOT_READY",
        correlation_id: result.value.correlation_id,
      }),
    );
  }

  return ok(result.value);
}
