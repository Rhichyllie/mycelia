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
  "persisted-governed-flow-harness",
  "persisted-governed-flow-harness.ts",
);

const FORBIDDEN_PATTERNS = [
  /\bPrismaClient\b/,
  /@prisma\/client/i,
  /\bfrom\s+["']node:fs["']/,
  /\bfrom\s+["']fs["']/,
  /\bfetch\s*\(/i,
  /route\.ts/i,
  /\bNextRequest\b/,
  /\bResponse\.json\b/,
  /<button|<form|jsx/i,
  /\bauth\b\s*\(/i,
  /\bDate\.now\b/,
  /\bnew\s+Date\b/,
  /\bMath\.random\b/,
  /\brandomUUID\b/i,
  /\bsetTimeout\b/,
  /\bsetInterval\b/,
  /\bEventEmitter\b/,
  /\bemit\s*\(/i,
  /\.emit\b/i,
  /\bwriteFile\b/i,
  /\bappendFile\b/i,
  /\btool\s+execution\b/i,
  /\bexternal\s+call\b/i,
  /\breplay\s+execution\b/i,
  /\bdangerouslySetInnerHTML\b/,
  /\bdownload\b/i,
  /\bpdf\b/i,
  /\bretired source\b/,
] as const;

describe("persisted governed flow harness source safety", () => {
  it("does not add API, UI, auth, external calls, replay execution, tools or retired source", () => {
    const source = productionCodeOnly(readFileSync(PRODUCTION_MODULE, "utf8"));

    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(source, `${pattern} must be absent`).not.toMatch(pattern);
    }
  });

  it("does not introduce hardcoded local absolute paths", () => {
    const source = readFileSync(PRODUCTION_MODULE, "utf8");
    const windowsForwardPath = ["C:", "Projetos", "mycelia"].join("/");
    const windowsBackslashPath = ["C:", "Projetos", "mycelia"].join("\\");

    expect(source).not.toContain(windowsForwardPath);
    expect(source).not.toContain(windowsBackslashPath);
  });
});
