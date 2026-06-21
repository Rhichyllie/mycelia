import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { seedDemoScenario } from "../demo-seed-scenario";
import { decideApprovalRequest } from "../governed-request/decide-approval-request";
import { createPrismaApprovalRequestRepository } from "../repositories/prisma-approval-request.repository";
import { getControlCenterSummary } from "./get-control-center-summary";

const tempRoots: string[] = [];

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

function sqliteUrl(dbPath: string): string {
  return `file:${dbPath.replace(/\\/g, "/")}`;
}

async function applyMigrationFile(client: PrismaClient, path: string) {
  const migration = readFileSync(path, "utf8");
  const statements = migration
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await client.$executeRawUnsafe(statement);
  }
}

async function applyMigrations(client: PrismaClient) {
  for (const migration of [
    "000001_minimal_runtime_slice",
    "000002_auth_foundation",
    "000003_workspace_graph_foundation",
  ]) {
    await applyMigrationFile(
      client,
      repoPath("prisma", "migrations", migration, "migration.sql"),
    );
  }
}

async function createTempClient() {
  const root = mkdtempSync(join(tmpdir(), "mycelia-control-center-"));
  const dbPath = join(root, "control-center.sqlite");
  const client = new PrismaClient({
    datasources: {
      db: { url: sqliteUrl(dbPath) },
    },
  });

  tempRoots.push(root);
  await applyMigrations(client);

  return { client, dbPath };
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("Control Center summary", () => {
  it("returns real zero counts for an empty local database", async () => {
    const { client } = await createTempClient();

    try {
      await expect(
        getControlCenterSummary({ client, tenantId: "tenant_empty_control" }),
      ).resolves.toEqual({
        tenantId: "tenant_empty_control",
        totalRuns: 0,
        runsByState: {
          waitingApproval: 0,
          approved: 0,
          rejected: 0,
          completed: 0,
        },
        pendingApprovals: 0,
        auditEvents: 0,
        workspaces: 0,
      });
    } finally {
      await client.$disconnect();
    }
  });

  it("counts seeded and decided governed activity from SQLite", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_control_center";

    try {
      const seed = await seedDemoScenario({ client, tenantId });
      const seededSummary = await getControlCenterSummary({ client, tenantId });

      expect(seededSummary).toMatchObject({
        tenantId,
        totalRuns: 1,
        runsByState: {
          waitingApproval: 1,
          approved: 0,
          rejected: 0,
          completed: 0,
        },
        pendingApprovals: 0,
        auditEvents: 2,
        workspaces: 1,
      });

      const approvalRequest = await createPrismaApprovalRequestRepository(
        client,
      ).findOrCreateForRun({
        tenantId,
        governedRunId: seed.governedRunId,
      });

      expect(approvalRequest).toMatchObject({ status: "PENDING" });
      await expect(
        getControlCenterSummary({ client, tenantId }),
      ).resolves.toMatchObject({ pendingApprovals: 1 });

      const decided = await decideApprovalRequest({
        client,
        tenantId,
        runId: seed.governedRunId,
        decision: "APPROVE",
      });

      expect(decided.ok).toBe(true);
      await expect(
        getControlCenterSummary({ client, tenantId }),
      ).resolves.toMatchObject({
        totalRuns: 1,
        runsByState: {
          waitingApproval: 0,
          approved: 1,
          rejected: 0,
          completed: 0,
        },
        pendingApprovals: 0,
        auditEvents: 3,
        workspaces: 1,
      });
    } finally {
      await client.$disconnect();
    }
  });
});
