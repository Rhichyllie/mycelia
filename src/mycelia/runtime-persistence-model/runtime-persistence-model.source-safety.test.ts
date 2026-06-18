import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const runtimePersistenceModelSourcePath = new URL(
  "./runtime-persistence-model.ts",
  import.meta.url,
);

const FORBIDDEN_RUNTIME_PERSISTENCE_SOURCE_PATTERNS = [
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
  "PrismaClient",
  "@prisma/client",
  "prisma migrate",
  "migration.sql",
  "CREATE TABLE",
  "datasource db",
  "generator client",
] as const;

function source(fileUrl: URL): string {
  return readFileSync(fileUrl, "utf8");
}

function productionCodeOnly(input: string): string {
  return input
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/(["'`])(?:\\[\s\S]|(?!\1)[^\\])*\1/g, "\"\"");
}

describe("runtime persistence model source safety", () => {
  it("does not add runtime, browser, route, file or external service behavior", () => {
    const modelSource = productionCodeOnly(
      source(runtimePersistenceModelSourcePath),
    ).toLowerCase();

    for (const pattern of FORBIDDEN_RUNTIME_PERSISTENCE_SOURCE_PATTERNS) {
      expect(modelSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("does not add forms, action controls or external links", () => {
    const modelSource = source(runtimePersistenceModelSourcePath);

    expect(modelSource).not.toContain("<form");
    expect(modelSource).not.toContain("<button");
    expect(modelSource).not.toContain("target=");
    expect(modelSource).not.toContain("rel=");
    expect(modelSource).not.toContain("action=");
    expect(modelSource).not.toContain("http://");
    expect(modelSource).not.toContain("https://");
  });

  it("does not import PrismaClient or create migrations", () => {
    const modelSource = productionCodeOnly(
      source(runtimePersistenceModelSourcePath),
    );

    expect(modelSource).not.toContain("PrismaClient");
    expect(modelSource).not.toContain("@prisma/client");
    expect(modelSource).not.toContain("prisma migrate");
    expect(modelSource).not.toContain("migration.sql");
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
