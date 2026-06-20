import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEMO_LOCAL_PREVIEW_COMMAND,
  DEMO_LOCAL_PREVIEW_CONTRACT,
  DEMO_LOCAL_PREVIEW_DEFAULT_PORT,
  DEMO_LOCAL_PREVIEW_HOST,
  DemoLocalPreviewAllowedRoutes,
  DemoLocalPreviewStatuses,
  getDemoLocalPreviewUrls,
} from ".";

const scriptPath = join(process.cwd(), "scripts", "mycelia-demo-local.mjs");
const packagePath = join(process.cwd(), "package.json");

function currentPackageJson() {
  return JSON.parse(readFileSync(packagePath, "utf8")) as {
    readonly scripts?: Record<string, string>;
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
  };
}

function headPackageJson() {
  return JSON.parse(
    execFileSync("git", ["show", "HEAD:package.json"], {
      encoding: "utf8",
    }),
  ) as {
    readonly dependencies?: Record<string, string>;
    readonly devDependencies?: Record<string, string>;
  };
}

describe("demo local preview contract", () => {
  it("exports the command, host, default port, routes and status values", () => {
    expect(DEMO_LOCAL_PREVIEW_COMMAND).toBe("pnpm demo:local");
    expect(DEMO_LOCAL_PREVIEW_HOST).toBe("127.0.0.1");
    expect(DEMO_LOCAL_PREVIEW_DEFAULT_PORT).toBe(3000);
    expect(DemoLocalPreviewStatuses).toEqual([
      "DEMO_LOCAL_PREVIEW_READY",
      "DEMO_LOCAL_PREVIEW_BLOCKED",
      "DEMO_LOCAL_PREVIEW_FAILED_SAFE",
    ]);
    expect(DemoLocalPreviewAllowedRoutes).toEqual([
      "/mycelia",
      "/mycelia/demo",
      "/mycelia/request/new",
      "/mycelia/approval/decision",
      "/mycelia/investigation",
    ]);
  });

  it("builds safe local URLs for the controlled demo surfaces", () => {
    expect(getDemoLocalPreviewUrls()).toEqual([
      "http://127.0.0.1:3000/mycelia",
      "http://127.0.0.1:3000/mycelia/demo",
      "http://127.0.0.1:3000/mycelia/request/new",
      "http://127.0.0.1:3000/mycelia/approval/decision",
      "http://127.0.0.1:3000/mycelia/investigation",
    ]);
    expect(getDemoLocalPreviewUrls(3100)).toContain(
      "http://127.0.0.1:3100/mycelia/demo",
    );
  });

  it("documents the safety boundary and forbidden capabilities", () => {
    expect(DEMO_LOCAL_PREVIEW_CONTRACT.previewStatus).toBe(
      "DEMO_LOCAL_PREVIEW_READY",
    );
    expect(DEMO_LOCAL_PREVIEW_CONTRACT.safetyBoundary).toEqual(
      expect.arrayContaining([
        "Local browser inspection is limited to MYCELIA demo surfaces.",
        "The preview command binds to 127.0.0.1 by default.",
      ]),
    );
    expect(DEMO_LOCAL_PREVIEW_CONTRACT.forbiddenCapabilities).toEqual(
      expect.arrayContaining([
        "production runtime activation",
        "live persistence write",
        "replay execution",
        "export, PDF or download behavior",
        "external integration",
        "broad workflow builder",
      ]),
    );
  });

  it("adds demo:local without replacing the guarded dev command", () => {
    const packageJson = currentPackageJson();

    expect(packageJson.scripts?.["demo:local"]).toBe(
      "node scripts/mycelia-demo-local.mjs",
    );
    expect(packageJson.scripts?.dev).toBe("node scripts/phase0-guard.mjs dev");
    expect(packageJson.scripts?.build).toBe(
      "node scripts/phase0-guard.mjs build",
    );
    expect(packageJson.scripts?.start).toBe(
      "node scripts/phase0-guard.mjs start",
    );
  });

  it("does not add package dependencies or modify the lockfile", () => {
    const packageJson = currentPackageJson();
    const headPackage = headPackageJson();
    const lockStatus = execFileSync(
      "git",
      ["status", "--short", "--", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(packageJson.dependencies).toEqual(headPackage.dependencies);
    expect(packageJson.devDependencies).toEqual(headPackage.devDependencies);
    expect(lockStatus.trim()).toBe("");
  });

  it("keeps schema and migration unchanged and creates no unmanaged database file", () => {
    const schemaDiff = execFileSync(
      "git",
      [
        "diff",
        "--name-only",
        "--",
        "prisma/schema.prisma",
        "prisma/migrations/000001_minimal_runtime_slice/migration.sql",
      ],
      { encoding: "utf8" },
    );
    const forbiddenDbFiles = [
      join(process.cwd(), "dev.db"),
      join(process.cwd(), "mycelia.sqlite"),
      join(process.cwd(), "prisma", "mycelia.sqlite"),
    ];

    expect(schemaDiff.trim()).toBe("");

    for (const file of forbiddenDbFiles) {
      expect(existsSync(file), `${file} should not exist`).toBe(false);
    }
  });

  it("creates the local demo script file", () => {
    expect(existsSync(scriptPath)).toBe(true);
  });
});
