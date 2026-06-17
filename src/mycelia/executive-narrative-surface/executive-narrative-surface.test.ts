import { execFileSync } from "node:child_process";

import { createElement, isValidElement } from "react";
import { describe, expect, it } from "vitest";

import {
  EXECUTIVE_NARRATIVE_DEMO_PROOFS,
  EXECUTIVE_NARRATIVE_NOT_ACTIVE,
  EXECUTIVE_NARRATIVE_ROUTES,
  EXECUTIVE_NARRATIVE_SAFETY_BOUNDARY,
  ExecutiveNarrativeSurface,
  getExecutiveNarrativeSurfaceModel,
} from ".";

const ALLOWED_INTERNAL_ROUTES = new Set<string>([
  "/",
  "/mycelia",
  "/mycelia/static-demo",
  "/mycelia/roadmap",
  "/mycelia/walkthrough",
  "/mycelia/investigation",
  "/mycelia/executive",
]);
const UNSAFE_EXECUTIVE_STRING_PATTERN =
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
  const section = getExecutiveNarrativeSurfaceModel().sections.find(
    (candidate) => candidate.title === title,
  );

  return section?.items ?? [];
}

describe("executive narrative surface", () => {
  it("builds an executive model successfully", () => {
    const model = getExecutiveNarrativeSurfaceModel();

    expect(model.title).toBe("MYCELIA");
    expect(model.routes).toEqual(EXECUTIVE_NARRATIVE_ROUTES);
  });

  it("includes MYCELIA title", () => {
    expect(getExecutiveNarrativeSurfaceModel().title).toBe("MYCELIA");
  });

  it("includes all seven product routes", () => {
    expect(getExecutiveNarrativeSurfaceModel().routes).toEqual([
      "/",
      "/mycelia",
      "/mycelia/executive",
      "/mycelia/static-demo",
      "/mycelia/walkthrough",
      "/mycelia/investigation",
      "/mycelia/roadmap",
    ]);
  });

  it("includes required executive section titles", () => {
    const sectionTitles = getExecutiveNarrativeSurfaceModel().sections.map(
      (section) => section.title,
    );

    expect(sectionTitles).toContain("Problem");
    expect(sectionTitles).toContain("Solution");
    expect(sectionTitles).toContain("Why it matters");
    expect(sectionTitles).toContain("What exists now");
    expect(sectionTitles).toContain("What the demo proves");
    expect(sectionTitles).toContain("Not active yet");
    expect(sectionTitles).toContain("Safety boundary");
  });

  it("includes required not-active-yet items", () => {
    for (const item of EXECUTIVE_NARRATIVE_NOT_ACTIVE) {
      expect(sectionItems("Not active yet")).toContain(item);
    }
  });

  it("includes required safety boundary items", () => {
    for (const item of EXECUTIVE_NARRATIVE_SAFETY_BOUNDARY) {
      expect(sectionItems("Safety boundary")).toContain(item);
    }
  });

  it("includes required demo proof items", () => {
    for (const item of EXECUTIVE_NARRATIVE_DEMO_PROOFS) {
      expect(sectionItems("What the demo proves")).toContain(item);
    }
  });

  it("creates a React element without mounting", () => {
    expect(isValidElement(createElement(ExecutiveNarrativeSurface))).toBe(true);
  });

  it("has no unsafe URL, email, file path, credential or token strings", () => {
    const model = getExecutiveNarrativeSurfaceModel();
    const unsafeStrings = collectStrings(model)
      .filter((value) => !ALLOWED_INTERNAL_ROUTES.has(value))
      .filter((value) => UNSAFE_EXECUTIVE_STRING_PATTERN.test(value));

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
