import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MYCELIA_TOKENS } from "./design-tokens";

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

function source(...segments: string[]): string {
  return readFileSync(repoPath(...segments), "utf8");
}

const tokenizedSurfaceFiles = [
  ["src", "mycelia", "ui-surfaces", "product-surface-shell", "product-surface-shell.tsx"],
  ["src", "mycelia", "runtime", "ui", "risk-pill.tsx"],
  ["src", "mycelia", "runtime", "ui", "live-route-nav.tsx"],
  ["src", "mycelia", "runtime", "ui", "live-outcome-banner.tsx"],
  ["src", "mycelia", "runtime", "ui", "consequential-action-reveal.tsx"],
  ["app", "mycelia", "page.tsx"],
  ["app", "mycelia", "runs", "page.tsx"],
  ["app", "mycelia", "approvals", "page.tsx"],
  ["app", "mycelia", "investigations", "page.tsx"],
  ["app", "mycelia", "studio", "page.tsx"],
  ["app", "mycelia", "about", "page.tsx"],
] as const;

describe("MYCELIA design token foundation", () => {
  it("defines the MVP dark identity token groups", () => {
    expect(MYCELIA_TOKENS.color.bg.canvas).toBeTypeOf("string");
    expect(MYCELIA_TOKENS.color.brand.sage).toBeTypeOf("string");
    expect(MYCELIA_TOKENS.color.brand.ivory).toBeTypeOf("string");
    expect(MYCELIA_TOKENS.color.policy.requiresApproval).toBeTypeOf("string");
    expect(MYCELIA_TOKENS.color.runtime.failed).toBeTypeOf("string");
    expect(MYCELIA_TOKENS.spacing[4]).toBeTypeOf("string");
    expect(MYCELIA_TOKENS.radius.panel).toBeTypeOf("string");
    expect(MYCELIA_TOKENS.type.heading1).toBeTypeOf("string");
    expect(MYCELIA_TOKENS.motion.duration.instant).toBe("0ms");
    expect(MYCELIA_TOKENS.motion.duration.fast).toBe("100ms");
    expect(MYCELIA_TOKENS.motion.duration.base).toBe("200ms");
    expect(MYCELIA_TOKENS.motion.duration.slow).toBe("300ms");
    expect(MYCELIA_TOKENS.motion.easing.standard).toBe(
      "cubic-bezier(0.2, 0, 0, 1)",
    );
    expect(MYCELIA_TOKENS.motion.easing.enter).toBe(
      "cubic-bezier(0, 0, 0.2, 1)",
    );
    expect(MYCELIA_TOKENS.motion.easing.exit).toBe(
      "cubic-bezier(0.4, 0, 1, 1)",
    );
  });

  it("keeps hardcoded color values out of primary component code", () => {
    for (const file of tokenizedSurfaceFiles) {
      expect(source(...file), file.join("/")).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
  });

  it("makes every primary surface consume the shared token source", () => {
    for (const file of tokenizedSurfaceFiles) {
      expect(source(...file), file.join("/")).toContain("MYCELIA_TOKENS");
    }
  });

  it("keeps consequential motion finite and tokenized", () => {
    const revealSource = source(
      "src",
      "mycelia",
      "runtime",
      "ui",
      "consequential-action-reveal.tsx",
    );

    expect(revealSource).toContain("MYCELIA_TOKENS.motion.duration.base");
    expect(revealSource).toContain("MYCELIA_TOKENS.motion.duration.slow");
    expect(revealSource).toContain("MYCELIA_TOKENS.motion.easing.enter");
    expect(revealSource).toContain("prefers-reduced-motion");
    expect(revealSource).not.toMatch(/animationIterationCount|infinite|@keyframes/i);
    expect(revealSource).not.toMatch(/bounce|elastic|spring/i);
  });

  it("keeps the run workspace wired to persisted runs and timeline detail", () => {
    const runWorkspaceSource = source("app", "mycelia", "runs", "page.tsx");

    expect(runWorkspaceSource).toContain("createPrismaGovernedRunRepository");
    expect(runWorkspaceSource).toContain("listRecent");
    expect(runWorkspaceSource).toContain("findRunById");
    expect(runWorkspaceSource).toContain("loadInvestigationTimeline");
    expect(runWorkspaceSource).toContain("renderRiskPill");
    expect(runWorkspaceSource).not.toContain("function riskTone");
    expect(runWorkspaceSource).toContain("runId");
    expect(runWorkspaceSource).toContain("Risk level");
    expect(runWorkspaceSource).toContain("Policy check");
    expect(runWorkspaceSource).toContain("Readiness check");
    expect(runWorkspaceSource).toContain("History and lineage");
    expect(runWorkspaceSource).toContain("/mycelia/investigations?runId=");
    expect(runWorkspaceSource).toContain("Open full investigation for this run");
  });

  it("keeps the Control Center wired to command-view feeds and actionable links", () => {
    const controlCenterSource = source("app", "mycelia", "page.tsx");

    expect(controlCenterSource).toContain("getControlCenterSummary");
    expect(controlCenterSource).toContain("createPrismaGovernedRunRepository");
    expect(controlCenterSource).toContain("createPrismaApprovalRequestRepository");
    expect(controlCenterSource).toContain("createPrismaDemoReadRepository");
    expect(controlCenterSource).toContain("listRecent");
    expect(controlCenterSource).toContain("listPendingForTenant");
    expect(controlCenterSource).toContain("renderRiskPill");
    expect(controlCenterSource).toContain("/mycelia/runs?runId=");
    expect(controlCenterSource).toContain("/mycelia/approvals?approvalId=");
    expect(controlCenterSource).toContain("Needs your attention");
  });

  it("keeps the approval decision center wired to queue, detail and rationale capture", () => {
    const approvalSource = source("app", "mycelia", "approvals", "page.tsx");

    expect(approvalSource).toContain("listPendingForTenant");
    expect(approvalSource).toContain("approvalId");
    expect(approvalSource).toContain("loadInvestigationTimeline");
    expect(approvalSource).toContain("Decision summary");
    expect(approvalSource).toContain("Risk level");
    expect(approvalSource).toContain("Policy check");
    expect(approvalSource).toContain("Evidence preview");
    expect(approvalSource).toContain("Rejection rationale");
    expect(approvalSource).toContain("safeDecisionSummary");
    expect(approvalSource).toContain("/mycelia/investigations?runId=");
  });

  it("keeps investigations wired to deep links and narrative evidence sections", () => {
    const investigationSource = source("app", "mycelia", "investigations", "page.tsx");

    expect(investigationSource).toContain("resolvedSearchParams?.runId");
    expect(investigationSource).toContain("loadInvestigationTimeline");
    expect(investigationSource).toContain("createPrismaGovernedRunRepository");
    expect(investigationSource).toContain("listRecent");
    expect(investigationSource).toContain("/mycelia/investigations?runId=");
    expect(investigationSource).toContain("Narrative timeline");
    expect(investigationSource).toContain("Evidence records");
  });
});
