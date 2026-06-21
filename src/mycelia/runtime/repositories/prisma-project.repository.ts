import type { PrismaClient, Project } from "@prisma/client";

import { prisma } from "../db/client";

export type ProjectTemplate = "sitemap" | "flowchart" | "erd" | "graph";

export type PrismaProjectRepositoryClient = Pick<PrismaClient, "project">;

export type CreateProjectInput = {
  readonly id: string;
  readonly workspaceId: string;
  readonly slug: string;
  readonly name: string;
  readonly description?: string | null;
  readonly template: ProjectTemplate;
};

export function createPrismaProjectRepository(
  client: PrismaProjectRepositoryClient = prisma,
) {
  return {
    create(input: CreateProjectInput): Promise<Project> {
      return client.project.create({
        data: {
          id: input.id,
          workspaceId: input.workspaceId,
          slug: input.slug,
          name: input.name,
          description: input.description ?? null,
          template: input.template,
        },
      });
    },
    findById(input: { readonly id: string }): Promise<Project | null> {
      return client.project.findUnique({ where: { id: input.id } });
    },
    findBySlug(input: {
      readonly workspaceId: string;
      readonly slug: string;
    }): Promise<Project | null> {
      return client.project.findUnique({
        where: {
          workspaceId_slug: {
            workspaceId: input.workspaceId,
            slug: input.slug,
          },
        },
      });
    },
    listForWorkspace(input: { readonly workspaceId: string }): Promise<Project[]> {
      return client.project.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { createdAt: "asc" },
      });
    },
  };
}