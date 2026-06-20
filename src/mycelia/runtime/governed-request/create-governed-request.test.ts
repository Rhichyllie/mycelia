import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { createGovernedRequest } from "./create-governed-request";
import { createPrismaAdmissionRepository } from "../repositories/prisma-admission.repository";
import { createPrismaAuditRepository } from "../repositories/prisma-audit.repository";
import { createPrismaGovernedRunRepository } from "../repositories/prisma-governed-run.repository";
import { createPrismaPolicyRepository } from "../repositories/prisma-policy.repository";
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
  const root = mkdtempSync(join(tmpdir(), "mycelia-live2-"));
  const dbPath = join(root, "live2.sqlite");
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

describe("LIVE-2 governed request creation write path", () => {
  it("persists a medium-risk governed request through real SQLite", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_2";

    try {
      const result = await createGovernedRequest({ client, tenantId });

      expect(result).toMatchObject({
        ok: true,
        currentState: "WAITING_APPROVAL",
        status: "WAITING_APPROVAL",
        riskLevel: "MEDIUM",
        admissionOutcome: "APPROVAL_REQUIRED",
        lifecycleIntentHint: "WAITING_APPROVAL",
        auditCount: 2,
      });

      if (!result.ok) {
        throw new Error(result.safeReason);
      }

      const runs = createPrismaGovernedRunRepository(client);
      const states = createPrismaRuntimeStateRepository(client);
      const audits = createPrismaAuditRepository(client);
      const policies = createPrismaPolicyRepository(client);
      const admissions = createPrismaAdmissionRepository(client);

      const run = await runs.findById({ tenantId, id: result.runId });
      const snapshots = await states.listForRun({
        tenantId,
        governedRunId: result.runId,
      });
      const auditRecords = await audits.listForRun({
        tenantId,
        governedRunId: result.runId,
      });
      const policy = await policies.findLatestForRun({
        tenantId,
        governedRunId: result.runId,
      });
      const admission = await admissions.findLatestForRun({
        tenantId,
        governedRunId: result.runId,
      });

      expect(run).toMatchObject({
        id: result.runId,
        tenantId,
        correlationId: result.correlationId,
        currentState: "WAITING_APPROVAL",
        status: "WAITING_APPROVAL",
        resourceRef: "fixture://documents/vendor-contract-review",
        requesterRef: "demo://actor/requester",
        purpose: "governed review of vendor contract fixture",
      });
      expect(snapshots.map((snapshot) => snapshot.state)).toEqual([
        "CREATED",
        "WAITING_APPROVAL",
      ]);
      expect(snapshots.map((snapshot) => snapshot.reasonCode)).toEqual([
        "RUN_CREATED",
        "POLICY_REQUIRES_APPROVAL",
      ]);
      expect(auditRecords.map((record) => record.reasonCode)).toEqual([
        "RUN_CREATED",
        "POLICY_EVALUATED",
      ]);
      expect(policy).toMatchObject({
        tenantId,
        governedRunId: result.runId,
        riskLevel: "MEDIUM",
        policyRef: "fixture://policy/vendor-contract-review-medium-risk",
      });
      expect(admission).toMatchObject({
        tenantId,
        governedRunId: result.runId,
        outcome: "APPROVAL_REQUIRED",
        lifecycleIntentHint: "WAITING_APPROVAL",
      });
    } finally {
      await client.$disconnect();
    }
  });

  it("creates distinct runs and correlation ids for two clicks", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_2_distinct";

    try {
      const first = await createGovernedRequest({ client, tenantId });
      const second = await createGovernedRequest({ client, tenantId });

      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);

      if (!first.ok || !second.ok) {
        throw new Error("Expected both governed request creations to succeed.");
      }

      expect(first.runId).not.toBe(second.runId);
      expect(first.correlationId).not.toBe(second.correlationId);

      const runs = await createPrismaGovernedRunRepository(client).listRecent({
        tenantId,
        take: 5,
      });

      expect(runs).toHaveLength(2);
      expect(new Set(runs.map((run) => run.correlationId)).size).toBe(2);
    } finally {
      await client.$disconnect();
    }
  });

  it("does not store raw document-like content in persisted fields", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_2_raw_guard";

    try {
      const result = await createGovernedRequest({ client, tenantId });

      expect(result.ok).toBe(true);

      if (!result.ok) {
        throw new Error(result.safeReason);
      }

      const persisted = await client.governedRun.findFirst({
        where: { tenantId, id: result.runId },
        include: {
          runtimeStateSnapshots: true,
          policyDecisionRecords: true,
          admissionDecisions: true,
          auditRecords: true,
        },
      });
      const text = JSON.stringify(persisted);

      expect(text).not.toMatch(/rawDocument|documentContent|rawContent/i);
      expect(text).not.toMatch(/fileBlob|binary|payload|privateKey|secret/i);
      expect(text).not.toMatch(/contract body|document bytes|source material/i);
    } finally {
      await client.$disconnect();
    }
  });
});