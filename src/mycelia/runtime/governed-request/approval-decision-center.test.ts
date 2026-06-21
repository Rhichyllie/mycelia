import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { loadInvestigationTimeline } from "../investigation/load-investigation-timeline";
import { createPrismaApprovalRequestRepository } from "../repositories/prisma-approval-request.repository";
import { createGovernedRequest } from "./create-governed-request";
import { decideApprovalRequest } from "./decide-approval-request";

const tempRoots: string[] = [];

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

function sqliteUrl(dbPath: string): string {
  return `file:${dbPath.replace(/\\/g, "/")}`;
}

async function applyMinimalMigration(client: PrismaClient) {
  const migration = readFileSync(
    repoPath(
      "prisma",
      "migrations",
      "000001_minimal_runtime_slice",
      "migration.sql",
    ),
    "utf8",
  );

  const statements = migration
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await client.$executeRawUnsafe(statement);
  }
}

async function createTempClient() {
  const root = mkdtempSync(join(tmpdir(), "mycelia-live9-"));
  const dbPath = join(root, "live9.sqlite");
  const client = new PrismaClient({
    datasources: {
      db: { url: sqliteUrl(dbPath) },
    },
  });

  tempRoots.push(root);
  await applyMinimalMigration(client);

  return { client, dbPath };
}

async function createPendingApproval(client: PrismaClient, tenantId: string) {
  const created = await createGovernedRequest({ client, tenantId });

  if (!created.ok) {
    throw new Error(created.safeReason);
  }

  const approvals = createPrismaApprovalRequestRepository(client);
  const approvalRequest = await approvals.findOrCreateForRun({
    tenantId,
    governedRunId: created.runId,
  });

  if (approvalRequest === null) {
    throw new Error("Expected pending approval request for LIVE-9 fixture.");
  }

  return { created, approvalRequest };
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("LIVE-9 approval decision center persistence", () => {
  it("lists pending approvals, loads detail, requires rejection rationale and preserves decided state", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_9_decision_center";

    try {
      const approvals = createPrismaApprovalRequestRepository(client);
      const { created: firstRun, approvalRequest: firstApproval } =
        await createPendingApproval(client, tenantId);

      const pending = await approvals.listPendingForTenant({ tenantId, take: 10 });
      expect(pending).toHaveLength(1);
      expect(pending[0]).toMatchObject({
        id: firstApproval.id,
        status: "PENDING",
        requesterRef: "demo://actor/requester",
      });

      const detail = await loadInvestigationTimeline({
        client,
        tenantId,
        runId: firstRun.runId,
      });

      expect(detail.status).toBe("READY");

      if (detail.status !== "READY") {
        throw new Error("Expected approval detail timeline.");
      }

      expect(detail.run.id).toBe(firstRun.runId);
      expect(detail.policies.at(0)).toMatchObject({
        riskLevel: "MEDIUM",
        outcome: "APPROVAL_REQUIRED",
      });
      expect(detail.admission).toMatchObject({
        lifecycleIntentHint: "WAITING_APPROVAL",
      });

      const missingRationale = await decideApprovalRequest({
        client,
        tenantId,
        runId: firstRun.runId,
        decision: "REJECT",
        safeDecisionSummary: " ",
      });

      expect(missingRationale).toMatchObject({
        ok: false,
        status: "FAILED_SAFE",
        reasonCode: "APPROVAL_RATIONALE_REQUIRED",
      });
      expect(
        await approvals.findById({ tenantId, id: firstApproval.id }),
      ).toMatchObject({
        status: "PENDING",
        decisionOutcome: null,
        safeDecisionSummary: null,
        decidedAt: null,
      });

      const rejectionRationale =
        "Rejected because the vendor contract fixture needs legal review before action.";
      const rejected = await decideApprovalRequest({
        client,
        tenantId,
        runId: firstRun.runId,
        decision: "REJECT",
        safeDecisionSummary: rejectionRationale,
      });

      expect(rejected).toMatchObject({
        ok: true,
        currentState: "REJECTED",
        decisionOutcome: "REJECT",
        safeDecisionSummary: rejectionRationale,
      });
      expect(
        await approvals.findById({ tenantId, id: firstApproval.id }),
      ).toMatchObject({
        status: "REJECTED",
        decisionOutcome: "REJECT",
        safeDecisionSummary: rejectionRationale,
      });

      const { created: secondRun, approvalRequest: secondApproval } =
        await createPendingApproval(client, tenantId);
      const approvalRationale =
        "Approved because the evidence preview supports a controlled next step.";
      const approved = await decideApprovalRequest({
        client,
        tenantId,
        runId: secondRun.runId,
        decision: "APPROVE",
        safeDecisionSummary: approvalRationale,
      });

      expect(approved).toMatchObject({
        ok: true,
        currentState: "APPROVED",
        decisionOutcome: "APPROVE",
        safeDecisionSummary: approvalRationale,
      });

      const approvalBeforeStaleAttempt = await approvals.findById({
        tenantId,
        id: secondApproval.id,
      });
      const stale = await decideApprovalRequest({
        client,
        tenantId,
        runId: secondRun.runId,
        decision: "REJECT",
        safeDecisionSummary: "Attempted stale overwrite.",
      });
      const approvalAfterStaleAttempt = await approvals.findById({
        tenantId,
        id: secondApproval.id,
      });

      expect(stale.ok).toBe(false);
      expect(approvalAfterStaleAttempt).toMatchObject({
        id: approvalBeforeStaleAttempt?.id,
        status: "APPROVED",
        decisionOutcome: "APPROVE",
        safeDecisionSummary: approvalRationale,
      });
      expect(approvalAfterStaleAttempt?.decidedAt?.getTime()).toBe(
        approvalBeforeStaleAttempt?.decidedAt?.getTime(),
      );
    } finally {
      await client.$disconnect();
    }
  });
});
