import { z } from "zod";

import {
  err,
  ok,
  type Result,
} from "../../foundation/shared-kernel";
import { RuntimePersistenceRunStates } from "../../persistence/runtime-persistence-model";
import { RUNTIME_SLICE_STATE_LIFECYCLE } from "../../planning/runtime-slice-technical-plan";

export const GOVERNED_RUN_LIFECYCLE_PHASE = "2S";

export const GOVERNED_RUN_LIFECYCLE_NAME =
  "Minimal Governed Run Lifecycle";

export const GOVERNED_RUN_LIFECYCLE_STATUS =
  "pure TypeScript in-memory lifecycle logic only";

export const GovernedRunLifecycleStates = RuntimePersistenceRunStates;

export type GovernedRunLifecycleState =
  (typeof GovernedRunLifecycleStates)[number];

export const GovernedRunLifecycleIntents = [
  "RESOLVE_CONTEXT",
  "EVALUATE_POLICY",
  "GRANT_ADMISSION",
  "REQUIRE_APPROVAL",
  "APPROVE",
  "REJECT",
  "START_RUN",
  "COMPLETE_RUN",
  "CANCEL_RUN",
  "FAIL_RUN",
] as const;

export type GovernedRunLifecycleIntent =
  (typeof GovernedRunLifecycleIntents)[number];

export const GovernedRunLifecycleTerminalStates = [
  "COMPLETED",
  "CANCELLED",
  "FAILED",
  "REJECTED",
] as const satisfies readonly GovernedRunLifecycleState[];

export type GovernedRunLifecycleTerminalState =
  (typeof GovernedRunLifecycleTerminalStates)[number];

const terminalStateSet = new Set<GovernedRunLifecycleState>(
  GovernedRunLifecycleTerminalStates,
);

export const GovernedRunLifecycleNonTerminalStates =
  GovernedRunLifecycleStates.filter(
    (state): state is GovernedRunLifecycleState =>
      !terminalStateSet.has(state),
  );

export const GovernedRunLifecycleStateSchema = z.enum(
  GovernedRunLifecycleStates,
);

export const GovernedRunLifecycleIntentSchema = z.enum(
  GovernedRunLifecycleIntents,
);

export const GovernedRunLifecycleTransitionSchema = z
  .object({
    current_state: GovernedRunLifecycleStateSchema,
    intent: GovernedRunLifecycleIntentSchema,
  })
  .strict();

export type GovernedRunLifecycleTransition = z.infer<
  typeof GovernedRunLifecycleTransitionSchema
>;

export const GovernedRunLifecycleDenialCodeSchema = z.enum([
  "GOVERNED_RUN_LIFECYCLE_INPUT_REQUIRED",
  "GOVERNED_RUN_LIFECYCLE_STATE_INVALID",
  "GOVERNED_RUN_LIFECYCLE_INTENT_INVALID",
  "GOVERNED_RUN_LIFECYCLE_TRANSITION_DENIED",
  "GOVERNED_RUN_LIFECYCLE_TERMINAL_STATE_DENIED",
]);

export type GovernedRunLifecycleDenialCode = z.infer<
  typeof GovernedRunLifecycleDenialCodeSchema
>;

export const GovernedRunLifecycleReasonCodeSchema = z.enum([
  "CONTEXT_RESOLUTION_ALLOWED",
  "POLICY_EVALUATION_ALLOWED",
  "ADMISSION_GRANTED_ALLOWED",
  "APPROVAL_REQUIRED_ALLOWED",
  "POLICY_REJECTION_ALLOWED",
  "APPROVAL_ACCEPTED_ALLOWED",
  "APPROVAL_REJECTION_ALLOWED",
  "RUN_START_ALLOWED",
  "RUN_COMPLETION_ALLOWED",
  "RUN_CANCELLATION_ALLOWED",
  "RUN_FAILURE_ALLOWED",
  "LIFECYCLE_INPUT_INVALID",
  "LIFECYCLE_STATE_INVALID",
  "LIFECYCLE_INTENT_INVALID",
  "LIFECYCLE_TRANSITION_NOT_ALLOWED",
  "LIFECYCLE_TERMINAL_STATE",
]);

export type GovernedRunLifecycleReasonCode = z.infer<
  typeof GovernedRunLifecycleReasonCodeSchema
>;

export const GovernedRunLifecyclePersistenceStatusSchema = z.enum([
  "ACTIVE_OR_IN_PROGRESS",
  "TERMINAL_COMPLETED",
  "TERMINAL_CANCELLED",
  "TERMINAL_FAILED",
  "TERMINAL_REJECTED",
]);

