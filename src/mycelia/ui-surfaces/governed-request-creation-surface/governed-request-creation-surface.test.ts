import { execFileSync } from "node:child_process";

import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_GOVERNED_REQUEST_CREATION_DRAFT,
  GOVERNED_REQUEST_CREATION_FIXTURES,
  GOVERNED_REQUEST_CREATION_SURFACE_NAME,
  GOVERNED_REQUEST_CREATION_UNSAFE_RAW_CONTENT_ATTEMPT,
  GovernedRequestCreationSections,
  GovernedRequestCreationStatuses,
  GovernedRequestCreationSurface,
  presentGovernedRequestCreationDraft,
} from ".";

function htmlForDraft(
  draft: unknown = DEFAULT_GOVERNED_REQUEST_CREATION_DRAFT,
): string {
  return renderToStaticMarkup(
    createElement(GovernedRequestCreationSurface, { draft }),
  );
}

describe("governed request creation surface", () => {
  it("exports module contract, presenter and renderer", () => {
    expect(GOVERNED_REQUEST_CREATION_SURFACE_NAME).toBe(
      "Governed Request Creation Surface",
    );
    expect(GovernedRequestCreationStatuses).toEqual([
      "REQUEST_DRAFT_READY",
      "REQUEST_DRAFT_INCOMPLETE",
      "REQUEST_DRAFT_BLOCKED",
      "REQUEST_DRAFT_FAILED_SAFE",
    ]);
    expect(GovernedRequestCreationSections).toEqual([
      "requestOverview",
      "governancePreview",
      "safetyBoundary",
      "expectedRunPath",
      "requestSeedSummary",
      "warnings",
      "nextActions",
    ]);
    expect(isValidElement(createElement(GovernedRequestCreationSurface))).toBe(
      true,
    );
  });

  it("renders the low-risk document review request fixture", () => {
    const model = presentGovernedRequestCreationDraft(
      GOVERNED_REQUEST_CREATION_FIXTURES.lowRiskDocumentReview,
    );
    const html = htmlForDraft(GOVERNED_REQUEST_CREATION_FIXTURES.lowRiskDocumentReview);

    expect(model.status).toBe("REQUEST_DRAFT_READY");
    expect(html).toContain("draft_low_risk_document_review");
    expect(html).toContain("DOCUMENT_REVIEW");
    expect(html).toContain("ADMIT");
  });

  it("renders the medium-risk approval-required fixture", () => {
    const model = presentGovernedRequestCreationDraft(
      GOVERNED_REQUEST_CREATION_FIXTURES.mediumRiskApprovalRequired,
    );
    const html = htmlForDraft(
      GOVERNED_REQUEST_CREATION_FIXTURES.mediumRiskApprovalRequired,
    );

    expect(model.status).toBe("REQUEST_DRAFT_READY");
    expect(html).toContain("REQUEST_DRAFT_READY");
    expect(html).toContain("REQUIRE_APPROVAL");
    expect(html).toContain("compliance_reviewer");
    expect(html).toContain("APPROVAL_EXPECTED");
  });

  it("renders the high-risk blocked fixture", () => {
    const model = presentGovernedRequestCreationDraft(
      GOVERNED_REQUEST_CREATION_FIXTURES.highRiskBlocked,
    );
    const html = htmlForDraft(GOVERNED_REQUEST_CREATION_FIXTURES.highRiskBlocked);

    expect(model.status).toBe("REQUEST_DRAFT_BLOCKED");
    expect(html).toContain("REQUEST_DRAFT_BLOCKED");
    expect(html).toContain("HIGH_RISK_HINT");
  });

  it("renders incomplete drafts with explicit missing-field warnings", () => {
    const model = presentGovernedRequestCreationDraft(
      GOVERNED_REQUEST_CREATION_FIXTURES.incompleteDraft,
    );
    const html = htmlForDraft(GOVERNED_REQUEST_CREATION_FIXTURES.incompleteDraft);

    expect(model.status).toBe("REQUEST_DRAFT_INCOMPLETE");
    expect(html).toContain("REQUEST_DRAFT_INCOMPLETE");
    expect(html).toContain("Not supplied");
    expect(html).toContain("RESOURCE_REF_MISSING");
    expect(html).toContain("REQUEST_PURPOSE_MISSING");
  });

  it("fails safe for unsafe raw-content attempts", () => {
    const model = presentGovernedRequestCreationDraft(
      GOVERNED_REQUEST_CREATION_UNSAFE_RAW_CONTENT_ATTEMPT,
    );
    const html = htmlForDraft(GOVERNED_REQUEST_CREATION_UNSAFE_RAW_CONTENT_ATTEMPT);

    expect(model.status).toBe("REQUEST_DRAFT_FAILED_SAFE");
    expect(html).toContain("REQUEST_DRAFT_FAILED_SAFE");
    expect(html).toContain("UNSAFE_RAW_FIELD_NAME");
    expect(html).not.toContain("unsafe content is never accepted");
  });

  it("blocks unsupported action types", () => {
    const model = presentGovernedRequestCreationDraft(
      GOVERNED_REQUEST_CREATION_FIXTURES.unsupportedActionType,
    );
    const html = htmlForDraft(
      GOVERNED_REQUEST_CREATION_FIXTURES.unsupportedActionType,
    );

    expect(model.status).toBe("REQUEST_DRAFT_BLOCKED");
    expect(html).toContain("UNSUPPORTED_ACTION_TYPE");
    expect(html).toContain("BPMN_WORKFLOW_LAUNCH");
  });

  it("normalizes missing fields without mutating the fixture", () => {
    const before = JSON.stringify(GOVERNED_REQUEST_CREATION_FIXTURES.incompleteDraft);
    const model = presentGovernedRequestCreationDraft(
      GOVERNED_REQUEST_CREATION_FIXTURES.incompleteDraft,
    );
    const after = JSON.stringify(GOVERNED_REQUEST_CREATION_FIXTURES.incompleteDraft);

    expect(model.requestOverview.some((item) => item.value === "Not supplied"))
      .toBe(true);
    expect(after).toBe(before);
  });

  it("renders all required UI sections", () => {
    const html = htmlForDraft();

    for (const heading of [
      "Request overview",
      "Governance preview",
      "Safety boundary",
      "Expected run path",
      "Request seed summary",
      "Warnings",
      "Next actions",
    ]) {
      expect(html).toContain(heading);
    }
  });

  it("does not render raw sensitive fields, SQL details or stack traces", () => {
    const combinedHtml = [
      ...Object.values(GOVERNED_REQUEST_CREATION_FIXTURES).map((fixture) =>
        htmlForDraft(fixture),
      ),
      htmlForDraft(GOVERNED_REQUEST_CREATION_UNSAFE_RAW_CONTENT_ATTEMPT),
    ].join("\n");

    expect(combinedHtml).not.toMatch(
      /rawDocument|documentContent|rawContent|fileBlob|binary|payload/i,
    );
    expect(combinedHtml).not.toMatch(/SQLITE|stack trace|private key|secret/i);
  });

  it("does not present fake submit or mutation affordances", () => {
    const html = htmlForDraft();

    expect(html).not.toMatch(/<form\b/i);
    expect(html).not.toMatch(/<button\b/i);
    expect(html).not.toMatch(/<input\b/i);
    expect(html).not.toMatch(/<textarea\b/i);
    expect(html).not.toMatch(/<select\b/i);
    expect(html).not.toContain("action=");
    expect(html).not.toContain("onSubmit");
  });

  it("keeps pnpm-lock.yaml unchanged", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(status.trim()).toBe("");
  });
});
