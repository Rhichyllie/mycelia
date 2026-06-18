import type { GovernedRun, PrismaClient } from "@prisma/client";

import { prisma } from "../db/client";

export type PrismaGovernedRunRepositoryClient = Pick<
  PrismaClient,
  "governedRun"
>;

export type CreateGovernedRunInput = {
  readonly id: string;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly currentState: string;
  readonly status: string;
  readonly resourceRef: string;
  readonly requesterRef: string;
  readonly purpose: string;
};

export type TenantScopedRecordInput = {
  readonly tenantId: string;
  readonly id: string;
};

export type TenantScopedCorrelationInput = {
  readonly tenantId: string;
  readonly correlationId: string;
};

export function createPrismaGovernedRunRepository(
  client: PrismaGovernedRunRepositoryClient = prisma,
) {
  return {
    create(input: CreateGovernedRunInput): Promise<GovernedRun> {
      return client.governedRun.create({
        data: {
          id: input.id,
          tenantId: input.tenantId,
          correlationId: input.correlationId,
          currentState: input.currentState,
          status: input.status,
          resourceRef: input.resourceRef,
          requesterRef: input.requesterRef,
          purpose: input.purpose,
        },
      });
    },
    findById(input: TenantScopedRecordInput): Promise<GovernedRun | null> {
      return client.governedRun.findFirst({
        where: {
          id: input.id,
          tenantId: input.tenantId,
        },
      });
    },
    findByCorrelationId(
      input: TenantScopedCorrelationInput,
    ): Promise<GovernedRun | null> {
      return client.governedRun.findFirst({
        where: {
          tenantId: input.tenantId,
          correlationId: input.correlationId,
        },
      });
    },
    listRecent(input: {
      readonly tenantId: string;
      readonly take?: number;
    }): Promise<GovernedRun[]> {
      return client.governedRun.findMany({
        where: { tenantId: input.tenantId },
        orderBy: { createdAt: "desc" },
        take: input.take ?? 20,
      });
    },
  };
}
