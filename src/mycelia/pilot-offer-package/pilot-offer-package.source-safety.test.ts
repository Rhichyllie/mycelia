import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const packageSourcePath = new URL(
  "./pilot-offer-package.ts",
  import.meta.url,
);

const FORBIDDEN_PILOT_OFFER_SOURCE_PATTERNS = [
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

describe("pilot offer package source safety", () => {
  it("does not add runtime, browser, file, route or external service behavior", () => {
    const packageSource = source(packageSourcePath).toLowerCase();

    for (const pattern of FORBIDDEN_PILOT_OFFER_SOURCE_PATTERNS) {
      expect(packageSource).not.toContain(pattern.toLowerCase());
    }
  });

  it("does not add forms, action controls or external links", () => {
    const packageSource = source(packageSourcePath);

    expect(packageSource).not.toContain("<form");
    expect(packageSource).not.toContain("<button");
    expect(packageSource).not.toContain("target=");
    expect(packageSource).not.toContain("rel=");
    expect(packageSource).not.toContain("action=");
    expect(packageSource).not.toContain("http://");
    expect(packageSource).not.toContain("https://");
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
