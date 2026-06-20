import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const layoutPath = new URL(
  "../../../../app/layout.tsx",
  import.meta.url,
);
const routePath = new URL(
  "../../../../app/mycelia/static-demo/page.tsx",
  import.meta.url,
);

const FORBIDDEN_ROUTE_PATTERNS = [
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
  "fs",
  "path",
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
  "api_key",
  "bearer",
  "connection_string",
  "external_service",
  "legacy",
  "mapia",
] as const;

function source(fileUrl: URL): string {
  return readFileSync(fileUrl, "utf8");
}

describe("static demo App Router surface safety", () => {
  it("creates the required App Router files", () => {
    expect(existsSync(layoutPath)).toBe(true);
    expect(existsSync(routePath)).toBe(true);
  });

  it("routes to the existing ReadOnlyStaticDemoPage view", () => {
    const routeSource = source(routePath);

    expect(routeSource).toContain("ReadOnlyStaticDemoPage");
    expect(routeSource).toContain(
      "@/mycelia/ui-surfaces/read-only-static-demo-page",
    );
  });

  it("keeps the static demo route free of unsafe runtime behavior", () => {
    const routeSource = source(routePath).toLowerCase();

    for (const pattern of FORBIDDEN_ROUTE_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("keeps the root layout minimal and free of unsafe runtime behavior", () => {
    const layoutSource = source(layoutPath).toLowerCase();

    for (const pattern of FORBIDDEN_ROUTE_PATTERNS) {
      expect(layoutSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("does not add forms, action buttons or external links", () => {
    const combinedSource = `${source(layoutPath)}\n${source(routePath)}`;

    expect(combinedSource).not.toContain("<form");
    expect(combinedSource).not.toContain("<button");
    expect(combinedSource).not.toContain("<a ");
    expect(combinedSource).not.toContain("href=");
    expect(combinedSource).not.toContain("action=");
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
