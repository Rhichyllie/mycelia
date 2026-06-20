import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { getMyceliaDemoDatabaseConfig } from "./demo-config";
import { createPrismaAuditRepository } from "../repositories/prisma-audit.repository";
import { createPrismaGovernedRunRepository } from "../repositories/prisma-governed-run.repository";

const tempRoots: string[] = [];

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

function sqliteUrl(dbPath: string): string {
  return `file:${dbPath.replace(/\\/g, "/")}`;
}

function packageJson() {
  return JSON.parse(readFileSync(repoPath("package.json"), "utf8")) as {
    readonly scripts?: Record<string, string>;
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
  };
}

async function applyMinimalMigration(client: PrismaClient) {
  const migration = readFileSync(
    repoPath(
      "prisma",
      "migrations",
      "000001_minimal_runtime_slice",
      "migration.sql",
    ),
    "utf8",
  );

  const statements = migration
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await client.$executeRawUnsafe(statement);
  }
}

function createTempClient() {
  const root = mkdtempSync(join(tmpdir(), "mycelia-live1-"));
  const dbPath = join(root, "live1.sqlite");
  const client = new PrismaClient({
    datasources: {
      db: { url: sqliteUrl(dbPath) },
    },
  });

  tempRoots.push(root);

  return { client, dbPath };
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("LIVE-1 local demo database activation", () => {
  it("adds local DB scripts without changing guarded product commands", () => {
    const scripts = packageJson().scripts;

    expect(scripts?.["db:generate"]).toBe("prisma generate");
    expect(scripts?.["db:migrate"]).toBe("prisma migrate deploy");
    expect(scripts?.["db:seed"]).toBe("tsx prisma/seed.ts");
    expect(scripts?.["db:reset"]).toBe(
      "prisma migrate reset --force --skip-seed && pnpm db:seed",
    );
    expect(scripts?.["db:studio"]).toBe("prisma studio");
    expect(scripts?.dev).toBe("node scripts/phase0-guard.mjs dev");
    expect(scripts?.build).toBe("node scripts/phase0-guard.mjs build");
    expect(scripts?.start).toBe("node scripts/phase0-guard.mjs start");
  });

  it("documents safe local demo environment defaults", () => {
    const envExample = readFileSync(repoPath(".env.example"), "utf8");

    expect(envExample).toContain('DATABASE_URL="file:./dev.db"');
    expect(envExample).toContain('DEMO_TENANT="DEMO_TENANT"');
    expect(envExample).toContain('DEMO_APPROVER="DEMO_APPROVER"');
    expect(envExample).toContain('DEMO_MODE="true"');
    expect(getMyceliaDemoDatabaseConfig()).toMatchObject({
      tenantId: "DEMO_TENANT",
      approverRef: "DEMO_APPROVER",
      demoMode: true,
    });
  });

  it("keeps generated SQLite database files ignored", () => {
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

  it("creates and reads back a governed run through real SQLite", async () => {
    const { client } = createTempClient();

    try {
      await applyMinimalMigration(client);

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
        moment: "LOCAL_SQLITE_ROUNDTRIP",
        requirement: "LIVE_1_TEST",
        recordKindHint: "GOVERNED_RUN",
        reasonCode: "LIVE_1_SQLITE_ROUNDTRIP",
        safeSummary: "Real SQLite persistence was verified.",
        subjectRef: governedRunId,
        actorRef: "demo://actor/test",
      });

      const auditRecords = await audits.listForRun({ tenantId, governedRunId });

      expect(auditRecords).toHaveLength(1);
      expect(auditRecords[0]).toMatchObject({
        tenantId,
        governedRunId,
        reasonCode: "LIVE_1_SQLITE_ROUNDTRIP",
      });
    } finally {
      await client.$disconnect();
    }
  });
});

