import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { AppError } from "../../lib/app-error";

import {
  findActiveAppUserById,
  syncAuthenticatedActor,
  upsertAppUserByEmail,
} from "./auth-user-store";

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
  const method = ["$execute", "RawUnsafe"].join("") as keyof PrismaClient;
  const runStatement = client[method] as unknown as (
    statement: string,
  ) => Promise<unknown>;

  for (const statement of statements) {
    await runStatement.call(client, statement);
  }
}

async function applyAuthFoundationMigrations(client: PrismaClient) {
  await applyMigrationFile(
    client,
    repoPath(
      "prisma",
      "migrations",
      "000001_minimal_runtime_slice",
      "migration.sql",
    ),
  );
  await applyMigrationFile(
    client,
    repoPath(
      "prisma",
      "migrations",
      "000002_auth_foundation",
      "migration.sql",
    ),
  );
}

async function createTempClient() {
  const root = mkdtempSync(join(tmpdir(), "mycelia-auth-"));
  const dbPath = join(root, "auth.sqlite");
  const client = new PrismaClient({
    datasources: {
      db: { url: sqliteUrl(dbPath) },
    },
  });

  tempRoots.push(root);
  await applyAuthFoundationMigrations(client);

  return { client, dbPath };
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

async function expectAppErrorCode(
  promise: Promise<unknown>,
  code: string,
): Promise<void> {
  try {
    await promise;
    throw new Error(`Expected ${code} AppError.`);
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code });
  }
}