export type GovernedRunLifecyclePersistenceStatus = z.infer<
  typeof GovernedRunLifecyclePersistenceStatusSchema
>;

export const GovernedRunLifecyclePersistenceMappingSchema = z
  .object({
    governed_run_current_state: GovernedRunLifecycleStateSchema,
    governed_run_status: GovernedRunLifecyclePersistenceStatusSchema,
    runtime_state_snapshot_state: GovernedRunLifecycleStateSchema,
    future_audit_record: z.literal(
      "future audit-addressable transition moment only",
    ),
  })
  .strict();

export type GovernedRunLifecyclePersistenceMapping = z.infer<
  typeof GovernedRunLifecyclePersistenceMappingSchema
>;

export const GovernedRunLifecycleDecisionSchema = z
  .object({
    outcome: z.literal("ALLOWED"),
    current_state: GovernedRunLifecycleStateSchema,
    intent: GovernedRunLifecycleIntentSchema,
    next_state: GovernedRunLifecycleStateSchema,
    reason_code: GovernedRunLifecycleReasonCodeSchema,
    reason: z.string().min(1).max(240),
    terminal: z.boolean(),
    persistence_mapping: GovernedRunLifecyclePersistenceMappingSchema,
    audit_implication: z.literal(
      "future audit descriptor should be addressable; no audit record is written",
    ),
  })
  .strict();

export type GovernedRunLifecycleDecision = z.infer<
  typeof GovernedRunLifecycleDecisionSchema
>;

export const GovernedRunLifecycleDenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    code: GovernedRunLifecycleDenialCodeSchema,
    current_state: GovernedRunLifecycleStateSchema.optional(),
    intent: GovernedRunLifecycleIntentSchema.optional(),
    reason_code: GovernedRunLifecycleReasonCodeSchema,
    reason: z.string().min(1).max(240),
    message: z.literal(
      "The governed run lifecycle transition is not allowed.",
    ),
  })
  .strict();

export type GovernedRunLifecycleDenial = z.infer<
  typeof GovernedRunLifecycleDenialSchema
>;

export type GovernedRunLifecycleAllowedTransition = {
  readonly current_state: GovernedRunLifecycleState;
  readonly intent: GovernedRunLifecycleIntent;
  readonly next_state: GovernedRunLifecycleState;
  readonly reason_code: GovernedRunLifecycleReasonCode;
  readonly reason: string;
};

export const GOVERNED_RUN_LIFECYCLE_ALLOWED_TRANSITIONS = [
  {
    current_state: "CREATED",
    intent: "RESOLVE_CONTEXT",
    next_state: "CONTEXT_RESOLVED",
    reason_code: "CONTEXT_RESOLUTION_ALLOWED",
    reason: "Context resolution may follow a created governed run.",
  },
  {
    current_state: "CONTEXT_RESOLVED",
    intent: "EVALUATE_POLICY",
    next_state: "POLICY_EVALUATED",
    reason_code: "POLICY_EVALUATION_ALLOWED",
    reason: "Policy evaluation may follow resolved context.",
  },
  {
    current_state: "POLICY_EVALUATED",
    intent: "GRANT_ADMISSION",
    next_state: "ADMISSION_GRANTED",
    reason_code: "ADMISSION_GRANTED_ALLOWED",
    reason: "Admission may be granted after policy evaluation.",
  },
  {
    current_state: "POLICY_EVALUATED",
    intent: "REQUIRE_APPROVAL",
    next_state: "WAITING_APPROVAL",
    reason_code: "APPROVAL_REQUIRED_ALLOWED",
    reason: "Approval may be required after policy evaluation.",
  },
  {
    current_state: "POLICY_EVALUATED",
    intent: "REJECT",
    next_state: "REJECTED",
    reason_code: "POLICY_REJECTION_ALLOWED",
    reason: "Policy evaluation may reject the governed run.",
  },
  {
    current_state: "WAITING_APPROVAL",
    intent: "APPROVE",
    next_state: "APPROVED",
    reason_code: "APPROVAL_ACCEPTED_ALLOWED",
    reason: "A waiting approval state may move to approved.",
  },
  {
    current_state: "WAITING_APPROVAL",
    intent: "REJECT",
    next_state: "REJECTED",
    reason_code: "APPROVAL_REJECTION_ALLOWED",
    reason: "A waiting approval state may be rejected.",
  },
  {
    current_state: "ADMISSION_GRANTED",
    intent: "START_RUN",
    next_state: "RUNNING",
    reason_code: "RUN_START_ALLOWED",
    reason: "An admitted governed run may start.",
  },
  {
    current_state: "APPROVED",
    intent: "START_RUN",
    next_state: "RUNNING",
    reason_code: "RUN_START_ALLOWED",
    reason: "An approved governed run may start.",
  },
  {
    current_state: "RUNNING",
    intent: "COMPLETE_RUN",
    next_state: "COMPLETED",
    reason_code: "RUN_COMPLETION_ALLOWED",
    reason: "A running governed run may complete.",
  },
] as const satisfies readonly GovernedRunLifecycleAllowedTransition[];

