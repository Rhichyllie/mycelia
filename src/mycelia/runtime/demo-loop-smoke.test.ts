import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { resetDemoDatabase } from "./demo-reset";
import {
  DEMO_SEED_GOVERNED_RUN_ID,
  seedDemoScenario,
} from "./demo-seed-scenario";
import { createGovernedRequest } from "./governed-request/create-governed-request";
import {
  decideApprovalRequest,
  type ApprovalDecisionOutcome,
} from "./governed-request/decide-approval-request";
import { loadInvestigationTimeline } from "./investigation/load-investigation-timeline";
import { createPrismaApprovalRequestRepository } from "./repositories/prisma-approval-request.repository";

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

async function applyDemoLoopMigrations(client: PrismaClient) {
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
  const root = mkdtempSync(join(tmpdir(), "mycelia-live6-loop-"));
  const dbPath = join(root, "live6-loop.sqlite");
  const client = new PrismaClient({
    datasources: {
      db: { url: sqliteUrl(dbPath) },
    },
  });

  tempRoots.push(root);
  await applyDemoLoopMigrations(client);

  return { client, dbPath };
}

function expectedFinalState(decision: ApprovalDecisionOutcome) {
  return decision === "APPROVE" ? "APPROVED" : "REJECTED";
}

function expectedDecisionReason(decision: ApprovalDecisionOutcome) {
  return decision === "APPROVE" ? "APPROVAL_ACCEPTED" : "APPROVAL_REJECTED";
}

async function waitForCreatedAtOrdering(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 15));
}

async function expectSeedBaseline(client: PrismaClient, tenantId: string) {
  const [runs, snapshots, policies, admissions, audits, approvals] =
    await Promise.all([
      client.governedRun.findMany({ where: { tenantId } }),
      client.runtimeStateSnapshot.count({ where: { tenantId } }),
      client.policyDecisionRecord.count({ where: { tenantId } }),
      client.admissionDecisionRecord.count({ where: { tenantId } }),
      client.auditRecord.count({ where: { tenantId } }),
      client.approvalRequest.count({ where: { tenantId } }),
    ]);

  expect(runs).toHaveLength(1);
  expect(runs[0]).toMatchObject({
    id: DEMO_SEED_GOVERNED_RUN_ID,
    currentState: "WAITING_APPROVAL",
    status: "WAITING_APPROVAL",
  });
  expect(snapshots).toBe(2);
  expect(policies).toBe(1);
  expect(admissions).toBe(1);
  expect(audits).toBe(2);
  expect(approvals).toBe(0);
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("LIVE-6 commercial demo loop smoke test", () => {
  it("runs seed, create, decide, investigate and reset for approve and reject", async () => {
    const { client } = await createTempClient();

    try {
      const tenantId = "tenant_live6_loop";

      for (const decision of ["APPROVE", "REJECT"] as const) {
        const seed = await seedDemoScenario({ client, tenantId });

        expect(seed).toMatchObject({
          tenantId,
          governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
          currentState: "WAITING_APPROVAL",
          status: "WAITING_APPROVAL",
        });
        await expectSeedBaseline(client, tenantId);
        await waitForCreatedAtOrdering();

        const created = await createGovernedRequest({ client, tenantId });
        expect(created.ok).toBe(true);

        if (!created.ok) {
          throw new Error(created.safeReason);
        }

        const approval = await createPrismaApprovalRequestRepository(
          client,
        ).findOrCreateForRun({
          tenantId,
          governedRunId: created.runId,
        });

        expect(approval).toMatchObject({
          tenantId,
          governedRunId: created.runId,
          status: "PENDING",
        });

        const decided = await decideApprovalRequest({
          client,
          tenantId,
          runId: created.runId,
          decision,
        });

        expect(decided).toMatchObject({
          ok: true,
          runId: created.runId,
          currentState: expectedFinalState(decision),
          status: expectedFinalState(decision),
          decisionOutcome: decision,
          decisionReasonCode: expectedDecisionReason(decision),
        });

        const timeline = await loadInvestigationTimeline({ client, tenantId });
        expect(timeline.status).toBe("READY");

        if (timeline.status !== "READY") {
          throw new Error("Expected investigation timeline after decision.");
        }

        expect(timeline.run).toMatchObject({
          id: created.runId,
          currentState: expectedFinalState(decision),
          status: expectedFinalState(decision),
        });
        expect(timeline.snapshots).toHaveLength(3);
        expect(timeline.audits).toHaveLength(3);
        expect(timeline.policies).toHaveLength(1);
        expect(timeline.admission?.lifecycleIntentHint).toBe("WAITING_APPROVAL");
        expect(timeline.approvalRequest).toMatchObject({
          status: expectedFinalState(decision),
          decisionOutcome: decision,
          decisionReasonCode: expectedDecisionReason(decision),
        });
        expect(timeline.summary).toMatchObject({
          auditCount: 3,
          finalState: expectedFinalState(decision),
          humanDecisionRequired: true,
          humanDecisionOutcome: decision,
        });

        const reset = await resetDemoDatabase({ client, tenantId });
        expect(reset.ok).toBe(true);
        await expectSeedBaseline(client, tenantId);
      }
    } finally {
      await client.$disconnect();
    }
  });
});