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
  ["src", "mycelia", "runtime", "ui", "live-route-nav.tsx"],
  ["src", "mycelia", "runtime", "ui", "live-outcome-banner.tsx"],
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

  it("keeps the run workspace wired to persisted runs and timeline detail", () => {
    const runWorkspaceSource = source("app", "mycelia", "runs", "page.tsx");

    expect(runWorkspaceSource).toContain("createPrismaGovernedRunRepository");
    expect(runWorkspaceSource).toContain("listRecent");
    expect(runWorkspaceSource).toContain("findRunById");
    expect(runWorkspaceSource).toContain("loadInvestigationTimeline");
    expect(runWorkspaceSource).toContain("runId");
    expect(runWorkspaceSource).toContain("Risk level");
    expect(runWorkspaceSource).toContain("Policy check");
    expect(runWorkspaceSource).toContain("Readiness check");
    expect(runWorkspaceSource).toContain("History and lineage");
  });
});
