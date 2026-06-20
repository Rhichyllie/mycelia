import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { createGovernedRequest } from "./create-governed-request";
import { decideApprovalRequest } from "./decide-approval-request";
import { createPrismaApprovalRequestRepository } from "../repositories/prisma-approval-request.repository";
import { createPrismaAuditRepository } from "../repositories/prisma-audit.repository";
import { createPrismaGovernedRunRepository } from "../repositories/prisma-governed-run.repository";
import { createPrismaRuntimeStateRepository } from "../repositories/prisma-runtime-state.repository";

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
  const root = mkdtempSync(join(tmpdir(), "mycelia-live3-"));
  const dbPath = join(root, "live3.sqlite");
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

async function createWaitingApprovalFixture(client: PrismaClient, tenantId: string) {
  const result = await createGovernedRequest({ client, tenantId });

  if (!result.ok) {
    throw new Error(result.safeReason);
  }

  const approvalRepository = createPrismaApprovalRequestRepository(client);
  const approvalRequest = await approvalRepository.findOrCreateForRun({
    tenantId,
    governedRunId: result.runId,
  });

  if (approvalRequest === null) {
    throw new Error("Expected approval request to be created for waiting run.");
  }

  return { result, approvalRequest };
}

async function countRunRecords(
  client: PrismaClient,
  tenantId: string,
  governedRunId: string,
) {
  const [approvalRequests, audits, snapshots] = await Promise.all([
    client.approvalRequest.count({ where: { tenantId, governedRunId } }),
    client.auditRecord.count({ where: { tenantId, governedRunId } }),
    client.runtimeStateSnapshot.count({ where: { tenantId, governedRunId } }),
  ]);

  return { approvalRequests, audits, snapshots };
}

