import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { upsertAppUserByEmail } from "../auth/auth-user-store";
import type { GraphSnapshot } from "./canonical-graph";
import { createWorkspaceProject } from "./create-workspace-project";
import { validateGraphSnapshotInvariants } from "./graph-invariants";
import { loadGraphSnapshot } from "./load-graph-snapshot";
import { persistGraphSnapshot } from "./persist-graph-snapshot";

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
  for (const migration of [
    "000001_minimal_runtime_slice",
    "000002_auth_foundation",
    "000003_workspace_graph_foundation",
  ]) {
    await applyMigrationFile(
      client,
      repoPath("prisma", "migrations", migration, "migration.sql"),
    );
  }
}

async function createTempClient() {
  const root = mkdtempSync(join(tmpdir(), "mycelia-engine-load-"));
  const dbPath = join(root, "engine-load.sqlite");
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

async function createProject(client: PrismaClient) {
  const user = await upsertAppUserByEmail({
    client,
    email: `load-owner-${crypto.randomUUID()}@example.com`,
    displayName: "Load Owner",
  });
  const result = await createWorkspaceProject({
    client,
    userId: user.id,
    workspace: {
      slug: `load-workspace-${crypto.randomUUID()}`,
      name: "Load Workspace",
    },
    project: {
      slug: "load-graph",
      name: "Load Graph",
      template: "graph",
    },
  });

  if (!result.ok) {
    throw new Error(result.safeReason);
  }

  return result.projectId;
}

function graphSnapshot(projectId: string): GraphSnapshot {
  const firstNodeId = crypto.randomUUID();
  const secondNodeId = crypto.randomUUID();

  return {
    nodes: [
      {
        id: firstNodeId,
        projectId,
        kind: "page",
        label: "Request",
        position: { x: 100, y: 200 },
        data: { route: "/request" },
        externalRefs: [
          {
            id: crypto.randomUUID(),
            system: "postgres",
            externalId: "request-table",
            locator: { table: "requests" },
            metadata: { readonly: true },
          },
        ],
      },
      {
        id: secondNodeId,
        projectId,
        kind: "flow-step",
        label: "Decision",
        position: { x: 300, y: 200 },
        data: { gate: "approval" },
        externalRefs: [],
      },
    ],
    edges: [
      {
        id: crypto.randomUUID(),
        projectId,
        sourceNodeId: firstNodeId,
        targetNodeId: secondNodeId,
        kind: "flows-to",
        label: "moves to",
        data: { ordered: true },
        externalRefs: [],
      },
    ],
    viewport: { x: 10, y: 20, zoom: 1.5 },
  };
}

function normalizeSnapshot(snapshot: GraphSnapshot) {
  return {
    ...snapshot,
    nodes: [...snapshot.nodes].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...snapshot.edges].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

describe("graph snapshot loading", () => {
  it("loads null for a missing project", async () => {
    const { client } = await createTempClient();

    try {
      await expect(
        loadGraphSnapshot({ client, projectId: crypto.randomUUID() }),
      ).resolves.toBeNull();
    } finally {
      await client.$disconnect();
    }
  });

  it("round-trips a persisted graph into a valid domain snapshot", async () => {
    const { client } = await createTempClient();

    try {
      const projectId = await createProject(client);
      const snapshot = graphSnapshot(projectId);
      await persistGraphSnapshot({ client, projectId, snapshot });
      const loaded = await loadGraphSnapshot({
        client,
        projectId,
        viewport: snapshot.viewport,
      });

      expect(loaded).not.toBeNull();

      if (loaded === null) {
        throw new Error("Expected graph snapshot to load from SQLite.");
      }

      expect(validateGraphSnapshotInvariants(loaded)).toEqual(loaded);
      expect(normalizeSnapshot(loaded)).toEqual(normalizeSnapshot(snapshot));
    } finally {
      await client.$disconnect();
    }
  });
});