import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { isValidElement } from "react";
import { describe, expect, it } from "vitest";

import { firstStaticDemoArtifact } from "../first-static-demo";

import {
  READ_ONLY_STATIC_DEMO_BADGES,
  READ_ONLY_STATIC_DEMO_LIMITATIONS,
  ReadOnlyStaticDemoPage,
  getReadOnlyStaticDemoPageModel,
} from ".";

const UNSAFE_PAGE_STRING_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|connection[_-]?string|credential|password|private[_-]?key|select\s|insert\s|update\s|delete\s|drop\s|sql|token)/i;

const FORBIDDEN_SOURCE_PATTERNS = [
  "dangerouslySetInnerHTML",
  "fetch(",
  "XMLHttpRequest",
  "server action",
  "cookies(",
  "localStorage",
  "sessionStorage",
  "setTimeout",
  "setInterval",
  "Math.random",
  "Date.now",
  "readFile",
  "writeFile",
  "createReadStream",
  "createWriteStream",
  "download=",
  "download:",
  "jsPDF",
  "pdf",
  "marked(",
  "remark",
  "rehype",
  "window.",
  "document.",
] as const;

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

function pageSource(): string {
  return readFileSync(
    new URL("./read-only-static-demo-page.tsx", import.meta.url),
    "utf8",
  );
}

describe("read-only static demo page", () => {
  it("builds a ready page model from the static preview", () => {
    const model = getReadOnlyStaticDemoPageModel();

    expect(model.status).toBe("READY");
    expect(model.page_title).toBe("MYCELIA");
  });

  it("returns a pure React element without mounting", () => {
    expect(isValidElement(ReadOnlyStaticDemoPage())).toBe(true);
  });

  it("includes the MYCELIA title", () => {
    const model = getReadOnlyStaticDemoPageModel();

    expect(model.page_title).toBe("MYCELIA");
    expect(model.product_framing).toContain(
      "Governed operational intelligence",
    );
  });

  it("includes descriptor-level preview warning badges", () => {
    const model = getReadOnlyStaticDemoPageModel();

    for (const badge of READ_ONLY_STATIC_DEMO_BADGES) {
      expect(model.badges).toContain(badge);
    }
  });

  it("includes no-runtime, no-persistence and no-external-service limitations", () => {
    const model = getReadOnlyStaticDemoPageModel();

    expect(model.limitations).toContain("no runtime execution");
    expect(model.limitations).toContain("no persistence");
    expect(model.limitations).toContain("no external services");
    expect(model.badges).toContain("No runtime execution");
    expect(model.badges).toContain("No persistence");
    expect(model.badges).toContain("No external service calls");
    expect(model.badges).toContain("No export");
  });

  it("includes preview title and summary", () => {
    const model = getReadOnlyStaticDemoPageModel();

    expect(model.preview_title).toBe(firstStaticDemoArtifact.title);
    expect(model.preview_summary).toBe(firstStaticDemoArtifact.summary);
  });

  it("includes rendered plain text preview", () => {
    const model = getReadOnlyStaticDemoPageModel();

    expect(model.rendered_text).toContain(
      "MYCELIA Static Demo Artifact",
    );
    expect(model.rendered_text).toContain(firstStaticDemoArtifact.title);
  });

  it("does not expose metadata by default", () => {
    const model = getReadOnlyStaticDemoPageModel();

    expect(model).not.toHaveProperty("metadata");
    expect(model.rendered_text).not.toContain("Metadata Keys:");
  });

  it("has no unsafe URL, email, path, credential or token strings", () => {
    const model = getReadOnlyStaticDemoPageModel();
    const unsafeStrings = collectStrings(model).filter((value) =>
      UNSAFE_PAGE_STRING_PATTERN.test(value),
    );

    expect(unsafeStrings).toEqual([]);
  });

  it("renders the expected static demo sections", () => {
    const model = getReadOnlyStaticDemoPageModel();

    expect(model.section_titles).toEqual(
      firstStaticDemoArtifact.sections.map((section) => section.title),
    );
    expect(model.section_count).toBe(model.section_titles.length);
    expect(model.character_count).toBe(model.rendered_text.length);
  });

  it("keeps all required read-only limitations in the model", () => {
    const model = getReadOnlyStaticDemoPageModel();

    for (const limitation of READ_ONLY_STATIC_DEMO_LIMITATIONS) {
      expect(model.limitations).toContain(limitation);
    }
  });

  it("does not use dangerous HTML, API, storage, timer, export or PDF behavior", () => {
    const source = pageSource();

    for (const pattern of FORBIDDEN_SOURCE_PATTERNS) {
      expect(source).not.toContain(pattern);
    }
  });

  it("does not contain forms, action buttons or external links", () => {
    const source = pageSource();

    expect(source).not.toContain("<form");
    expect(source).not.toContain("<button");
    expect(source).not.toContain("<a ");
    expect(source).not.toContain("href=");
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
