import { execFileSync } from "node:child_process";

import { createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_MINIMAL_INVESTIGATION_UI_DESCRIPTOR,
  MINIMAL_INVESTIGATION_REFERENCE_RECORDS,
  MINIMAL_INVESTIGATION_REFERENCE_SCENARIO,
  MINIMAL_INVESTIGATION_UI_FIXTURES,
  MINIMAL_INVESTIGATION_UI_NAME,
  MinimalInvestigationUiRecordKinds,
  MinimalInvestigationUiSections,
  MinimalInvestigationUiSurface,
  loadMinimalInvestigationUiDescriptor,
  presentMinimalInvestigationDescriptor,
} from ".";
import { resolveInvestigationSelectionTarget } from "../../ui-surfaces/investigation-selection-readonly-boundary";

function htmlForFixture(
  fixture: keyof typeof MINIMAL_INVESTIGATION_UI_FIXTURES =
    "completeApproved",
): string {
  return renderToStaticMarkup(
    createElement(MinimalInvestigationUiSurface, {
      descriptor: MINIMAL_INVESTIGATION_UI_FIXTURES[fixture],
    }),
  );
}

describe("minimal investigation ui surface", () => {
  it("exports module contract, presenter and renderer", () => {
    expect(MINIMAL_INVESTIGATION_UI_NAME).toBe(
      "Minimal Investigation UI Surface",
    );
    expect(MinimalInvestigationUiSections).toEqual([
      "overview",
      "stateTimeline",
      "policyAdmission",
      "approval",
      "auditTrail",
      "persistenceCoverage",
      "findings",
      "nextActions",
    ]);
    expect(MinimalInvestigationUiRecordKinds).toEqual([
      "GovernedRun",
      "RuntimeStateSnapshot",
      "PolicyDecisionRecord",
      "AdmissionDecisionRecord",
      "ApprovalRequest",
      "AuditRecord",
    ]);
    expect(isValidElement(createElement(MinimalInvestigationUiSurface))).toBe(
      true,
    );
  });

  it("renders live read-only loader output through the same renderer contract", async () => {
    const loaded = await loadMinimalInvestigationUiDescriptor();
    const html = renderToStaticMarkup(
      createElement(MinimalInvestigationUiSurface, {
        descriptor: loaded.descriptor,
        sourceSummary: loaded.safeSummary,
      }),
    );

    expect(html).toContain("run_approved_reference");
    expect(html).toContain("persisted investigation read model");
    expect(html).toContain("Repository boundary reads only");
    expect(html).not.toContain("run_approved_static");
  });

  it("renders selected read-only investigation boundary output through the same renderer contract", async () => {
    const selected = await resolveInvestigationSelectionTarget();

    expect(selected.ok).toBe(true);

    if (!selected.ok) {
      throw new Error("Selection unexpectedly denied.");
    }

    const html = renderToStaticMarkup(
      createElement(MinimalInvestigationUiSurface, {
        descriptor: selected.value.uiDescriptor,
        sourceSummary: selected.value.safeSummary,
      }),
    );

    expect(html).toContain("run_approved_reference");
    expect(html).toContain("Investigation target resolved");
    expect(html).toContain("Repository boundary reads only");
    expect(html).not.toContain("run_approved_static");
  });

  it("renders all required semantic investigation sections", () => {
    const html = htmlForFixture();

    for (const heading of [
      "Overview",
      "State timeline",
      "Policy and admission",
      "Approval",
      "Audit trail",
      "Persistence coverage",
      "Findings",
      "Next actions",
    ]) {
      expect(html).toContain(heading);
    }
  });

  it("shows completeness and reconstruction verdict", () => {
    const html = htmlForFixture();

    expect(html).toContain("INVESTIGATION_RECONSTRUCTED");
    expect(html).toContain("COMPLETE");
  });

  it("renders overview, policy, approval, audit and coverage values", () => {
    const html = htmlForFixture();

    expect(html).toContain("run_approved_static");
    expect(html).toContain("tenant_01");
    expect(html).toContain("MEDIUM");
    expect(html).toContain("REQUIRE_APPROVAL");
    expect(html).toContain("APPROVED");
    expect(html).toContain("APPROVAL_DECIDED");
    expect(html).toContain("PolicyDecisionRecord");
  });

  it("renders missing audit warnings explicitly", () => {
    const html = htmlForFixture("incompleteAudit");

    expect(html).toContain("INVESTIGATION_INCOMPLETE");
    expect(html).toContain("ADMISSION_DECIDED");
    expect(html).toContain("AUDIT_ADMISSION_DECIDED_MISSING");
    expect(html).toContain("Expected audit moment ADMISSION_DECIDED");
  });

  it("handles no audit moments without pretending coverage is complete", () => {
    const html = htmlForFixture("noAuditMoments");

    expect(html).toContain(
      "No persisted audit moments are reconstructed in this descriptor.",
    );
    expect(html).toContain("REQUEST_CREATED");
    expect(html).toContain("ADMISSION_DECIDED");
    expect(html).toContain("INCOMPLETE");
  });

  it("renders missing approval as not reconstructed", () => {
    const html = htmlForFixture("approvalMissing");

    expect(html).toContain("Approval required");
    expect(html).toContain("Yes");
    expect(html).toContain("Not reconstructed");
    expect(html).toContain("APPROVAL_RECORD_MISSING");
  });

  it("renders partial persistence coverage with each first-slice record kind", () => {
    const html = htmlForFixture("partialCoverage");

    for (const recordKind of MinimalInvestigationUiRecordKinds) {
      expect(html).toContain(recordKind);
    }

    expect(html).toContain("missing");
    expect(html).toContain("PERSISTENCE_COVERAGE_PARTIAL");
  });

  it("renders empty findings and next actions as explicit empty states", () => {
    const html = htmlForFixture("emptyFindings");

    expect(html).toContain(
      "No findings were supplied or synthesized for this descriptor.",
    );
    expect(html).toContain(
      "No next actions were supplied by the read model descriptor.",
    );
  });

  it("renders blocked reconstruction honestly", () => {
    const html = htmlForFixture("blockedReconstruction");

    expect(html).toContain("INVESTIGATION_BLOCKED");
    expect(html).toContain("BLOCKED");
    expect(html).toContain("GOVERNED_RUN_MISSING");
    expect(html).toContain("No state snapshots are reconstructed");
  });

  it("normalizes descriptor presentation without mutating the fixture", () => {
    const before = JSON.stringify(DEFAULT_MINIMAL_INVESTIGATION_UI_DESCRIPTOR);
    const presented = presentMinimalInvestigationDescriptor(
      DEFAULT_MINIMAL_INVESTIGATION_UI_DESCRIPTOR,
    );
    const after = JSON.stringify(DEFAULT_MINIMAL_INVESTIGATION_UI_DESCRIPTOR);

    expect(presented.overview.length).toBeGreaterThan(0);
    expect(after).toBe(before);
  });

  it("does not render raw sensitive fields or storage internals", () => {
    const combinedHtml = Object.keys(MINIMAL_INVESTIGATION_UI_FIXTURES)
      .map((key) =>
        htmlForFixture(key as keyof typeof MINIMAL_INVESTIGATION_UI_FIXTURES)
      )
      .join("\n");

    expect(combinedHtml).not.toMatch(
      /rawDocument|documentContent|rawContent|fileBlob|binary|payload/i,
    );
    expect(combinedHtml).not.toMatch(/SQLITE|stack trace|secret|private key/i);
  });

  it("does not present false mutation affordances", () => {
    const html = htmlForFixture();

    expect(html).not.toMatch(/<button\b/i);
    expect(html).not.toMatch(/<form\b/i);
    expect(html).not.toMatch(/<input\b/i);
    expect(html).not.toMatch(/<textarea\b/i);
    expect(html).not.toMatch(/<select\b/i);
    expect(html).not.toContain("action=");
  });

  it("keeps reference source and scenario separate from UI fixture data", () => {
    expect(MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId).toBe(
      "run_approved_reference",
    );
    expect(MINIMAL_INVESTIGATION_REFERENCE_RECORDS.governedRuns[0].id).toBe(
      "run_approved_reference",
    );
    expect(DEFAULT_MINIMAL_INVESTIGATION_UI_DESCRIPTOR.overview.governedRunId)
      .toBe("run_approved_static");
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
