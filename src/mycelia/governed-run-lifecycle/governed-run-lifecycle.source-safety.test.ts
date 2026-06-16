import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const governedRunLifecycleSourcePath = new URL(
  "./governed-run-lifecycle.ts",
  import.meta.url,
);

const FORBIDDEN_GOVERNED_RUN_LIFECYCLE_SOURCE_PATTERNS = [
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

describe("governed run lifecycle source safety", () => {
  it("does not add runtime, browser, route, file or external service behavior", () => {
    const lifecycleSource = source(governedRunLifecycleSourcePath).toLowerCase();

    for (const pattern of FORBIDDEN_GOVERNED_RUN_LIFECYCLE_SOURCE_PATTERNS) {
      expect(lifecycleSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("does not add forms, action controls or external links", () => {
    const lifecycleSource = source(governedRunLifecycleSourcePath);

    expect(lifecycleSource).not.toContain("<form");
    expect(lifecycleSource).not.toContain("<button");
    expect(lifecycleSource).not.toContain("target=");
    expect(lifecycleSource).not.toContain("rel=");
    expect(lifecycleSource).not.toContain("action=");
    expect(lifecycleSource).not.toContain("http://");
    expect(lifecycleSource).not.toContain("https://");
  });

  it("does not import database clients or create migrations", () => {
    const lifecycleSource = source(governedRunLifecycleSourcePath);

    expect(lifecycleSource).not.toContain("PrismaClient");
    expect(lifecycleSource).not.toContain("@prisma/client");
    expect(lifecycleSource).not.toContain("prisma migrate");
    expect(lifecycleSource).not.toContain("migration.sql");
  });

  it("does not add event, audit writer or tool execution behavior", () => {
    const lifecycleSource = source(governedRunLifecycleSourcePath);

    expect(lifecycleSource).not.toContain("EventEmitter");
    expect(lifecycleSource).not.toContain(".emit(");
    expect(lifecycleSource).not.toContain("auditRecorder");
    expect(lifecycleSource).not.toContain("recordAudit");
    expect(lifecycleSource).not.toContain("writeAudit");
    expect(lifecycleSource).not.toContain("executeTool");
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
