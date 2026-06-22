import { afterEach, describe, expect, it } from "vitest";

import {
  createPostgresTestClient,
  dropPostgresTestSchema,
} from "../db/postgres-test-database";
import { seedDemoScenario } from "../demo-seed-scenario";
import { decideApprovalRequest } from "../governed-request/decide-approval-request";
import { createPrismaApprovalRequestRepository } from "../repositories/prisma-approval-request.repository";
import { getControlCenterSummary } from "./get-control-center-summary";

const testSchemas: string[] = [];

async function createTempClient() {
  const testDatabase = await createPostgresTestClient("mycelia_control_center");

  testSchemas.push(testDatabase.schema);
  return { client: testDatabase.client, schema: testDatabase.schema };
}

afterEach(async () => {
  for (const schema of testSchemas.splice(0)) {
    await dropPostgresTestSchema(schema);
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

  it("counts seeded and decided governed activity from PostgreSQL", async () => {
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
