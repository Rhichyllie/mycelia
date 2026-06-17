import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const productionModule = join(
  process.cwd(),
  "src",
  "mycelia",
  "persisted-investigation-read-model",
  "persisted-investigation-read-model.ts",
);

function productionCodeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\/(?:\\.|[^/\\\r\n])+\/[dgimsuvy]*/g, "\"\"")
    .replace(/`(?:\\.|[^`\\])*`/g, "\"\"")
    .replace(/"(?:\\.|[^"\\])*"/g, "\"\"")
    .replace(/'(?:\\.|[^'\\])*'/g, "\"\"");
}

describe("persisted investigation read model source safety", () => {
  it("keeps production source free of API, UI, auth, IO and integration behavior", () => {
    const source = productionCodeOnly(readFileSync(productionModule, "utf8"));
    const forbiddenPatterns = [
      /\bPrismaClient\b/,
      /@prisma\/client/i,
      /\bfrom\s+["']node:fs["']/,
      /\bfrom\s+["']fs["']/,
      /\bfetch\s*\(/i,
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
      /\brandomUUID\b/i,
      /\bsetTimeout\b/,
      /\bsetInterval\b/,
      /\bEventEmitter\b/,
      /\bemit\s*\(/i,
      /\.emit\b/i,
      /\bcreateServer\b/,
      /\broute\.ts\b/,
      /\bNextRequest\b/,
      /\bResponse\.json\b/,
      /<button|<form|jsx/i,
      /\bauth\b\s*\(/i,
      /\bwriteFile\b/i,
      /\bappendFile\b/i,
      /\btool\s+execution\b/i,
      /\bexternal\s+call\b/i,
      /\breplay\s+execution\b/i,
      /\bdangerouslySetInnerHTML\b/,
      /\bdownload\b/i,
      /\bpdf\b/i,
      /\bMapIA\b/,
    ];

    for (const pattern of forbiddenPatterns) {
      expect(source, `${pattern} must be absent`).not.toMatch(pattern);
    }
  });

  it("does not introduce hardcoded local absolute paths", () => {
    const source = readFileSync(productionModule, "utf8");
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
