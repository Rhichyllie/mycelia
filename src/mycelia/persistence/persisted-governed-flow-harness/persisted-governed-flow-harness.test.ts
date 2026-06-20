import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  assertPersistedGovernedFlowResult,
  createPersistedGovernedFlowHarness,
  PersistedGovernedFlowVerdicts,
} from ".";
import {
  assertPrismaRuntimeRepositoryAdapter,
  createPrismaRuntimeRepositoryAdapter,
} from "../../persistence/prisma-runtime-repository-adapter";

const tempRoots: string[] = [];
const SQLITE_INTEGRATION_TEST_TIMEOUT_MS = 15_000;

function sqliteCommand(): string {
  return process.env.SQLITE3_BIN ?? "sqlite3";
}

function tempDatabase() {
  const root = mkdtempSync(join(tmpdir(), "mycelia-3c-"));
  const dbPath = join(root, "harness.db");

  tempRoots.push(root);

  return { root, dbPath };
}

function applyMigration(dbPath: string) {
  const migrationPath = join(
    process.cwd(),
    "prisma",
    "migrations",
    "000001_minimal_runtime_slice",
    "migration.sql",
  );

  executeSql(dbPath, readFileSync(migrationPath, "utf8"));
}

function sqlValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "NULL";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function queryJson<T>(dbPath: string, sql: string): T[] {
  const output = execFileSync(sqliteCommand(), ["-json", dbPath, sql], {
    encoding: "utf8",
  }).trim();

  return output.length === 0 ? [] : JSON.parse(output) as T[];
}

function executeSql(dbPath: string, sql: string) {
  execFileSync(sqliteCommand(), [dbPath, sql], { encoding: "utf8" });
}

function insertRecord(
  dbPath: string,
  table: string,
  data: Record<string, unknown>,
) {
  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined,
  );
  const columns = entries.map(([key]) => `"${key}"`).join(", ");
  const values = entries.map(([, value]) => sqlValue(value)).join(", ");

  executeSql(dbPath, `INSERT INTO "${table}" (${columns}) VALUES (${values});`);
}

function whereClause(where: Record<string, unknown>) {
  return Object.entries(where)
    .map(([key, value]) => `"${key}" = ${sqlValue(value)}`)
    .join(" AND ");
}

function createSqliteDelegate(dbPath: string, table: string) {
  return {
    create({ data }: { readonly data: Record<string, unknown> }) {
      insertRecord(dbPath, table, data);
      return queryJson<Record<string, unknown>>(
        dbPath,
        `SELECT * FROM "${table}" WHERE "id" = ${sqlValue(data.id)} LIMIT 1;`,
      )[0];
    },
    findFirst({ where }: { readonly where: Record<string, unknown> }) {
      return (
        queryJson<Record<string, unknown>>(
          dbPath,
          `SELECT * FROM "${table}" WHERE ${whereClause(where)} LIMIT 1;`,
        )[0] ?? null
      );
    },
    findMany({
      where,
      orderBy,
    }: {
      readonly where: Record<string, unknown>;
      readonly orderBy?: Record<string, "asc" | "desc">;
    }) {
      const order =
        orderBy === undefined
          ? ""
          : ` ORDER BY ${Object.entries(orderBy)
            .map(([key, direction]) => `"${key}" ${direction.toUpperCase()}`)
            .join(", ")}`;

      return queryJson<Record<string, unknown>>(
        dbPath,
        `SELECT * FROM "${table}" WHERE ${whereClause(where)}${order};`,
      );
    },
    update({
      where,
      data,
    }: {
      readonly where: Record<string, unknown>;
      readonly data: Record<string, unknown>;
    }) {
      const entries = Object.entries(data).filter(
        ([, value]) => value !== undefined,
      );
      const assignments = entries
        .map(([key, value]) => `"${key}" = ${sqlValue(value)}`)
        .join(", ");

      executeSql(
        dbPath,
        `UPDATE "${table}" SET ${assignments} WHERE ${whereClause(where)};`,
      );

      return (
        queryJson<Record<string, unknown>>(
          dbPath,
          `SELECT * FROM "${table}" WHERE ${whereClause(where)} LIMIT 1;`,
        )[0] ?? null
      );
    },
  };
}

function createSqlitePrismaLikeClient(dbPath: string) {
  return {
    governedRun: createSqliteDelegate(dbPath, "GovernedRun"),
    runtimeStateSnapshot: createSqliteDelegate(dbPath, "RuntimeStateSnapshot"),
    policyDecisionRecord: createSqliteDelegate(dbPath, "PolicyDecisionRecord"),
    admissionDecisionRecord: createSqliteDelegate(
      dbPath,
      "AdmissionDecisionRecord",
    ),
    approvalRequest: createSqliteDelegate(dbPath, "ApprovalRequest"),
    auditRecord: createSqliteDelegate(dbPath, "AuditRecord"),
  };
}

function createHarnessForDatabase(dbPath: string) {
  const adapter = assertPrismaRuntimeRepositoryAdapter(
    createPrismaRuntimeRepositoryAdapter(createSqlitePrismaLikeClient(dbPath)),
  );
  const harness = createPersistedGovernedFlowHarness({
    repositoryClient: adapter.client,
  });

  if (!harness.ok) {
    throw new Error("Persisted governed flow harness setup denied.");
  }

  return harness.value;
}

