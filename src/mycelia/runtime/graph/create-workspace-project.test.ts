import { afterEach, describe, expect, it } from "vitest";

import { upsertAppUserByEmail } from "../auth/auth-user-store";
import {
  createPostgresTestClient,
  dropPostgresTestSchema,
} from "../db/postgres-test-database";
import { createPrismaProjectRepository } from "../repositories/prisma-project.repository";
import { createPrismaWorkspaceRepository } from "../repositories/prisma-workspace.repository";
import { createWorkspaceProject } from "./create-workspace-project";

const testSchemas: string[] = [];
const TENANT_ID = "tenant_engine_workspace_test";

async function createTempClient() {
  const testDatabase = await createPostgresTestClient("mycelia_engine_workspace");

  testSchemas.push(testDatabase.schema);
  return { client: testDatabase.client, schema: testDatabase.schema };
}

afterEach(async () => {
  for (const schema of testSchemas.splice(0)) {
    await dropPostgresTestSchema(schema);
  }
});

describe("workspace project creation", () => {
  it("creates a workspace, first project, and owner membership atomically", async () => {
    const { client } = await createTempClient();

    try {
      const user = await upsertAppUserByEmail({
        client,
        tenantId: TENANT_ID,
        email: "owner@example.com",
        displayName: "Owner User",
      });
      const result = await createWorkspaceProject({
        client,
        tenantId: TENANT_ID,
        userId: user.id,
        workspace: {
          slug: "ops-foundation",
          name: "Operations Foundation",
        },
        project: {
          slug: "pilot-graph",
          name: "Pilot Graph",
          description: "Initial graph project",
          template: "graph",
        },
      });

      expect(result.ok).toBe(true);

      if (!result.ok) {
        throw new Error(result.safeReason);
      }

      const workspaces = createPrismaWorkspaceRepository(client);
      const projects = createPrismaProjectRepository(client);
      const workspace = await workspaces.findById({
        tenantId: TENANT_ID,
        id: result.workspaceId,
      });
      const project = await projects.findById({
        tenantId: TENANT_ID,
        id: result.projectId,
      });
      const membership = await workspaces.findMembership({
        tenantId: TENANT_ID,
        workspaceId: result.workspaceId,
        userId: user.id,
      });

      expect(workspace).toMatchObject({
        slug: "ops-foundation",
        name: "Operations Foundation",
        ownerIdentity: "owner@example.com",
      });
      expect(project).toMatchObject({
        workspaceId: result.workspaceId,
        slug: "pilot-graph",
        template: "graph",
      });
      expect(membership).toMatchObject({
        id: result.membershipId,
        workspaceId: result.workspaceId,
        userId: user.id,
        role: "owner",
      });
    } finally {
      await client.$disconnect();
    }
  });

  it("fails closed on duplicate workspace slug without leaving partial rows", async () => {
    const { client } = await createTempClient();

    try {
      const user = await upsertAppUserByEmail({
        client,
        tenantId: TENANT_ID,
        email: "duplicate-owner@example.com",
        displayName: "Duplicate Owner",
      });
      const input = {
        client,
        tenantId: TENANT_ID,
        userId: user.id,
        workspace: {
          slug: "duplicate-workspace",
          name: "Duplicate Workspace",
        },
        project: {
          slug: "first-project",
          name: "First Project",
          template: "graph" as const,
        },
      };
      const first = await createWorkspaceProject(input);
      const second = await createWorkspaceProject({
        ...input,
        project: {
          slug: "second-project",
          name: "Second Project",
          template: "graph",
        },
      });

      expect(first.ok).toBe(true);
      expect(second).toMatchObject({
        ok: false,
        status: "FAILED_SAFE",
        reasonCode: "WORKSPACE_PROJECT_CREATE_FAILED",
      });
      expect(await client.workspace.count()).toBe(1);
      expect(await client.project.count()).toBe(1);
      expect(await client.workspaceMembership.count()).toBe(1);
    } finally {
      await client.$disconnect();
    }
  });
});
