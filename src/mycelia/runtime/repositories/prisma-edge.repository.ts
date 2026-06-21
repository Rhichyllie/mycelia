import type { Edge as PrismaEdge, Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "../db/client";
import type { DbEdgeKind } from "../graph/kind-mapping";

export type PrismaEdgeRepositoryClient = Pick<PrismaClient, "edge">;

export type CreateEdgeInput = {
  readonly id: string;
  readonly projectId: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly kind: DbEdgeKind;
  readonly label?: string | null;
  readonly data: string;
};

export function createPrismaEdgeRepository(
  client: PrismaEdgeRepositoryClient = prisma,
) {
  return {
    async createMany(inputs: readonly CreateEdgeInput[]): Promise<PrismaEdge[]> {
      const records: PrismaEdge[] = [];

      for (const input of inputs) {
        records.push(
          await client.edge.create({
            data: {
              id: input.id,
              projectId: input.projectId,
              sourceNodeId: input.sourceNodeId,
              targetNodeId: input.targetNodeId,
              kind: input.kind,
              label: input.label ?? null,
              data: input.data,
            },
          }),
        );
      }

      return records;
    },
    deleteForProject(input: { readonly projectId: string }): Promise<Prisma.BatchPayload> {
      return client.edge.deleteMany({ where: { projectId: input.projectId } });
    },
    listForProject(input: { readonly projectId: string }): Promise<PrismaEdge[]> {
      return client.edge.findMany({
        where: { projectId: input.projectId },
        orderBy: { id: "asc" },
      });
    },
  };
}