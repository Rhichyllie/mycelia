import { execFileSync } from "node:child_process";

import { createElement, isValidElement } from "react";
import { describe, expect, it } from "vitest";

import {
  PRODUCT_ROADMAP_AVAILABLE_NOW,
  PRODUCT_ROADMAP_NOT_ACTIVE_YET,
  PRODUCT_ROADMAP_PLANNED_NEXT,
  PRODUCT_ROADMAP_ROUTES,
  PRODUCT_ROADMAP_SAFETY_BOUNDARY,
  ProductRoadmapSurface,
  getProductRoadmapSurfaceModel,
} from ".";

const ALLOWED_INTERNAL_ROUTES = new Set<string>([
  "/",
  "/mycelia",
  "/mycelia/static-demo",
  "/mycelia/roadmap",
  "/mycelia/walkthrough",
  "/mycelia/executive",
]);
const UNSAFE_ROADMAP_STRING_PATTERN =
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

function sectionItems(title: string): readonly string[] {
  const section = getProductRoadmapSurfaceModel().sections.find(
    (candidate) => candidate.title === title,
  );

  return section?.items ?? [];
}

describe("product roadmap surface", () => {
  it("builds a product roadmap model successfully", () => {
    const model = getProductRoadmapSurfaceModel();

    expect(model.title).toBe("MYCELIA");
    expect(model.routes).toEqual(PRODUCT_ROADMAP_ROUTES);
  });

  it("includes MYCELIA title", () => {
    expect(getProductRoadmapSurfaceModel().title).toBe("MYCELIA");
  });

  it("includes all six product routes", () => {
    expect(getProductRoadmapSurfaceModel().routes).toEqual([
      "/",
      "/mycelia",
      "/mycelia/executive",
      "/mycelia/static-demo",
      "/mycelia/walkthrough",
      "/mycelia/roadmap",
    ]);
  });

  it("includes required roadmap section titles", () => {
    const sectionTitles = getProductRoadmapSurfaceModel().sections.map(
      (section) => section.title,
    );

    expect(sectionTitles).toContain("Available now");
    expect(sectionTitles).toContain("Planned next");
    expect(sectionTitles).toContain("Not active yet");
    expect(sectionTitles).toContain("Safety boundary");
  });

  it("includes required available-now items", () => {
    for (const item of PRODUCT_ROADMAP_AVAILABLE_NOW) {
      expect(sectionItems("Available now")).toContain(item);
    }
  });

  it("includes required planned-next items", () => {
    for (const item of PRODUCT_ROADMAP_PLANNED_NEXT) {
      expect(sectionItems("Planned next")).toContain(item);
    }
  });

  it("includes required not-active-yet items", () => {
    for (const item of PRODUCT_ROADMAP_NOT_ACTIVE_YET) {
      expect(sectionItems("Not active yet")).toContain(item);
    }
  });

  it("includes required safety boundary items", () => {
    for (const item of PRODUCT_ROADMAP_SAFETY_BOUNDARY) {
      expect(sectionItems("Safety boundary")).toContain(item);
    }
  });

  it("creates a React element without mounting", () => {
    expect(isValidElement(createElement(ProductRoadmapSurface))).toBe(true);
  });

  it("has no unsafe URL, email, file path, credential or token strings", () => {
    const model = getProductRoadmapSurfaceModel();
    const unsafeStrings = collectStrings(model)
      .filter((value) => !ALLOWED_INTERNAL_ROUTES.has(value))
      .filter((value) => UNSAFE_ROADMAP_STRING_PATTERN.test(value));

    expect(unsafeStrings).toEqual([]);
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
