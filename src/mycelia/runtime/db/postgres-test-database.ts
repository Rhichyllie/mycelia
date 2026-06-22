import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";

const DEFAULT_TEST_DATABASE_URL =
  "postgresql://mycelia:mycelia_dev@localhost:5432/mycelia_test";
const TEST_DATABASE_BOOTSTRAP_LOCK_ID = 774921300;

function migrationPath(...segments: string[]): string {
  return join(process.cwd(), "prisma", "migrations", ...segments);
}

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe PostgreSQL identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

function withSchema(databaseUrl: string, schema: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.set("schema", schema);
  return url.toString();
}

function withDatabase(databaseUrl: string, database: string): string {
  const url = new URL(databaseUrl);
  url.pathname = `/${database}`;
  url.searchParams.delete("schema");
  return url.toString();
}

function databaseName(databaseUrl: string): string {
  const name = new URL(databaseUrl).pathname.replace(/^\//, "");

  if (!name) {
    throw new Error("PostgreSQL test URL must include a database name.");
  }

  return decodeURIComponent(name);
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
}

export function resolvePostgresTestDatabaseUrl(): string {
  return (
    process.env.TEST_DATABASE_URL ??
    process.env.DATABASE_URL ??
    DEFAULT_TEST_DATABASE_URL
  );
}

async function ensurePostgresTestDatabaseExists(
  testDatabaseUrl: string,
): Promise<void> {
  const targetDatabase = databaseName(testDatabaseUrl);
  const appDatabaseUrl = process.env.DATABASE_URL ?? withDatabase(testDatabaseUrl, "mycelia");
  const appDatabase = databaseName(appDatabaseUrl);

  if (targetDatabase === appDatabase) {
    return;
  }

  const admin = new PrismaClient({
    datasources: {
      db: { url: withSchema(appDatabaseUrl, "public") },
    },
  });

  try {
    await admin.$queryRawUnsafe(
      `SELECT pg_advisory_lock(${TEST_DATABASE_BOOTSTRAP_LOCK_ID})::text AS "locked"`,
    );

    const exists = await admin.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${quoteLiteral(
        targetDatabase,
      )}) AS "exists"`,
    );

    if (!exists[0]?.exists) {
      await admin.$executeRawUnsafe(
        `CREATE DATABASE ${quoteIdentifier(targetDatabase)}`,
      );
    }
  } finally {
    await admin.$queryRawUnsafe(
      `SELECT pg_advisory_unlock(${TEST_DATABASE_BOOTSTRAP_LOCK_ID})::text AS "unlocked"`,
    );
    await admin.$disconnect();
  }
}

export async function applyPostgresBaselineMigration(
  client: PrismaClient,
): Promise<void> {
  const migration = readFileSync(
    migrationPath("000001_postgres_baseline", "migration.sql"),
    "utf8",
  );

  for (const statement of splitSqlStatements(migration)) {
    await client.$executeRawUnsafe(statement);
  }
}

export async function createPostgresTestClient(prefix: string): Promise<{
  readonly client: PrismaClient;
  readonly schema: string;
}> {
  const databaseUrl = resolvePostgresTestDatabaseUrl();
  await ensurePostgresTestDatabaseExists(databaseUrl);
  const schema = `${prefix}_${crypto.randomUUID().replaceAll("-", "_")}`;
  const admin = new PrismaClient({
    datasources: { db: { url: withSchema(databaseUrl, "public") } },
  });

  await admin.$executeRawUnsafe(`CREATE SCHEMA ${quoteIdentifier(schema)}`);
  await admin.$disconnect();

  const client = new PrismaClient({
    datasources: { db: { url: withSchema(databaseUrl, schema) } },
  });

  await applyPostgresBaselineMigration(client);

  return { client, schema };
}

export async function dropPostgresTestSchema(schema: string): Promise<void> {
  const admin = new PrismaClient({
    datasources: {
      db: { url: withSchema(resolvePostgresTestDatabaseUrl(), "public") },
    },
  });

  try {
    await admin.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS ${quoteIdentifier(schema)} CASCADE`,
    );
  } finally {
    await admin.$disconnect();
  }
}
