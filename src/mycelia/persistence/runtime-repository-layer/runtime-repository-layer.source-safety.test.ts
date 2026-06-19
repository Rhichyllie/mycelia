import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

function productionCodeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/(["'`])(?:\\[\s\S]|(?!\1)[^\\])*\1/g, "\"\"");
}

const PRODUCTION_MODULE = repoPath(
  "src",
  "mycelia",
  "persistence",
  "runtime-repository-layer",
  "runtime-repository-layer.ts",
);

const FORBIDDEN_PRODUCTION_PATTERNS = [
  /\bPrismaClient\b/,
  /@prisma\/client/i,
  /\bdb\./i,
  /\bdatabase\b/i,
  /\bconnect\b/i,
  /\btransaction\b/i,
  /\$queryRaw\b/i,
  /\$executeRaw\b/i,
  /\bfrom\s+["']node:fs["']/,
  /\bfrom\s+["']fs["']/,
  /\bfetch\s*\(/i,
  /route\.ts/i,
  /\bcookies\s*\(/i,
  /\bheaders\s*\(/i,
  /\bDate\.now\b/,
  /\bnew\s+Date\b/,
  /\bMath\.random\b/,
  /\brandomUUID\b/i,
  /\bsetTimeout\b/,
  /\bsetInterval\b/,
  /\bEventEmitter\b/,
  /\bemit\s*\(/i,
  /\.emit\b/i,
  /\btool\s+execution\b/i,
  /\bexternal\s+call\b/i,
  /\bdangerouslySetInnerHTML\b/,
  /\bdownload\b/i,
  /\bpdf\b/i,
  /\bMapIA\b/,
] as const;

describe("runtime repository layer source safety", () => {
  it("does not import PrismaClient, DB clients, fs, route handlers, timers, random behavior, events, tools, external calls or MapIA", () => {
    const source = productionCodeOnly(readFileSync(PRODUCTION_MODULE, "utf8"));

    for (const pattern of FORBIDDEN_PRODUCTION_PATTERNS) {
      expect(source, `${pattern} must be absent`).not.toMatch(pattern);
    }
  });

  it("does not add API routes, UI, auth, runtime execution, replay execution, audit writing or generated artifacts", () => {
    const source = productionCodeOnly(readFileSync(PRODUCTION_MODULE, "utf8"));

    expect(source).not.toMatch(/\bNextRequest\b/);
    expect(source).not.toMatch(/\bResponse\.json\b/);
    expect(source).not.toMatch(/<button|<form|jsx/i);
    expect(source).not.toMatch(/\bauth\b\s*\(/i);
    expect(source).not.toMatch(/\baudit\s*write\b/i);
    expect(source).not.toMatch(/\bwriteFile\b/i);
    expect(source).not.toMatch(/\bappendFile\b/i);
  });

  it("does not modify lockfile or Phase 3A schema and migration", () => {
    const packageStatus = execFileSync(
      "git",
      ["status", "--short", "--", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );
    const schemaDiff = execFileSync(
      "git",
      [
        "diff",
        "--name-only",
        "--",
        "prisma/schema.prisma",
        "prisma/migrations/000001_minimal_runtime_slice/migration.sql",
      ],
      { encoding: "utf8" },
    );

    expect(packageStatus.trim()).toBe("");
    expect(schemaDiff.trim()).toBe("");
  });
});
