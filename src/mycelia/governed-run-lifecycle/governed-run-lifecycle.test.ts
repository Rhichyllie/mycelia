import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  RuntimePersistenceRunStates,
} from "../runtime-persistence-model";
import {
  RUNTIME_SLICE_STATE_LIFECYCLE,
} from "../runtime-slice-technical-plan";

import {
  GOVERNED_RUN_LIFECYCLE_ALLOWED_TRANSITIONS,
  GovernedRunLifecycleIntentSchema,
  GovernedRunLifecycleIntents,
  GovernedRunLifecycleNonTerminalStates,
  GovernedRunLifecycleStateSchema,
  GovernedRunLifecycleStates,
  GovernedRunLifecycleTerminalStates,
  assertGovernedRunLifecycleTransition,
  evaluateGovernedRunLifecycleTransition,
  failClosedGovernedRunLifecycleDenial,
  getGovernedRunLifecycle,
  type GovernedRunLifecycleIntent,
  type GovernedRunLifecycleState,
} from ".";

const EXPECTED_STATES = [
  "CREATED",
  "CONTEXT_RESOLVED",
  "POLICY_EVALUATED",
  "ADMISSION_GRANTED",
  "WAITING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "RUNNING",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
] as const;

const EXPECTED_INTENTS = [
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

const TERMINAL_STATES = [
  "COMPLETED",
  "CANCELLED",
  "FAILED",
  "REJECTED",
] as const;

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

function expectAllowed(
  currentState: GovernedRunLifecycleState,
  intent: GovernedRunLifecycleIntent,
  nextState: GovernedRunLifecycleState,
): void {
  const result = evaluateGovernedRunLifecycleTransition({
    current_state: currentState,
    intent,
  });

  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error("Expected governed run lifecycle transition to be allowed.");
  }

  expect(result.value.current_state).toBe(currentState);
  expect(result.value.intent).toBe(intent);
  expect(result.value.next_state).toBe(nextState);
  expect(result.value.reason).toBeTruthy();
  expect(result.value.persistence_mapping.governed_run_current_state).toBe(
    nextState,
  );
  expect(result.value.persistence_mapping.runtime_state_snapshot_state).toBe(
    nextState,
  );
}