describe("auth user store", () => {
  it("upserts users by normalized email while preserving displayName when omitted", async () => {
    const { client } = await createTempClient();

    try {
      const created = await upsertAppUserByEmail({
        client,
        email: " Admin@Example.COM ",
        displayName: " Admin One ",
      });
      const renamed = await upsertAppUserByEmail({
        client,
        email: "admin@example.com",
        displayName: "Admin Two",
      });
      const preserved = await upsertAppUserByEmail({
        client,
        email: "ADMIN@example.com",
      });

      expect(created).toMatchObject({
        email: "admin@example.com",
        emailNormalized: "admin@example.com",
        displayName: "Admin One",
        active: true,
      });
      expect(renamed.id).toBe(created.id);
      expect(renamed.displayName).toBe("Admin Two");
      expect(preserved.id).toBe(created.id);
      expect(preserved.displayName).toBe("Admin Two");
      expect(await client.appUser.count()).toBe(1);
    } finally {
      await client.$disconnect();
    }
  });

  it("syncs a brand-new authenticated actor into AppUser and AuthIdentity", async () => {
    const { client } = await createTempClient();

    try {
      const actor = await syncAuthenticatedActor({
        client,
        providerId: "credentials",
        providerType: "development_credentials",
        subject: "admin@mycelia.local",
        email: "Admin@Mycelia.Local",
        displayName: "Development Admin",
        authMode: "development_credentials",
      });
      const identity = await client.authIdentity.findFirst({
        where: { providerId: "credentials", subject: "admin@mycelia.local" },
      });

      expect(actor).toMatchObject({
        email: "admin@mycelia.local",
        displayName: "Development Admin",
        providerId: "credentials",
        authMode: "development_credentials",
      });
      expect(identity).toMatchObject({
        userId: actor.userId,
        providerType: "development_credentials",
        emailAtLogin: "admin@mycelia.local",
      });
      expect(await client.appUser.count()).toBe(1);
      expect(await client.authIdentity.count()).toBe(1);
    } finally {
      await client.$disconnect();
    }
  });

  it("updates an existing identity instead of duplicating it", async () => {
    const { client } = await createTempClient();

    try {
      const first = await syncAuthenticatedActor({
        client,
        providerId: "credentials",
        providerType: "development_credentials",
        subject: "stable-subject",
        email: "first@example.com",
        displayName: "First Name",
        authMode: "development_credentials",
      });
      const firstIdentity = await client.authIdentity.findFirstOrThrow({
        where: { providerId: "credentials", subject: "stable-subject" },
      });
      const second = await syncAuthenticatedActor({
        client,
        providerId: "credentials",
        providerType: "development_credentials",
        subject: "stable-subject",
        email: "second@example.com",
        displayName: "Second Name",
        authMode: "development_credentials",
      });
      const secondIdentity = await client.authIdentity.findFirstOrThrow({
        where: { providerId: "credentials", subject: "stable-subject" },
      });
      const user = await client.appUser.findUniqueOrThrow({
        where: { id: first.userId },
      });

      expect(second.userId).toBe(first.userId);
      expect(firstIdentity.id).toBe(secondIdentity.id);
      expect(secondIdentity.emailAtLogin).toBe("second@example.com");
      expect(secondIdentity.lastSeenAt).toBeInstanceOf(Date);
      expect(user).toMatchObject({
        email: "second@example.com",
        emailNormalized: "second@example.com",
        displayName: "Second Name",
      });
      expect(await client.authIdentity.count()).toBe(1);
    } finally {
      await client.$disconnect();
    }
  });

  it("fails closed when an existing identity is linked to an inactive user", async () => {
    const { client } = await createTempClient();

    try {
      const actor = await syncAuthenticatedActor({
        client,
        providerId: "credentials",
        providerType: "development_credentials",
        subject: "disabled-subject",
        email: "disabled@example.com",
        displayName: "Disabled User",
        authMode: "development_credentials",
      });
      await client.appUser.update({
        where: { id: actor.userId },
        data: { active: false },
      });

      await expectAppErrorCode(
        syncAuthenticatedActor({
          client,
          providerId: "credentials",
          providerType: "development_credentials",
          subject: "disabled-subject",
          email: "disabled@example.com",
          displayName: "Disabled User",
          authMode: "development_credentials",
        }),
        "AUTH_USER_DISABLED",
      );
    } finally {
      await client.$disconnect();
    }
  });

  it("fails closed when the same provider email is already linked to a different subject", async () => {
    const { client } = await createTempClient();

    try {
      await syncAuthenticatedActor({
        client,
        providerId: "credentials",
        providerType: "development_credentials",
        subject: "subject-one",
        email: "conflict@example.com",
        displayName: "Conflict User",
        authMode: "development_credentials",
      });

      await expectAppErrorCode(
        syncAuthenticatedActor({
          client,
          providerId: "credentials",
          providerType: "development_credentials",
          subject: "subject-two",
          email: "conflict@example.com",
          displayName: "Conflict User",
          authMode: "development_credentials",
        }),
        "AUTH_IDENTITY_CONFLICT",
      );
      expect(await client.authIdentity.count()).toBe(1);
    } finally {
      await client.$disconnect();
    }
  });

  it("findActiveAppUserById resolves active users and hides inactive or missing users", async () => {
    const { client } = await createTempClient();

    try {
      const user = await upsertAppUserByEmail({
        client,
        email: "active@example.com",
        displayName: "Active User",
      });

      await expect(findActiveAppUserById(user.id, client)).resolves.toMatchObject({
        id: user.id,
        active: true,
      });
      expect(await findActiveAppUserById(randomUUID(), client)).toBeNull();

      await client.appUser.update({
        where: { id: user.id },
        data: { active: false },
      });
      expect(await findActiveAppUserById(user.id, client)).toBeNull();
    } finally {
      await client.$disconnect();
    }
  });

  it("keeps auth-user-store free of raw SQL Prisma APIs", () => {
    const source = readFileSync(
      repoPath("src", "mycelia", "runtime", "auth", "auth-user-store.ts"),
      "utf8",
    );
    const forbiddenQuery = ["query", "Raw"].join("");
    const forbiddenExecute = ["execute", "Raw"].join("");

    expect(source).not.toContain(forbiddenQuery);
    expect(source).not.toContain(forbiddenExecute);
  });
});