export const GOVERNED_RUN_LIFECYCLE_PERSISTENCE_MAPPING = [
  "next_state maps to future GovernedRun.currentState",
  "terminal outcome maps to future GovernedRun.status",
  "next_state maps to future RuntimeStateSnapshot.state",
  "allowed decisions are future audit-addressable lifecycle moments",
  "denials are future audit-addressable governance moments",
] as const;

export const GOVERNED_RUN_LIFECYCLE_MODULE_ALIGNMENT = [
  "src/mycelia/planning/runtime-slice-technical-plan/",
  "src/mycelia/persistence/runtime-persistence-model/",
  "src/mycelia/domain-contracts/state-transition/",
  "src/mycelia/domain-contracts/state-transition-coordinator/",
  "src/mycelia/domain-contracts/governed-run/",
  "src/mycelia/domain-contracts/runtime-state/",
] as const;

export const GOVERNED_RUN_LIFECYCLE_EXPLICITLY_OUT_OF_SCOPE = [
  "no runtime execution",
  "no persistence",
  "no DB access",
  "no migrations",
  "no repository/service layer",
  "no API",
  "no auth",
  "no UI",
  "no event emission",
  "no audit record writing",
  "no workflow execution",
  "no replay execution",
  "no external integrations",
  "no tool execution",
  "no export/PDF/download",
] as const;

export const GOVERNED_RUN_LIFECYCLE_SAFETY_BOUNDARY = [
  "this module evaluates lifecycle transitions in memory only",
  "this module returns allowed decisions or safe denials",
  "this module does not mutate input",
  "this module does not create next-state records",
  "this module does not persist data",
  "this module does not emit events",
  "this module does not write audit records",
  "this module does not call APIs or external services",
] as const;

export const GovernedRunLifecycleSchema = z
  .object({
    phase: z.literal(GOVERNED_RUN_LIFECYCLE_PHASE),
    name: z.literal(GOVERNED_RUN_LIFECYCLE_NAME),
    status: z.literal(GOVERNED_RUN_LIFECYCLE_STATUS),
    states: z.array(GovernedRunLifecycleStateSchema).length(11),
    intents: z.array(GovernedRunLifecycleIntentSchema).length(10),
    terminal_states: z.array(GovernedRunLifecycleStateSchema).length(4),
    allowed_transitions: z.array(
      z
        .object({
          current_state: GovernedRunLifecycleStateSchema,
          intent: GovernedRunLifecycleIntentSchema,
          next_state: GovernedRunLifecycleStateSchema,
          reason_code: GovernedRunLifecycleReasonCodeSchema,
          reason: z.string().min(1).max(240),
        })
        .strict(),
    ),
    persistence_mapping: z.array(z.string().min(1)),
    module_alignment: z.array(z.string().min(1)),
    lifecycle_plan_alignment: z.array(z.string().min(1)),
    explicitly_out_of_scope: z.array(z.string().min(1)),
    safety_boundary: z.array(z.string().min(1)),
  })
  .strict();

export type GovernedRunLifecycle = {
  readonly phase: typeof GOVERNED_RUN_LIFECYCLE_PHASE;
  readonly name: typeof GOVERNED_RUN_LIFECYCLE_NAME;
  readonly status: typeof GOVERNED_RUN_LIFECYCLE_STATUS;
  readonly states: readonly GovernedRunLifecycleState[];
  readonly intents: readonly GovernedRunLifecycleIntent[];
  readonly terminal_states: readonly GovernedRunLifecycleState[];
  readonly allowed_transitions:
    readonly GovernedRunLifecycleAllowedTransition[];
  readonly persistence_mapping: readonly string[];
  readonly module_alignment: readonly string[];
  readonly lifecycle_plan_alignment: readonly string[];
  readonly explicitly_out_of_scope: readonly string[];
  readonly safety_boundary: readonly string[];
};

