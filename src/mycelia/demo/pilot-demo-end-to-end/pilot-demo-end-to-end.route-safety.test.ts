import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { DemoScenarioSeedAllowedRoutes } from "../../demo/demo-scenario-seed-package";
import { PilotDemoEndToEndSurface } from ".";

const routePath = join(process.cwd(), "app", "mycelia", "runs", "page.tsx");
const actionPath = join(process.cwd(), "app", "mycelia", "runs", "actions.ts");
const legacyRoutePath = join(process.cwd(), "app", "mycelia", "demo", "page.tsx");

describe("pilot demo route safety", () => {
  it("creates the live route at app/mycelia/runs/page.tsx", () => {
    expect(existsSync(routePath)).toBe(true);
  });

  it("keeps the legacy demo route as a redirect", () => {
    const source = readFileSync(legacyRoutePath, "utf8");

    expect(source).toContain("redirect");
    expect(source).toContain("/mycelia/runs");
  });

  it("keeps the route scoped to the LIVE-2 governed request and LIVE-5 reset actions", () => {
    const source = readFileSync(routePath, "utf8");

    expect(source).toContain("createGovernedRequest");
    expect(source).toContain("<form action={createGovernedRequest}");
    expect(source).toContain("Start governed request");
    expect(source).toContain("resetDemo");
    expect(source).toContain("<form action={resetDemo}");
    expect(source).toContain("Reset demo");
    expect(source).not.toMatch(/route\.ts|NextRequest|Response\.json/i);
    expect(source).not.toMatch(/fetch\s*\(/i);
    expect(source).not.toMatch(/PrismaClient|@prisma\/client/i);
    expect(source).not.toMatch(/cookies\s*\(|headers\s*\(|auth\s*\(/i);
    expect(source).not.toMatch(/Approve request|Reject request|download|pdf/i);
  });

  it("keeps the server action file free of route handler and external behavior", () => {
    const source = readFileSync(actionPath, "utf8");

    expect(source).toContain('"use server"');
    expect(source).toContain("createGovernedRequest");
    expect(source).toContain("resetDemo");
    expect(source).not.toMatch(/route\.ts|NextRequest|Response\.json/i);
    expect(source).not.toMatch(/fetch\s*\(/i);
    expect(source).not.toMatch(/cookies\s*\(|headers\s*\(|auth\s*\(/i);
    expect(source).not.toMatch(/Approve request|Reject request|download|pdf/i);
  });

  it("renders route links only to known controlled MYCELIA routes", () => {
    const html = renderToStaticMarkup(createElement(PilotDemoEndToEndSurface));
    const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g)).map(
      (match) => match[1],
    );

    expect(hrefs.length).toBeGreaterThan(0);
    expect(new Set(hrefs)).toEqual(new Set(DemoScenarioSeedAllowedRoutes));
  });

  it("keeps the presenter surface free of fake mutating controls or export affordances", () => {
    const html = renderToStaticMarkup(createElement(PilotDemoEndToEndSurface));

    expect(html).not.toMatch(/<form\b/i);
    expect(html).not.toMatch(/<button\b/i);
    expect(html).not.toMatch(/<input\b/i);
    expect(html).not.toMatch(/<textarea\b/i);
    expect(html).not.toMatch(/<select\b/i);
    expect(html).not.toContain("onSubmit");
    expect(html).not.toContain("action=");
    expect(html).not.toContain("download=");
    expect(html).not.toContain("target=");
    expect(html).not.toContain("rel=");
  });
});

