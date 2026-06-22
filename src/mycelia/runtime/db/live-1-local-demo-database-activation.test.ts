import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createPostgresTestClient,
  dropPostgresTestSchema,
} from "./postgres-test-database";
import { getMyceliaDemoDatabaseConfig } from "./demo-config";
import { createPrismaAuditRepository } from "../repositories/prisma-audit.repository";
import { createPrismaGovernedRunRepository } from "../repositories/prisma-governed-run.repository";

const testSchemas: string[] = [];

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

function packageJson() {
  return JSON.parse(readFileSync(repoPath("package.json"), "utf8")) as {
    readonly scripts?: Record<string, string>;
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
  };
}

async function createTempClient() {
  const testDatabase = await createPostgresTestClient("mycelia_live1");

  testSchemas.push(testDatabase.schema);
  return { client: testDatabase.client, schema: testDatabase.schema };
}

afterEach(async () => {
  for (const schema of testSchemas.splice(0)) {
    await dropPostgresTestSchema(schema);
  }
});

describe("LIVE-1 local demo database activation", () => {
  it("adds local DB scripts and activates standard product commands", () => {
    const scripts = packageJson().scripts;

    expect(scripts?.["db:generate"]).toBe("prisma generate");
    expect(scripts?.["db:migrate"]).toBe("prisma migrate deploy");
    expect(scripts?.["db:seed"]).toBe("tsx prisma/seed.ts");
    expect(scripts?.["db:reset"]).toBe(
      "prisma migrate reset --force --skip-seed && pnpm db:seed",
    );
    expect(scripts?.["db:studio"]).toBe("prisma studio");
    expect(scripts?.["docker:up"]).toBe("docker compose up -d");
    expect(scripts?.["docker:down"]).toBe("docker compose down");
    expect(scripts?.["docker:reset"]).toBe(
      "docker compose down -v && docker compose up -d",
    );
    expect(scripts?.dev).toBe("next dev");
    expect(scripts?.build).toBe("next build");
    expect(scripts?.start).toBe("next start");
    expect(scripts?.["demo:local"]).toBeUndefined();
  });

  it("documents safe local demo environment defaults", () => {
    const envExample = readFileSync(repoPath(".env.example"), "utf8");

    expect(envExample).toContain(
      'DATABASE_URL="postgresql://mycelia:mycelia_dev@localhost:5432/mycelia"',
    );
    expect(envExample).toContain(
      'TEST_DATABASE_URL="postgresql://mycelia:mycelia_dev@localhost:5432/mycelia_test"',
    );
    expect(envExample).toContain('MYCELIA_POSTGRES_PORT="5432"');
    expect(envExample).toContain('DEMO_TENANT="DEMO_TENANT"');
    expect(envExample).toContain('DEMO_APPROVER="DEMO_APPROVER"');
    expect(envExample).toContain('DEMO_MODE="true"');
    expect(getMyceliaDemoDatabaseConfig()).toMatchObject({
      tenantId: "DEMO_TENANT",
      approverRef: "DEMO_APPROVER",
      demoMode: true,
    });
  });

  it("keeps generated local file database artifacts ignored", () => {
    for (const file of [
      "prisma/dev.db",
      "prisma/dev.db-journal",
      "prisma/local-test.db",
      "local-test.sqlite",
      "local-test.sqlite3",
    ]) {
      expect(
        execFileSync("git", ["check-ignore", file], { encoding: "utf8" })
          .trim(),
      ).toBe(file);
    }

    const lockStatus = execFileSync(
      "git",
      ["status", "--short", "--", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(lockStatus.trim()).toBe("");
  });

  it("creates and reads back a governed run through real PostgreSQL", async () => {
    const { client } = await createTempClient();

    try {
      const tenantId = "tenant_live_1";
      const governedRunId = "run_live_1_roundtrip";
      const runs = createPrismaGovernedRunRepository(client);
      const audits = createPrismaAuditRepository(client);

      await runs.create({
        id: governedRunId,
        tenantId,
        correlationId: "live_1_roundtrip",
        currentState: "WAITING_APPROVAL",
        status: "WAITING_APPROVAL",
        resourceRef: "fixture://documents/vendor-contract-review",
        requesterRef: "demo://actor/requester",
        purpose:
          "Governed review of a vendor contract fixture before AI-assisted operational action",
      });

      const found = await runs.findById({ tenantId, id: governedRunId });

      expect(found).toMatchObject({
        id: governedRunId,
        tenantId,
        currentState: "WAITING_APPROVAL",
        status: "WAITING_APPROVAL",
        resourceRef: "fixture://documents/vendor-contract-review",
        requesterRef: "demo://actor/requester",
        purpose:
          "Governed review of a vendor contract fixture before AI-assisted operational action",
      });

      await audits.create({
        id: "audit_live_1_roundtrip",
        tenantId,
        governedRunId,
        moment: "LOCAL_POSTGRES_ROUNDTRIP",
        requirement: "LIVE_1_TEST",
        recordKindHint: "GOVERNED_RUN",
        reasonCode: "LIVE_1_POSTGRES_ROUNDTRIP",
        safeSummary: "Real PostgreSQL persistence was verified.",
        subjectRef: governedRunId,
        actorRef: "demo://actor/test",
      });

      const auditRecords = await audits.listForRun({ tenantId, governedRunId });

      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0]).toMatchObject({
        tenantId,
        governedRunId,
        reasonCode: "LIVE_1_POSTGRES_ROUNDTRIP",
      });
    } finally {
      await client.$disconnect();
    }
  });
});