describe("LIVE-3 approval decision write path", () => {
  it("approves a WAITING_APPROVAL run through real SQLite", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_3_approve";

    try {
      const { result: created } = await createWaitingApprovalFixture(
        client,
        tenantId,
      );
      const decision = await decideApprovalRequest({
        client,
        tenantId,
        runId: created.runId,
        decision: "APPROVE",
      });

      expect(decision).toMatchObject({
        ok: true,
        runId: created.runId,
        currentState: "APPROVED",
        status: "APPROVED",
        approvalStatus: "APPROVED",
        decisionOutcome: "APPROVE",
        decisionReasonCode: "APPROVAL_ACCEPTED",
      });

      if (!decision.ok) {
        throw new Error(decision.safeReason);
      }

      const approvals = createPrismaApprovalRequestRepository(client);
      const runs = createPrismaGovernedRunRepository(client);
      const states = createPrismaRuntimeStateRepository(client);
      const audits = createPrismaAuditRepository(client);
      const approvalRequest = await approvals.findForRun({
        tenantId,
        governedRunId: created.runId,
      });
      const run = await runs.findById({ tenantId, id: created.runId });
      const snapshots = await states.listForRun({
        tenantId,
        governedRunId: created.runId,
      });
      const auditRecords = await audits.listForRun({
        tenantId,
        governedRunId: created.runId,
      });

      expect(approvalRequest).toMatchObject({
        status: "APPROVED",
        decisionOutcome: "APPROVE",
        decisionReasonCode: "APPROVAL_ACCEPTED",
        approverRef: decision.approverRef,
      });
      expect(approvalRequest?.decidedAt).toBeInstanceOf(Date);
      expect(run).toMatchObject({
        currentState: "APPROVED",
        status: "APPROVED",
      });
      expect(snapshots.map((snapshot) => snapshot.state)).toEqual([
        "CREATED",
        "WAITING_APPROVAL",
        "APPROVED",
      ]);
      expect(snapshots.at(-1)).toMatchObject({
        sequence: 3,
        reasonCode: "APPROVAL_ACCEPTED",
      });
      expect(auditRecords.map((record) => record.moment)).toContain(
        "APPROVAL_DECIDED",
      );
      expect(auditRecords.at(-1)).toMatchObject({
        reasonCode: "APPROVAL_ACCEPTED",
        evidenceRef: approvalRequest?.id,
      });
    } finally {
      await client.$disconnect();
    }
  });

  it("rejects a WAITING_APPROVAL run through real SQLite", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_3_reject";

    try {
      const { result: created } = await createWaitingApprovalFixture(
        client,
        tenantId,
      );
      const decision = await decideApprovalRequest({
        client,
        tenantId,
        runId: created.runId,
        decision: "REJECT",
      });

      expect(decision).toMatchObject({
        ok: true,
        runId: created.runId,
        currentState: "REJECTED",
        status: "REJECTED",
        approvalStatus: "REJECTED",
        decisionOutcome: "REJECT",
        decisionReasonCode: "APPROVAL_REJECTED",
      });

      if (!decision.ok) {
        throw new Error(decision.safeReason);
      }

      const approvals = createPrismaApprovalRequestRepository(client);
      const runs = createPrismaGovernedRunRepository(client);
      const states = createPrismaRuntimeStateRepository(client);
      const audits = createPrismaAuditRepository(client);
      const approvalRequest = await approvals.findForRun({
        tenantId,
        governedRunId: created.runId,
      });
      const run = await runs.findById({ tenantId, id: created.runId });
      const snapshots = await states.listForRun({
        tenantId,
        governedRunId: created.runId,
      });
      const auditRecords = await audits.listForRun({
        tenantId,
        governedRunId: created.runId,
      });

      expect(approvalRequest).toMatchObject({
        status: "REJECTED",
        decisionOutcome: "REJECT",
        decisionReasonCode: "APPROVAL_REJECTED",
        approverRef: decision.approverRef,
      });
      expect(approvalRequest?.decidedAt).toBeInstanceOf(Date);
      expect(run).toMatchObject({
        currentState: "REJECTED",
        status: "REJECTED",
      });
      expect(snapshots.map((snapshot) => snapshot.state)).toEqual([
        "CREATED",
        "WAITING_APPROVAL",
        "REJECTED",
      ]);
      expect(snapshots.at(-1)).toMatchObject({
        sequence: 3,
        reasonCode: "APPROVAL_REJECTED",
      });
      expect(auditRecords.at(-1)).toMatchObject({
        moment: "APPROVAL_DECIDED",
        reasonCode: "APPROVAL_REJECTED",
        evidenceRef: approvalRequest?.id,
      });
    } finally {
      await client.$disconnect();
    }
  });

  it("fails closed without writes when the run is not WAITING_APPROVAL", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_3_not_waiting";

    try {
      const { result: created } = await createWaitingApprovalFixture(
        client,
        tenantId,
      );
      await createPrismaGovernedRunRepository(client).updateState({
        tenantId,
        id: created.runId,
        currentState: "COMPLETED",
        status: "COMPLETED",
      });
      const before = await countRunRecords(client, tenantId, created.runId);
      const approvalBefore = await createPrismaApprovalRequestRepository(
        client,
      ).findForRun({ tenantId, governedRunId: created.runId });
      const decision = await decideApprovalRequest({
        client,
        tenantId,
        runId: created.runId,
        decision: "APPROVE",
      });
      const after = await countRunRecords(client, tenantId, created.runId);
      const approvalAfter = await createPrismaApprovalRequestRepository(
        client,
      ).findForRun({ tenantId, governedRunId: created.runId });

      expect(decision).toMatchObject({
        ok: false,
        status: "FAILED_SAFE",
        reasonCode: "RUN_NOT_WAITING_APPROVAL",
      });
      expect(after).toEqual(before);
      expect(approvalAfter).toMatchObject({
        id: approvalBefore?.id,
        status: "PENDING",
        decisionOutcome: null,
        decidedAt: null,
      });
    } finally {
      await client.$disconnect();
    }
  });

  it("fails closed without overwriting an already decided approval", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_3_second_decision";

    try {
      const { result: created } = await createWaitingApprovalFixture(
        client,
        tenantId,
      );
      const first = await decideApprovalRequest({
        client,
        tenantId,
        runId: created.runId,
        decision: "APPROVE",
      });

      expect(first.ok).toBe(true);

      const approvals = createPrismaApprovalRequestRepository(client);
      const approvalBefore = await approvals.findForRun({
        tenantId,
        governedRunId: created.runId,
      });
      const before = await countRunRecords(client, tenantId, created.runId);
      const second = await decideApprovalRequest({
        client,
        tenantId,
        runId: created.runId,
        decision: "REJECT",
      });
      const approvalAfter = await approvals.findForRun({
        tenantId,
        governedRunId: created.runId,
      });
      const after = await countRunRecords(client, tenantId, created.runId);

      expect(second.ok).toBe(false);
      expect(after).toEqual(before);
      expect(approvalAfter).toMatchObject({
        id: approvalBefore?.id,
        status: "APPROVED",
        decisionOutcome: "APPROVE",
        decisionReasonCode: "APPROVAL_ACCEPTED",
      });
      expect(approvalAfter?.decidedAt?.getTime()).toBe(
        approvalBefore?.decidedAt?.getTime(),
      );
    } finally {
      await client.$disconnect();
    }
  });

  it("creates exactly one pending approval request during the ensure step", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_3_ensure";

    try {
      const created = await createGovernedRequest({ client, tenantId });

      if (!created.ok) {
        throw new Error(created.safeReason);
      }

      const approvals = createPrismaApprovalRequestRepository(client);
      const beforeCount = await approvals.countForRun({
        tenantId,
        governedRunId: created.runId,
      });
      const first = await approvals.findOrCreateForRun({
        tenantId,
        governedRunId: created.runId,
      });
      const second = await approvals.findOrCreateForRun({
        tenantId,
        governedRunId: created.runId,
      });
      const afterCount = await approvals.countForRun({
        tenantId,
        governedRunId: created.runId,
      });

      expect(beforeCount).toBe(0);
      expect(first).toMatchObject({
        tenantId,
        governedRunId: created.runId,
        status: "PENDING",
        decisionOutcome: null,
        decidedAt: null,
      });
      expect(second?.id).toBe(first?.id);
      expect(afterCount).toBe(1);
    } finally {
      await client.$disconnect();
    }
  });
});