export const GOVERNED_RUN_LIFECYCLE = {
  phase: GOVERNED_RUN_LIFECYCLE_PHASE,
  name: GOVERNED_RUN_LIFECYCLE_NAME,
  status: GOVERNED_RUN_LIFECYCLE_STATUS,
  states: GovernedRunLifecycleStates,
  intents: GovernedRunLifecycleIntents,
  terminal_states: GovernedRunLifecycleTerminalStates,
  allowed_transitions: GOVERNED_RUN_LIFECYCLE_ALLOWED_TRANSITIONS,
  persistence_mapping: GOVERNED_RUN_LIFECYCLE_PERSISTENCE_MAPPING,
  module_alignment: GOVERNED_RUN_LIFECYCLE_MODULE_ALIGNMENT,
  lifecycle_plan_alignment: RUNTIME_SLICE_STATE_LIFECYCLE.map(
    (state) => state.state,
  ),
  explicitly_out_of_scope: GOVERNED_RUN_LIFECYCLE_EXPLICITLY_OUT_OF_SCOPE,
  safety_boundary: GOVERNED_RUN_LIFECYCLE_SAFETY_BOUNDARY,
} as const satisfies GovernedRunLifecycle;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function isGovernedRunLifecycleState(
  input: unknown,
): input is GovernedRunLifecycleState {
  return GovernedRunLifecycleStateSchema.safeParse(input).success;
}

function isGovernedRunLifecycleIntent(
  input: unknown,
): input is GovernedRunLifecycleIntent {
  return GovernedRunLifecycleIntentSchema.safeParse(input).success;
}

function isTerminalState(state: GovernedRunLifecycleState): boolean {
  return terminalStateSet.has(state);
}

function persistenceStatusForState(
  state: GovernedRunLifecycleState,
): GovernedRunLifecyclePersistenceStatus {
  if (state === "COMPLETED") {
    return "TERMINAL_COMPLETED";
  }

  if (state === "CANCELLED") {
    return "TERMINAL_CANCELLED";
  }

  if (state === "FAILED") {
    return "TERMINAL_FAILED";
  }

  if (state === "REJECTED") {
    return "TERMINAL_REJECTED";
  }

  return "ACTIVE_OR_IN_PROGRESS";
}

function createPersistenceMapping(
  nextState: GovernedRunLifecycleState,
): GovernedRunLifecyclePersistenceMapping {
  return GovernedRunLifecyclePersistenceMappingSchema.parse({
    governed_run_current_state: nextState,
    governed_run_status: persistenceStatusForState(nextState),
    runtime_state_snapshot_state: nextState,
    future_audit_record: "future audit-addressable transition moment only",
  });
}

function findSpecificAllowedTransition(
  transition: GovernedRunLifecycleTransition,
): GovernedRunLifecycleAllowedTransition | undefined {
  return GOVERNED_RUN_LIFECYCLE_ALLOWED_TRANSITIONS.find(
    (allowed) =>
      allowed.current_state === transition.current_state &&
      allowed.intent === transition.intent,
  );
}

function wildcardTransitionFor(
  transition: GovernedRunLifecycleTransition,
): GovernedRunLifecycleAllowedTransition | undefined {
  if (isTerminalState(transition.current_state)) {
    return undefined;
  }

  if (transition.intent === "CANCEL_RUN") {
    return {
      current_state: transition.current_state,
      intent: transition.intent,
      next_state: "CANCELLED",
      reason_code: "RUN_CANCELLATION_ALLOWED",
      reason: "A non-terminal governed run may be cancelled.",
    };
  }

  if (transition.intent === "FAIL_RUN") {
    return {
      current_state: transition.current_state,
      intent: transition.intent,
      next_state: "FAILED",
      reason_code: "RUN_FAILURE_ALLOWED",
      reason: "A non-terminal governed run may fail closed.",
    };
  }

  return undefined;
}

function createDecision(
  allowed: GovernedRunLifecycleAllowedTransition,
): GovernedRunLifecycleDecision {
  return GovernedRunLifecycleDecisionSchema.parse({
    outcome: "ALLOWED",
    current_state: allowed.current_state,
    intent: allowed.intent,
    next_state: allowed.next_state,
    reason_code: allowed.reason_code,
    reason: allowed.reason,
    terminal: isTerminalState(allowed.next_state),
    persistence_mapping: createPersistenceMapping(allowed.next_state),
    audit_implication:
      "future audit descriptor should be addressable; no audit record is written",
  });
}

