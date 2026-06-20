import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  ApprovalAuditRuntimeScenario,
  assertApprovalAuditRuntimeResult,
  createApprovalAuditRuntimeSlice,
} from "../../persistence/approval-audit-runtime-slice";
import {
  assertPersistedGovernedFlowResult,
  createPersistedGovernedFlowHarness,
  type PersistedGovernedFlowScenario,
} from "../../persistence/persisted-governed-flow-harness";
import {
  PersistedInvestigationCompletenessValues,
  PersistedInvestigationFindingSeverities,
  PersistedInvestigationReadModelVerdicts,
  PersistedInvestigationSections,
  assertPersistedInvestigationReadModelResult,
  createPersistedInvestigationReadModel,
  type PersistedInvestigationReadModelScenario,
} from ".";
import {
  assertPrismaRuntimeRepositoryAdapter,
  createPrismaRuntimeRepositoryAdapter,
} from "../../persistence/prisma-runtime-repository-adapter";
import type {
  RuntimeRepositoryClient,
  RuntimeRepositoryStateSnapshotRecord,
} from "../../persistence/runtime-repository-layer";

const tempRoots: string[] = [];
const timestamp = "2026-01-01T00:00:00.000Z";
const decidedAt = "2026-01-01T00:01:00.000Z";
const integrationTimeout = 20000;

function sqliteCommand(): string {
  return process.env.SQLITE3_BIN ?? "sqlite3";
}

function tempDatabase() {
  const root = mkdtempSync(join(tmpdir(), "mycelia-3e-"));
  const dbPath = join(root, "investigation-read-model.db");

  tempRoots.push(root);

  return { dbPath, root };
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

function repositoryClientForDatabase(dbPath: string) {
  return assertPrismaRuntimeRepositoryAdapter(
    createPrismaRuntimeRepositoryAdapter(createSqlitePrismaLikeClient(dbPath)),
  ).client;
}

function flowScenario(
  riskLevel: "LOW" | "MEDIUM" | "HIGH",
  runId: string,
): PersistedGovernedFlowScenario {
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
    createdAt: timestamp,
  };
}

function investigationScenario(
  runId: string,
  tenantId = "tenant_01",
): PersistedInvestigationReadModelScenario {
  return {
    tenantId,
    governedRunId: runId,
    correlationId: `${runId}_correlation`,
    investigationPurpose: "COMPLIANCE_REVIEW_INVESTIGATION",
    requestedByRef: "investigator_01",
  };
}

