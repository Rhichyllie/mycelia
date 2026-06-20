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
  it("creates the static investigation page route", () => {
    const source = routeSource();

    expect(existsSync(routePath)).toBe(true);
    expect(source).toContain("export default async function MyceliaInvestigationPage");
    expect(source).toContain("resolveInvestigationSelectionTarget");
    expect(source).toContain("sourceSummary={sourceSummary}");
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

  it("keeps the page static and read-only", () => {
    const source = routeSource();

    expect(source).toContain("MinimalInvestigationUiSurface");
    expect(source).toContain("resolveInvestigationSelectionTarget");
    expect(source).not.toContain("loadMinimalInvestigationUiDescriptor");
    expect(source).not.toContain("DEFAULT_MINIMAL_INVESTIGATION_UI_DESCRIPTOR");
    expect(source).not.toContain("MINIMAL_INVESTIGATION_UI_FIXTURES");
    expect(source).not.toContain("\"use client\"");
    expect(source).not.toContain("'use client'");
    expect(source).not.toContain("<form");
    expect(source).not.toContain("<button");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("PrismaClient");
  });
});
