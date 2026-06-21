import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const routePath = new URL(
  "../../../../app/mycelia/about/page.tsx",
  import.meta.url,
);
const surfacePath = new URL(
  "./product-information-surface.tsx",
  import.meta.url,
);

const RETIRED_SOURCE_CODENAME = ["ma", "pia"].join("");

const FORBIDDEN_PRODUCT_INFORMATION_ROUTE_PATTERNS = [
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
  RETIRED_SOURCE_CODENAME,
] as const;

function source(fileUrl: URL): string {
  return readFileSync(fileUrl, "utf8");
}

describe("product information App Router surface safety", () => {
  it("creates the /mycelia/about App Router file", () => {
    expect(existsSync(routePath)).toBe(true);
  });

  it("routes to the tokenized About index for secondary product story pages", () => {
    const routeSource = source(routePath);

    expect(routeSource).toContain("MYCELIA_TOKENS");
    expect(routeSource).toContain("/mycelia/static-demo");
    expect(routeSource).toContain("/mycelia/walkthrough");
    expect(routeSource).toContain("/mycelia/roadmap");
  });

  it("keeps the /mycelia/about route free of unsafe runtime behavior", () => {
    const routeSource = source(routePath).toLowerCase();

    for (const pattern of FORBIDDEN_PRODUCT_INFORMATION_ROUTE_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }

    expect(routeSource).not.toContain("download");
    expect(routeSource).not.toContain("pdf");
  });

  it("keeps the product information surface free of unsafe runtime behavior", () => {
    const surfaceSource = source(surfacePath).toLowerCase();

    for (const pattern of FORBIDDEN_PRODUCT_INFORMATION_ROUTE_PATTERNS) {
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

  it("keeps the callout link internal", () => {
    const surfaceSource = source(surfacePath);

    expect(surfaceSource).toContain("ProductSurfaceIndex");
    expect(surfaceSource).toContain('"/mycelia/static-demo"');
    expect(surfaceSource).toContain("href={model.static_demo_route}");
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