function approvalDecisionScenario(
  runId: string,
  decisionOutcome: ApprovalAuditRuntimeScenario["decisionOutcome"],
): ApprovalAuditRuntimeScenario {
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

async function seedFlow(
  dbPath: string,
  riskLevel: "LOW" | "MEDIUM" | "HIGH",
  runId: string,
) {
  const repositoryClient = repositoryClientForDatabase(dbPath);
  const harness = createPersistedGovernedFlowHarness({ repositoryClient });

  if (!harness.ok) {
    throw new Error("Persisted governed flow harness setup denied.");
  }

  const result = await harness.value.runScenario(flowScenario(riskLevel, runId));

  assertPersistedGovernedFlowResult(result);

  return repositoryClient;
}

async function seedApprovedFlow(
  dbPath: string,
  runId: string,
  decisionOutcome: ApprovalAuditRuntimeScenario["decisionOutcome"],
) {
  const repositoryClient = await seedFlow(dbPath, "MEDIUM", runId);
  const slice = createApprovalAuditRuntimeSlice({ repositoryClient });

  if (!slice.ok) {
    throw new Error("Approval audit runtime slice setup denied.");
  }

  assertApprovalAuditRuntimeResult(
    await slice.value.decideApprovalRequest(
      approvalDecisionScenario(runId, decisionOutcome),
    ),
  );

  return repositoryClient;
}

async function reconstruct(
  repositoryClient: RuntimeRepositoryClient,
  scenario: unknown,
) {
  const model = createPersistedInvestigationReadModel({ repositoryClient });

  if (!model.ok) {
    throw new Error("Persisted investigation read model setup denied.");
  }

  return model.value.reconstruct(scenario);
}

function allText(input: unknown): string {
  return JSON.stringify(input);
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("persisted investigation read model", () => {
  it("exports the required model enums and requires an injected repository client", () => {
    expect(PersistedInvestigationReadModelVerdicts).toEqual([
      "INVESTIGATION_RECONSTRUCTED",
      "INVESTIGATION_INCOMPLETE",
      "INVESTIGATION_BLOCKED",
      "INVESTIGATION_FAILED_SAFE",
    ]);
    expect(PersistedInvestigationCompletenessValues).toEqual([
      "COMPLETE",
      "INCOMPLETE",
      "BLOCKED",
      "FAILED_SAFE",
    ]);
    expect(PersistedInvestigationFindingSeverities).toEqual([
      "INFO",
      "WARNING",
      "BLOCKER",
    ]);
    expect(PersistedInvestigationSections).toEqual([
      "overview",
      "stateTimeline",
      "policyAdmission",
      "approval",
      "auditTrail",
      "persistenceCoverage",
      "findings",
      "nextActions",
    ]);
    expect(createPersistedInvestigationReadModel(undefined).ok).toBe(false);
    expect(createPersistedInvestigationReadModel({}).ok).toBe(false);
  });

  it("reconstructs a low-risk completed investigation", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await seedFlow(dbPath, "LOW", "run_low_read");
    const value = assertPersistedInvestigationReadModelResult(
      await reconstruct(repositoryClient, investigationScenario("run_low_read")),
    );

    expect(value.verdict).toBe("INVESTIGATION_RECONSTRUCTED");
    expect(value.completeness).toBe("COMPLETE");
    expect(value.sections).toEqual(PersistedInvestigationSections);
    expect(value.overview.currentState).toBe("COMPLETED");
    expect(value.stateTimeline.initialState).toBe("CREATED");
    expect(value.policyAdmission.policyOutcome).toBe("ADMIT");
    expect(value.policyAdmission.admissionOutcome).toBe("ADMIT");
    expect(value.auditTrail.presentMoments).toEqual([
      "REQUEST_CREATED",
      "ADMISSION_DECIDED",
    ]);
    expect(value.persistenceCoverage.recordCounts.governedRuns).toBe(1);
    expect(value.recordsReadBack).toBe(true);
  }, integrationTimeout);

  it("reconstructs a medium-risk pending approval investigation", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await seedFlow(
      dbPath,
      "MEDIUM",
      "run_pending_read",
    );
    const value = assertPersistedInvestigationReadModelResult(
      await reconstruct(
        repositoryClient,
        investigationScenario("run_pending_read"),
      ),
    );

    expect(value.verdict).toBe("INVESTIGATION_RECONSTRUCTED");
    expect(value.completeness).toBe("COMPLETE");
    expect(value.overview.currentState).toBe("WAITING_APPROVAL");
    expect(value.approval.approvalRequired).toBe(true);
    expect(value.approval.currentApprovalStatus).toBe("PENDING");
    expect(value.auditTrail.expectedMoments).not.toContain(
      "APPROVAL_DECIDED",
    );
    expect(value.persistenceCoverage.recordCounts.approvalRequests).toBe(1);
  }, integrationTimeout);

  it("reconstructs an approved investigation", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await seedApprovedFlow(
      dbPath,
      "run_approved_read",
      "APPROVE",
    );
    const value = assertPersistedInvestigationReadModelResult(
      await reconstruct(
        repositoryClient,
        investigationScenario("run_approved_read"),
      ),
    );

    expect(value.verdict).toBe("INVESTIGATION_RECONSTRUCTED");
    expect(value.approval.currentApprovalStatus).toBe("APPROVED");
    expect(value.approval.decisionOutcome).toBe("APPROVE");
    expect(value.approval.lifecycleCoherence).toBe("COHERENT");
    expect(value.stateTimeline.currentState).toBe("APPROVED");
    expect(value.auditTrail.presentMoments).toContain("APPROVAL_DECIDED");
  }, integrationTimeout);

  it("reconstructs a rejected approval investigation", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await seedApprovedFlow(
      dbPath,
      "run_rejected_read",
      "REJECT",
    );
    const value = assertPersistedInvestigationReadModelResult(
      await reconstruct(
        repositoryClient,
        investigationScenario("run_rejected_read"),
      ),
    );

    expect(value.verdict).toBe("INVESTIGATION_RECONSTRUCTED");
    expect(value.approval.currentApprovalStatus).toBe("REJECTED");
    expect(value.stateTimeline.currentState).toBe("REJECTED");
    expect(value.auditTrail.presentMoments).toContain("APPROVAL_DECIDED");
  }, integrationTimeout);

  it("reconstructs a timed-out approval investigation", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await seedApprovedFlow(
      dbPath,
      "run_timeout_read",
      "TIMEOUT",
    );
    const value = assertPersistedInvestigationReadModelResult(
      await reconstruct(
        repositoryClient,
        investigationScenario("run_timeout_read"),
      ),
    );

    expect(value.verdict).toBe("INVESTIGATION_RECONSTRUCTED");
    expect(value.approval.currentApprovalStatus).toBe("TIMED_OUT");
    expect(value.stateTimeline.currentState).toBe("FAILED");
    expect(value.auditTrail.presentMoments).toContain("APPROVAL_DECIDED");
  }, integrationTimeout);

  it("reconstructs a cancelled approval investigation", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await seedApprovedFlow(
      dbPath,
      "run_cancelled_read",
      "CANCEL",
    );
    const value = assertPersistedInvestigationReadModelResult(
      await reconstruct(
        repositoryClient,
        investigationScenario("run_cancelled_read"),
      ),
    );

    expect(value.verdict).toBe("INVESTIGATION_RECONSTRUCTED");
    expect(value.approval.currentApprovalStatus).toBe("CANCELLED");
    expect(value.stateTimeline.currentState).toBe("CANCELLED");
    expect(value.auditTrail.presentMoments).toContain("APPROVAL_DECIDED");
  }, integrationTimeout);

  it("reconstructs a high-risk rejected investigation", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await seedFlow(dbPath, "HIGH", "run_high_read");
    const value = assertPersistedInvestigationReadModelResult(
      await reconstruct(repositoryClient, investigationScenario("run_high_read")),
    );

    expect(value.verdict).toBe("INVESTIGATION_RECONSTRUCTED");
    expect(value.stateTimeline.currentState).toBe("REJECTED");
    expect(value.policyAdmission.policyOutcome).toBe("DENY");
    expect(value.policyAdmission.admissionOutcome).toBe("DENY");
    expect(value.approval.approvalRequired).toBe(false);
  }, integrationTimeout);

  it("surfaces missing audit as warning and incomplete reconstruction", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await seedFlow(
      dbPath,
      "LOW",
      "run_missing_audit",
    );

    executeSql(
      dbPath,
      `DELETE FROM "AuditRecord" WHERE "governedRunId" = 'run_missing_audit' AND "moment" = 'ADMISSION_DECIDED';`,
    );

    const value = assertPersistedInvestigationReadModelResult(
      await reconstruct(
        repositoryClient,
        investigationScenario("run_missing_audit"),
      ),
    );

    expect(value.verdict).toBe("INVESTIGATION_INCOMPLETE");
    expect(value.completeness).toBe("INCOMPLETE");
    expect(value.auditTrail.missingMoments).toContain("ADMISSION_DECIDED");
    expect(value.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "WARNING",
          code: "AUDIT_ADMISSION_DECIDED_MISSING",
        }),
      ]),
    );
  }, integrationTimeout);

  it("blocks reconstruction when the governed run root is missing", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const value = assertPersistedInvestigationReadModelResult(
      await reconstruct(
        repositoryClientForDatabase(dbPath),
        investigationScenario("run_missing_root"),
      ),
    );

    expect(value.verdict).toBe("INVESTIGATION_BLOCKED");
    expect(value.completeness).toBe("BLOCKED");
    expect(value.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "BLOCKER",
          code: "GOVERNED_RUN_MISSING",
        }),
      ]),
    );
  }, integrationTimeout);

  it("fails closed for tenant mismatch without cross-tenant inference", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await seedFlow(
      dbPath,
      "LOW",
      "run_tenant_boundary",
    );
    const value = assertPersistedInvestigationReadModelResult(
      await reconstruct(
        repositoryClient,
        investigationScenario("run_tenant_boundary", "tenant_02"),
      ),
    );
    const text = allText(value);

    expect(value.verdict).toBe("INVESTIGATION_BLOCKED");
    expect(value.completeness).toBe("BLOCKED");
    expect(text).not.toContain("tenant_01");
    expect(text).not.toContain("cross tenant exists");
  }, integrationTimeout);

  it("fails closed for missing scope fields and raw content fields", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = repositoryClientForDatabase(dbPath);
    const rawFields = [
      "rawDocument",
      "documentContent",
      "rawContent",
      "fileBlob",
      "binary",
      "payload",
    ];

    expect(
      (await reconstruct(repositoryClient, {
        ...investigationScenario("run_invalid"),
        tenantId: "",
      })).ok,
    ).toBe(false);
    expect(
      (await reconstruct(repositoryClient, {
        ...investigationScenario("run_invalid"),
        governedRunId: "",
      })).ok,
    ).toBe(false);

    for (const field of rawFields) {
      const result = await reconstruct(repositoryClient, {
        ...investigationScenario("run_invalid"),
        [field]: "unsafe",
      });

      expect(result.ok).toBe(false);
    }
  }, integrationTimeout);

  it("sanitizes repository and client errors", async () => {
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
        throw new Error("unused");
      },
      createAuditRecord() {
        throw new Error("unused");
      },
      findGovernedRunByTenantAndCorrelation() {
        throw new Error("SQLITE raw stack secret payload failure");
      },
      listRuntimeStateSnapshotsByRun() {
        return [
          {
            id: "state_01",
            tenantId: "tenant_01",
            governedRunId: "run_error",
            state: "CREATED",
            sequence: 1,
            reasonCode: "STATE_CREATED",
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
        return [];
      },
      listAuditRecordsByRun() {
        return [];
      },
    };
    const result = await reconstruct(client, investigationScenario("run_error"));
    const text = allText(result);

    expect(result.ok).toBe(false);
    expect(text).not.toContain("SQLITE");
    expect(text).not.toContain("stack");
    expect(text).not.toContain("secret");
    expect(text).not.toContain("payload");
  });

  it("keeps findings bounded and free of raw sensitive payloads", async () => {
    const { dbPath } = tempDatabase();

    applyMigration(dbPath);

    const repositoryClient = await seedFlow(
      dbPath,
      "LOW",
      "run_safe_findings",
    );
    const value = assertPersistedInvestigationReadModelResult(
      await reconstruct(
        repositoryClient,
        investigationScenario("run_safe_findings"),
      ),
    );
    const findingsText = allText(value.findings);

    expect(value.recordsReadBack).toBe(true);
    expect(findingsText).not.toMatch(
      /rawDocument|documentContent|rawContent|fileBlob|binary|payload/i,
    );
  }, integrationTimeout);

  it("does not leave disposable database files in the repository", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "*.db", "*.sqlite", "*.sqlite3"],
      { encoding: "utf8" },
    );

    expect(status.trim()).toBe("");
  });
});
