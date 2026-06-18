import { execFileSync } from "node:child_process";

import { createElement, isValidElement } from "react";
import { describe, expect, it } from "vitest";

import {
  PRODUCT_INFORMATION_NOT_IMPLEMENTED,
  PRODUCT_INFORMATION_ROUTES,
  PRODUCT_INFORMATION_STATIC_DEMO_PROOFS,
  ProductInformationSurface,
  getProductInformationSurfaceModel,
} from ".";
import { PRODUCT_SURFACE_INDEX_ITEMS } from "../product-surface-index";

const ALLOWED_INTERNAL_ROUTES = new Set<string>([
  "/",
  "/mycelia",
  "/mycelia/executive",
  "/mycelia/static-demo",
  "/mycelia/walkthrough",
  "/mycelia/roadmap",
]);
const UNSAFE_PRODUCT_INFORMATION_STRING_PATTERN =
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

function sectionTitles(): readonly string[] {
  return getProductInformationSurfaceModel().sections.map(
    (section) => section.title,
  );
}

describe("product information surface", () => {
  it("builds a product information model successfully", () => {
    const model = getProductInformationSurfaceModel();

    expect(model.title).toBe("MYCELIA");
    expect(model.routes).toEqual(PRODUCT_INFORMATION_ROUTES);
  });

  it("includes MYCELIA title", () => {
    expect(getProductInformationSurfaceModel().title).toBe("MYCELIA");
  });

  it("includes all six product routes", () => {
    const model = getProductInformationSurfaceModel();

    expect(model.routes).toEqual([
      "/",
      "/mycelia",
      "/mycelia/executive",
      "/mycelia/static-demo",
      "/mycelia/walkthrough",
      "/mycelia/roadmap",
    ]);
  });

  it("includes required product information sections", () => {
    expect(sectionTitles()).toContain("What MYCELIA is");
    expect(sectionTitles()).toContain("What exists now");
    expect(sectionTitles()).toContain("What the static demo proves");
    expect(sectionTitles()).toContain("Not implemented yet");
    expect(sectionTitles()).toContain("Safety boundary");
  });

  it("includes required not-yet-implemented items", () => {
    const notYetImplemented = getProductInformationSurfaceModel()
      .sections.find((section) => section.title === "Not implemented yet")
      ?.items;

    expect(notYetImplemented).toBeDefined();
    for (const item of PRODUCT_INFORMATION_NOT_IMPLEMENTED) {
      expect(notYetImplemented).toContain(item);
    }
  });

  it("includes required static demo proof items", () => {
    const proofItems = getProductInformationSurfaceModel().sections.find(
      (section) => section.title === "What the static demo proves",
    )?.items;

    expect(proofItems).toBeDefined();
    for (const item of PRODUCT_INFORMATION_STATIC_DEMO_PROOFS) {
      expect(proofItems).toContain(item);
    }
  });

  it("uses the product surface index", () => {
    const model = getProductInformationSurfaceModel();

    expect(model.product_surfaces).toEqual(PRODUCT_SURFACE_INDEX_ITEMS);
  });

  it("creates a React element without mounting", () => {
    expect(isValidElement(createElement(ProductInformationSurface))).toBe(
      true,
    );
  });

  it("has no unsafe URL, email, file path, credential or token strings", () => {
    const model = getProductInformationSurfaceModel();
    const unsafeStrings = collectStrings(model)
      .filter((value) => !ALLOWED_INTERNAL_ROUTES.has(value))
      .filter((value) =>
        UNSAFE_PRODUCT_INFORMATION_STRING_PATTERN.test(value),
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
