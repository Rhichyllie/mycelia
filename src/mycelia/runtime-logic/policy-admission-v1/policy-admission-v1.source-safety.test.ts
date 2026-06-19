import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const policyAdmissionV1SourcePath = new URL(
  "./policy-admission-v1.ts",
  import.meta.url,
);

const FORBIDDEN_POLICY_ADMISSION_V1_SOURCE_PATTERNS = [
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
  "EventEmitter",
  ".emit(",
  "auditRecorder",
  "recordAudit",
  "writeAudit",
  "toolExecution",
  "executeTool",
] as const;

function source(fileUrl: URL): string {
  return readFileSync(fileUrl, "utf8");
}

describe("policy/admission v1 source safety", () => {
  it("does not add runtime, browser, route, file or external service behavior", () => {
    const moduleSource = source(policyAdmissionV1SourcePath).toLowerCase();

    for (const pattern of FORBIDDEN_POLICY_ADMISSION_V1_SOURCE_PATTERNS) {
      expect(moduleSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("does not add forms, action controls or external links", () => {
    const moduleSource = source(policyAdmissionV1SourcePath);

    expect(moduleSource).not.toContain("<form");
    expect(moduleSource).not.toContain("<button");
    expect(moduleSource).not.toContain("target=");
    expect(moduleSource).not.toContain("rel=");
    expect(moduleSource).not.toContain("action=");
    expect(moduleSource).not.toContain("http://");
    expect(moduleSource).not.toContain("https://");
  });

  it("does not import database clients or create migrations", () => {
    const moduleSource = source(policyAdmissionV1SourcePath);

    expect(moduleSource).not.toContain("PrismaClient");
    expect(moduleSource).not.toContain("@prisma/client");
    expect(moduleSource).not.toContain("prisma migrate");
    expect(moduleSource).not.toContain("migration.sql");
  });

  it("does not add event, audit writer or tool execution behavior", () => {
    const moduleSource = source(policyAdmissionV1SourcePath);

    expect(moduleSource).not.toContain("EventEmitter");
    expect(moduleSource).not.toContain(".emit(");
    expect(moduleSource).not.toContain("auditRecorder");
    expect(moduleSource).not.toContain("recordAudit");
    expect(moduleSource).not.toContain("writeAudit");
    expect(moduleSource).not.toContain("executeTool");
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
