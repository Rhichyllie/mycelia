import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const layoutPath = new URL("../../../../app/layout.tsx", import.meta.url);
const homeRoutePath = new URL("../../../../app/page.tsx", import.meta.url);
const controlCenterRoutePath = new URL(
  "../../../../app/mycelia/page.tsx",
  import.meta.url,
);
const runsRoutePath = new URL(
  "../../../../app/mycelia/runs/page.tsx",
  import.meta.url,
);
const runsActionPath = new URL(
  "../../../../app/mycelia/runs/actions.ts",
  import.meta.url,
);
const approvalsRoutePath = new URL(
  "../../../../app/mycelia/approvals/page.tsx",
  import.meta.url,
);
const approvalsActionPath = new URL(
  "../../../../app/mycelia/approvals/actions.ts",
  import.meta.url,
);
const investigationsRoutePath = new URL(
  "../../../../app/mycelia/investigations/page.tsx",
  import.meta.url,
);
const studioRoutePath = new URL(
  "../../../../app/mycelia/studio/page.tsx",
  import.meta.url,
);
const aboutRoutePath = new URL(
  "../../../../app/mycelia/about/page.tsx",
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
const executiveRoutePath = new URL(
  "../../../../app/mycelia/executive/page.tsx",
  import.meta.url,
);
const legacyDemoRoutePath = new URL(
  "../../../../app/mycelia/demo/page.tsx",
  import.meta.url,
);
const legacyInvestigationRoutePath = new URL(
  "../../../../app/mycelia/investigation/page.tsx",
  import.meta.url,
);
const legacyRequestCreationRoutePath = new URL(
  "../../../../app/mycelia/request/new/page.tsx",
  import.meta.url,
);
const legacyApprovalDecisionRoutePath = new URL(
  "../../../../app/mycelia/approval/decision/page.tsx",
  import.meta.url,
);
const shellPath = new URL("./product-surface-shell.tsx", import.meta.url);

const RETIRED_SOURCE_CODENAME = ["ma", "pia"].join("");

const FORBIDDEN_SHELL_PATTERNS = [
  "dangerouslySetInnerHTML",
  "fetch(",
  "axios",
  "XMLHttpRequest",
  "cookies(",
  "headers(",
  "notFound(",
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
  RETIRED_SOURCE_CODENAME,
] as const;

const PRIMARY_ROUTE_STALE_CLAIMS = [
  ["Phase", "0"].join(" "),
  ["intentionally", "not", "implemented"].join(" "),
  ["no", "runtime", "execution"].join(" "),
  ["no", "persistence"].join(" "),
  ["no", "API", "calls"].join(" "),
  ["no", "writes"].join(" "),
  ["No", "live", "DB", "write"].join(" "),
] as const;

function source(fileUrl: URL): string {
  return readFileSync(fileUrl, "utf8");
}

function expectNoForbiddenShellPatterns(fileUrl: URL): void {
  const routeSource = source(fileUrl).toLowerCase();

  for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
    expect(routeSource).not.toContain(pattern.toLowerCase());
  }
}

function expectRedirect(fileUrl: URL, target: string): void {
  const routeSource = source(fileUrl);

  expect(routeSource).toContain("redirect");
  expect(routeSource).toContain(target);
  expect(routeSource).not.toContain("fetch(");
  expect(routeSource).not.toContain("Response.json");
  expect(routeSource).not.toContain("<form");
  expect(routeSource).not.toContain("<button");
}

describe("product surface shell route safety", () => {
  it("integrates ProductSurfaceShell in the App Router layout", () => {
    const layoutSource = source(layoutPath);

    expect(layoutSource).toContain("ProductSurfaceShell");
    expect(layoutSource).toContain("@/mycelia/ui-surfaces/product-surface-shell");
  });

  it("keeps primary enterprise routes free of unsafe shell patterns", () => {
    for (const fileUrl of [
      homeRoutePath,
      controlCenterRoutePath,
      investigationsRoutePath,
      studioRoutePath,
      aboutRoutePath,
      staticDemoRoutePath,
      roadmapRoutePath,
      walkthroughRoutePath,
      executiveRoutePath,
      shellPath,
    ]) {
      expectNoForbiddenShellPatterns(fileUrl);
    }
  });

  it("keeps legacy routes as narrow redirects", () => {
    expectRedirect(legacyDemoRoutePath, "/mycelia/runs");
    expectRedirect(legacyRequestCreationRoutePath, "/mycelia/runs");
    expectRedirect(legacyApprovalDecisionRoutePath, "/mycelia/approvals");
    expectRedirect(legacyInvestigationRoutePath, "/mycelia/investigations");
  });

  it("uses only internal shell links", () => {
    const shellSource = source(shellPath);

    expect(shellSource).toContain("href={item.href}");
    expect(shellSource).not.toContain("target=");
    expect(shellSource).not.toContain("rel=");
  });

  it("keeps forms limited to the governed run and approval actions", () => {
    const staticRouteSource = [
      source(layoutPath),
      source(homeRoutePath),
      source(controlCenterRoutePath),
      source(staticDemoRoutePath),
      source(roadmapRoutePath),
      source(walkthroughRoutePath),
      source(legacyRequestCreationRoutePath),
      source(investigationsRoutePath),
      source(studioRoutePath),
      source(aboutRoutePath),
      source(executiveRoutePath),
      source(shellPath),
    ].join("\n");
    const runsSource = source(runsRoutePath);
    const approvalsSource = source(approvalsRoutePath);

    expect(staticRouteSource).not.toContain("<form");
    expect(staticRouteSource).not.toContain("<button");
    expect(staticRouteSource).not.toContain("action=");
    expect(runsSource).toContain("<form action={createGovernedRequest}");
    expect(runsSource).toContain("Start governed request");
    expect(runsSource).toContain("<form action={resetDemo}");
    expect(runsSource).toContain("Reset demo");
    expect(runsSource).not.toContain("fetch(");
    expect(runsSource).not.toContain("Response.json");
    expect(runsSource).not.toMatch(/Approve request|Reject request/i);
    expect(approvalsSource).toContain("<form action={approveGovernedRequest}");
    expect(approvalsSource).toContain("<form action={rejectGovernedRequest}");
    expect(approvalsSource).toContain("Approve");
    expect(approvalsSource).toContain("Reject");
    expect(approvalsSource).not.toContain("fetch(");
    expect(approvalsSource).not.toContain("Response.json");
  });

  it("keeps primary enterprise copy free of stale inactive-product claims", () => {
    const primarySource = [
      source(controlCenterRoutePath),
      source(runsRoutePath),
      source(approvalsRoutePath),
      source(investigationsRoutePath),
      source(studioRoutePath),
      source(shellPath),
      source(runsActionPath),
      source(approvalsActionPath),
    ].join("\n");

    for (const claim of PRIMARY_ROUTE_STALE_CLAIMS) {
      expect(primarySource).not.toContain(claim);
    }
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
