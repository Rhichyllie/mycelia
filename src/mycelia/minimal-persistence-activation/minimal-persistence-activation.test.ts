import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getMinimalPersistenceActivation,
  MinimalPersistenceActivationVerdicts,
  MinimalPersistenceRecordNames,
} from ".";

const REQUIRED_MODELS = [
  "GovernedRun",
  "RuntimeStateSnapshot",
  "PolicyDecisionRecord",
  "AdmissionDecisionRecord",
  "ApprovalRequest",
  "AuditRecord",
] as const;

const RUN_LINKED_MODELS = REQUIRED_MODELS.filter(
  (model) => model !== "GovernedRun",
);

const FORBIDDEN_MODELS = [
  "User",
  "Tenant",
  "Document",
  "Workflow",
  "ToolExecution",
  "Event",
  "ReplayExecution",
  "InvestigationCase",
  "Billing",
] as const;

const FORBIDDEN_RAW_FIELDS = [
  "rawDocument",
  "documentContent",
  "rawContent",
  "fileBlob",
  "binary",
  "payload",
] as const;

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

function schemaText(): string {
  return readFileSync(repoPath("prisma", "schema.prisma"), "utf8");
}

function migrationText(): string {
  return readFileSync(
    repoPath(
      "prisma",
      "migrations",
      "000001_minimal_runtime_slice",
      "migration.sql",
    ),
    "utf8",
  );
}

function modelBlocks(schema: string): Map<string, string> {
  const blocks = new Map<string, string>();

  for (const match of schema.matchAll(/^model\s+(\w+)\s+\{([\s\S]*?)^}/gm)) {
    blocks.set(match[1] ?? "", match[2] ?? "");
  }

  return blocks;
}

function modelNames(schema: string): string[] {
  return [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map(
    (match) => match[1] ?? "",
  );
}

function migrationTables(sql: string): string[] {
  return [...sql.matchAll(/CREATE TABLE\s+"([^"]+)"/g)].map(
    (match) => match[1] ?? "",
  );
}

describe("minimal persistence activation", () => {
  it("exports the Phase 3A descriptor", () => {
    const activation = getMinimalPersistenceActivation();

    expect(activation.phase).toBe("3A");
    expect(activation.name).toBe("Minimal Persistence Activation");
    expect(activation.verdict).toBe("ACTIVE_SCHEMA_CONTRACT");
    expect(MinimalPersistenceActivationVerdicts).toEqual([
      "ACTIVE_SCHEMA_CONTRACT",
      "BLOCKED",
      "NOT_ACTIVE",
    ]);
    expect(MinimalPersistenceRecordNames).toEqual(REQUIRED_MODELS);
  });

  it("creates schema and migration contract files", () => {
    expect(existsSync(repoPath("prisma", "schema.prisma"))).toBe(true);
    expect(
      existsSync(
        repoPath(
          "prisma",
          "migrations",
          "000001_minimal_runtime_slice",
          "migration.sql",
        ),
      ),
    ).toBe(true);
  });

  it("defines exactly the six required Prisma models", () => {
    expect(modelNames(schemaText())).toEqual(REQUIRED_MODELS);
  });

  it("does not define forbidden extra models", () => {
    const names = modelNames(schemaText());

    for (const model of FORBIDDEN_MODELS) {
      expect(names).not.toContain(model);
    }
  });

  it("tenant scopes every model and run-links every child model", () => {
    const blocks = modelBlocks(schemaText());

    for (const model of REQUIRED_MODELS) {
      expect(blocks.get(model), `${model} must exist`).toBeDefined();
      expect(blocks.get(model)).toMatch(/^\s+tenantId\s+String\b/m);
    }

    for (const model of RUN_LINKED_MODELS) {
      expect(blocks.get(model)).toMatch(/^\s+governedRunId\s+String\b/m);
    }
  });

  it("excludes raw sensitive document content fields from the schema", () => {
    const schema = schemaText();

    for (const field of FORBIDDEN_RAW_FIELDS) {
      expect(schema).not.toMatch(new RegExp(`^\\s+${field}\\s+`, "im"));
    }
  });

  it("uses the expected sqlite DATABASE_URL datasource", () => {
    const schema = schemaText();

    expect(schema).toContain('provider = "sqlite"');
    expect(schema).toContain('url      = env("DATABASE_URL")');
  });

  it("migration creates exactly the six required tables", () => {
    expect(migrationTables(migrationText())).toEqual(REQUIRED_MODELS);
  });

  it("migration does not create forbidden extra tables", () => {
    const tables = migrationTables(migrationText());

    for (const table of FORBIDDEN_MODELS) {
      expect(tables).not.toContain(table);
    }
  });

  it("migration includes tenant and governed run indexes where expected", () => {
    const migration = migrationText();

    expect(migration).toContain(
      'CREATE UNIQUE INDEX "GovernedRun_tenantId_correlationId_key"',
    );

    for (const model of REQUIRED_MODELS) {
      expect(migration).toContain(`CREATE INDEX "${model}_tenantId_idx"`);
    }

    for (const model of RUN_LINKED_MODELS) {
      expect(migration).toContain(`CREATE INDEX "${model}_governedRunId_idx"`);
    }
  });

  it("descriptor states the source and next-phase boundaries", () => {
    const activation = getMinimalPersistenceActivation();
    const text = JSON.stringify(activation).toLowerCase();

    expect(activation.datasource_provider).toBe("sqlite");
    expect(activation.schema_path).toBe("prisma/schema.prisma");
    expect(activation.migration_path).toBe(
      "prisma/migrations/000001_minimal_runtime_slice/migration.sql",
    );
    expect(activation.next_phase_boundary).toBe("3B Runtime Repository Layer");
    expect(text).toContain("no prismaclient import");
    expect(text).toContain("no database read activation");
    expect(text).toContain("no database write activation");
    expect(text).toContain("raw sensitive document content is not stored");
  });

  it("package.json and pnpm-lock.yaml are not modified", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "package.json", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(status.trim()).toBe("");
  });
});
