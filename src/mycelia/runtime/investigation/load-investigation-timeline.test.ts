import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { createGovernedRequest } from "../governed-request/create-governed-request";
import { decideApprovalRequest } from "../governed-request/decide-approval-request";
import { createPrismaApprovalRequestRepository } from "../repositories/prisma-approval-request.repository";
import {
  loadInvestigationTimeline,
  type InvestigationTimelineReadyResult,
} from "./load-investigation-timeline";

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
  const root = mkdtempSync(join(tmpdir(), "mycelia-live4-"));
  const dbPath = join(root, "live4.sqlite");
  const client = new PrismaClient({
    datasources: {
      db: { url: sqliteUrl(dbPath) },
    },
  });

  tempRoots.push(root);
  await applyMinimalMigration(client);

  return { client, dbPath };
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

async function createWaitingApprovalRun(client: PrismaClient, tenantId: string) {
  const created = await createGovernedRequest({ client, tenantId });

  if (!created.ok) {
    throw new Error(created.safeReason);
  }

  return created;
}

async function ensureApprovalRequest(
  client: PrismaClient,
  tenantId: string,
  governedRunId: string,
) {
  const approvalRequest = await createPrismaApprovalRequestRepository(
    client,
  ).findOrCreateForRun({ tenantId, governedRunId });

  if (approvalRequest === null) {
    throw new Error("Expected pending approval request for LIVE-4 fixture.");
  }

  return approvalRequest;
}

function expectChronological(result: InvestigationTimelineReadyResult): void {
  for (let index = 1; index < result.timeline.length; index += 1) {
    expect(result.timeline[index].occurredAt.getTime()).toBeGreaterThanOrEqual(
      result.timeline[index - 1].occurredAt.getTime(),
    );
  }
}

function countKind(
  result: InvestigationTimelineReadyResult,
  kind: InvestigationTimelineReadyResult["timeline"][number]["kind"],
): number {
  return result.timeline.filter((entry) => entry.kind === kind).length;
}

