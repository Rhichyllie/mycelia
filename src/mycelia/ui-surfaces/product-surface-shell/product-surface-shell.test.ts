import { execFileSync } from "node:child_process";

import { createElement, isValidElement } from "react";
import { describe, expect, it } from "vitest";

import {
  PRODUCT_SURFACE_SHELL_NAV_ITEMS,
  PRODUCT_SURFACE_SHELL_SAFETY_BADGES,
  ProductSurfaceShell,
  getProductSurfaceShellModel,
} from ".";
import { PRODUCT_SURFACE_INDEX_ITEMS } from "../../ui-surfaces/product-surface-index";

const UNSAFE_SHELL_STRING_PATTERN =
  /(@|https?:\/\/|www\.|[A-Za-z]:\\|\\\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|connection[_-]?string|credential|password|private[_-]?key|select\s|insert\s|update\s|delete\s|drop\s|sql|token)/i;

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

  it("includes Home, MYCELIA, Executive, Static Demo, Walkthrough, Pilot Demo, Request Draft, Approval, Investigation and Roadmap nav items", () => {
    const model = getProductSurfaceShellModel();

    expect(model.nav_items.map((item) => item.label)).toEqual([
      "Home",
      "MYCELIA",
      "Executive",
      "Static Demo",
      "Walkthrough",
      "Pilot Demo",
      "Request Draft",
      "Approval",
      "Investigation",
      "Roadmap",
    ]);
  });

  it("includes the product route targets", () => {
    const model = getProductSurfaceShellModel();

    expect(model.nav_items.map((item) => item.href)).toEqual([
      "/",
      "/mycelia",
      "/mycelia/executive",
      "/mycelia/static-demo",
      "/mycelia/walkthrough",
      "/mycelia/demo",
      "/mycelia/request/new",
      "/mycelia/approval/decision",
      "/mycelia/investigation",
      "/mycelia/roadmap",
    ]);
  });

  it("keeps navigation coherent with the product surface index", () => {
    const model = getProductSurfaceShellModel();

    expect(model.nav_items.map((item) => item.href)).toEqual(
      PRODUCT_SURFACE_INDEX_ITEMS.map((item) => item.route),
    );
  });

  it("includes all safety badges", () => {
    const model = getProductSurfaceShellModel();

    for (const badge of PRODUCT_SURFACE_SHELL_SAFETY_BADGES) {
      expect(model.safety_badges).toContain(badge);
    }
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
