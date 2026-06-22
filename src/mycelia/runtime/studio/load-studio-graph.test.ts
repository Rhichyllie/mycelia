import { afterEach, describe, expect, it } from "vitest";

import {
  createPostgresTestClient,
  dropPostgresTestSchema,
} from "../db/postgres-test-database";
import { resetDemoDatabase } from "../demo-reset";
import { seedDemoScenario } from "../demo-seed-scenario";
import { getMyceliaDemoDatabaseConfig } from "../db/demo-config";
import { loadStudioGraph } from "./load-studio-graph";

const testSchemas: string[] = [];
const TENANT_ID = getMyceliaDemoDatabaseConfig().tenantId;

async function createTempClient() {
  const testDatabase = await createPostgresTestClient("mycelia_studio");

  testSchemas.push(testDatabase.schema);
  return { client: testDatabase.client, schema: testDatabase.schema };
}

afterEach(async () => {
  for (const schema of testSchemas.splice(0)) {
    await dropPostgresTestSchema(schema);
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

  it("loads the seeded workspace project graph through real PostgreSQL", async () => {
    const { client } = await createTempClient();

    try {
      await seedDemoScenario({ client, tenantId: TENANT_ID });
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

    try {
      await seedDemoScenario({ client, tenantId: TENANT_ID });
      await client.workspace.create({
        data: {
          tenantId: TENANT_ID,
          slug: "temporary-workspace",
          name: "Temporary Workspace",
        },
      });
      const reset = await resetDemoDatabase({ client, tenantId: TENANT_ID });
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
