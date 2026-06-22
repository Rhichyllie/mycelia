import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { resetDemoDatabase } from "./demo-reset";
import {
  DEMO_AUTH_ADMIN_DISPLAY_NAME,
  DEMO_SEED_GOVERNED_RUN_ID,
  seedDemoScenario,
} from "./demo-seed-scenario";
import { LIVE_DEMO_SCENARIO } from "./demo-scenario";
import { createGovernedRequest } from "./governed-request/create-governed-request";
import { decideApprovalRequest } from "./governed-request/decide-approval-request";
import { loadInvestigationTimeline } from "./investigation/load-investigation-timeline";
import { createPrismaApprovalRequestRepository } from "./repositories/prisma-approval-request.repository";
import { createPrismaDemoReadRepository } from "./repositories/prisma-demo-read.repository";

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
  const root = mkdtempSync(join(tmpdir(), "mycelia-live5-"));
  const dbPath = join(root, "live5.sqlite");
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

async function tenantCounts(client: PrismaClient, tenantId: string) {
  const [
    governedRuns,
    snapshots,
    policies,
    admissions,
    approvalRequests,
    audits,
    workspaces,
    projects,
    nodes,
    edges,
  ] = await Promise.all([
    client.governedRun.count({ where: { tenantId } }),
    client.runtimeStateSnapshot.count({ where: { tenantId } }),
    client.policyDecisionRecord.count({ where: { tenantId } }),
    client.admissionDecisionRecord.count({ where: { tenantId } }),
    client.approvalRequest.count({ where: { tenantId } }),
    client.auditRecord.count({ where: { tenantId } }),
    client.workspace.count({ where: { slug: "acme-enterprise" } }),
    client.project.count({ where: { slug: "governed-run-lifecycle" } }),
    client.node.count(),
    client.edge.count(),
  ]);

  return {
    governedRuns,
    snapshots,
    policies,
    admissions,
    approvalRequests,
    audits,
    workspaces,
    projects,
    nodes,
    edges,
  };
}

async function childCountsForRun(
  client: PrismaClient,
  tenantId: string,
  governedRunId: string,
) {
  const [snapshots, policies, admissions, approvalRequests, audits] =
    await Promise.all([
      client.runtimeStateSnapshot.count({ where: { tenantId, governedRunId } }),
      client.policyDecisionRecord.count({ where: { tenantId, governedRunId } }),
      client.admissionDecisionRecord.count({ where: { tenantId, governedRunId } }),
      client.approvalRequest.count({ where: { tenantId, governedRunId } }),
      client.auditRecord.count({ where: { tenantId, governedRunId } }),
    ]);

  return { snapshots, policies, admissions, approvalRequests, audits };
}

async function createAndDecideExtraRun(
  client: PrismaClient,
  tenantId: string,
): Promise<string> {
  const created = await createGovernedRequest({
    client,
    tenantId,
    scenarioKey: LIVE_DEMO_SCENARIO.scenarioKey,
  });

  if (!created.ok) {
    throw new Error(created.safeReason);
  }

  const approvalRequest = await createPrismaApprovalRequestRepository(
    client,
  ).findOrCreateForRun({ tenantId, governedRunId: created.runId });

  if (approvalRequest === null) {
    throw new Error("Expected approval request for extra run.");
  }

  const decision = await decideApprovalRequest({
    client,
    tenantId,
    runId: created.runId,
    decision: "APPROVE",
  });

  if (!decision.ok) {
    throw new Error(decision.safeReason);
  }

  return created.runId;
}

