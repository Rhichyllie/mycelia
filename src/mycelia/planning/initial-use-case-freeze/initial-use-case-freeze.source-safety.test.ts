import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const freezeSourcePath = new URL(
  "./initial-use-case-freeze.ts",
  import.meta.url,
);

const FORBIDDEN_INITIAL_USE_CASE_SOURCE_PATTERNS = [
  "dangerouslySetInnerHTML",
  "fetch(",
  "axios",
  "XMLHttpRequest",
  "cookies(",
  "headers(",
  "redirect(",
  "notFound(",
  "revalidate",
  "server action",
  "\"use server\"",
  "'use server'",
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
  "node:fs",
  "node:path",
  "http://",
  "https://",
  "www.",
  "mapia",
  "URL.createObjectURL",
  "new Blob",
  "download=",
  "<a download",
  "pdfMake",
  "jsPDF",
  "generatePdf",
  "exportFile",
] as const;

function source(fileUrl: URL): string {
  return readFileSync(fileUrl, "utf8");
}

describe("initial use case freeze source safety", () => {
  it("does not add runtime, browser, file, route or external service behavior", () => {
    const freezeSource = source(freezeSourcePath).toLowerCase();

    for (const pattern of FORBIDDEN_INITIAL_USE_CASE_SOURCE_PATTERNS) {
      expect(freezeSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("does not add forms, action controls or external links", () => {
    const freezeSource = source(freezeSourcePath);

    expect(freezeSource).not.toContain("<form");
    expect(freezeSource).not.toContain("<button");
    expect(freezeSource).not.toContain("target=");
    expect(freezeSource).not.toContain("rel=");
    expect(freezeSource).not.toContain("action=");
    expect(freezeSource).not.toContain("http://");
    expect(freezeSource).not.toContain("https://");
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