describe("LIVE-4 investigation timeline read model", () => {
  it("returns EMPTY when no governed run exists for the tenant", async () => {
    const { client } = await createTempClient();

    try {
      const result = await loadInvestigationTimeline({
        client,
        tenantId: "tenant_live_4_empty",
      });

      expect(result).toEqual({ status: "EMPTY" });
    } finally {
      await client.$disconnect();
    }
  });

  it("loads the full WAITING_APPROVAL history from real SQLite", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_4_waiting";

    try {
      const created = await createWaitingApprovalRun(client, tenantId);
      const result = await loadInvestigationTimeline({ client, tenantId });

      expect(result.status).toBe("READY");

      if (result.status !== "READY") {
        throw new Error("Expected READY investigation timeline.");
      }

      expect(result.run).toMatchObject({
        id: created.runId,
        currentState: "WAITING_APPROVAL",
        status: "WAITING_APPROVAL",
      });
      expect(result.snapshots).toHaveLength(2);
      expect(result.policies).toHaveLength(1);
      expect(result.admission).toMatchObject({
        lifecycleIntentHint: "WAITING_APPROVAL",
      });
      expect(result.audits).toHaveLength(2);
      expect(result.approvalRequest).toBeNull();
      expect(countKind(result, "RuntimeStateSnapshot")).toBe(2);
      expect(countKind(result, "PolicyDecisionRecord")).toBe(1);
      expect(countKind(result, "AdmissionDecisionRecord")).toBe(1);
      expect(countKind(result, "AuditRecord")).toBe(2);
      expect(result.timeline).toHaveLength(6);
      expectChronological(result);
      expect(result.summary).toEqual({
        auditCount: 2,
        finalState: "WAITING_APPROVAL",
        humanDecisionRequired: true,
        humanDecisionOutcome: "pending",
      });
    } finally {
      await client.$disconnect();
    }
  });

  it("loads the full APPROVED history including the approval decision", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_4_approved";

    try {
      const created = await createWaitingApprovalRun(client, tenantId);
      await ensureApprovalRequest(client, tenantId, created.runId);
      const decision = await decideApprovalRequest({
        client,
        tenantId,
        runId: created.runId,
        decision: "APPROVE",
      });

      expect(decision.ok).toBe(true);

      const result = await loadInvestigationTimeline({ client, tenantId });

      expect(result.status).toBe("READY");

      if (result.status !== "READY") {
        throw new Error("Expected READY investigation timeline.");
      }

      expect(result.run).toMatchObject({
        id: created.runId,
        currentState: "APPROVED",
        status: "APPROVED",
      });
      expect(result.snapshots).toHaveLength(3);
      expect(result.audits).toHaveLength(3);
      expect(result.approvalRequest).toMatchObject({
        status: "APPROVED",
        decisionOutcome: "APPROVE",
        decisionReasonCode: "APPROVAL_ACCEPTED",
      });
      expect(result.approvalRequest?.decidedAt).toBeInstanceOf(Date);
      expect(countKind(result, "RuntimeStateSnapshot")).toBe(3);
      expect(countKind(result, "PolicyDecisionRecord")).toBe(1);
      expect(countKind(result, "AdmissionDecisionRecord")).toBe(1);
      expect(countKind(result, "AuditRecord")).toBe(3);
      expect(countKind(result, "ApprovalRequestCreated")).toBe(1);
      expect(countKind(result, "ApprovalRequestDecided")).toBe(1);
      expect(result.timeline).toHaveLength(10);
      expect(result.timeline.map((entry) => entry.reasonCode)).toContain(
        "APPROVAL_ACCEPTED",
      );
      expectChronological(result);
      expect(result.summary).toEqual({
        auditCount: 3,
        finalState: "APPROVED",
        humanDecisionRequired: true,
        humanDecisionOutcome: "APPROVE",
      });
    } finally {
      await client.$disconnect();
    }
  });

  it("loads the full REJECTED history including the rejected approval", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_4_rejected";

    try {
      const created = await createWaitingApprovalRun(client, tenantId);
      await ensureApprovalRequest(client, tenantId, created.runId);
      const decision = await decideApprovalRequest({
        client,
        tenantId,
        runId: created.runId,
        decision: "REJECT",
        safeDecisionSummary:
          "Rejected because the local demo reviewer found the fixture risk unacceptable.",
      });

      expect(decision.ok).toBe(true);

      const result = await loadInvestigationTimeline({ client, tenantId });

      expect(result.status).toBe("READY");

      if (result.status !== "READY") {
        throw new Error("Expected READY investigation timeline.");
      }

      expect(result.run).toMatchObject({
        id: created.runId,
        currentState: "REJECTED",
        status: "REJECTED",
      });
      expect(result.approvalRequest).toMatchObject({
        status: "REJECTED",
        decisionOutcome: "REJECT",
        decisionReasonCode: "APPROVAL_REJECTED",
      });
      expect(result.summary).toEqual({
        auditCount: 3,
        finalState: "REJECTED",
        humanDecisionRequired: true,
        humanDecisionOutcome: "REJECT",
      });
      expect(countKind(result, "ApprovalRequestCreated")).toBe(1);
      expect(countKind(result, "ApprovalRequestDecided")).toBe(1);
      expectChronological(result);
    } finally {
      await client.$disconnect();
    }
  });

  it("reads the most recently created run for the tenant", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_4_recent";

    try {
      const first = await createWaitingApprovalRun(client, tenantId);
      const second = await createWaitingApprovalRun(client, tenantId);
      const result = await loadInvestigationTimeline({ client, tenantId });

      expect(first.runId).not.toBe(second.runId);
      expect(result.status).toBe("READY");

      if (result.status !== "READY") {
        throw new Error("Expected READY investigation timeline.");
      }

      expect(result.run.id).toBe(second.runId);
    } finally {
      await client.$disconnect();
    }
  });

  it("loads a specific run when a runId is provided", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_4_specific_run";

    try {
      const first = await createWaitingApprovalRun(client, tenantId);
      const second = await createWaitingApprovalRun(client, tenantId);
      const mostRecent = await loadInvestigationTimeline({ client, tenantId });
      const result = await loadInvestigationTimeline({
        client,
        tenantId,
        runId: first.runId,
      });

      expect(first.runId).not.toBe(second.runId);
      expect(mostRecent.status).toBe("READY");
      expect(result.status).toBe("READY");

      if (mostRecent.status !== "READY") {
        throw new Error("Expected READY most recent investigation timeline.");
      }

      if (result.status !== "READY") {
        throw new Error("Expected READY investigation timeline.");
      }

      expect(mostRecent.run.id).toBe(second.runId);
      expect(result.run.id).toBe(first.runId);
      expect(result.run.id).not.toBe(mostRecent.run.id);
      expect(result.summary.finalState).toBe("WAITING_APPROVAL");
    } finally {
      await client.$disconnect();
    }
  });
});
