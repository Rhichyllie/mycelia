import type {
  ExternalRef as PrismaExternalRef,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import { prisma } from "../db/client";
import type { DbExternalSystem } from "../graph/kind-mapping";

export type PrismaExternalRefRepositoryClient = Pick<PrismaClient, "externalRef">;

export type CreateExternalRefInput = {
  readonly id: string;
  readonly projectId: string;
  readonly nodeId?: string | null;
  readonly edgeId?: string | null;
  readonly system: DbExternalSystem;
  readonly externalId: string;
  readonly locator: string;
  readonly metadata: string;
};

export function createPrismaExternalRefRepository(
  client: PrismaExternalRefRepositoryClient = prisma,
) {
  return {
    async createMany(
      inputs: readonly CreateExternalRefInput[],
    ): Promise<PrismaExternalRef[]> {
      const records: PrismaExternalRef[] = [];

      for (const input of inputs) {
        records.push(
          await client.externalRef.create({
            data: {
              id: input.id,
              projectId: input.projectId,
              nodeId: input.nodeId ?? null,
              edgeId: input.edgeId ?? null,
              system: input.system,
              externalId: input.externalId,
              locator: input.locator,
              metadata: input.metadata,
            },
          }),
        );
      }

      return records;
    },
    deleteForProject(input: {
      readonly projectId: string;
    }): Promise<Prisma.BatchPayload> {
      return client.externalRef.deleteMany({ where: { projectId: input.projectId } });
    },
    listForProject(input: {
      readonly projectId: string;
    }): Promise<PrismaExternalRef[]> {
      return client.externalRef.findMany({
        where: { projectId: input.projectId },
        orderBy: { id: "asc" },
      });
    },
  };
}