describe("LIVE-5 demo seed correction and reset", () => {
  it("seeds a coherent WAITING_APPROVAL scenario on an empty database", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_5_seed";

    try {
      const seed = await seedDemoScenario({ client, tenantId });
      const run = await client.governedRun.findFirst({
        where: { tenantId, id: seed.governedRunId },
      });

      expect(seed).toMatchObject({
        tenantId,
        governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
        currentState: "WAITING_APPROVAL",
        status: "WAITING_APPROVAL",
      });
      expect(run).toMatchObject({
        currentState: "WAITING_APPROVAL",
        status: "WAITING_APPROVAL",
        resourceRef: "fixture://documents/vendor-contract-review",
        requesterRef: "demo://actor/requester",
        purpose: "governed review of vendor contract fixture",
      });
      expect(await tenantCounts(client, tenantId)).toEqual({
        governedRuns: 1,
        snapshots: 2,
        policies: 1,
        admissions: 1,
        approvalRequests: 0,
        audits: 2,
        workspaces: 1,
        projects: 1,
        nodes: 5,
        edges: 4,
      });
      await expect(client.authIdentity.findFirst({
        where: {
          providerId: "credentials",
          subject: "admin@mycelia.local",
        },
        include: { user: true },
      })).resolves.toMatchObject({
        providerType: "development_credentials",
        emailAtLogin: "admin@mycelia.local",
        user: {
          emailNormalized: "admin@mycelia.local",
          displayName: DEMO_AUTH_ADMIN_DISPLAY_NAME,
          active: true,
        },
      });
    } finally {
      await client.$disconnect();
    }
  });

  it("makes the freshly seeded scenario available as a complete investigation timeline", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_5_seed_timeline";

    try {
      await seedDemoScenario({ client, tenantId });

      const timeline = await loadInvestigationTimeline({ client, tenantId });

      expect(timeline.status).toBe("READY");

      if (timeline.status !== "READY") {
        throw new Error("Expected seeded investigation timeline to be ready.");
      }

      expect(timeline.run).toMatchObject({
        id: DEMO_SEED_GOVERNED_RUN_ID,
        currentState: "WAITING_APPROVAL",
        status: "WAITING_APPROVAL",
      });
      expect(timeline.snapshots).toHaveLength(2);
      expect(timeline.policies).toHaveLength(1);
      expect(timeline.admission).toMatchObject({
        outcome: "APPROVAL_REQUIRED",
        lifecycleIntentHint: "WAITING_APPROVAL",
      });
      expect(timeline.audits).toHaveLength(2);
      expect(timeline.approvalRequest).toBeNull();
      expect(timeline.timeline).toHaveLength(6);
      expect(timeline.summary).toMatchObject({
        auditCount: 2,
        finalState: "WAITING_APPROVAL",
        humanDecisionRequired: true,
        humanDecisionOutcome: "pending",
      });
    } finally {
      await client.$disconnect();
    }
  });
  it("keeps seedDemoScenario idempotent", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_5_idempotent";

    try {
      await seedDemoScenario({ client, tenantId });
      await seedDemoScenario({ client, tenantId });

      expect(await tenantCounts(client, tenantId)).toEqual({
        governedRuns: 1,
        snapshots: 2,
        policies: 1,
        admissions: 1,
        approvalRequests: 0,
        audits: 2,
        workspaces: 1,
        projects: 1,
        nodes: 5,
        edges: 4,
      });
      expect(await client.authIdentity.count({
        where: {
          providerId: "credentials",
          subject: "admin@mycelia.local",
        },
      })).toBe(1);
    } finally {
      await client.$disconnect();
    }
  });

  it("resets all tenant rows in FK-safe order and restores only the seed", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_5_reset";

    try {
      await seedDemoScenario({ client, tenantId });
      const extraRunId = await createAndDecideExtraRun(client, tenantId);

      expect(await tenantCounts(client, tenantId)).toEqual({
        governedRuns: 2,
        snapshots: 5,
        policies: 2,
        admissions: 2,
        approvalRequests: 1,
        audits: 5,
        workspaces: 1,
        projects: 1,
        nodes: 5,
        edges: 4,
      });

      const reset = await resetDemoDatabase({ client, tenantId });

      expect(reset.ok).toBe(true);
      expect(await tenantCounts(client, tenantId)).toEqual({
        governedRuns: 1,
        snapshots: 2,
        policies: 1,
        admissions: 1,
        approvalRequests: 0,
        audits: 2,
        workspaces: 1,
        projects: 1,
        nodes: 5,
        edges: 4,
      });
      expect(await client.governedRun.findFirst({
        where: { tenantId, id: extraRunId },
      })).toBeNull();
      expect(await childCountsForRun(client, tenantId, extraRunId)).toEqual({
        snapshots: 0,
        policies: 0,
        admissions: 0,
        approvalRequests: 0,
        audits: 0,
      });
      expect(await client.governedRun.findFirst({
        where: { tenantId, id: DEMO_SEED_GOVERNED_RUN_ID },
      })).toMatchObject({
        currentState: "WAITING_APPROVAL",
        status: "WAITING_APPROVAL",
      });
    } finally {
      await client.$disconnect();
    }
  });

  it("makes the seeded run discoverable for approval and approval request creation", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_live_5_discoverable";

    try {
      await seedDemoScenario({ client, tenantId });

      const waitingRun = await createPrismaDemoReadRepository(
        client,
      ).findLatestWaitingApprovalRun({ tenantId });

      expect(waitingRun).not.toBeNull();
      expect(waitingRun?.run).toMatchObject({
        id: DEMO_SEED_GOVERNED_RUN_ID,
        currentState: "WAITING_APPROVAL",
        status: "WAITING_APPROVAL",
      });

      const approvalRequest = await createPrismaApprovalRequestRepository(
        client,
      ).findOrCreateForRun({
        tenantId,
        governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
      });

      expect(approvalRequest).toMatchObject({
        tenantId,
        governedRunId: DEMO_SEED_GOVERNED_RUN_ID,
        status: "PENDING",
        decisionOutcome: null,
        decidedAt: null,
      });
      expect(await client.approvalRequest.count({ where: { tenantId } })).toBe(1);
      expect(await client.workspace.count({ where: { slug: "acme-enterprise" } })).toBe(1);
      expect(await client.node.count()).toBe(5);
      expect(await client.edge.count()).toBe(4);
    } finally {
      await client.$disconnect();
    }
  });
});


