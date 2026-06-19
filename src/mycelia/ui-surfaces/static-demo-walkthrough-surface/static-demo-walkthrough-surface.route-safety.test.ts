import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const routePath = new URL(
  "../../../../app/mycelia/walkthrough/page.tsx",
  import.meta.url,
);
const surfacePath = new URL(
  "./static-demo-walkthrough-surface.tsx",
  import.meta.url,
);

const FORBIDDEN_WALKTHROUGH_ROUTE_PATTERNS = [
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

describe("static demo walkthrough App Router surface safety", () => {
  it("creates the /mycelia/walkthrough App Router file", () => {
    expect(existsSync(routePath)).toBe(true);
  });

  it("routes to the StaticDemoWalkthroughSurface view", () => {
    const routeSource = source(routePath);

    expect(routeSource).toContain("StaticDemoWalkthroughSurface");
    expect(routeSource).toContain("@/mycelia/ui-surfaces/static-demo-walkthrough-surface");
  });

  it("keeps the walkthrough route free of unsafe runtime behavior", () => {
    const routeSource = source(routePath).toLowerCase();

    for (const pattern of FORBIDDEN_WALKTHROUGH_ROUTE_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }

    expect(routeSource).not.toContain("download");
    expect(routeSource).not.toContain("pdf");
  });

  it("keeps the walkthrough surface free of runtime behavior primitives", () => {
    const surfaceSource = source(surfacePath).toLowerCase();

    for (const pattern of FORBIDDEN_WALKTHROUGH_ROUTE_PATTERNS) {
      expect(surfaceSource).not.toContain(pattern.toLowerCase());
    }

    expect(surfaceSource).not.toContain("target=");
    expect(surfaceSource).not.toContain("rel=");
  });

  it("does not add forms, action buttons or external links", () => {
    const combinedSource = `${source(routePath)}\n${source(surfacePath)}`;

    expect(combinedSource).not.toContain("<form");
    expect(combinedSource).not.toContain("<button");
    expect(combinedSource).not.toContain("action=");
    expect(combinedSource).not.toContain("http://");
    expect(combinedSource).not.toContain("https://");
  });

  it("keeps walkthrough navigation links internal", () => {
    const surfaceSource = source(surfacePath);

    expect(surfaceSource).toContain('href: "/mycelia"');
    expect(surfaceSource).toContain('href: "/mycelia/static-demo"');
    expect(surfaceSource).toContain('href: "/mycelia/roadmap"');
    expect(surfaceSource).toContain('href: "/mycelia/executive"');
    expect(surfaceSource).toContain("href={callout.href}");
  });

  it("does not modify pnpm-lock.yaml", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(status.trim()).toBe("");
  });
});
