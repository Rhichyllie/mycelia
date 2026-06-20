import { execFileSync } from "node:child_process";

import { isValidElement } from "react";
import { describe, expect, it } from "vitest";

import {
  HOME_ENTRY_SURFACE_NOT_YET_IMPLEMENTED,
  HOME_ENTRY_SURFACE_ROUTE,
  HOME_ENTRY_SURFACE_SAFETY_BADGES,
  HomeEntrySurface,
  getHomeEntrySurfaceModel,
} from ".";
import { PRODUCT_SURFACE_INDEX_ITEMS } from "../../ui-surfaces/product-surface-index";

const UNSAFE_HOME_STRING_PATTERN =
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

describe("home entry surface", () => {
  it("builds a home model successfully", () => {
    const model = getHomeEntrySurfaceModel();

    expect(model.product_name).toBe("MYCELIA");
    expect(model.static_demo_route).toBe(HOME_ENTRY_SURFACE_ROUTE);
  });

  it("includes the MYCELIA name", () => {
    const model = getHomeEntrySurfaceModel();

    expect(model.product_name).toBe("MYCELIA");
    expect(model.headline).toContain("Governed operational intelligence");
  });

  it("includes the static demo route", () => {
    const model = getHomeEntrySurfaceModel();

    expect(model.static_demo_route).toBe("/mycelia/static-demo");
    expect(model.current_surface.body).toContain("/mycelia/static-demo");
  });

  it("includes positioning text", () => {
    const model = getHomeEntrySurfaceModel();

    expect(model.positioning).toContain("governed operational intelligence");
    expect(model.positioning).toContain("governed agentic runtime");
    expect(model.positioning).toContain(
      "static descriptor-level demo currently available",
    );
  });

  it("includes all safety badges", () => {
    const model = getHomeEntrySurfaceModel();

    for (const badge of HOME_ENTRY_SURFACE_SAFETY_BADGES) {
      expect(model.safety_badges).toContain(badge);
    }
  });

  it("includes current surface section", () => {
    const model = getHomeEntrySurfaceModel();

    expect(model.current_surface.title).toBe("Current surface");
    expect(model.current_surface.body).toContain("connected set");
  });

  it("uses the product surface index", () => {
    const model = getHomeEntrySurfaceModel();

    expect(model.product_surfaces).toEqual(PRODUCT_SURFACE_INDEX_ITEMS);
    expect(model.product_surfaces.map((item) => item.route)).toContain(
      "/mycelia/executive",
    );
  });

  it("includes not-yet-implemented section", () => {
    const model = getHomeEntrySurfaceModel();

    for (const item of HOME_ENTRY_SURFACE_NOT_YET_IMPLEMENTED) {
      expect(model.not_yet_implemented).toContain(item);
    }
  });

  it("creates a React element without mounting", () => {
    expect(isValidElement(HomeEntrySurface())).toBe(true);
  });

  it("does not contain unsafe URL, email, file path, credential or token strings", () => {
    const model = getHomeEntrySurfaceModel();
    const unsafeStrings = collectStrings(model).filter((value) =>
      UNSAFE_HOME_STRING_PATTERN.test(value),
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
