import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
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

function productionSourceFiles(root: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(root)) {
    const fullPath = join(root, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...productionSourceFiles(fullPath));
      continue;
    }

    if (
      /\.(ts|tsx)$/.test(entry) &&
      !entry.endsWith(".test.ts") &&
      !entry.endsWith(".test.tsx")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

const APPLICATION_SOURCE_PATTERNS = [
  /\bPrismaClient\b/,
  /@prisma\/client/i,
  /\bprisma\s*\./i,
  /\bdb\s*\./i,
  /\bdatabase\s*\./i,
  /\.(findMany|findUnique|findFirst|create|createMany|update|upsert|delete|deleteMany)\s*\(/,
  /\bfetch\s*\(/i,
  /\bcreateServer\s*\(/i,
  /route\.ts/i,
  /\bcookies\s*\(/i,
  /\bheaders\s*\(/i,
  /\bwriteFile\b/i,
  /\bappendFile\b/i,
  /\bemit\s*\(/i,
  /\.emit\b/i,
  /\bEventEmitter\b/,
  /\baudit\s+write\b/i,
  /\bappend\s+log\b/i,
  /\btool\s+execution\b/i,
  /\bexternal\s+call\b/i,
  /\bruntime\s+execution\b/i,
  /\breplay\s+execution\b/i,
  /\bMapIA\b/,
] as const;

describe("minimal persistence activation source safety", () => {
  it("does not import PrismaClient or activate DB reads/writes in application source", () => {
    const sources = productionSourceFiles(repoPath("src"));

    for (const sourcePath of sources) {
      const source = productionCodeOnly(readFileSync(sourcePath, "utf8"));

      for (const pattern of APPLICATION_SOURCE_PATTERNS) {
        expect(source, `${sourcePath} must not match ${pattern}`).not.toMatch(
          pattern,
        );
      }
    }
  });

  it("keeps Phase 3A module free of runtime, API, event, audit writer, tool and external call behavior", () => {
    const source = productionCodeOnly(
      readFileSync(
        repoPath(
          "src",
          "mycelia",
          "minimal-persistence-activation",
          "minimal-persistence-activation.ts",
        ),
        "utf8",
      ),
    );

    expect(source).not.toMatch(/\bPrismaClient\b/);
    expect(source).not.toMatch(/@prisma\/client/i);
    expect(source).not.toMatch(/\bfetch\s*\(/i);
    expect(source).not.toMatch(/\bwriteFile\b/i);
    expect(source).not.toMatch(/\bappendFile\b/i);
    expect(source).not.toMatch(/\bEventEmitter\b/);
    expect(source).not.toMatch(/\.emit\b/i);
    expect(source).not.toMatch(/\bMapIA\b/);
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