function scenario(
  riskLevel: "LOW" | "MEDIUM" | "HIGH",
  runId: string,
) {
  return {
    tenantId: "tenant_01",
    runId,
    correlationId: `${runId}_correlation`,
    requesterRef: "requester_01",
    resourceRef: "resource_01",
    action: "compliance.review",
    purpose: "COMPLIANCE_REVIEW",
    riskLevel,
    contextStatus: "RESOLVED",
    tenantBoundaryStatus: "MATCHED",
    hasRequiredContext: true,
    policyRef: "policy_01",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function tableCount(dbPath: string, table: string): number {
  const [result] = queryJson<{ readonly count: number }>(
    dbPath,
    `SELECT COUNT(*) AS count FROM "${table}";`,
  );

  return result.count;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("persisted governed flow harness", () => {
  it("exports exact verdicts", () => {
    expect(PersistedGovernedFlowVerdicts).toEqual([
      "PERSISTED_COMPLETED",
      "PERSISTED_WAITING_APPROVAL",
      "PERSISTED_REJECTED",
      "PERSISTED_FAILED_SAFE",
    ]);
  });

  it("applies the Phase 3A migration to a disposable SQLite database", () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const tables = queryJson<{ readonly name: string }>(
      dbPath,
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;",
    ).map((table) => table.name);

    expect(tables).toEqual([
      "AdmissionDecisionRecord",
      "ApprovalRequest",
      "AuditRecord",
      "GovernedRun",
      "PolicyDecisionRecord",
      "RuntimeStateSnapshot",
    ]);
  }, SQLITE_INTEGRATION_TEST_TIMEOUT_MS);

  it("persists and reads back the low-risk completed path", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const result = await createHarnessForDatabase(dbPath).runScenario(
      scenario("LOW", "run_low"),
    );
    const value = assertPersistedGovernedFlowResult(result);

    expect(value.verdict).toBe("PERSISTED_COMPLETED");
    expect(value.governedRun.currentState).toBe("COMPLETED");
    expect(value.stateSnapshots.map((snapshot) => snapshot.state)).toEqual([
      "CREATED",
      "CONTEXT_RESOLVED",
      "POLICY_EVALUATED",
      "ADMISSION_GRANTED",
      "RUNNING",
      "COMPLETED",
    ]);
    expect(value.policyDecisionRecords).toHaveLength(1);
    expect(value.admissionDecisionRecords).toHaveLength(1);
    expect(value.approvalRequests).toHaveLength(0);
    expect(value.auditRecords.map((record) => record.moment)).toEqual([
      "REQUEST_CREATED",
      "ADMISSION_DECIDED",
    ]);
  }, SQLITE_INTEGRATION_TEST_TIMEOUT_MS);

  it("persists and reads back the medium-risk approval-required path", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const result = await createHarnessForDatabase(dbPath).runScenario(
      scenario("MEDIUM", "run_medium"),
    );

    const value = assertPersistedGovernedFlowResult(result);

    expect(value.verdict).toBe("PERSISTED_WAITING_APPROVAL");
    expect(value.governedRun.currentState).toBe("WAITING_APPROVAL");
    expect(value.policyAdmissionDecision.outcome).toBe("REQUIRE_APPROVAL");
    expect(value.approvalRequests).toHaveLength(1);
    expect(value.approvalRequests[0].status).toBe("PENDING");
    expect(tableCount(dbPath, "ApprovalRequest")).toBe(1);
  }, SQLITE_INTEGRATION_TEST_TIMEOUT_MS);

  it("persists and reads back the high-risk rejected path", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const result = await createHarnessForDatabase(dbPath).runScenario(
      scenario("HIGH", "run_high"),
    );
    const value = assertPersistedGovernedFlowResult(result);

    expect(value.verdict).toBe("PERSISTED_REJECTED");
    expect(value.governedRun.currentState).toBe("REJECTED");
    expect(value.policyAdmissionDecision.outcome).toBe("DENY");
    expect(value.approvalRequests).toHaveLength(0);
    expect(value.stateSnapshots.at(-1)?.state).toBe("REJECTED");
  }, SQLITE_INTEGRATION_TEST_TIMEOUT_MS);

  it("fails closed for unsafe input without persisting records", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const result = await createHarnessForDatabase(dbPath).runScenario({
      ...scenario("LOW", "run_unsafe"),
      rawDocument: "unsafe",
    });

    expect(result.ok).toBe(false);
    expect(tableCount(dbPath, "GovernedRun")).toBe(0);
  }, SQLITE_INTEGRATION_TEST_TIMEOUT_MS);

  it("rejects raw content field names before persistence", async () => {
    const rawFields = [
      "rawDocument",
      "documentContent",
      "rawContent",
      "fileBlob",
      "binary",
      "payload",
    ];

    for (const field of rawFields) {
      const { dbPath } = tempDatabase();

      applyMigration(dbPath);

      const result = await createHarnessForDatabase(dbPath).runScenario({
        ...scenario("LOW", `run_${field.toLowerCase()}`),
        [field]: "unsafe",
      });

      expect(result.ok).toBe(false);
      expect(tableCount(dbPath, "GovernedRun")).toBe(0);
    }
  }, SQLITE_INTEGRATION_TEST_TIMEOUT_MS);

  it("keeps schema, migration and pnpm-lock.yaml unchanged and creates no repo database file", () => {
    const packageStatus = execFileSync(
      "git",
      ["status", "--short", "--", "pnpm-lock.yaml"],
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
    let databaseFiles = "";

    try {
      databaseFiles = execFileSync(
        "rg",
        [
          "--files",
          "-g",
          "*.db",
          "-g",
          "*.sqlite",
          "-g",
          "*.sqlite3",
          "-g",
          "!prisma/dev.db",
          "-g",
          "!prisma/dev.db-journal",
          "-g",
          "!node_modules/**",
          "-g",
          "!.next/**",
        ],
        { encoding: "utf8" },
      );
    } catch {
      databaseFiles = "";
    }

    expect(packageStatus.trim()).toBe("");
    expect(schemaDiff.trim()).toBe("");
    expect(databaseFiles.trim()).toBe("");
  });
});
