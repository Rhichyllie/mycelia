export type LiveOutcomeStatus =
  | "FAILED_SAFE"
  | "DEMO_MODE_DISABLED"
  | "RUN_CREATED";

export type LiveOutcome = {
  readonly status: LiveOutcomeStatus;
  readonly reasonCode?: string;
  readonly safeReason?: string;
};

export type LiveOutcomeSearchParams = Record<
  string,
  string | string[] | undefined
>;

const LIVE_OUTCOME_STATUS_PARAM = "liveStatus";
const LIVE_OUTCOME_REASON_CODE_PARAM = "liveReasonCode";
const LIVE_OUTCOME_SAFE_REASON_PARAM = "liveSafeReason";

const STATUS_LABELS = {
  FAILED_SAFE: "The demo action stopped safely before completing.",
  DEMO_MODE_DISABLED: "Demo reset is disabled in this environment.",
  RUN_CREATED: "The governed request was created.",
} as const satisfies Record<LiveOutcomeStatus, string>;

const REASON_LABELS = {
  NO_WAITING_APPROVAL_RUN:
    "Create a governed request before asking the approval page to decide one.",
  RUN_NOT_WAITING_APPROVAL:
    "The selected run is no longer waiting for approval, so the decision was not applied.",
  APPROVAL_REQUEST_NOT_PENDING:
    "The approval request is no longer pending, so the prior decision was preserved.",
  APPROVAL_RATIONALE_REQUIRED:
    "Add a rationale before rejecting this approval request.",
  APPROVAL_DECISION_FAILED:
    "The approval decision failed before the atomic write path completed.",
  POLICY_REQUIRES_APPROVAL:
    "The policy check requires approval before this can proceed.",
  POLICY_ADMITTED_LOW_RISK:
    "The policy check cleared the low-risk request without approval.",
  POLICY_DENIED_HIGH_RISK:
    "This request is blocked by policy.",
  POLICY_FAILED_SAFE_UNKNOWN_RISK:
    "The policy check stopped because the risk level was unknown.",
  RUN_CREATED: "The governed run was created from fixture metadata.",
  POLICY_EVALUATED: "The policy check was recorded for this governed run.",
  APPROVAL_ACCEPTED: "The approval request was accepted and persisted.",
  APPROVAL_REJECTED: "The approval request was rejected and persisted.",
} as const satisfies Record<string, string>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function cleanText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, 220);
}

function hasKnownReasonCode(
  reasonCode: string,
): reasonCode is keyof typeof REASON_LABELS {
  return Object.prototype.hasOwnProperty.call(REASON_LABELS, reasonCode);
}

function parseLiveOutcomeStatus(value: string | undefined): LiveOutcomeStatus | null {
  if (
    value === "FAILED_SAFE" ||
    value === "DEMO_MODE_DISABLED" ||
    value === "RUN_CREATED"
  ) {
    return value;
  }

  return null;
}

export function parseLiveOutcomeSearchParams(
  searchParams: LiveOutcomeSearchParams | undefined,
): LiveOutcome | null {
  if (searchParams === undefined) {
    return null;
  }

  const status = parseLiveOutcomeStatus(
    firstParam(searchParams[LIVE_OUTCOME_STATUS_PARAM]),
  );

  if (status === null) {
    return null;
  }

  return {
    status,
    ...(cleanText(firstParam(searchParams[LIVE_OUTCOME_REASON_CODE_PARAM]))
      ? {
          reasonCode: cleanText(
            firstParam(searchParams[LIVE_OUTCOME_REASON_CODE_PARAM]),
          ),
        }
      : {}),
    ...(cleanText(firstParam(searchParams[LIVE_OUTCOME_SAFE_REASON_PARAM]))
      ? {
          safeReason: cleanText(
            firstParam(searchParams[LIVE_OUTCOME_SAFE_REASON_PARAM]),
          ),
        }
      : {}),
  };
}

export function buildLiveOutcomeRedirectPath(
  path: string,
  outcome: LiveOutcome,
): string {
  const params = new URLSearchParams();
  params.set(LIVE_OUTCOME_STATUS_PARAM, outcome.status);

  if (outcome.reasonCode) {
    params.set(LIVE_OUTCOME_REASON_CODE_PARAM, outcome.reasonCode);
  } else if (outcome.safeReason) {
    params.set(LIVE_OUTCOME_SAFE_REASON_PARAM, outcome.safeReason);
  }

  return `${path}${path.includes("?") ? "&" : "?"}${params.toString()}`;
}

export function formatLiveOutcomeTitle(status: LiveOutcomeStatus): string {
  return STATUS_LABELS[status];
}

export function formatLiveReasonLabel(outcome: LiveOutcome): string {
  if (outcome.reasonCode && hasKnownReasonCode(outcome.reasonCode)) {
    return REASON_LABELS[outcome.reasonCode];
  }

  if (outcome.status === "DEMO_MODE_DISABLED") {
    return STATUS_LABELS.DEMO_MODE_DISABLED;
  }

  if (outcome.safeReason) {
    return outcome.safeReason;
  }

  return "The live demo kept the persisted workflow unchanged.";
}
