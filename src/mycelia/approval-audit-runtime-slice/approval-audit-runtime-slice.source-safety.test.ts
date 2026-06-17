import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const productionFiles = [
  join(
    process.cwd(),
    "src",
    "mycelia",
    "approval-audit-runtime-slice",
    "approval-audit-runtime-slice.ts",
  ),
  join(
    process.cwd(),
    "src",
    "mycelia",
    "runtime-repository-layer",
    "runtime-repository-layer.ts",
  ),
  join(
    process.cwd(),
    "src",
    "mycelia",
    "prisma-runtime-repository-adapter",
    "prisma-runtime-repository-adapter.ts",
  ),
] as const;

function sourceWithoutStringsAndComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\/(?:\\.|[^/\\\r\n])+\/[dgimsuvy]*/g, "\"\"")
    .replace(/`(?:\\.|[^`\\])*`/g, "\"\"")
    .replace(/"(?:\\.|[^"\\])*"/g, "\"\"")
    .replace(/'(?:\\.|[^'\\])*'/g, "\"\"");
}

describe("approval audit runtime slice source safety", () => {
  it("keeps production source free of forbidden runtime, IO and integration behavior", () => {
    const forbiddenPatterns = [
      /\bPrismaClient\b/,
      /\bfrom\s+["']node:fs["']/,
      /\bfrom\s+["']fs["']/,
      /\bfetch\s*\(/,
      /\bXMLHttpRequest\b/,
      /\bcookies\s*\(/,
      /\bheaders\s*\(/,
      /\blocalStorage\b/,
      /\bsessionStorage\b/,
      /\bwindow\./,
      /\bdocument\./,
      /\bDate\.now\b/,
      /\bnew\s+Date\b/,
      /\bMath\.random\b/,
      /\brandomUUID\b/,
      /\bsetTimeout\b/,
      /\bsetInterval\b/,
      /\bEventEmitter\b/,
      /\.emit\s*\(/,
      /\bcreateServer\b/,
      /\broute\.ts\b/,
      /\bdangerouslySetInnerHTML\b/,
      /\bMapIA\b/,
      /\bdownload\b/i,
      /\bpdf\b/i,
    ];

    for (const file of productionFiles) {
      const source = sourceWithoutStringsAndComments(
        readFileSync(file, "utf8"),
      );

      for (const pattern of forbiddenPatterns) {
        expect(source, `${file} matched ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("does not introduce hardcoded local absolute paths", () => {
    const source = productionFiles
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    const slashPath = ["C:", "Projetos", "mycelia"].join("/");
    const backslashPath = ["C:", "Projetos", "mycelia"].join("\\");

    expect(source).not.toContain(slashPath);
    expect(source).not.toContain(backslashPath);
  });

  it("keeps package files, schema and migration untouched", () => {
    const packageStatus = execFileSync(
      "git",
      ["status", "--short", "--", "package.json", "pnpm-lock.yaml"],
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
