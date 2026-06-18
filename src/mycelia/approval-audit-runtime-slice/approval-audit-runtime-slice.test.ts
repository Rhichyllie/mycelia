import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  ApprovalAuditRuntimeVerdicts,
  assertApprovalAuditRuntimeResult,
  createApprovalAuditRuntimeSlice,
  decideApprovalRequest,
} from ".";
import {
  assertPersistedGovernedFlowResult,
  createPersistedGovernedFlowHarness,
} from "../persisted-governed-flow-harness";
import {
  assertPrismaRuntimeRepositoryAdapter,
  createPrismaRuntimeRepositoryAdapter,
} from "../prisma-runtime-repository-adapter";
import type {
  RuntimeRepositoryApprovalRequestRecord,
  RuntimeRepositoryAuditRecord,
  RuntimeRepositoryClient,
  RuntimeRepositoryStateSnapshotRecord,
} from "../runtime-repository-layer";

const tempRoots: string[] = [];
const timestamp = "2026-01-01T00:00:00.000Z";
const decidedAt = "2026-01-01T00:01:00.000Z";
const integrationTimeout = 20000;

function sqliteCommand(): string {
  return process.env.SQLITE3_BIN ?? "sqlite3";
}

function tempDatabase() {
  const root = mkdtempSync(join(tmpdir(), "mycelia-3d-"));
  const dbPath = join(root, "approval-audit.db");

  tempRoots.push(root);

  return { root, dbPath };
}

