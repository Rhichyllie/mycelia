import type { AppUser, PrismaClient, Workspace, WorkspaceMembership } from "@prisma/client";

import { prisma } from "../db/client";

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export type PrismaWorkspaceRepositoryClient = Pick<
  PrismaClient,
  "appUser" | "workspace" | "workspaceMembership"
>;

export type CreateWorkspaceInput = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly ownerIdentity?: string | null;
};

export type CreateWorkspaceMembershipInput = {
  readonly id: string;
  readonly workspaceId: string;
  readonly userId: string;
  readonly role: WorkspaceRole;
};

export function createPrismaWorkspaceRepository(
  client: PrismaWorkspaceRepositoryClient = prisma,
) {
  return {
    findActiveUserById(input: { readonly userId: string }): Promise<AppUser | null> {
      return client.appUser.findFirst({
        where: {
          id: input.userId,
          active: true,
        },
      });
    },
    create(input: CreateWorkspaceInput): Promise<Workspace> {
      return client.workspace.create({
        data: {
          id: input.id,
          slug: input.slug,
          name: input.name,
          ownerIdentity: input.ownerIdentity ?? null,
        },
      });
    },
    findById(input: { readonly id: string }): Promise<Workspace | null> {
      return client.workspace.findUnique({ where: { id: input.id } });
    },
    findBySlug(input: { readonly slug: string }): Promise<Workspace | null> {
      return client.workspace.findUnique({ where: { slug: input.slug } });
    },
    createMembership(
      input: CreateWorkspaceMembershipInput,
    ): Promise<WorkspaceMembership> {
      return client.workspaceMembership.create({
        data: {
          id: input.id,
          workspaceId: input.workspaceId,
          userId: input.userId,
          role: input.role,
        },
      });
    },
    findMembership(input: {
      readonly workspaceId: string;
      readonly userId: string;
    }): Promise<WorkspaceMembership | null> {
      return client.workspaceMembership.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: input.workspaceId,
            userId: input.userId,
          },
        },
      });
    },
  };
}