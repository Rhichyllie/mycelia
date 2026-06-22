import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import YAML from "yaml";

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

function modelBlock(schema: string, modelName: string): string {
  const match = new RegExp(`model ${modelName} \\{([\\s\\S]*?)\\n\\}`).exec(schema);

  if (!match?.[1]) {
    throw new Error(`Missing Prisma model ${modelName}.`);
  }

  return match[1];
}

describe("ENGINE-3 PostgreSQL and Docker foundation", () => {
  it("defines the local PostgreSQL Docker service contract", () => {
    const compose = YAML.parse(
      readFileSync(repoPath("docker-compose.yml"), "utf8"),
    ) as {
      readonly services?: Record<
        string,
        {
          readonly image?: string;
          readonly environment?: Record<string, string>;
          readonly ports?: string[];
          readonly healthcheck?: { readonly test?: string[] };
        }
      >;
      readonly volumes?: Record<string, unknown>;
    };
    const postgres = compose.services?.postgres;

    expect(postgres).toBeDefined();
    expect(postgres?.image).toBe("postgres:16");
    expect(postgres?.environment).toMatchObject({
      POSTGRES_DB: "mycelia",
      POSTGRES_USER: "mycelia",
      POSTGRES_PASSWORD: "mycelia_dev",
    });
    expect(postgres?.ports).toContain("${MYCELIA_POSTGRES_PORT:-5432}:5432");
    expect(postgres?.healthcheck?.test?.join(" ")).toContain("pg_isready");
    expect(compose.volumes).toHaveProperty("mycelia_postgres_data");
  });

  it("uses PostgreSQL and keeps tenantId on every tenant-scoped model", () => {
    const schema = readFileSync(repoPath("prisma", "schema.prisma"), "utf8");

    expect(schema).toContain('provider = "postgresql"');

    for (const modelName of [
      "AppUser",
      "Workspace",
      "WorkspaceMembership",
      "Project",
      "Node",
      "Edge",
      "ExternalRef",
    ]) {
      const block = modelBlock(schema, modelName);

      expect(block).toMatch(/\n\s+tenantId\s+String\b/);
      expect(block).toContain("@@index([tenantId])");
    }
  });
});
