import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const routePath = join(
  process.cwd(),
  "app",
  "mycelia",
  "request",
  "new",
  "page.tsx",
);
const routeHandlerPath = join(
  process.cwd(),
  "app",
  "mycelia",
  "request",
  "new",
  "route.ts",
);

function routeSource(): string {
  return readFileSync(routePath, "utf8");
}

describe("governed request creation route safety", () => {
  it("creates the controlled request creation page route", () => {
    const source = routeSource();

    expect(existsSync(routePath)).toBe(true);
    expect(source).toContain("export default function MyceliaGovernedRequestCreationPage");
    expect(source).toContain("GovernedRequestCreationSurface");
  });

  it("does not create a route handler or API behavior", () => {
    const source = routeSource();

    expect(existsSync(routeHandlerPath)).toBe(false);
    expect(source).not.toContain("NextRequest");
    expect(source).not.toContain("Response.json");
    expect(source).not.toContain("GET(");
    expect(source).not.toContain("POST(");
  });

  it("keeps the page static and non-mutating", () => {
    const source = routeSource();

    expect(source).not.toContain("\"use client\"");
    expect(source).not.toContain("'use client'");
    expect(source).not.toContain("<form");
    expect(source).not.toContain("<button");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("PrismaClient");
    expect(source).not.toContain("writeFile");
    expect(source).not.toContain("download");
    expect(source).not.toContain("pdf");
  });
});
