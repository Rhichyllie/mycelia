import { execFileSync } from "node:child_process";

import { createElement, isValidElement } from "react";
import { describe, expect, it } from "vitest";

import {
  PRODUCT_SURFACE_SHELL_NAV_ITEMS,
  PRODUCT_SURFACE_SHELL_SAFETY_BADGES,
  ProductSurfaceShell,
  getProductSurfaceShellModel,
} from ".";

const UNSAFE_SHELL_STRING_PATTERN =
  /(@|https?:\/\/|www\.|[A-Za-z]:\\|\\\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|connection[_-]?string|credential|password|private[_-]?key|select\s|insert\s|update\s|delete\s|drop\s|\bsql\b|token)/i;

function collectStrings(input: unknown): string[] {
  if (typeof input === "string") {
    return [input];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => collectStrings(item));
  }

  if (typeof input === "object" && input !== null) {
    return Object.entries(input).flatMap(([key, value]) => [
      key,
      ...collectStrings(value),
    ]);
  }

  return [];
}

describe("product surface shell", () => {
  it("builds a shell model successfully", () => {
    const model = getProductSurfaceShellModel();

    expect(model.brand).toBe("MYCELIA");
    expect(model.nav_items).toEqual(PRODUCT_SURFACE_SHELL_NAV_ITEMS);
  });

  it("includes MYCELIA brand", () => {
    const model = getProductSurfaceShellModel();

    expect(model.brand).toBe("MYCELIA");
    expect(model.positioning).toContain(
      "Governed operational intelligence",
    );
    expect(model.positioning).toContain("governed agentic runtime");
  });

  it("includes the enterprise navigation items", () => {
    const model = getProductSurfaceShellModel();

    expect(model.nav_items.map((item) => item.label)).toEqual([
      "Control Center",
      "Runs",
      "Approvals",
      "Investigations",
      "Studio",
      "About",
    ]);
  });

  it("includes the product route targets", () => {
    const model = getProductSurfaceShellModel();

    expect(model.nav_items.map((item) => item.href)).toEqual([
      "/mycelia",
      "/mycelia/runs",
      "/mycelia/approvals",
      "/mycelia/investigations",
      "/mycelia/studio",
      "/mycelia/about",
    ]);
  });


  it("includes accurate local live-demo safety badges", () => {
    const model = getProductSurfaceShellModel();

    expect(model.safety_badges).toEqual(PRODUCT_SURFACE_SHELL_SAFETY_BADGES);
    expect(model.safety_badges).toEqual([
      "Local SQLite",
      "Real persistence",
      "Governed runtime",
      "Local demo mode",
      "No production auth",
      "No cloud deployment",
    ]);
    expect(model.safety_badges).not.toContain("Static");
    expect(model.safety_badges).not.toContain("Read-only");
    expect(model.safety_badges).not.toContain("No DB writes");
    expect(model.safety_badges).not.toContain(["No API", "calls"].join(" "));
  });

  it("describes the live local persistence boundary accurately", () => {
    const model = getProductSurfaceShellModel();

    expect(model.footer_note).toContain("executes and persists locally in SQLite");
    expect(model.footer_note).toContain("pre-production");
    expect(model.footer_note).not.toContain("do not execute runtime");
    expect(model.footer_note).not.toContain("mutate persisted data");
  });

  it("creates a React element without mounting", () => {
    const element = createElement(
      ProductSurfaceShell,
      undefined,
      createElement("span", undefined, "static content"),
    );

    expect(isValidElement(element)).toBe(true);
  });

  it("has no unsafe URL, email, file path, credential or token strings", () => {
    const model = getProductSurfaceShellModel();
    const unsafeStrings = collectStrings(model).filter((value) =>
      UNSAFE_SHELL_STRING_PATTERN.test(value),
    );

    expect(unsafeStrings).toEqual([]);
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
