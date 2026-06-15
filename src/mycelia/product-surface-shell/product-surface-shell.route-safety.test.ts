import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const layoutPath = new URL("../../../app/layout.tsx", import.meta.url);
const homeRoutePath = new URL("../../../app/page.tsx", import.meta.url);
const productHubRoutePath = new URL(
  "../../../app/mycelia/page.tsx",
  import.meta.url,
);
const staticDemoRoutePath = new URL(
  "../../../app/mycelia/static-demo/page.tsx",
  import.meta.url,
);
const roadmapRoutePath = new URL(
  "../../../app/mycelia/roadmap/page.tsx",
  import.meta.url,
);
const walkthroughRoutePath = new URL(
  "../../../app/mycelia/walkthrough/page.tsx",
  import.meta.url,
);
const executiveRoutePath = new URL(
  "../../../app/mycelia/executive/page.tsx",
  import.meta.url,
);
const shellPath = new URL("./product-surface-shell.tsx", import.meta.url);

const FORBIDDEN_SHELL_PATTERNS = [
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

describe("product surface shell route safety", () => {
  it("integrates ProductSurfaceShell in the App Router layout", () => {
    const layoutSource = source(layoutPath);

    expect(layoutSource).toContain("ProductSurfaceShell");
    expect(layoutSource).toContain("@/mycelia/product-surface-shell");
  });

  it("keeps the home route safe", () => {
    const routeSource = source(homeRoutePath).toLowerCase();

    for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("keeps the static demo route safe", () => {
    const routeSource = source(staticDemoRoutePath).toLowerCase();

    for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("keeps the product information route safe", () => {
    const routeSource = source(productHubRoutePath).toLowerCase();

    for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("keeps the roadmap route safe", () => {
    const routeSource = source(roadmapRoutePath).toLowerCase();

    for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("keeps the walkthrough route safe", () => {
    const routeSource = source(walkthroughRoutePath).toLowerCase();

    for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("keeps the executive route safe", () => {
    const routeSource = source(executiveRoutePath).toLowerCase();

    for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("keeps the shell source safe", () => {
    const shellSource = source(shellPath).toLowerCase();

    for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
      expect(shellSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("uses only internal shell links", () => {
    const shellSource = source(shellPath);

    expect(shellSource).toContain('href: "/"');
    expect(shellSource).toContain('href: "/mycelia"');
    expect(shellSource).toContain('href: "/mycelia/static-demo"');
    expect(shellSource).toContain('href: "/mycelia/roadmap"');
    expect(shellSource).toContain('href: "/mycelia/walkthrough"');
    expect(shellSource).toContain('href: "/mycelia/executive"');
    expect(shellSource).toContain("href={item.href}");
    expect(shellSource).not.toContain("target=");
    expect(shellSource).not.toContain("rel=");
  });

  it("does not add forms or action buttons", () => {
    const combinedSource = [
      source(layoutPath),
      source(homeRoutePath),
      source(productHubRoutePath),
      source(staticDemoRoutePath),
      source(roadmapRoutePath),
      source(walkthroughRoutePath),
      source(executiveRoutePath),
      source(shellPath),
    ].join("\n");

    expect(combinedSource).not.toContain("<form");
    expect(combinedSource).not.toContain("<button");
    expect(combinedSource).not.toContain("action=");
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
