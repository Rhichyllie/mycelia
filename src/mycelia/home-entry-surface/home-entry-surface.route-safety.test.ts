import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const homeRoutePath = new URL("../../../app/page.tsx", import.meta.url);
const homeSurfacePath = new URL(
  "./home-entry-surface.tsx",
  import.meta.url,
);

const FORBIDDEN_HOME_ROUTE_PATTERNS = [
  "dangerouslySetInnerHTML",
  "fetch(",
  "axios",
  "XMLHttpRequest",
  "cookies(",
  "headers(",
  "redirect(",
  "notFound(",
  "revalidate",
  "server action",
  "\"use server\"",
  "'use server'",
  "localStorage",
  "sessionStorage",
  "setTimeout",
  "setInterval",
  "Math.random",
  "Date.now",
  "readFile",
  "writeFile",
  "createReadStream",
  "createWriteStream",
  "download",
  "pdf",
  "blob",
  "URL.createObjectURL",
  "http://",
  "https://",
  "www.",
  "mapia",
] as const;

function source(fileUrl: URL): string {
  return readFileSync(fileUrl, "utf8");
}

describe("home entry App Router surface safety", () => {
  it("creates the home App Router file", () => {
    expect(existsSync(homeRoutePath)).toBe(true);
  });

  it("routes to the HomeEntrySurface view", () => {
    const routeSource = source(homeRoutePath);

    expect(routeSource).toContain("HomeEntrySurface");
    expect(routeSource).toContain("@/mycelia/home-entry-surface");
  });

  it("keeps the home route free of unsafe runtime behavior", () => {
    const routeSource = source(homeRoutePath).toLowerCase();

    for (const pattern of FORBIDDEN_HOME_ROUTE_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("keeps the home surface free of unsafe runtime behavior", () => {
    const componentSource = source(homeSurfacePath).toLowerCase();

    for (const pattern of FORBIDDEN_HOME_ROUTE_PATTERNS) {
      expect(componentSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("does not add forms, action buttons, external links or target blank", () => {
    const combinedSource = `${source(homeRoutePath)}\n${source(
      homeSurfacePath,
    )}`;

    expect(combinedSource).not.toContain("<form");
    expect(combinedSource).not.toContain("<button");
    expect(combinedSource).not.toContain("target=");
    expect(combinedSource).not.toContain("rel=");
    expect(combinedSource).not.toContain("action=");
    expect(combinedSource).not.toContain("http://");
    expect(combinedSource).not.toContain("https://");
  });

  it("uses the shared product surface index and keeps the static demo link internal", () => {
    const componentSource = source(homeSurfacePath);

    expect(componentSource).toContain("ProductSurfaceIndex");
    expect(componentSource).toContain('"/mycelia/static-demo"');
    expect(componentSource).toContain("href={model.static_demo_route}");
  });

  it("does not modify package.json or pnpm-lock.yaml", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "package.json", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(status.trim()).toBe("");
  });
});
