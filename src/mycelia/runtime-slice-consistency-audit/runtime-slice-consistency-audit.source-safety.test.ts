import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

const RUNTIME_SLICE_PRODUCTION_SOURCES = [
  repoPath(
    "src",
    "mycelia",
    "runtime-slice-technical-plan",
    "runtime-slice-technical-plan.ts",
  ),
  repoPath(
    "src",
    "mycelia",
    "runtime-persistence-model",
    "runtime-persistence-model.ts",
  ),
  repoPath(
    "src",
    "mycelia",
    "governed-run-lifecycle",
    "governed-run-lifecycle.ts",
  ),
  repoPath(
    "src",
    "mycelia",
    "policy-admission-v1",
    "policy-admission-v1.ts",
  ),
  repoPath(
    "src",
    "mycelia",
    "audit-commit-boundary",
    "audit-commit-boundary.ts",
  ),
  repoPath(
    "src",
    "mycelia",
    "approval-gate-v1",
    "approval-gate-v1.ts",
  ),
  repoPath(
    "src",
    "mycelia",
    "investigation-view-model-v1",
    "investigation-view-model-v1.ts",
  ),
  repoPath(
    "src",
    "mycelia",
    "replay-dry-run-descriptor-v1",
    "replay-dry-run-descriptor-v1.ts",
  ),
  repoPath(
    "src",
    "mycelia",
    "internal-runtime-orchestrator-v1",
    "internal-runtime-orchestrator-v1.ts",
  ),
  repoPath(
    "src",
    "mycelia",
    "runtime-slice-consistency-audit",
    "runtime-slice-consistency-audit.ts",
  ),
] as const;

const FORBIDDEN_RUNTIME_SLICE_CODE_PATTERNS = [
  /\bfetch\s*\(/i,
  /\baxios\b/i,
  /\bXMLHttpRequest\b/i,
  /\bPrismaClient\b/,
  /@prisma\/client/i,
  /\bprisma\s*\./i,
  /\bdb\s*\./i,
  /\bdatabase\b/i,
  /\bcreateServer\s*\(/i,
  /route\.ts/i,
  /\bcookies\s*\(/i,
  /\bheaders\s*\(/i,
  /\blocalStorage\b/i,
  /\bsessionStorage\b/i,
  /\bwindow\s*\./i,
  /\bdocument\s*\./i,
  /\bDate\.now\b/,
  /\bnew\s+Date\b/,
  /\bMath\.random\b/,
  /\bcrypto\.random/i,
  /\brandomUUID\b/i,
  /\bsetTimeout\b/,
  /\bsetInterval\b/,
  /\bfs\s*\./i,
  /\breadFile\b/i,
  /\bwriteFile\b/i,
  /\bappendFile\b/i,
  /\bemit\s*\(/i,
  /\.emit\b/i,
  /\bEventEmitter\b/,
  /\baudit\s+write\b/i,
  /\bappend\s+log\b/i,
  /\btool\s+execution\b/i,
  /\bexternal\s+call\b/i,
  /\bdangerouslySetInnerHTML\b/,
  /\bdownload\b/i,
  /\bpdf\b/i,
  /\bMapIA\b/,
] as const;

function productionCodeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/(["'`])(?:\\[\s\S]|(?!\1)[^\\])*\1/g, "\"\"");
}

describe("runtime slice consistency audit source safety", () => {
  it("keeps production runtime slice modules free of forbidden active behavior", () => {
    for (const sourcePath of RUNTIME_SLICE_PRODUCTION_SOURCES) {
      const source = productionCodeOnly(readFileSync(sourcePath, "utf8"));

      for (const pattern of FORBIDDEN_RUNTIME_SLICE_CODE_PATTERNS) {
        expect(source, `${sourcePath} must not match ${pattern}`).not.toMatch(
          pattern,
        );
      }
    }
  });

  it("does not use runtime, replay, random, timestamp, Prisma, fetch or filesystem behavior in production code", () => {
    const joinedSource = RUNTIME_SLICE_PRODUCTION_SOURCES.map((sourcePath) =>
      productionCodeOnly(readFileSync(sourcePath, "utf8")),
    ).join("\n");

    expect(joinedSource).not.toMatch(/\bDate\.now\b/);
    expect(joinedSource).not.toMatch(/\bnew\s+Date\b/);
    expect(joinedSource).not.toMatch(/\bMath\.random\b/);
    expect(joinedSource).not.toMatch(/\brandomUUID\b/);
    expect(joinedSource).not.toMatch(/\bPrismaClient\b/);
    expect(joinedSource).not.toMatch(/\bfetch\s*\(/);
    expect(joinedSource).not.toMatch(/\bfs\s*\./);
    expect(joinedSource).not.toMatch(/\breadFile\b/);
    expect(joinedSource).not.toMatch(/\bwriteFile\b/);
  });

  it("does not modify pnpm-lock.yaml", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(status.trim()).toBe("");
  });
});
