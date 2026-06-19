import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const scriptPath = join(process.cwd(), "scripts", "mycelia-demo-local.mjs");
const contractFiles = [
  join(
    process.cwd(),
    "src",
    "mycelia",
    "demo",
    "demo-local-preview",
    "demo-local-preview-contract.ts",
  ),
  join(process.cwd(), "src", "mycelia", "demo", "demo-local-preview", "index.ts"),
] as const;

function productionCodeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .replace(/\/\/.*$/gmu, "")
    .replace(/\/(?:\\.|[^/\\\r\n])+\/[dgimsuvy]*/gu, "\"\"")
    .replace(/`(?:\\.|[^`\\])*`/gu, "\"\"")
    .replace(/"(?:\\.|[^"\\])*"/gu, "\"\"")
    .replace(/'(?:\\.|[^'\\])*'/gu, "\"\"");
}

describe("demo local preview source safety", () => {
  it("keeps the preview script local, explicit and route-scoped", () => {
    const source = readFileSync(scriptPath, "utf8");

    expect(source).toContain("127.0.0.1");
    expect(source).toContain("DEFAULT_PORT = 3000");
    expect(source).toContain("MYCELIA_DEMO_LOCAL_PORT");
    expect(source).toContain("/mycelia/demo");
    expect(source).toContain("/mycelia/request/new");
    expect(source).toContain("/mycelia/approval/decision");
    expect(source).toContain("/mycelia/investigation");
    expect(source).toContain("http://${HOST}:${PORT}/mycelia/demo");
    expect(source).toContain("MYCELIA_LOCAL_DEMO_PREVIEW");
    expect(source).toContain("process.execPath");
    expect(source).toContain("\"node_modules\", \"next\", \"dist\", \"bin\", \"next\"");
    expect(source).toContain("\"dev\"");
    expect(source).toContain("\"--hostname\"");
    expect(source).toContain("\"--port\"");
    expect(source).not.toContain("pnpm.cmd");
    expect(source).not.toContain("\"pnpm\"");
  });

  it("uses argument arrays instead of shell command strings", () => {
    const source = readFileSync(scriptPath, "utf8");

    expect(source).toContain("const args = [");
    expect(source).toContain("spawn(command, args");
    expect(source).toContain("shell: false");
    expect(source).not.toMatch(/spawn\([^,]+,\s*["'`]/);
    expect(source).not.toContain("exec(");
    expect(source).not.toContain("execFile(");
  });

  it("does not include external URLs in the script", () => {
    const source = readFileSync(scriptPath, "utf8");
    const urls = Array.from(source.matchAll(/https?:\/\/[^"`'\s)]+/g)).map(
      (match) => match[0],
    );
    const externalUrls = urls.filter(
      (url) =>
        !url.startsWith("http://${HOST}") &&
        !url.startsWith("http://127.0.0.1:"),
    );

    expect(externalUrls).toEqual([]);
  });

  it("does not run database, migration, API, replay, fetch, tool, file write or export behavior", () => {
    const source = productionCodeOnly(readFileSync(scriptPath, "utf8"));
    const forbiddenPatterns = [
      /\bPrismaClient\b/,
      /@prisma\/client/i,
      /\bprisma\b/i,
      /\bmigrate\b/i,
      /\bdb\s+push\b/i,
      /\bfetch\s*\(/i,
      /\bXMLHttpRequest\b/,
      /\bNextRequest\b/,
      /\bResponse\.json\b/,
      /\broute\.ts\b/i,
      /\bPOST\b|\bPUT\b|\bPATCH\b|\bDELETE\b/,
      /\bcookies\s*\(/,
      /\bheaders\s*\(/,
      /\bauth\b\s*\(/i,
      /\bwriteFile\b/i,
      /\bappendFile\b/i,
      /\bmkdir\b/i,
      /\brmSync\b/i,
      /\bunlink\b/i,
      /\breplay\s+execution\b/i,
      /\btool\s+execution\b/i,
      /\bdownload\b/i,
      /\bpdf\b/i,
      /\bexport\b/i,
      /\bMapIA\b/i,
    ];

    for (const pattern of forbiddenPatterns) {
      expect(source, `${scriptPath} matched ${pattern}`).not.toMatch(pattern);
    }
  });

  it("keeps the contract module descriptive only", () => {
    const source = productionCodeOnly(
      contractFiles.map((file) => readFileSync(file, "utf8")).join("\n"),
    );
    const forbiddenPatterns = [
      /\bfrom\s+["']node:child_process["']/,
      /\bspawn\b/,
      /\bexecFile\b/,
      /\bPrismaClient\b/,
      /\bfetch\s*\(/i,
      /\bwriteFile\b/i,
      /\bappendFile\b/i,
      /\bcreateServer\b/i,
      /\bNextRequest\b/,
      /\bResponse\.json\b/,
      /\bMapIA\b/i,
    ];

    for (const pattern of forbiddenPatterns) {
      expect(source, `contract source matched ${pattern}`).not.toMatch(pattern);
    }
  });

  it("does not introduce hardcoded local absolute paths", () => {
    const source = [
      readFileSync(scriptPath, "utf8"),
      ...contractFiles.map((file) => readFileSync(file, "utf8")),
    ].join("\n");
    const slashPath = ["C:", "Projetos", "mycelia"].join("/");
    const backslashPath = ["C:", "Projetos", "mycelia"].join("\\");

    expect(source).not.toContain(slashPath);
    expect(source).not.toContain(backslashPath);
  });
});
