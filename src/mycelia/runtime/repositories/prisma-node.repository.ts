import type { Node as PrismaNode, Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "../db/client";
import type { DbNodeKind } from "../graph/kind-mapping";

export type PrismaNodeRepositoryClient = Pick<PrismaClient, "node">;

export type CreateNodeInput = {
  readonly id: string;
  readonly projectId: string;
  readonly kind: DbNodeKind;
  readonly label: string;
  readonly positionX: number;
  readonly positionY: number;
  readonly data: string;
};

export function createPrismaNodeRepository(
  client: PrismaNodeRepositoryClient = prisma,
) {
  return {
    async createMany(inputs: readonly CreateNodeInput[]): Promise<PrismaNode[]> {
      const records: PrismaNode[] = [];

      for (const input of inputs) {
        records.push(
          await client.node.create({
            data: {
              id: input.id,
              projectId: input.projectId,
              kind: input.kind,
              label: input.label,
              positionX: input.positionX,
              positionY: input.positionY,
              data: input.data,
            },
          }),
        );
      }

      return records;
    },
    deleteForProject(input: { readonly projectId: string }): Promise<Prisma.BatchPayload> {
      return client.node.deleteMany({ where: { projectId: input.projectId } });
    },
    listForProject(input: { readonly projectId: string }): Promise<PrismaNode[]> {
      return client.node.findMany({
        where: { projectId: input.projectId },
        orderBy: { id: "asc" },
      });
    },
  };
}