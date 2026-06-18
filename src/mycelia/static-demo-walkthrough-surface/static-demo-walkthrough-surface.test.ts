import { execFileSync } from "node:child_process";

import { createElement, isValidElement } from "react";
import { describe, expect, it } from "vitest";

import {
  STATIC_DEMO_WALKTHROUGH_NOT_ACTIVE,
  STATIC_DEMO_WALKTHROUGH_ROUTES,
  STATIC_DEMO_WALKTHROUGH_SAFETY_BOUNDARY,
  STATIC_DEMO_WALKTHROUGH_STEP_TITLES,
  StaticDemoWalkthroughSurface,
  getStaticDemoWalkthroughSurfaceModel,
} from ".";

const ALLOWED_INTERNAL_ROUTES = new Set<string>([
  "/",
  "/mycelia",
  "/mycelia/static-demo",
  "/mycelia/roadmap",
  "/mycelia/walkthrough",
  "/mycelia/demo",
  "/mycelia/investigation",
  "/mycelia/executive",
]);
const UNSAFE_WALKTHROUGH_STRING_PATTERN =
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

describe("static demo walkthrough surface", () => {
  it("builds a walkthrough model successfully", () => {
    const model = getStaticDemoWalkthroughSurfaceModel();

    expect(model.title).toBe("MYCELIA");
    expect(model.routes).toEqual(STATIC_DEMO_WALKTHROUGH_ROUTES);
  });

  it("includes MYCELIA title", () => {
    expect(getStaticDemoWalkthroughSurfaceModel().title).toBe("MYCELIA");
  });

  it("includes all eight product routes", () => {
    expect(getStaticDemoWalkthroughSurfaceModel().routes).toEqual([
      "/",
      "/mycelia",
      "/mycelia/executive",
      "/mycelia/static-demo",
      "/mycelia/walkthrough",
      "/mycelia/demo",
      "/mycelia/investigation",
      "/mycelia/roadmap",
    ]);
  });

  it("includes all required guided steps", () => {
    const titles = getStaticDemoWalkthroughSurfaceModel().guided_steps.map(
      (step) => step.title,
    );

    for (const title of STATIC_DEMO_WALKTHROUGH_STEP_TITLES) {
      expect(titles).toContain(title);
    }
  });

  it("keeps guided steps ordered", () => {
    const orders = getStaticDemoWalkthroughSurfaceModel().guided_steps.map(
      (step) => step.step_order,
    );

    expect(orders).toEqual([...orders].sort((left, right) => left - right));
  });

  it("adds title, summary, descriptor focus and safety note to each step", () => {
    const steps = getStaticDemoWalkthroughSurfaceModel().guided_steps;

    for (const step of steps) {
      expect(step.title).toBeTruthy();
      expect(step.summary).toBeTruthy();
      expect(step.descriptor_focus).toBeTruthy();
      expect(step.safety_note).toBeTruthy();
    }
  });

  it("includes the required explanation sections", () => {
    const model = getStaticDemoWalkthroughSurfaceModel();

    expect(model.proof_section.title).toBe("What the walkthrough proves");
    expect(model.not_active_section.title).toBe("Not active yet");
    expect(model.safety_section.title).toBe("Safety boundary");
  });

  it("mentions the Executive surface", () => {
    const model = getStaticDemoWalkthroughSurfaceModel();

    expect(model.routes).toContain("/mycelia/executive");
    expect(model.navigation_callouts.map((callout) => callout.href)).toContain(
      "/mycelia/executive",
    );
  });

  it("includes required not-active-yet items", () => {
    const items = getStaticDemoWalkthroughSurfaceModel().not_active_section.items;

    for (const item of STATIC_DEMO_WALKTHROUGH_NOT_ACTIVE) {
      expect(items).toContain(item);
    }
  });

  it("includes required safety boundary items", () => {
    const items = getStaticDemoWalkthroughSurfaceModel().safety_section.items;

    for (const item of STATIC_DEMO_WALKTHROUGH_SAFETY_BOUNDARY) {
      expect(items).toContain(item);
    }
  });

  it("creates a React element without mounting", () => {
    expect(isValidElement(createElement(StaticDemoWalkthroughSurface))).toBe(
      true,
    );
  });

  it("has no unsafe URL, email, file path, credential or token strings", () => {
    const model = getStaticDemoWalkthroughSurfaceModel();
    const unsafeStrings = collectStrings(model)
      .filter((value) => !ALLOWED_INTERNAL_ROUTES.has(value))
      .filter((value) => UNSAFE_WALKTHROUGH_STRING_PATTERN.test(value));

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