export function failClosedGovernedRunLifecycleDenial(
  input?: unknown,
  code: GovernedRunLifecycleDenialCode =
    "GOVERNED_RUN_LIFECYCLE_TRANSITION_DENIED",
): GovernedRunLifecycleDenial {
  const currentState = isRecord(input) && isGovernedRunLifecycleState(
    input.current_state,
  )
    ? input.current_state
    : undefined;
  const intent = isRecord(input) && isGovernedRunLifecycleIntent(input.intent)
    ? input.intent
    : undefined;

  const reasonCodeByDenialCode: Record<
    GovernedRunLifecycleDenialCode,
    GovernedRunLifecycleReasonCode
  > = {
    GOVERNED_RUN_LIFECYCLE_INPUT_REQUIRED: "LIFECYCLE_INPUT_INVALID",
    GOVERNED_RUN_LIFECYCLE_STATE_INVALID: "LIFECYCLE_STATE_INVALID",
    GOVERNED_RUN_LIFECYCLE_INTENT_INVALID: "LIFECYCLE_INTENT_INVALID",
    GOVERNED_RUN_LIFECYCLE_TRANSITION_DENIED:
      "LIFECYCLE_TRANSITION_NOT_ALLOWED",
    GOVERNED_RUN_LIFECYCLE_TERMINAL_STATE_DENIED: "LIFECYCLE_TERMINAL_STATE",
  };

  const reasonByDenialCode: Record<GovernedRunLifecycleDenialCode, string> = {
    GOVERNED_RUN_LIFECYCLE_INPUT_REQUIRED:
      "A lifecycle transition request is required.",
    GOVERNED_RUN_LIFECYCLE_STATE_INVALID:
      "The lifecycle state is not recognized.",
    GOVERNED_RUN_LIFECYCLE_INTENT_INVALID:
      "The lifecycle intent is not recognized.",
    GOVERNED_RUN_LIFECYCLE_TRANSITION_DENIED:
      "The requested lifecycle transition is not allowed.",
    GOVERNED_RUN_LIFECYCLE_TERMINAL_STATE_DENIED:
      "Terminal lifecycle states cannot transition.",
  };

  return GovernedRunLifecycleDenialSchema.parse({
    outcome: "DENIED",
    code,
    current_state: currentState,
    intent,
    reason_code: reasonCodeByDenialCode[code],
    reason: reasonByDenialCode[code],
    message: "The governed run lifecycle transition is not allowed.",
  });
}

function denialForInvalidInput(input: unknown): GovernedRunLifecycleDenial {
  if (!isRecord(input)) {
    return failClosedGovernedRunLifecycleDenial(
      input,
      "GOVERNED_RUN_LIFECYCLE_INPUT_REQUIRED",
    );
  }

  if (!isGovernedRunLifecycleState(input.current_state)) {
    return failClosedGovernedRunLifecycleDenial(
      input,
      "GOVERNED_RUN_LIFECYCLE_STATE_INVALID",
    );
  }

  if (!isGovernedRunLifecycleIntent(input.intent)) {
    return failClosedGovernedRunLifecycleDenial(
      input,
      "GOVERNED_RUN_LIFECYCLE_INTENT_INVALID",
    );
  }

  return failClosedGovernedRunLifecycleDenial(input);
}

export function evaluateGovernedRunLifecycleTransition(
  input: unknown,
): Result<GovernedRunLifecycleDecision, GovernedRunLifecycleDenial> {
  const transition = GovernedRunLifecycleTransitionSchema.safeParse(input);

  if (!transition.success) {
    return err(denialForInvalidInput(input));
  }

  if (isTerminalState(transition.data.current_state)) {
    return err(
      failClosedGovernedRunLifecycleDenial(
        transition.data,
        "GOVERNED_RUN_LIFECYCLE_TERMINAL_STATE_DENIED",
      ),
    );
  }

  const allowed =
    findSpecificAllowedTransition(transition.data) ??
    wildcardTransitionFor(transition.data);

  if (allowed === undefined) {
    return err(failClosedGovernedRunLifecycleDenial(transition.data));
  }

  return ok(createDecision(allowed));
}

export function assertGovernedRunLifecycleTransition(
  input: unknown,
): Result<GovernedRunLifecycleDecision, GovernedRunLifecycleDenial> {
  return evaluateGovernedRunLifecycleTransition(input);
}

export function getGovernedRunLifecycle(): GovernedRunLifecycle {
  return GOVERNED_RUN_LIFECYCLE;
}
