import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { resetDemoDatabase } from "../demo-reset";
import { seedDemoScenario } from "../demo-seed-scenario";
import { loadStudioGraph } from "./load-studio-graph";

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

async function applyMigrations(client: PrismaClient) {
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
  const root = mkdtempSync(join(tmpdir(), "mycelia-studio-"));
  const dbPath = join(root, "studio.sqlite");
  const client = new PrismaClient({
    datasources: {
      db: { url: sqliteUrl(dbPath) },
    },
  });

  tempRoots.push(root);
  await applyMigrations(client);

  return { client, dbPath };
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("Studio graph read model", () => {
  it("returns empty when the seeded workspace graph does not exist", async () => {
    const { client } = await createTempClient();

    try {
      await expect(loadStudioGraph({ client })).resolves.toEqual({ status: "EMPTY" });
    } finally {
      await client.$disconnect();
    }
  });

  it("loads the seeded workspace project graph through real SQLite", async () => {
    const { client } = await createTempClient();

    try {
      await seedDemoScenario({ client, tenantId: "tenant_studio_seed" });
      const result = await loadStudioGraph({ client });

      expect(result.status).toBe("READY");

      if (result.status !== "READY") {
        throw new Error("Expected Studio graph to be ready.");
      }

      expect(result.workspace).toMatchObject({
        slug: "acme-enterprise",
        name: "Acme Enterprise",
      });
      expect(result.project).toMatchObject({
        slug: "governed-run-lifecycle",
        template: "graph",
      });
      expect(result.snapshot.nodes.map((node) => node.label)).toEqual([
        "Request",
        "Policy",
        "Approval",
        "Audit",
        "Investigation",
      ]);
      expect(result.snapshot.edges).toHaveLength(4);
    } finally {
      await client.$disconnect();
    }
  });

  it("reset restores the seeded workspace graph", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_studio_reset";

    try {
      await seedDemoScenario({ client, tenantId });
      await client.workspace.create({
        data: {
          slug: "temporary-workspace",
          name: "Temporary Workspace",
        },
      });
      const reset = await resetDemoDatabase({ client, tenantId });
      const result = await loadStudioGraph({ client });

      expect(reset.ok).toBe(true);
      expect(await client.workspace.count()).toBe(2);
      expect(result.status).toBe("READY");

      if (result.status !== "READY") {
        throw new Error("Expected Studio graph after reset.");
      }

      expect(result.snapshot.nodes).toHaveLength(5);
      expect(result.snapshot.edges).toHaveLength(4);
    } finally {
      await client.$disconnect();
    }
  });
});
