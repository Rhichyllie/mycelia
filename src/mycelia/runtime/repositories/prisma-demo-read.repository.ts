import type {
  AdmissionDecisionRecord,
  GovernedRun,
  PolicyDecisionRecord,
  PrismaClient,
  RuntimeStateSnapshot,
} from "@prisma/client";

import { prisma } from "../db/client";
import { createPrismaAdmissionRepository } from "./prisma-admission.repository";
import { createPrismaAuditRepository } from "./prisma-audit.repository";
import { createPrismaGovernedRunRepository } from "./prisma-governed-run.repository";
import { createPrismaPolicyRepository } from "./prisma-policy.repository";
import { createPrismaRuntimeStateRepository } from "./prisma-runtime-state.repository";

export type PrismaDemoReadRepositoryClient = Pick<
  PrismaClient,
  | "admissionDecisionRecord"
  | "auditRecord"
  | "governedRun"
  | "policyDecisionRecord"
  | "runtimeStateSnapshot"
>;

export type DemoPersistedRunSummary = {
  readonly run: GovernedRun;
  readonly latestPolicy: PolicyDecisionRecord | null;
  readonly latestAdmission: AdmissionDecisionRecord | null;
  readonly latestSnapshot: RuntimeStateSnapshot | null;
  readonly auditCount: number;
};

export function createPrismaDemoReadRepository(
  client: PrismaDemoReadRepositoryClient = prisma,
) {
  const runs = createPrismaGovernedRunRepository(client);
  const policy = createPrismaPolicyRepository(client);
  const admission = createPrismaAdmissionRepository(client);
  const state = createPrismaRuntimeStateRepository(client);
  const audit = createPrismaAuditRepository(client);

  async function summarizeRun(
    tenantId: string,
    run: GovernedRun,
  ): Promise<DemoPersistedRunSummary> {
    const [latestPolicy, latestAdmission, snapshots, auditCount] =
      await Promise.all([
        policy.findLatestForRun({ tenantId, governedRunId: run.id }),
        admission.findLatestForRun({ tenantId, governedRunId: run.id }),
        state.listForRun({ tenantId, governedRunId: run.id }),
        audit.countForRun({ tenantId, governedRunId: run.id }),
      ]);

    return {
      run,
      latestPolicy,
      latestAdmission,
      latestSnapshot: snapshots.at(-1) ?? null,
      auditCount,
    };
  }

  async function findLatestRunByState(input: {
    readonly tenantId: string;
    readonly states: readonly string[];
  }): Promise<DemoPersistedRunSummary | null> {
    const run = await client.governedRun.findFirst({
      where: {
        tenantId: input.tenantId,
        currentState: { in: [...input.states] },
        status: { in: [...input.states] },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    if (run === null) {
      return null;
    }

    return summarizeRun(input.tenantId, run);
  }

  return {
    async findLatestRun(input: {
      readonly tenantId: string;
    }): Promise<DemoPersistedRunSummary | null> {
      const [run] = await runs.listRecent({ tenantId: input.tenantId, take: 1 });

      if (run === undefined) {
        return null;
      }

      return summarizeRun(input.tenantId, run);
    },
    async findRunById(input: {
      readonly tenantId: string;
      readonly runId: string;
    }): Promise<DemoPersistedRunSummary | null> {
      const run = await runs.findById({
        tenantId: input.tenantId,
        id: input.runId,
      });

      if (run === null) {
        return null;
      }

      return summarizeRun(input.tenantId, run);
    },
    findLatestWaitingApprovalRun(input: {
      readonly tenantId: string;
    }): Promise<DemoPersistedRunSummary | null> {
      return findLatestRunByState({
        tenantId: input.tenantId,
        states: ["WAITING_APPROVAL"],
      });
    },
    findLatestDecidedApprovalRun(input: {
      readonly tenantId: string;
    }): Promise<DemoPersistedRunSummary | null> {
      return findLatestRunByState({
        tenantId: input.tenantId,
        states: ["APPROVED", "REJECTED"],
      });
    },
  };
}
