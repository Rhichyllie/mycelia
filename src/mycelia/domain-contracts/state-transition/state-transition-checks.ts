import {
  err,
  ok,
  type Result,
} from "../../foundation/shared-kernel";
import { validateRuntimeState } from "../../domain-contracts/runtime-state";

import {
  StateTransitionSchema,
  type StateTransition,
} from "./state-transition";
import {
  createStateTransitionDenial,
  type StateTransitionDenial,
} from "./state-transition-denial";
import {
  StateTransitionIntentSchema,
  SafeStateTransitionMetadataSchema,
  isStateTransitionIsoDateTime,
  type StateTransitionIntent,
} from "./state-transition-intent";
import {
  StateTransitionResultSchema,
  type StateTransitionResult,
} from "./state-transition-result";
import { isAllowedStateTransitionRule } from "./state-transition-rule";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasInvalidPositiveInteger(input: unknown): boolean {
  return (
    typeof input !== "number" ||
    !Number.isInteger(input) ||
    input <= 0
  );
}

function hasUnsafeMetadata(input: Record<string, unknown>): boolean {
  return (
    input.metadata !== undefined &&
    !SafeStateTransitionMetadataSchema.safeParse(input.metadata).success
  );
}

export function validateStateTransitionIntent(
  input: unknown,
): Result<StateTransitionIntent, StateTransitionDenial> {
  if (!isRecord(input)) {
    return err(
      createStateTransitionDenial({
        code: "STATE_TRANSITION_INTENT_REQUIRED",
      }),
    );
  }

  if (input.transition_intent_id === undefined) {
    return err(
      createStateTransitionDenial({
        code: "TRANSITION_INTENT_ID_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createStateTransitionDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (input.run_id === undefined) {
    return err(createStateTransitionDenial({ code: "RUN_ID_REQUIRED" }));
  }

  if (input.from_state_id === undefined) {
    return err(
      createStateTransitionDenial({ code: "FROM_STATE_ID_REQUIRED" }),
    );
  }

  if (hasInvalidPositiveInteger(input.expected_from_version)) {
    return err(
      createStateTransitionDenial({
        code: "EXPECTED_FROM_VERSION_INVALID",
      }),
    );
  }

  if (
    typeof input.requested_at !== "string" ||
    !isStateTransitionIsoDateTime(input.requested_at)
  ) {
    return err(
      createStateTransitionDenial({
        code: "INVALID_STATE_TRANSITION_TIMESTAMP",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createStateTransitionDenial({
        code: "UNSAFE_STATE_TRANSITION_METADATA",
      }),
    );
  }

  const parsed = StateTransitionIntentSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createStateTransitionDenial({
        code: "STATE_TRANSITION_INTENT_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function isAllowedStateTransition(
  fromKind: StateTransitionIntent["from_kind"],
  toKind: StateTransitionIntent["to_kind"],
): boolean {
  return isAllowedStateTransitionRule(fromKind, toKind);
}

export function validateStateTransition(
  input: unknown,
): Result<StateTransition, StateTransitionDenial> {
  if (!isRecord(input)) {
    return err(
      createStateTransitionDenial({ code: "STATE_TRANSITION_REQUIRED" }),
    );
  }

  if (input.transition_id === undefined) {
    return err(
      createStateTransitionDenial({ code: "TRANSITION_ID_REQUIRED" }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createStateTransitionDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (input.run_id === undefined) {
    return err(createStateTransitionDenial({ code: "RUN_ID_REQUIRED" }));
  }

  if (input.from_state_ref === undefined && input.from_state === undefined) {
    return err(createStateTransitionDenial({ code: "FROM_STATE_REQUIRED" }));
  }

  if (input.to_state_ref === undefined && input.to_state === undefined) {
    return err(createStateTransitionDenial({ code: "TO_STATE_REQUIRED" }));
  }

  if (hasInvalidPositiveInteger(input.from_version)) {
    return err(
      createStateTransitionDenial({
        code: "STATE_TRANSITION_VERSION_INVALID",
      }),
    );
  }

  if (hasInvalidPositiveInteger(input.to_version)) {
    return err(
      createStateTransitionDenial({
        code: "STATE_TRANSITION_VERSION_INVALID",
      }),
    );
  }

  if (
    typeof input.validated_at !== "string" ||
    !isStateTransitionIsoDateTime(input.validated_at)
  ) {
    return err(
      createStateTransitionDenial({
        code: "INVALID_STATE_TRANSITION_TIMESTAMP",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createStateTransitionDenial({
        code: "UNSAFE_STATE_TRANSITION_METADATA",
      }),
    );
  }

  if (input.from_state !== undefined) {
    const fromState = validateRuntimeState(input.from_state);

    if (!fromState.ok) {
      return err(
        createStateTransitionDenial({ code: "STATE_TRANSITION_INVALID" }),
      );
    }
  }

  if (input.to_state !== undefined) {
    const toState = validateRuntimeState(input.to_state);

    if (!toState.ok) {
      return err(
        createStateTransitionDenial({ code: "STATE_TRANSITION_INVALID" }),
      );
    }
  }

  if (input.intent !== undefined) {
    const intent = validateStateTransitionIntent(input.intent);

    if (!intent.ok) {
      return err(
        createStateTransitionDenial({ code: "STATE_TRANSITION_INTENT_INVALID" }),
      );
    }
  }

  const parsed = StateTransitionSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const issuePath = firstIssue?.path.join(".");
    const issueMessage = firstIssue?.message ?? "";

    if (issuePath === "to_version") {
      return err(
        createStateTransitionDenial({
          code: "STATE_TRANSITION_VERSION_MISMATCH",
        }),
      );
    }

    if (issuePath?.includes("tenant_id")) {
      return err(
        createStateTransitionDenial({
          code: "STATE_TRANSITION_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.includes("run_id")) {
      return err(
        createStateTransitionDenial({
          code: "STATE_TRANSITION_RUN_MISMATCH",
        }),
      );
    }

    if (
      issuePath?.includes("kind") ||
      issueMessage.toLowerCase().includes("kind")
    ) {
      return err(
        createStateTransitionDenial({
          code: "STATE_TRANSITION_KIND_MISMATCH",
        }),
      );
    }

    if (issueMessage.toLowerCase().includes("rule")) {
      return err(
        createStateTransitionDenial({ code: "STATE_TRANSITION_RULE_DENIED" }),
      );
    }

    return err(
      createStateTransitionDenial({ code: "STATE_TRANSITION_INVALID" }),
    );
  }

  return ok(parsed.data);
}

export function validateStateTransitionResult(
  input: unknown,
): Result<StateTransitionResult, StateTransitionDenial> {
  if (!isRecord(input)) {
    return err(
      createStateTransitionDenial({
        code: "STATE_TRANSITION_RESULT_REQUIRED",
      }),
    );
  }

  const parsed = StateTransitionResultSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createStateTransitionDenial({
        code: "STATE_TRANSITION_RESULT_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

function createStateTransitionResult(
  intent: StateTransitionIntent,
  outcome: StateTransitionResult["outcome"],
): StateTransitionResult {
  const accepted = outcome === "ACCEPTED";

  return StateTransitionResultSchema.parse({
    transition_result_id: `${intent.transition_intent_id}.${accepted ? "accepted" : "rejected"}`,
    transition_intent_id: intent.transition_intent_id,
    tenant_id: intent.tenant_id,
    run_id: intent.run_id,
    outcome,
    reason_code: accepted
      ? "STATE_TRANSITION_CONTRACT_ACCEPTED"
      : "STATE_TRANSITION_CONTRACT_REJECTED",
    message: accepted
      ? "The state transition contract is accepted."
      : "The state transition contract is rejected.",
    decided_at: intent.requested_at,
    correlation_id: intent.correlation_id,
    denial: accepted
      ? undefined
      : createStateTransitionDenial({
          code: "STATE_TRANSITION_RULE_DENIED",
          correlation_id: intent.correlation_id,
        }),
  });
}

export function evaluateStateTransitionIntent(
  input: unknown,
): Result<StateTransitionResult, StateTransitionDenial> {
  const intent = validateStateTransitionIntent(input);

  if (!intent.ok) {
    return intent;
  }

  return ok(
    createStateTransitionResult(
      intent.value,
      isAllowedStateTransition(intent.value.from_kind, intent.value.to_kind)
        ? "ACCEPTED"
        : "REJECTED",
    ),
  );
}

export function ensureTransitionTenantMatchesStates(
  transition: StateTransition,
): Result<true, StateTransitionDenial> {
  if (
    transition.from_state !== undefined &&
    transition.from_state.tenant_id !== transition.tenant_id
  ) {
    return err(
      createStateTransitionDenial({
        code: "STATE_TRANSITION_TENANT_MISMATCH",
        correlation_id: transition.correlation_id,
      }),
    );
  }

  if (
    transition.to_state !== undefined &&
    transition.to_state.tenant_id !== transition.tenant_id
  ) {
    return err(
      createStateTransitionDenial({
        code: "STATE_TRANSITION_TENANT_MISMATCH",
        correlation_id: transition.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureTransitionVersionIncrements(
  transition: StateTransition,
): Result<true, StateTransitionDenial> {
  if (transition.to_version !== transition.from_version + 1) {
    return err(
      createStateTransitionDenial({
        code: "STATE_TRANSITION_VERSION_MISMATCH",
        correlation_id: transition.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function isStateTransitionAccepted(input: unknown): boolean {
  const result = validateStateTransitionResult(input);

  return result.ok && result.value.outcome === "ACCEPTED";
}

export function isStateTransitionRejected(input: unknown): boolean {
  const result = validateStateTransitionResult(input);

  return !result.ok || result.value.outcome === "REJECTED";
}

export function assertStateTransitionAccepted(
  input: unknown,
): Result<StateTransitionResult, StateTransitionDenial> {
  const result = validateStateTransitionResult(input);

  if (!result.ok) {
    return result;
  }

  if (result.value.outcome !== "ACCEPTED") {
    return err(
      createStateTransitionDenial({
        code: "STATE_TRANSITION_NOT_ACCEPTED",
        correlation_id: result.value.correlation_id,
      }),
    );
  }

  return ok(result.value);
}

export function failClosedStateTransitionResult(
  intent: StateTransitionIntent,
): StateTransitionResult {
  return createStateTransitionResult(intent, "REJECTED");
}
