import { describe, expect, it } from "vitest";

import {
  buildLiveOutcomeRedirectPath,
  formatLiveOutcomeTitle,
  formatLiveReasonLabel,
  parseLiveOutcomeSearchParams,
} from "./format-live-label";

describe("live label formatting", () => {
  it("humanizes known reason codes", () => {
    expect(
      formatLiveReasonLabel({
        status: "FAILED_SAFE",
        reasonCode: "NO_WAITING_APPROVAL_RUN",
      }),
    ).toBe("Create a governed request before asking the approval page to decide one.");
    expect(
      formatLiveReasonLabel({
        status: "FAILED_SAFE",
        reasonCode: "APPROVAL_REQUEST_NOT_PENDING",
      }),
    ).toBe(
      "The approval request is no longer pending, so the prior decision was preserved.",
    );
    expect(
      formatLiveReasonLabel({
        status: "FAILED_SAFE",
        reasonCode: "POLICY_EVALUATED",
      }),
    ).toBe("The policy check was recorded for this governed run.");
    expect(
      formatLiveReasonLabel({
        status: "FAILED_SAFE",
        reasonCode: "APPROVAL_RATIONALE_REQUIRED",
      }),
    ).toBe("Add a rationale before rejecting this approval request.");
    expect(
      formatLiveReasonLabel({
        status: "RUN_CREATED",
        reasonCode: "SENSITIVE_TRANSFER_HIGH_RISK",
      }),
    ).toBe(
      "The policy check found this sensitive transfer fixture to be high risk.",
    );
  });

  it("uses safe fallback text without exposing raw machine codes", () => {
    expect(formatLiveOutcomeTitle("FAILED_SAFE")).toBe(
      "The demo action stopped safely before completing.",
    );
    expect(formatLiveOutcomeTitle("RUN_CREATED")).toBe(
      "The governed request was created.",
    );
    expect(formatLiveOutcomeTitle("APPROVAL_DECIDED")).toBe(
      "The approval decision was recorded.",
    );
    expect(
      formatLiveReasonLabel({
        status: "FAILED_SAFE",
        safeReason: "Controlled reset failed before writing anything.",
      }),
    ).toBe("Controlled reset failed before writing anything.");
    expect(formatLiveReasonLabel({ status: "DEMO_MODE_DISABLED" })).toBe(
      "Demo reset is disabled in this environment.",
    );
  });

  it("parses and builds live outcome query strings", () => {
    const href = buildLiveOutcomeRedirectPath("/mycelia/approvals", {
      status: "FAILED_SAFE",
      reasonCode: "RUN_NOT_WAITING_APPROVAL",
    });

    expect(href).toBe(
      "/mycelia/approvals?liveStatus=FAILED_SAFE&liveReasonCode=RUN_NOT_WAITING_APPROVAL",
    );
    expect(
      parseLiveOutcomeSearchParams({
        liveStatus: "FAILED_SAFE",
        liveReasonCode: ["RUN_NOT_WAITING_APPROVAL", "IGNORED"],
      }),
    ).toEqual({
      status: "FAILED_SAFE",
      reasonCode: "RUN_NOT_WAITING_APPROVAL",
    });

    const successHref = buildLiveOutcomeRedirectPath("/mycelia/runs?runId=run_1", {
      status: "RUN_CREATED",
      reasonCode: "POLICY_ADMITTED_LOW_RISK",
    });

    expect(successHref).toBe(
      "/mycelia/runs?runId=run_1&liveStatus=RUN_CREATED&liveReasonCode=POLICY_ADMITTED_LOW_RISK",
    );
    expect(
      parseLiveOutcomeSearchParams({
        liveStatus: "RUN_CREATED",
        liveReasonCode: "POLICY_ADMITTED_LOW_RISK",
      }),
    ).toEqual({
      status: "RUN_CREATED",
      reasonCode: "POLICY_ADMITTED_LOW_RISK",
    });
    expect(
      parseLiveOutcomeSearchParams({
        liveStatus: "APPROVAL_DECIDED",
        liveReasonCode: "APPROVAL_ACCEPTED",
      }),
    ).toEqual({
      status: "APPROVAL_DECIDED",
      reasonCode: "APPROVAL_ACCEPTED",
    });
  });

  it("ignores unrelated or unsupported query strings", () => {
    expect(parseLiveOutcomeSearchParams({})).toBeNull();
    expect(parseLiveOutcomeSearchParams({ liveStatus: "OK" })).toBeNull();
  });
});
