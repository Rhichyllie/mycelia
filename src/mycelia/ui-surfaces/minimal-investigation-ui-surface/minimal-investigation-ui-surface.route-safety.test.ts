import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const routePath = join(
  process.cwd(),
  "app",
  "mycelia",
  "investigation",
  "page.tsx",
);
const routeHandlerPath = join(
  process.cwd(),
  "app",
  "mycelia",
  "investigation",
  "route.ts",
);

function routeSource(): string {
  return readFileSync(routePath, "utf8");
}

describe("minimal investigation ui route safety", () => {
  it("creates the live read-only investigation page route", () => {
    const source = routeSource();

    expect(existsSync(routePath)).toBe(true);
    expect(source).toContain("export default async function MyceliaInvestigationPage");
    expect(source).toContain("loadInvestigationTimeline");
    expect(source).toContain('export const dynamic = "force-dynamic"');
  });

  it("does not create a route handler or API behavior", () => {
    const source = routeSource();

    expect(existsSync(routeHandlerPath)).toBe(false);
    expect(source).not.toContain("route.ts");
    expect(source).not.toContain("NextRequest");
    expect(source).not.toContain("Response.json");
    expect(source).not.toContain("GET(");
    expect(source).not.toContain("POST(");
  });

  it("keeps the page live read-only without descriptor-layer wiring", () => {
    const source = routeSource();

    expect(source).toContain("Controlled Demo Environment");
    expect(source).toContain("Chronological history");
    expect(source).toContain("What MYCELIA controlled");
    expect(source).not.toContain("MinimalInvestigationUiSurface");
    expect(source).not.toContain("resolveInvestigationSelectionTarget");
    expect(source).not.toContain("persisted-investigation-read-model");
    expect(source).not.toContain("investigation-view-model-v1");
    expect(source).not.toContain("runtime-repository-layer");
    expect(source).not.toContain("prisma-runtime-repository-adapter");
    expect(source).not.toContain("\"use client\"");
    expect(source).not.toContain("'use client'");
    expect(source).not.toContain("\"use server\"");
    expect(source).not.toContain("'use server'");
    expect(source).not.toContain("<form");
    expect(source).not.toContain("<button");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("PrismaClient");
    expect(source).not.toContain("@prisma/client");
    expect(source).not.toMatch(/cookies\s*\(|headers\s*\(|auth\s*\(/i);
    expect(source).not.toMatch(/writeFile|download|pdf/i);
  });
});
