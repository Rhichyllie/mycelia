import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const orchestratorSourcePath = new URL(
  "./internal-runtime-orchestrator-v1.ts",
  import.meta.url,
);

const FORBIDDEN_INTERNAL_RUNTIME_ORCHESTRATOR_SOURCE_PATTERNS = [
  "dangerouslySetInnerHTML",
  "fetch(",
  "axios",
  "XMLHttpRequest",
  "cookies(",
  "headers(",
  "redirect(",
  "notFound(",
  "server action",
  "\"use server\"",
  "'use server'",
  "localStorage",
  "sessionStorage",
  "setTimeout",
  "setInterval",
  "Math.random",
  "Date.now",
  "new Date",
  "randomUUID",
  "crypto.random",
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
  "auditRepository",
  "auditStore",
  "databaseClient",
  "dbClient",
  "findMany",
  "findUnique",
  ".query(",
  "executeTool",
  "toolExecution",
  "executeReplay",
  "runReplay",
  "executeRuntime",
  "runWorkflow",
  "executeWorkflow",
] as const;

function source(fileUrl: URL): string {
  return readFileSync(fileUrl, "utf8");
}

describe("internal runtime orchestrator v1 source safety", () => {
  it("does not add browser, route, timing, random or external behavior", () => {
    const moduleSource = source(orchestratorSourcePath).toLowerCase();

    for (const pattern of FORBIDDEN_INTERNAL_RUNTIME_ORCHESTRATOR_SOURCE_PATTERNS) {
      expect(moduleSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("does not add forms, action controls or external links", () => {
    const moduleSource = source(orchestratorSourcePath);

    expect(moduleSource).not.toContain("<form");
    expect(moduleSource).not.toContain("<button");
    expect(moduleSource).not.toContain("target=");
    expect(moduleSource).not.toContain("rel=");
    expect(moduleSource).not.toContain("action=");
    expect(moduleSource).not.toContain("http://");
    expect(moduleSource).not.toContain("https://");
  });

  it("does not import database clients or create migrations", () => {
    const moduleSource = source(orchestratorSourcePath);

    expect(moduleSource).not.toContain("PrismaClient");
    expect(moduleSource).not.toContain("@prisma/client");
    expect(moduleSource).not.toContain("prisma migrate");
    expect(moduleSource).not.toContain("migration.sql");
    expect(moduleSource).not.toContain("datasource db");
  });

  it("does not add event, audit writer, append log or tool execution behavior", () => {
    const moduleSource = source(orchestratorSourcePath);

    expect(moduleSource).not.toContain("EventEmitter");
    expect(moduleSource).not.toContain(".emit(");
    expect(moduleSource).not.toContain("recordAudit");
    expect(moduleSource).not.toContain("writeAudit");
    expect(moduleSource).not.toContain("appendAudit");
    expect(moduleSource).not.toContain("appendLog");
    expect(moduleSource).not.toContain("auditRepository");
    expect(moduleSource).not.toContain("executeTool");
    expect(moduleSource).not.toContain("executeReplay");
    expect(moduleSource).not.toContain("executeRuntime");
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
