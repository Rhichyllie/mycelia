import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { DemoScenarioSeedAllowedRoutes } from "../demo-scenario-seed-package";
import { PilotDemoEndToEndSurface } from ".";

const routePath = join(process.cwd(), "app", "mycelia", "demo", "page.tsx");

describe("pilot demo route safety", () => {
  it("creates the route at app/mycelia/demo/page.tsx", () => {
    expect(existsSync(routePath)).toBe(true);
  });

  it("keeps the route thin, static and non-mutating", () => {
    const source = readFileSync(routePath, "utf8");

    expect(source).toContain("PilotDemoEndToEndSurface");
    expect(source).not.toMatch(/route\.ts|NextRequest|Response\.json/i);
    expect(source).not.toMatch(/fetch\s*\(/i);
    expect(source).not.toMatch(/PrismaClient|@prisma\/client/i);
    expect(source).not.toMatch(/cookies\s*\(|headers\s*\(|auth\s*\(/i);
    expect(source).not.toMatch(/POST|PUT|PATCH|DELETE|onSubmit|<form/i);
  });

  it("renders route links only to known controlled MYCELIA routes", () => {
    const html = renderToStaticMarkup(createElement(PilotDemoEndToEndSurface));
    const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g)).map(
      (match) => match[1],
    );

    expect(hrefs.length).toBeGreaterThan(0);
    expect(new Set(hrefs)).toEqual(new Set(DemoScenarioSeedAllowedRoutes));
  });

  it("does not render fake mutating controls or export affordances", () => {
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
