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

export type UpdateGovernedRunStateInput = {
  readonly tenantId: string;
  readonly id: string;
  readonly currentState: string;
  readonly status: string;
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
    async updateState(input: UpdateGovernedRunStateInput): Promise<GovernedRun> {
      const update = await client.governedRun.updateMany({
        where: {
          id: input.id,
          tenantId: input.tenantId,
        },
        data: {
          currentState: input.currentState,
          status: input.status,
        },
      });

      if (update.count !== 1) {
        throw new Error("Governed run state update failed closed.");
      }

      const record = await client.governedRun.findFirst({
        where: {
          id: input.id,
          tenantId: input.tenantId,
        },
      });

      if (record === null) {
        throw new Error("Governed run state update did not return a record.");
      }

      return record;
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
    countForTenant(input: { readonly tenantId: string }): Promise<number> {
      return client.governedRun.count({ where: { tenantId: input.tenantId } });
    },
    countByState(input: {
      readonly tenantId: string;
      readonly state: string;
    }): Promise<number> {
      return client.governedRun.count({
        where: {
          tenantId: input.tenantId,
          currentState: input.state,
          status: input.state,
        },
      });
    },
  };
}