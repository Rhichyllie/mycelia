import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { upsertAppUserByEmail } from "../auth/auth-user-store";
import { createPrismaProjectRepository } from "../repositories/prisma-project.repository";
import { createPrismaWorkspaceRepository } from "../repositories/prisma-workspace.repository";
import { createWorkspaceProject } from "./create-workspace-project";

const tempRoots: string[] = [];

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

function sqliteUrl(dbPath: string): string {
  return `file:${dbPath.replace(/\\/g, "/")}`;
}

async function applyMigrationFile(client: PrismaClient, path: string) {
  const migration = readFileSync(path, "utf8");
  const statements = migration
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await client.$executeRawUnsafe(statement);
  }
}

async function applyEngineMigrations(client: PrismaClient) {
  await applyMigrationFile(
    client,
    repoPath("prisma", "migrations", "000001_minimal_runtime_slice", "migration.sql"),
  );
  await applyMigrationFile(
    client,
    repoPath("prisma", "migrations", "000002_auth_foundation", "migration.sql"),
  );
  await applyMigrationFile(
    client,
    repoPath(
      "prisma",
      "migrations",
      "000003_workspace_graph_foundation",
      "migration.sql",
    ),
  );
}

async function createTempClient() {
  const root = mkdtempSync(join(tmpdir(), "mycelia-engine-workspace-"));
  const dbPath = join(root, "engine-workspace.sqlite");
  const client = new PrismaClient({
    datasources: {
      db: { url: sqliteUrl(dbPath) },
    },
  });

  tempRoots.push(root);
  await applyEngineMigrations(client);

  return { client, dbPath };
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("workspace project creation", () => {
  it("creates a workspace, first project, and owner membership atomically", async () => {
    const { client } = await createTempClient();

    try {
      const user = await upsertAppUserByEmail({
        client,
        email: "owner@example.com",
        displayName: "Owner User",
      });
      const result = await createWorkspaceProject({
        client,
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
      const workspace = await workspaces.findById({ id: result.workspaceId });
      const project = await projects.findById({ id: result.projectId });
      const membership = await workspaces.findMembership({
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
        email: "duplicate-owner@example.com",
        displayName: "Duplicate Owner",
      });
      const input = {
        client,
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