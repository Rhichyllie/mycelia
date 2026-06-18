import { execFileSync } from "node:child_process";

import { createElement, isValidElement } from "react";
import { describe, expect, it } from "vitest";

import {
  PRODUCT_SURFACE_INDEX_ITEMS,
  PRODUCT_SURFACE_INDEX_ROUTES,
  ProductSurfaceIndex,
  getProductSurfaceIndexModel,
} from ".";

const ALLOWED_INTERNAL_ROUTES = new Set<string>(PRODUCT_SURFACE_INDEX_ROUTES);
const UNSAFE_PRODUCT_SURFACE_INDEX_STRING_PATTERN =
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

describe("product surface index", () => {
  it("builds a product surface index model successfully", () => {
    const model = getProductSurfaceIndexModel();

    expect(model.title).toBe("Product surfaces");
    expect(model.items).toEqual(PRODUCT_SURFACE_INDEX_ITEMS);
  });

  it("includes all eight product routes", () => {
    const routes = getProductSurfaceIndexModel().items.map(
      (item) => item.route,
    );

    expect(routes).toEqual([
      "/",
      "/mycelia",
      "/mycelia/executive",
      "/mycelia/static-demo",
      "/mycelia/walkthrough",
      "/mycelia/request/new",
      "/mycelia/investigation",
      "/mycelia/roadmap",
    ]);
  });

  it("adds label, route, description, audience, status and safety note to each item", () => {
    const model = getProductSurfaceIndexModel();

    for (const item of model.items) {
      expect(item.label).toBeTruthy();
      expect(item.route).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.audience.length).toBeGreaterThan(0);
      expect(item.status).toBeTruthy();
      expect(item.safety_note).toBeTruthy();
      expect(item.available_now).toBe(true);
    }
  });

  it("creates a React element without mounting", () => {
    expect(isValidElement(createElement(ProductSurfaceIndex))).toBe(true);
  });

  it("has no unsafe URL, email, file path, credential or token strings", () => {
    const model = getProductSurfaceIndexModel();
    const unsafeStrings = collectStrings(model)
      .filter((value) => !ALLOWED_INTERNAL_ROUTES.has(value))
      .filter((value) =>
        UNSAFE_PRODUCT_SURFACE_INDEX_STRING_PATTERN.test(value),
      );

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
