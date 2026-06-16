import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const approvalGateV1SourcePath = new URL(
  "./approval-gate-v1.ts",
  import.meta.url,
);

const FORBIDDEN_APPROVAL_GATE_V1_SOURCE_PATTERNS = [
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
  "appendFile",
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
  "EventEmitter",
  ".emit(",
  "recordAudit",
  "writeAudit",
  "appendAudit",
  "appendLog",
  "auditStore",
  "auditRepository",
  "toolExecution",
  "executeTool",
] as const;

function source(fileUrl: URL): string {
  return readFileSync(fileUrl, "utf8");
}

describe("approval gate v1 source safety", () => {
  it("does not add runtime, browser, route, file or external service behavior", () => {
    const moduleSource = source(approvalGateV1SourcePath).toLowerCase();

    for (const pattern of FORBIDDEN_APPROVAL_GATE_V1_SOURCE_PATTERNS) {
      expect(moduleSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("does not add forms, action controls or external links", () => {
    const moduleSource = source(approvalGateV1SourcePath);

    expect(moduleSource).not.toContain("<form");
    expect(moduleSource).not.toContain("<button");
    expect(moduleSource).not.toContain("target=");
    expect(moduleSource).not.toContain("rel=");
    expect(moduleSource).not.toContain("action=");
    expect(moduleSource).not.toContain("http://");
    expect(moduleSource).not.toContain("https://");
  });

  it("does not import database clients or create migrations", () => {
    const moduleSource = source(approvalGateV1SourcePath);

    expect(moduleSource).not.toContain("PrismaClient");
    expect(moduleSource).not.toContain("@prisma/client");
    expect(moduleSource).not.toContain("prisma migrate");
    expect(moduleSource).not.toContain("migration.sql");
  });

  it("does not add event, audit writer, append log or tool execution behavior", () => {
    const moduleSource = source(approvalGateV1SourcePath);

    expect(moduleSource).not.toContain("EventEmitter");
    expect(moduleSource).not.toContain(".emit(");
    expect(moduleSource).not.toContain("recordAudit");
    expect(moduleSource).not.toContain("writeAudit");
    expect(moduleSource).not.toContain("appendAudit");
    expect(moduleSource).not.toContain("appendLog");
    expect(moduleSource).not.toContain("auditRepository");
    expect(moduleSource).not.toContain("executeTool");
  });

  it("does not modify package.json or pnpm-lock.yaml", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "package.json", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(status.trim()).toBe("");
  });
});
