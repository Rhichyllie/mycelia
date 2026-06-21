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
  });

  it("uses safe fallback text without exposing raw machine codes", () => {
    expect(formatLiveOutcomeTitle("FAILED_SAFE")).toBe(
      "The demo action stopped safely before completing.",
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
    const href = buildLiveOutcomeRedirectPath("/mycelia/approval/decision", {
      status: "FAILED_SAFE",
      reasonCode: "RUN_NOT_WAITING_APPROVAL",
    });

    expect(href).toBe(
      "/mycelia/approval/decision?liveStatus=FAILED_SAFE&liveReasonCode=RUN_NOT_WAITING_APPROVAL",
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
  });

  it("ignores unrelated or unsupported query strings", () => {
    expect(parseLiveOutcomeSearchParams({})).toBeNull();
    expect(parseLiveOutcomeSearchParams({ liveStatus: "OK" })).toBeNull();
  });
});