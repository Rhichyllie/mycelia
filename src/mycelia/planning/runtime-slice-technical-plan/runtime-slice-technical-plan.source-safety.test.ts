import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const planSourcePath = new URL(
  "./runtime-slice-technical-plan.ts",
  import.meta.url,
);

const FORBIDDEN_RUNTIME_SLICE_PLAN_SOURCE_PATTERNS = [
  "dangerouslySetInnerHTML",
  "fetch(",
  "axios",
  "XMLHttpRequest",
  "cookies(",
  "headers(",
  "redirect(",
  "notFound(",
  "revalidate",
  "server action",
  "\"use server\"",
  "'use server'",
  "localStorage",
  "sessionStorage",
  "setTimeout",
  "setInterval",
  "Math.random",
  "Date.now",
  "readFile",
  "writeFile",
  "createReadStream",
  "createWriteStream",
  "node:fs",
  "node:path",
  "http://",
  "https://",
  "www.",
  "mapia",
  "URL.createObjectURL",
  "new Blob",
  "download=",
  "<a download",
  "pdfMake",
  "jsPDF",
  "generatePdf",
  "exportFile",
  "prisma migrate",
  "migration.sql",
  "schema.prisma",
  "CREATE TABLE",
] as const;

function source(fileUrl: URL): string {
  return readFileSync(fileUrl, "utf8");
}

describe("runtime slice technical plan source safety", () => {
  it("does not add runtime, browser, file, route or external service behavior", () => {
    const planSource = source(planSourcePath).toLowerCase();

    for (const pattern of FORBIDDEN_RUNTIME_SLICE_PLAN_SOURCE_PATTERNS) {
      expect(planSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("does not add forms, action controls or external links", () => {
    const planSource = source(planSourcePath);

    expect(planSource).not.toContain("<form");
    expect(planSource).not.toContain("<button");
    expect(planSource).not.toContain("target=");
    expect(planSource).not.toContain("rel=");
    expect(planSource).not.toContain("action=");
    expect(planSource).not.toContain("http://");
    expect(planSource).not.toContain("https://");
  });

  it("does not add Prisma schema or migration creation text", () => {
    const planSource = source(planSourcePath);

    expect(planSource).not.toContain("model GovernedRun");
    expect(planSource).not.toContain("datasource");
    expect(planSource).not.toContain("generator client");
    expect(planSource).not.toContain("@relation");
    expect(planSource).not.toContain("@@id");
    expect(planSource).not.toContain("prisma migrate");
    expect(planSource).not.toContain("migration.sql");
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
