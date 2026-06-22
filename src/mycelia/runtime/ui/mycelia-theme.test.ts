import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(...segments: string[]): string {
  return readFileSync(join(process.cwd(), ...segments), "utf8");
}

function themeCss(): string {
  return source("src", "mycelia", "runtime", "ui", "mycelia-theme.css");
}

describe("MYCELIA theme CSS variables", () => {
  it("defines dark and light selectors with canonical surface values", () => {
    const css = themeCss();

    expect(css).toContain(':root,\n[data-theme="dark"]');
    expect(css).toContain('[data-theme="light"]');
    expect(css).toContain("--mycelia-color-bg-canvas: #0A0C0B;");
    expect(css).toContain("--mycelia-color-bg-surface: #111512;");
    expect(css).toContain("--mycelia-color-bg-panel: #171C19;");
    expect(css).toContain("--mycelia-color-bg-canvas: #FAFAF7;");
    expect(css).toContain("--mycelia-color-bg-surface: #EDEEE8;");
    expect(css).toContain("--mycelia-color-bg-panel: #F2F0E9;");
    expect(css).toContain("--mycelia-color-brand-sage: #566B5C;");
    expect(css).not.toContain("--mycelia-color-bg-canvas: #FFFFFF;");
  });

  it("keeps light intent backgrounds visible on warm ivory surfaces", () => {
    const css = themeCss();

    expect(css).toContain("--mycelia-color-intent-successBg: rgba(79, 118, 88, 0.2);");
    expect(css).toContain("--mycelia-color-intent-warningBg: rgba(138, 94, 0, 0.2);");
    expect(css).toContain("--mycelia-color-intent-dangerBg: rgba(176, 69, 59, 0.2);");
    expect(css).toContain("--mycelia-color-intent-infoBg: rgba(68, 109, 132, 0.2);");
    expect(css).toContain("--mycelia-color-intent-neutralBg: rgba(92, 102, 96, 0.16);");
    expect(css).toContain("--mycelia-color-intent-accentBg: rgba(86, 107, 92, 0.2);");
  });

  it("initializes the theme before hydration from storage or system preference", () => {
    const layoutSource = source("app", "layout.tsx");

    expect(layoutSource).toContain("MYCELIA_THEME_INIT_SCRIPT");
    expect(layoutSource).toContain("strategy=\"beforeInteractive\"");
    expect(layoutSource).toContain("localStorage");
    expect(layoutSource).toContain("prefers-color-scheme");
    expect(layoutSource).toContain("mycelia-theme");
  });
});
