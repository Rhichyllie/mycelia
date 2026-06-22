import type { PrismaClient } from "@prisma/client";

import { prisma } from "../db/client";
import { getMyceliaDemoDatabaseConfig } from "../db/demo-config";
import { createPrismaApprovalRequestRepository } from "../repositories/prisma-approval-request.repository";
import { createPrismaAuditRepository } from "../repositories/prisma-audit.repository";
import { createPrismaGovernedRunRepository } from "../repositories/prisma-governed-run.repository";

export type ControlCenterRunStateCounts = {
  readonly waitingApproval: number;
  readonly approved: number;
  readonly rejected: number;
  readonly completed: number;
};

export type ControlCenterSummary = {
  readonly tenantId: string;
  readonly totalRuns: number;
  readonly runsByState: ControlCenterRunStateCounts;
  readonly pendingApprovals: number;
  readonly auditEvents: number;
  readonly workspaces: number;
};

export type GetControlCenterSummaryInput = {
  readonly client?: PrismaClient;
  readonly tenantId?: string;
};

export async function getControlCenterSummary(
  input: GetControlCenterSummaryInput = {},
): Promise<ControlCenterSummary> {
  const client = input.client ?? prisma;
  const tenantId = input.tenantId ?? getMyceliaDemoDatabaseConfig().tenantId;
  const runs = createPrismaGovernedRunRepository(client);
  const approvals = createPrismaApprovalRequestRepository(client);
  const audits = createPrismaAuditRepository(client);
  const [
    totalRuns,
    waitingApproval,
    approved,
    rejected,
    completed,
    pendingApprovals,
    auditEvents,
    workspaceCount,
  ] = await Promise.all([
    runs.countForTenant({ tenantId }),
    runs.countByState({ tenantId, state: "WAITING_APPROVAL" }),
    runs.countByState({ tenantId, state: "APPROVED" }),
    runs.countByState({ tenantId, state: "REJECTED" }),
    runs.countByState({ tenantId, state: "COMPLETED" }),
    approvals.countPendingForTenant({ tenantId }),
    audits.countForTenant({ tenantId }),
    client.workspace.count({ where: { tenantId } }),
  ]);

  return {
    tenantId,
    totalRuns,
    runsByState: {
      waitingApproval,
      approved,
      rejected,
      completed,
    },
    pendingApprovals,
    auditEvents,
    workspaces: workspaceCount,
  };
}
