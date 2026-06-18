import { execFileSync } from "node:child_process";

import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  APPROVAL_DECISION_UI_FIXTURES,
  APPROVAL_DECISION_UI_SURFACE_NAME,
  APPROVAL_DECISION_UI_UNSAFE_RAW_CONTENT_ATTEMPT,
  ApprovalDecisionUiSections,
  ApprovalDecisionUiStatuses,
  ApprovalDecisionUiSurface,
  DEFAULT_APPROVAL_DECISION_UI_PREVIEW,
  presentApprovalDecisionUiPreview,
} from ".";

function htmlForPreview(
  preview: unknown = DEFAULT_APPROVAL_DECISION_UI_PREVIEW,
): string {
  return renderToStaticMarkup(
    createElement(ApprovalDecisionUiSurface, { preview }),
  );
}

describe("approval decision ui surface", () => {
  it("exports module contract, presenter and renderer", () => {
    expect(APPROVAL_DECISION_UI_SURFACE_NAME).toBe(
      "Approval Decision UI Surface",
    );
    expect(ApprovalDecisionUiStatuses).toEqual([
      "APPROVAL_DECISION_PREVIEW_READY",
      "APPROVAL_DECISION_PREVIEW_INCOMPLETE",
      "APPROVAL_DECISION_PREVIEW_BLOCKED",
      "APPROVAL_DECISION_PREVIEW_FAILED_SAFE",
    ]);
    expect(ApprovalDecisionUiSections).toEqual([
      "approvalOverview",
      "governanceContext",
      "decisionPreview",
      "expectedRuntimeEffect",
      "safetyBoundary",
      "warnings",
      "nextActions",
    ]);
    expect(isValidElement(createElement(ApprovalDecisionUiSurface))).toBe(true);
  });

  it("renders the pending medium-risk approval fixture", () => {
    const model = presentApprovalDecisionUiPreview(
      APPROVAL_DECISION_UI_FIXTURES.pendingMediumRiskApproval,
    );
    const html = htmlForPreview(
      APPROVAL_DECISION_UI_FIXTURES.pendingMediumRiskApproval,
    );

    expect(model.status).toBe("APPROVAL_DECISION_PREVIEW_READY");
    expect(html).toContain("approval_preview_pending_medium");
    expect(html).toContain("REQUIRE_APPROVAL");
    expect(html).toContain("APPROVE, REJECT, CANCEL, TIMEOUT");
  });

  it("renders approved, rejected, cancelled and timed-out decision previews", () => {
    const scenarios = [
      ["approvedDecisionPreview", "APPROVED"],
      ["rejectedDecisionPreview", "REJECTED"],
      ["cancelledDecisionPreview", "CANCELLED"],
      ["timedOutDecisionPreview", "TIMED_OUT"],
    ] as const;

    for (const [fixtureName, expectedStatus] of scenarios) {
      const fixture = APPROVAL_DECISION_UI_FIXTURES[fixtureName];
      const model = presentApprovalDecisionUiPreview(fixture);
      const html = htmlForPreview(fixture);

      expect(model.status).toBe("APPROVAL_DECISION_PREVIEW_READY");
      expect(html).toContain(expectedStatus);
      expect(html).toContain("APPROVAL_DECIDED");
    }
  });

  it("renders missing approval request warnings and blocks live-action readiness", () => {
    const model = presentApprovalDecisionUiPreview(
      APPROVAL_DECISION_UI_FIXTURES.missingApprovalRequest,
    );
    const html = htmlForPreview(APPROVAL_DECISION_UI_FIXTURES.missingApprovalRequest);

    expect(model.status).toBe("APPROVAL_DECISION_PREVIEW_BLOCKED");
    expect(html).toContain("APPROVAL_REQUEST_REF_MISSING");
    expect(html).toContain("Not supplied");
  });

  it("blocks unsupported decision options", () => {
    const model = presentApprovalDecisionUiPreview(
      APPROVAL_DECISION_UI_FIXTURES.unsupportedDecisionOption,
    );
    const html = htmlForPreview(
      APPROVAL_DECISION_UI_FIXTURES.unsupportedDecisionOption,
    );

    expect(model.status).toBe("APPROVAL_DECISION_PREVIEW_BLOCKED");
    expect(html).toContain("UNSUPPORTED_DECISION_OPTION");
    expect(html).toContain("ESCALATE");
  });

  it("blocks already terminal approval status", () => {
    const model = presentApprovalDecisionUiPreview(
      APPROVAL_DECISION_UI_FIXTURES.alreadyTerminalApproval,
    );
    const html = htmlForPreview(
      APPROVAL_DECISION_UI_FIXTURES.alreadyTerminalApproval,
    );

    expect(model.status).toBe("APPROVAL_DECISION_PREVIEW_BLOCKED");
    expect(html).toContain("APPROVAL_STATUS_TERMINAL");
  });

  it("blocks tenant/run mismatches", () => {
    const model = presentApprovalDecisionUiPreview(
      APPROVAL_DECISION_UI_FIXTURES.tenantRunMismatch,
    );
    const html = htmlForPreview(APPROVAL_DECISION_UI_FIXTURES.tenantRunMismatch);

    expect(model.status).toBe("APPROVAL_DECISION_PREVIEW_BLOCKED");
    expect(html).toContain("TENANT_RUN_BOUNDARY_MISMATCH");
  });

  it("fails safe for unsafe raw-content attempts", () => {
    const model = presentApprovalDecisionUiPreview(
      APPROVAL_DECISION_UI_UNSAFE_RAW_CONTENT_ATTEMPT,
    );
    const html = htmlForPreview(APPROVAL_DECISION_UI_UNSAFE_RAW_CONTENT_ATTEMPT);

    expect(model.status).toBe("APPROVAL_DECISION_PREVIEW_FAILED_SAFE");
    expect(html).toContain("UNSAFE_RAW_FIELD_NAME");
    expect(html).not.toContain("unsafe content is never accepted");
  });

  it("normalizes missing fields without mutating the fixture", () => {
    const fixture = APPROVAL_DECISION_UI_FIXTURES.missingApprovalRequest;
    const before = JSON.stringify(fixture);
    const model = presentApprovalDecisionUiPreview(fixture);
    const after = JSON.stringify(fixture);

    expect(model.approvalOverview.some((item) => item.value === "Not supplied"))
      .toBe(true);
    expect(after).toBe(before);
  });

  it("renders all required UI sections", () => {
    const html = htmlForPreview();

    for (const heading of [
      "Approval overview",
      "Governance context",
      "Decision preview",
      "Expected runtime effect",
      "Safety boundary",
      "Warnings",
      "Next actions",
    ]) {
      expect(html).toContain(heading);
    }
  });

  it("does not render raw sensitive fields, SQL details or stack traces", () => {
    const combinedHtml = [
      ...Object.values(APPROVAL_DECISION_UI_FIXTURES).map((fixture) =>
        htmlForPreview(fixture),
      ),
      htmlForPreview(APPROVAL_DECISION_UI_UNSAFE_RAW_CONTENT_ATTEMPT),
    ].join("\n");

    expect(combinedHtml).not.toMatch(
      /rawDocument|documentContent|rawContent|fileBlob|binary|payload/i,
    );
    expect(combinedHtml).not.toMatch(/SQLITE|stack trace|private key|secret/i);
  });

  it("does not present fake submit or mutation affordances", () => {
    const html = htmlForPreview();

    expect(html).not.toMatch(/<form\b/i);
    expect(html).not.toMatch(/<button\b/i);
    expect(html).not.toMatch(/<input\b/i);
    expect(html).not.toMatch(/<textarea\b/i);
    expect(html).not.toMatch(/<select\b/i);
    expect(html).not.toContain("action=");
    expect(html).not.toContain("onSubmit");
  });

  it("keeps package files unchanged", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "package.json", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(status.trim()).toBe("");
  });
});