function executeSql(dbPath: string, sql: string) {
  execFileSync(sqliteCommand(), [dbPath, sql], { encoding: "utf8" });
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

function createRepositoryClientForDatabase(dbPath: string) {
  return assertPrismaRuntimeRepositoryAdapter(
    createPrismaRuntimeRepositoryAdapter(createSqlitePrismaLikeClient(dbPath)),
  ).client;
}

function pendingScenario(runId: string) {
  return {
    tenantId: "tenant_01",
    runId,
    correlationId: `${runId}_correlation`,
    requesterRef: "requester_01",
    resourceRef: "resource_01",
    action: "compliance.review",
    purpose: "COMPLIANCE_REVIEW",
    riskLevel: "MEDIUM",
    contextStatus: "RESOLVED",
    tenantBoundaryStatus: "MATCHED",
    hasRequiredContext: true,
    policyRef: "policy_01",
    createdAt: timestamp,
  };
}

function decisionScenario(
  runId: string,
  decisionOutcome: "APPROVE" | "REJECT" | "TIMEOUT" | "CANCEL",
) {
  return {
    tenantId: "tenant_01",
    governedRunId: runId,
    correlationId: `${runId}_correlation`,
    approvalRequestId: `${runId}_approval_01`,
    decisionOutcome,
    decisionReasonCode: `${decisionOutcome}_DECISION`,
    safeDecisionSummary: "Approval decision accepted.",
    approverRef: "approver_01",
    decidedAt,
  };
}

async function createPendingApproval(dbPath: string, runId: string) {
  const repositoryClient = createRepositoryClientForDatabase(dbPath);
  const harness = createPersistedGovernedFlowHarness({ repositoryClient });

  if (!harness.ok) {
    throw new Error("Persisted governed flow harness setup denied.");
  }

  const pending = await harness.value.runScenario(pendingScenario(runId));
  const pendingValue = assertPersistedGovernedFlowResult(pending);

  expect(pendingValue.verdict).toBe("PERSISTED_WAITING_APPROVAL");

  return repositoryClient;
}

async function decide(
  dbPath: string,
  runId: string,
  decisionOutcome: "APPROVE" | "REJECT" | "TIMEOUT" | "CANCEL",
) {
  const repositoryClient = await createPendingApproval(dbPath, runId);
  const slice = createApprovalAuditRuntimeSlice({ repositoryClient });

  if (!slice.ok) {
    throw new Error("Approval audit runtime slice setup denied.");
  }

  return slice.value.decideApprovalRequest(
    decisionScenario(runId, decisionOutcome),
  );
}

function tableCount(dbPath: string, table: string): number {
  const [result] = queryJson<{ readonly count: number }>(
    dbPath,
    `SELECT COUNT(*) AS count FROM "${table}";`,
  );

  return result.count;
}

function createRepositoryClientThatFailsOnUse(
  calls: (keyof RuntimeRepositoryClient)[],
): RuntimeRepositoryClient {
  const fail = (method: keyof RuntimeRepositoryClient) => () => {
    calls.push(method);
    throw new Error(`Repository method ${method} must not be called.`);
  };

  return {
    createGovernedRun: fail("createGovernedRun"),
    createRuntimeStateSnapshot: fail("createRuntimeStateSnapshot"),
    createPolicyDecisionRecord: fail("createPolicyDecisionRecord"),
    createAdmissionDecisionRecord: fail("createAdmissionDecisionRecord"),
    createApprovalRequest: fail("createApprovalRequest"),
    updateApprovalRequestDecision: fail("updateApprovalRequestDecision"),
    createAuditRecord: fail("createAuditRecord"),
    findGovernedRunByTenantAndCorrelation: fail(
      "findGovernedRunByTenantAndCorrelation",
    ),
    listRuntimeStateSnapshotsByRun: fail("listRuntimeStateSnapshotsByRun"),
    listPolicyDecisionRecordsByRun: fail("listPolicyDecisionRecordsByRun"),
    listAdmissionDecisionRecordsByRun: fail(
      "listAdmissionDecisionRecordsByRun",
    ),
    listApprovalRequestsByRun: fail("listApprovalRequestsByRun"),
    listAuditRecordsByRun: fail("listAuditRecordsByRun"),
  };
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("approval audit runtime slice", () => {
  it("exports exact verdicts and requires an injected repository client", () => {
    expect(ApprovalAuditRuntimeVerdicts).toEqual([
      "APPROVAL_AUDIT_APPROVED",
      "APPROVAL_AUDIT_REJECTED",
      "APPROVAL_AUDIT_TIMED_OUT",
      "APPROVAL_AUDIT_CANCELLED",
      "APPROVAL_AUDIT_FAILED_SAFE",
    ]);
    expect(createApprovalAuditRuntimeSlice(undefined).ok).toBe(false);
    expect(createApprovalAuditRuntimeSlice({}).ok).toBe(false);
  });

  it("approves a pending request, persists the decision and reads it back", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const value = assertApprovalAuditRuntimeResult(
      await decide(dbPath, "run_approve", "APPROVE"),
    );

    expect(value.verdict).toBe("APPROVAL_AUDIT_APPROVED");
    expect(value.approvalRequest.status).toBe("APPROVED");
    expect(value.approvalRequest.decisionOutcome).toBe("APPROVE");
    expect(value.lifecycleDecision.next_state).toBe("APPROVED");
    expect(value.stateSnapshots.at(-1)?.state).toBe("APPROVED");
    expect(value.auditRecords.map((record) => record.moment)).toContain(
      "APPROVAL_DECIDED",
    );
    expect(value.reconstructedDescriptor.approvalStatus).toBe("APPROVED");
    expect(value.recordsReadBack.approvalRequests).toBe(1);
  }, integrationTimeout);

  it("rejects a pending request, persists the decision and reads it back", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const value = assertApprovalAuditRuntimeResult(
      await decide(dbPath, "run_reject", "REJECT"),
    );

    expect(value.verdict).toBe("APPROVAL_AUDIT_REJECTED");
    expect(value.approvalRequest.status).toBe("REJECTED");
    expect(value.lifecycleDecision.next_state).toBe("REJECTED");
    expect(value.stateSnapshots.at(-1)?.state).toBe("REJECTED");
    expect(value.auditRecords.map((record) => record.moment)).toContain(
      "APPROVAL_DECIDED",
    );
  }, integrationTimeout);

  it("times out a pending request, persists the decision and reads it back", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const value = assertApprovalAuditRuntimeResult(
      await decide(dbPath, "run_timeout", "TIMEOUT"),
    );

    expect(value.verdict).toBe("APPROVAL_AUDIT_TIMED_OUT");
    expect(value.approvalRequest.status).toBe("TIMED_OUT");
    expect(value.lifecycleDecision.next_state).toBe("FAILED");
    expect(value.stateSnapshots.at(-1)?.state).toBe("FAILED");
    expect(value.approvalGateDecision.lifecycle_intent_hint).toBe("FAIL_RUN");
  }, integrationTimeout);

  it("cancels a pending request, persists the decision and reads it back", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const value = assertApprovalAuditRuntimeResult(
      await decide(dbPath, "run_cancel", "CANCEL"),
    );

    expect(value.verdict).toBe("APPROVAL_AUDIT_CANCELLED");
    expect(value.approvalRequest.status).toBe("CANCELLED");
    expect(value.lifecycleDecision.next_state).toBe("CANCELLED");
    expect(value.stateSnapshots.at(-1)?.state).toBe("CANCELLED");
  }, integrationTimeout);

  it("fails closed for unsafe input and persists nothing new", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await createPendingApproval(dbPath, "run_unsafe");
    const slice = createApprovalAuditRuntimeSlice({ repositoryClient });

    if (!slice.ok) {
      throw new Error("Approval audit runtime slice setup denied.");
    }

    const stateCount = tableCount(dbPath, "RuntimeStateSnapshot");
    const auditCount = tableCount(dbPath, "AuditRecord");
    const result = await slice.value.decideApprovalRequest({
      ...decisionScenario("run_unsafe", "APPROVE"),
      rawDocument: "unsafe",
    });

    expect(result.ok).toBe(false);
    expect(tableCount(dbPath, "RuntimeStateSnapshot")).toBe(stateCount);
    expect(tableCount(dbPath, "AuditRecord")).toBe(auditCount);
  }, integrationTimeout);

  it("fails closed for missing scope fields and unsupported decisions", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await createPendingApproval(dbPath, "run_invalid");
    const slice = createApprovalAuditRuntimeSlice({ repositoryClient });

    if (!slice.ok) {
      throw new Error("Approval audit runtime slice setup denied.");
    }

    const cases = [
      { ...decisionScenario("run_invalid", "APPROVE"), tenantId: "" },
      { ...decisionScenario("run_invalid", "APPROVE"), governedRunId: "" },
      { ...decisionScenario("run_invalid", "APPROVE"), approvalRequestId: "" },
      {
        ...decisionScenario("run_invalid", "APPROVE"),
        decisionOutcome: "ESCALATE",
      },
    ];

    for (const candidate of cases) {
      expect((await slice.value.decideApprovalRequest(candidate)).ok).toBe(
        false,
      );
    }
  }, integrationTimeout);

  it("fails closed for non-pending approval requests and tenant mismatch", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await createPendingApproval(dbPath, "run_boundary");
    const slice = createApprovalAuditRuntimeSlice({ repositoryClient });

    if (!slice.ok) {
      throw new Error("Approval audit runtime slice setup denied.");
    }

    const firstDecision = await slice.value.decideApprovalRequest(
      decisionScenario("run_boundary", "APPROVE"),
    );
    const approved = assertApprovalAuditRuntimeResult(firstDecision);
    const stateCount = tableCount(dbPath, "RuntimeStateSnapshot");
    const auditCount = tableCount(dbPath, "AuditRecord");

    expect(approved.approvalRequest.status).toBe("APPROVED");
    expect(
      (await slice.value.decideApprovalRequest(
        decisionScenario("run_boundary", "REJECT"),
      )).ok,
    ).toBe(false);
    expect(
      (await slice.value.decideApprovalRequest({
        ...decisionScenario("run_boundary", "APPROVE"),
        tenantId: "tenant_02",
      })).ok,
    ).toBe(false);
    expect(tableCount(dbPath, "RuntimeStateSnapshot")).toBe(stateCount);
    expect(tableCount(dbPath, "AuditRecord")).toBe(auditCount);
  }, integrationTimeout);

  it("rejects raw content field names before persistence", async () => {
    const rawFields = [
      "rawDocument",
      "documentContent",
      "rawContent",
      "fileBlob",
      "binary",
      "payload",
    ];
    const repositoryCalls: (keyof RuntimeRepositoryClient)[] = [];
    const repositoryClient =
      createRepositoryClientThatFailsOnUse(repositoryCalls);
    const slice = createApprovalAuditRuntimeSlice({ repositoryClient });

    if (!slice.ok) {
      throw new Error("Approval audit runtime slice setup denied.");
    }

    for (const field of rawFields) {
      const result = await slice.value.decideApprovalRequest({
        ...decisionScenario("run_sensitive", "APPROVE"),
        [field]: "unsafe",
      });

      expect(result.ok).toBe(false);
      expect(result).toMatchObject({
        ok: false,
        error: { code: "APPROVAL_AUDIT_INPUT_INVALID" },
      });
      expect(repositoryCalls).toEqual([]);
    }
  });

  it("sanitizes injected client errors", async () => {
    const client: RuntimeRepositoryClient = {
      createGovernedRun() {
        throw new Error("unused");
      },
      createRuntimeStateSnapshot() {
        throw new Error("unused");
      },
      createPolicyDecisionRecord() {
        throw new Error("unused");
      },
      createAdmissionDecisionRecord() {
        throw new Error("unused");
      },
      createApprovalRequest() {
        throw new Error("unused");
      },
      updateApprovalRequestDecision() {
        throw new Error("SQLITE raw stack secret payload failure");
      },
      createAuditRecord() {
        throw new Error("unused");
      },
      findGovernedRunByTenantAndCorrelation() {
        return null;
      },
      listRuntimeStateSnapshotsByRun() {
        return [
          {
            id: "state_01",
            tenantId: "tenant_01",
            governedRunId: "run_error",
            state: "WAITING_APPROVAL",
            sequence: 1,
            reasonCode: "WAITING_APPROVAL_RECORDED",
            safeSummary: "State snapshot persisted.",
            createdAt: timestamp,
          } satisfies RuntimeRepositoryStateSnapshotRecord,
        ];
      },
      listPolicyDecisionRecordsByRun() {
        return [];
      },
      listAdmissionDecisionRecordsByRun() {
        return [];
      },
      listApprovalRequestsByRun() {
        return [
          {
            id: "run_error_approval_01",
            tenantId: "tenant_01",
            governedRunId: "run_error",
            admissionDecisionRecordId: "run_error_admission_01",
            status: "PENDING",
            requestedRole: "compliance_reviewer",
            requesterRef: "requester_01",
            createdAt: timestamp,
          } satisfies RuntimeRepositoryApprovalRequestRecord,
        ];
      },
      listAuditRecordsByRun() {
        return [] satisfies RuntimeRepositoryAuditRecord[];
      },
    };
    const slice = createApprovalAuditRuntimeSlice({ repositoryClient: client });

    if (!slice.ok) {
      throw new Error("Approval audit runtime slice setup denied.");
    }

    const result = await decideApprovalRequest(
      slice.value,
      decisionScenario("run_error", "APPROVE"),
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const denial = JSON.stringify(result.error);

      expect(denial).not.toContain("SQLITE");
      expect(denial).not.toContain("secret");
      expect(denial).not.toContain("stack");
      expect(denial).not.toContain("payload");
    }
  });

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
