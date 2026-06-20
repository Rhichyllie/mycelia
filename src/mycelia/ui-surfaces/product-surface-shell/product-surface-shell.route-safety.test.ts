import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const layoutPath = new URL("../../../../app/layout.tsx", import.meta.url);
const homeRoutePath = new URL("../../../../app/page.tsx", import.meta.url);
const productHubRoutePath = new URL(
  "../../../../app/mycelia/page.tsx",
  import.meta.url,
);
const staticDemoRoutePath = new URL(
  "../../../../app/mycelia/static-demo/page.tsx",
  import.meta.url,
);
const roadmapRoutePath = new URL(
  "../../../../app/mycelia/roadmap/page.tsx",
  import.meta.url,
);
const walkthroughRoutePath = new URL(
  "../../../../app/mycelia/walkthrough/page.tsx",
  import.meta.url,
);
const pilotDemoRoutePath = new URL(
  "../../../../app/mycelia/demo/page.tsx",
  import.meta.url,
);
const investigationRoutePath = new URL(
  "../../../../app/mycelia/investigation/page.tsx",
  import.meta.url,
);
const requestCreationRoutePath = new URL(
  "../../../../app/mycelia/request/new/page.tsx",
  import.meta.url,
);
const approvalDecisionRoutePath = new URL(
  "../../../../app/mycelia/approval/decision/page.tsx",
  import.meta.url,
);
const executiveRoutePath = new URL(
  "../../../../app/mycelia/executive/page.tsx",
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
    expect(layoutSource).toContain("@/mycelia/ui-surfaces/product-surface-shell");
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

  it("keeps the pilot demo route safe", () => {
    const routeSource = source(pilotDemoRoutePath).toLowerCase();

    for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("keeps the investigation route safe", () => {
    const routeSource = source(investigationRoutePath).toLowerCase();

    for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("keeps the request creation route safe", () => {
    const routeSource = source(requestCreationRoutePath).toLowerCase();

    for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
      expect(routeSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("keeps the approval decision route safe", () => {
    const routeSource = source(approvalDecisionRoutePath).toLowerCase();

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

    expect(shellSource).toContain("PRODUCT_SURFACE_INDEX_ITEMS");
    expect(shellSource).toContain("href={item.href}");
    expect(shellSource).not.toContain("target=");
    expect(shellSource).not.toContain("rel=");
  });

  it("keeps forms limited to the LIVE-2, LIVE-3 and LIVE-5 governed demo actions", () => {
    const staticRouteSource = [
      source(layoutPath),
      source(homeRoutePath),
      source(productHubRoutePath),
      source(staticDemoRoutePath),
      source(roadmapRoutePath),
      source(walkthroughRoutePath),
      source(requestCreationRoutePath),
      source(investigationRoutePath),
      source(executiveRoutePath),
      source(shellPath),
    ].join("\n");
    const pilotSource = source(pilotDemoRoutePath);
    const approvalSource = source(approvalDecisionRoutePath);

    expect(staticRouteSource).not.toContain("<form");
    expect(staticRouteSource).not.toContain("<button");
    expect(staticRouteSource).not.toContain("action=");
    expect(pilotSource).toContain("<form action={createGovernedRequest}");
    expect(pilotSource).toContain("Start governed request");
    expect(pilotSource).toContain("<form action={resetDemo}");
    expect(pilotSource).toContain("Reset demo");
    expect(pilotSource).not.toContain("fetch(");
    expect(pilotSource).not.toContain("Response.json");
    expect(pilotSource).not.toMatch(/Approve request|Reject request/i);
    expect(approvalSource).toContain("<form action={approveGovernedRequest}");
    expect(approvalSource).toContain("<form action={rejectGovernedRequest}");
    expect(approvalSource).toContain("Approve");
    expect(approvalSource).toContain("Reject");
    expect(approvalSource).not.toContain("fetch(");
    expect(approvalSource).not.toContain("Response.json");
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

