"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";

import { MYCELIA_TOKENS } from "./design-tokens";
import { formatLiveReasonLabel, type LiveOutcomeStatus } from "./format-live-label";

export type ConsequentialActionRevealKind =
  | "RUN_CREATED"
  | "APPROVAL_DECIDED";

export type ConsequentialActionRevealInput = {
  readonly kind: ConsequentialActionRevealKind;
  readonly scenarioTitle?: string | null;
  readonly policyReasonCode?: string | null;
  readonly admissionReasonCode?: string | null;
  readonly decisionReasonCode?: string | null;
  readonly finalState: string;
  readonly riskLevel?: string | null;
  readonly decisionOutcome?: string | null;
};

export type ConsequentialActionRevealStage = {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
};

export type ConsequentialActionRevealProps = {
  readonly input: ConsequentialActionRevealInput;
  readonly reducedMotionMode?: "system" | "reduce";
};

const styles = {
  panel: {
    border: `1px solid ${MYCELIA_TOKENS.color.runtime.active}`,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.intent.successBg,
    color: MYCELIA_TOKENS.color.text.primary,
    marginTop: MYCELIA_TOKENS.spacing[4],
    overflow: "hidden",
    padding: `${MYCELIA_TOKENS.spacing[4]} ${MYCELIA_TOKENS.spacing[5]}`,
  },
  eyebrow: {
    margin: 0,
    color: MYCELIA_TOKENS.color.brand.sage,
    fontSize: MYCELIA_TOKENS.type.label,
    fontWeight: 850,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  stage: {
    marginTop: MYCELIA_TOKENS.spacing[2],
    transition: [
      `opacity ${MYCELIA_TOKENS.motion.duration.base} ${MYCELIA_TOKENS.motion.easing.enter}`,
      `transform ${MYCELIA_TOKENS.motion.duration.base} ${MYCELIA_TOKENS.motion.easing.enter}`,
    ].join(", "),
  },
  stageHidden: {
    opacity: 0,
    transform: "translateY(8px)",
  },
  stageVisible: {
    opacity: 1,
    transform: "translateY(0)",
  },
  title: {
    margin: 0,
    fontSize: MYCELIA_TOKENS.type.heading3,
    fontWeight: 850,
    lineHeight: 1.35,
  },
  detail: {
    margin: `${MYCELIA_TOKENS.spacing[1]} 0 0`,
    color: MYCELIA_TOKENS.color.text.secondary,
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    fontWeight: 700,
    lineHeight: 1.45,
  },
  count: {
    margin: `${MYCELIA_TOKENS.spacing[3]} 0 0`,
    color: MYCELIA_TOKENS.color.text.tertiary,
    fontSize: MYCELIA_TOKENS.type.badge,
    fontWeight: 760,
    textTransform: "uppercase",
  },
} satisfies Record<string, CSSProperties>;

const REVEAL_STEP_DELAY_MS = Number.parseInt(
  MYCELIA_TOKENS.motion.duration.slow,
  10,
);

export function isConsequentialSuccessStatus(
  status: string | null | undefined,
): status is ConsequentialActionRevealKind {
  return status === "RUN_CREATED" || status === "APPROVAL_DECIDED";
}

export function buildConsequentialActionRevealStages(
  input: ConsequentialActionRevealInput,
): readonly ConsequentialActionRevealStage[] {
  if (input.kind === "APPROVAL_DECIDED") {
    const decisionReason =
      input.decisionReasonCode === null || input.decisionReasonCode === undefined
        ? "The approval decision was recorded."
        : formatLiveReason(input.kind, input.decisionReasonCode);
    const decisionLabel =
      input.decisionOutcome === null || input.decisionOutcome === undefined
        ? "Decision recorded"
        : `Decision: ${humanState(input.decisionOutcome)}`;

    return [
      {
        id: "approval-decision-recorded",
        label: "Decision recorded",
        detail: decisionReason,
      },
      {
        id: "approval-decision-outcome",
        label: decisionLabel,
        detail: decisionReason,
      },
      {
        id: "approval-final-state",
        label: `Outcome: ${humanState(input.finalState)}`,
        detail: `Persisted state: ${input.finalState}`,
      },
    ];
  }

  const policyDetail =
    input.policyReasonCode === null || input.policyReasonCode === undefined
      ? "The policy check was recorded for this governed run."
      : formatLiveReason(input.kind, input.policyReasonCode);
  const admissionDetail =
    input.admissionReasonCode === null || input.admissionReasonCode === undefined
      ? `Persisted state: ${input.finalState}`
      : formatLiveReason(input.kind, input.admissionReasonCode);

  return [
    {
      id: "run-request-recorded",
      label: "Request recorded",
      detail: input.scenarioTitle ?? formatLiveReason(input.kind, "RUN_CREATED"),
    },
    {
      id: "run-policy-checked",
      label:
        input.riskLevel === null || input.riskLevel === undefined
          ? "Policy checked"
          : `Risk level: ${input.riskLevel}`,
      detail: policyDetail,
    },
    {
      id: "run-final-state",
      label: `Outcome: ${humanState(input.finalState)}`,
      detail: admissionDetail,
    },
  ];
}

export function ConsequentialActionReveal({
  input,
  reducedMotionMode = "system",
}: ConsequentialActionRevealProps): ReactElement {
  const stages = useMemo(
    () => buildConsequentialActionRevealStages(input),
    [input],
  );
  const finalStageIndex = Math.max(0, stages.length - 1);
  const [activeStageIndex, setActiveStageIndex] = useState(finalStageIndex);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const shouldReduceMotion =
      reducedMotionMode === "reduce" || prefersReducedMotion();

    if (shouldReduceMotion || stages.length <= 1) {
      return undefined;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    function showStage(index: number): void {
      if (cancelled) {
        return;
      }

      setIsVisible(false);
      timers.push(
        setTimeout(() => {
          if (cancelled) {
            return;
          }

          setActiveStageIndex(index);
          setIsVisible(true);
        }, 0),
      );
    }

    timers.push(
      setTimeout(() => {
        showStage(0);
      }, 0),
    );

    for (let index = 1; index < stages.length; index += 1) {
      timers.push(
        setTimeout(() => {
          showStage(index);
        }, index * REVEAL_STEP_DELAY_MS),
      );
    }

    return () => {
      cancelled = true;
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [finalStageIndex, reducedMotionMode, stages]);

  const stage = stages[activeStageIndex] ?? stages[finalStageIndex];

  return (
    <section aria-live="polite" role="status" style={styles.panel}>
      <p style={styles.eyebrow}>Recorded transition</p>
      <div
        style={{
          ...styles.stage,
          ...(isVisible ? styles.stageVisible : styles.stageHidden),
        }}
      >
        <p style={styles.title}>{stage.label}</p>
        <p style={styles.detail}>{stage.detail}</p>
      </div>
      <p style={styles.count}>
        Step {activeStageIndex + 1} of {stages.length}
      </p>
    </section>
  );
}

function formatLiveReason(
  status: LiveOutcomeStatus,
  reasonCode: string,
): string {
  return formatLiveReasonLabel({ status, reasonCode });
}

function humanState(value: string): string {
  return value.replaceAll("_", " ").toLowerCase();
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