describe("governed run lifecycle", () => {
  it("builds the deterministic lifecycle model successfully", () => {
    const model = getGovernedRunLifecycle();

    expect(model.phase).toBe("2S");
    expect(model.name).toBe("Minimal Governed Run Lifecycle");
    expect(model.status).toBe(
      "pure TypeScript in-memory lifecycle logic only",
    );
  });

  it("defines the exact planned lifecycle states", () => {
    expect(GovernedRunLifecycleStates).toEqual(EXPECTED_STATES);
    expect(getGovernedRunLifecycle().states).toEqual(EXPECTED_STATES);
  });

  it("defines the exact planned transition intents", () => {
    expect(GovernedRunLifecycleIntents).toEqual(EXPECTED_INTENTS);
    expect(getGovernedRunLifecycle().intents).toEqual(EXPECTED_INTENTS);
  });

  it("defines the exact terminal states", () => {
    expect(GovernedRunLifecycleTerminalStates).toEqual(TERMINAL_STATES);
    expect(getGovernedRunLifecycle().terminal_states).toEqual(TERMINAL_STATES);
  });

  it("allows the explicit planned transitions", () => {
    for (const transition of GOVERNED_RUN_LIFECYCLE_ALLOWED_TRANSITIONS) {
      expectAllowed(
        transition.current_state,
        transition.intent,
        transition.next_state,
      );
    }
  });

  it("denies invalid transitions", () => {
    const result = evaluateGovernedRunLifecycleTransition({
      current_state: "CREATED",
      intent: "APPROVE",
    });

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Expected governed run lifecycle transition denial.");
    }

    expect(result.error.code).toBe(
      "GOVERNED_RUN_LIFECYCLE_TRANSITION_DENIED",
    );
    expect(result.error.current_state).toBe("CREATED");
    expect(result.error.intent).toBe("APPROVE");
    expect(result.error.reason_code).toBe("LIFECYCLE_TRANSITION_NOT_ALLOWED");
    expect(result.error.message).toBe(
      "The governed run lifecycle transition is not allowed.",
    );
  });

  it("denies every transition from terminal states", () => {
    for (const state of GovernedRunLifecycleTerminalStates) {
      for (const intent of GovernedRunLifecycleIntents) {
        const result = evaluateGovernedRunLifecycleTransition({
          current_state: state,
          intent,
        });

        expect(result.ok).toBe(false);

        if (result.ok) {
          throw new Error("Expected terminal lifecycle transition denial.");
        }

        expect(result.error.code).toBe(
          "GOVERNED_RUN_LIFECYCLE_TERMINAL_STATE_DENIED",
        );
        expect(result.error.current_state).toBe(state);
        expect(result.error.intent).toBe(intent);
      }
    }
  });

  it("allows cancellation from all non-terminal states", () => {
    for (const state of GovernedRunLifecycleNonTerminalStates) {
      expectAllowed(state, "CANCEL_RUN", "CANCELLED");
    }
  });

  it("allows fail-closed failure from all non-terminal states", () => {
    for (const state of GovernedRunLifecycleNonTerminalStates) {
      expectAllowed(state, "FAIL_RUN", "FAILED");
    }
  });

  it("does not mutate transition inputs", () => {
    const transition = Object.freeze({
      current_state: "CREATED",
      intent: "RESOLVE_CONTEXT",
    });
    const before = { ...transition };

    const result = evaluateGovernedRunLifecycleTransition(transition);

    expect(result.ok).toBe(true);
    expect(transition).toEqual(before);
  });

  it("includes current state, intent, next state and reason in decisions", () => {
    const result = evaluateGovernedRunLifecycleTransition({
      current_state: "RUNNING",
      intent: "COMPLETE_RUN",
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Expected governed run lifecycle transition to be allowed.");
    }

    expect(result.value).toMatchObject({
      outcome: "ALLOWED",
      current_state: "RUNNING",
      intent: "COMPLETE_RUN",
      next_state: "COMPLETED",
      reason_code: "RUN_COMPLETION_ALLOWED",
      terminal: true,
    });
    expect(result.value.reason).toBe("A running governed run may complete.");
    expect(result.value.audit_implication).toBe(
      "future audit descriptor should be addressable; no audit record is written",
    );
  });

  it("includes current state, intent, safe reason and safe code in denials", () => {
    const result = failClosedGovernedRunLifecycleDenial({
      current_state: "CREATED",
      intent: "COMPLETE_RUN",
    });

    expect(result).toMatchObject({
      outcome: "DENIED",
      code: "GOVERNED_RUN_LIFECYCLE_TRANSITION_DENIED",
      current_state: "CREATED",
      intent: "COMPLETE_RUN",
      reason_code: "LIFECYCLE_TRANSITION_NOT_ALLOWED",
      reason: "The requested lifecycle transition is not allowed.",
      message: "The governed run lifecycle transition is not allowed.",
    });
  });

  it("schemas reject unknown states and intents", () => {
    expect(GovernedRunLifecycleStateSchema.safeParse("ADMITTED").success).toBe(
      false,
    );
    expect(GovernedRunLifecycleIntentSchema.safeParse("EXECUTE").success).toBe(
      false,
    );

    expect(
      evaluateGovernedRunLifecycleTransition({
        current_state: "ADMITTED",
        intent: "START_RUN",
      }).ok,
    ).toBe(false);

    expect(
      evaluateGovernedRunLifecycleTransition({
        current_state: "CREATED",
        intent: "EXECUTE",
      }).ok,
    ).toBe(false);
  });

  it("assert helper returns the same fail-closed Result style", () => {
    const accepted = assertGovernedRunLifecycleTransition({
      current_state: "CREATED",
      intent: "RESOLVE_CONTEXT",
    });
    const denied = assertGovernedRunLifecycleTransition({
      current_state: "CREATED",
      intent: "COMPLETE_RUN",
    });

    expect(accepted.ok).toBe(true);
    expect(denied.ok).toBe(false);
  });

  it("maps conceptually to the runtime persistence scaffold", () => {
    const model = getGovernedRunLifecycle();

    expect(model.states).toEqual([...RuntimePersistenceRunStates]);
    expect(model.persistence_mapping).toEqual([
      "next_state maps to future GovernedRun.currentState",
      "terminal outcome maps to future GovernedRun.status",
      "next_state maps to future RuntimeStateSnapshot.state",
      "allowed decisions are future audit-addressable lifecycle moments",
      "denials are future audit-addressable governance moments",
    ]);

    const decision = evaluateGovernedRunLifecycleTransition({
      current_state: "POLICY_EVALUATED",
      intent: "REQUIRE_APPROVAL",
    });

    expect(decision.ok).toBe(true);

    if (!decision.ok) {
      throw new Error("Expected lifecycle transition to be allowed.");
    }

    expect(decision.value.persistence_mapping).toEqual({
      governed_run_current_state: "WAITING_APPROVAL",
      governed_run_status: "ACTIVE_OR_IN_PROGRESS",
      runtime_state_snapshot_state: "WAITING_APPROVAL",
      future_audit_record: "future audit-addressable transition moment only",
    });
  });

  it("aligns with the runtime slice technical plan lifecycle states", () => {
    const plannedStates = RUNTIME_SLICE_STATE_LIFECYCLE.map(
      (state) => state.state,
    );

    expect(getGovernedRunLifecycle().lifecycle_plan_alignment).toEqual(
      plannedStates,
    );
    expect(getGovernedRunLifecycle().states).toEqual(plannedStates);
  });

  it("does not imply runtime execution or active persistence exists", () => {
    const text = collectStrings(getGovernedRunLifecycle()).join("\n").toLowerCase();

    expect(text).toContain("no runtime execution");
    expect(text).toContain("no persistence");
    expect(text).toContain("no db access");
    expect(text).toContain("no repository/service layer");
    expect(text).not.toContain("runtime execution is active");
    expect(text).not.toContain("active persistence exists");
    expect(text).not.toContain("database access is available");
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
