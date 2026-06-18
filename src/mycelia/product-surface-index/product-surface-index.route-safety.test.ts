import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const indexPath = new URL("./product-surface-index.tsx", import.meta.url);
const homeSurfacePath = new URL(
  "../home-entry-surface/home-entry-surface.tsx",
  import.meta.url,
);
const productInformationSurfacePath = new URL(
  "../product-information-surface/product-information-surface.tsx",
  import.meta.url,
);

const FORBIDDEN_PRODUCT_SURFACE_INDEX_PATTERNS = [
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

describe("product surface index source safety", () => {
  it("keeps the product surface index free of unsafe runtime behavior", () => {
    const indexSource = source(indexPath).toLowerCase();

    for (const pattern of FORBIDDEN_PRODUCT_SURFACE_INDEX_PATTERNS) {
      expect(indexSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("keeps integrated home and product hub surfaces free of unsafe runtime behavior", () => {
    const combinedSource = [
      source(homeSurfacePath),
      source(productInformationSurfacePath),
    ]
      .join("\n")
      .toLowerCase();

    for (const pattern of FORBIDDEN_PRODUCT_SURFACE_INDEX_PATTERNS) {
      expect(combinedSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("does not add forms, action buttons or external links", () => {
    const combinedSource = [
      source(indexPath),
      source(homeSurfacePath),
      source(productInformationSurfacePath),
    ].join("\n");

    expect(combinedSource).not.toContain("<form");
    expect(combinedSource).not.toContain("<button");
    expect(combinedSource).not.toContain("target=");
    expect(combinedSource).not.toContain("rel=");
    expect(combinedSource).not.toContain("action=");
    expect(combinedSource).not.toContain("http://");
    expect(combinedSource).not.toContain("https://");
  });

  it("uses internal route links only", () => {
    const indexSource = source(indexPath);

    expect(indexSource).toContain('route: "/"');
    expect(indexSource).toContain('route: "/mycelia"');
    expect(indexSource).toContain('route: "/mycelia/executive"');
    expect(indexSource).toContain('route: "/mycelia/static-demo"');
    expect(indexSource).toContain('route: "/mycelia/walkthrough"');
    expect(indexSource).toContain('route: "/mycelia/request/new"');
    expect(indexSource).toContain('route: "/mycelia/approval/decision"');
    expect(indexSource).toContain('route: "/mycelia/investigation"');
    expect(indexSource).toContain('route: "/mycelia/roadmap"');
    expect(indexSource).toContain("href={item.route}");
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
