import type { PrismaClient, RuntimeStateSnapshot } from "@prisma/client";

import { prisma } from "../db/client";

export type PrismaRuntimeStateRepositoryClient = Pick<
  PrismaClient,
  "runtimeStateSnapshot"
>;

export type CreateRuntimeStateSnapshotInput = {
  readonly id: string;
  readonly tenantId: string;
  readonly governedRunId: string;
  readonly state: string;
  readonly sequence: number;
  readonly reasonCode: string;
  readonly safeSummary: string;
};

export function createPrismaRuntimeStateRepository(
  client: PrismaRuntimeStateRepositoryClient = prisma,
) {
  return {
    createSnapshot(
      input: CreateRuntimeStateSnapshotInput,
    ): Promise<RuntimeStateSnapshot> {
      return client.runtimeStateSnapshot.create({
        data: {
          id: input.id,
          tenantId: input.tenantId,
          governedRunId: input.governedRunId,
          state: input.state,
          sequence: input.sequence,
          reasonCode: input.reasonCode,
          safeSummary: input.safeSummary,
        },
      });
    },
    listForRun(input: {
      readonly tenantId: string;
      readonly governedRunId: string;
    }): Promise<RuntimeStateSnapshot[]> {
      return client.runtimeStateSnapshot.findMany({
        where: {
          tenantId: input.tenantId,
          governedRunId: input.governedRunId,
        },
        orderBy: { sequence: "asc" },
      });
    },
  };
}