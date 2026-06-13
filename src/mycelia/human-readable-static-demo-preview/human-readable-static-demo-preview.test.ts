import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { isAuditIsoDateTime } from "../audit-record";
import {
  firstStaticDemoArtifact,
  firstStaticDemoReadinessReport,
  validateFirstStaticDemoDescriptors,
} from "../first-static-demo";
import { renderStaticDemoArtifactText } from "../static-demo-text-renderer";

import {
  REQUIRED_HUMAN_READABLE_STATIC_DEMO_LIMITATIONS,
  buildHumanReadableFirstStaticDemoPreview,
  createHumanReadableStaticDemoPreviewDenial,
  failClosedHumanReadableStaticDemoPreview,
  validateHumanReadableFirstStaticDemoPreview,
  type HumanReadableStaticDemoPreview,
} from ".";

const UNSAFE_PREVIEW_STRING_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|connection[_-]?string|credential|password|private[_-]?key|select\s|insert\s|update\s|delete\s|drop\s|sql|token)/i;

const DESCRIPTOR_ONLY_FORBIDDEN_KEYS = [
  "api_call",
  "download_url",
  "downloadable_artifact",
  "emitted_event_id",
  "event_emission",
  "execute",
  "executed_at",
  "export_path",
  "external_service_call",
  "file_path",
  "generated_html",
  "generated_markdown_file",
  "generated_pdf",
  "html",
  "markdown_path",
  "persisted_at",
  "replay_simulation",
  "runtime_execution",
  "tool_call",
  "ui_component",
] as const;

function builtPreview(): HumanReadableStaticDemoPreview {
  const result = buildHumanReadableFirstStaticDemoPreview();

  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.code);
  }

  return result.value;
}

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

function collectKeys(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.flatMap((item) => collectKeys(item));
  }

  if (typeof input === "object" && input !== null) {
    return Object.entries(input).flatMap(([key, value]) => [
      key,
      ...collectKeys(value),
    ]);
  }

  return [];
}

describe("human-readable static demo preview", () => {
  it("buildHumanReadableFirstStaticDemoPreview returns success", () => {
    expect(buildHumanReadableFirstStaticDemoPreview().ok).toBe(true);
  });

  it("validateHumanReadableFirstStaticDemoPreview succeeds for the built preview", () => {
    const preview = builtPreview();

    expect(validateHumanReadableFirstStaticDemoPreview(preview).ok).toBe(
      true,
    );
  });

  it("contains title, summary and rendered text", () => {
    const preview = builtPreview();

    expect(preview.title).toBe(firstStaticDemoArtifact.title);
    expect(preview.summary).toBe(firstStaticDemoArtifact.summary);
    expect(preview.rendered_text).toContain(
      "MYCELIA Static Demo Artifact",
    );
    expect(preview.rendered_text).toContain(firstStaticDemoArtifact.title);
  });

  it("contains all expected section titles from the static demo artifact", () => {
    const preview = builtPreview();

    expect(preview.section_titles).toEqual(
      firstStaticDemoArtifact.sections.map((section) => section.title),
    );
  });

  it("sets section_count to section_titles length", () => {
    const preview = builtPreview();

    expect(preview.section_count).toBe(preview.section_titles.length);
  });

  it("sets character_count to rendered_text length", () => {
    const preview = builtPreview();

    expect(preview.character_count).toBe(preview.rendered_text.length);
  });

  it("uses customer-safe data classification", () => {
    const preview = builtPreview();

    expect(preview.data_classification).toBe("PUBLIC");
  });

  it("contains all required non-goal limitations", () => {
    const preview = builtPreview();

    for (const limitation of REQUIRED_HUMAN_READABLE_STATIC_DEMO_LIMITATIONS) {
      expect(preview.limitations).toContain(limitation);
    }
  });

  it("uses a valid ISO preview_generated_at timestamp", () => {
    const preview = builtPreview();

    expect(isAuditIsoDateTime(preview.preview_generated_at)).toBe(true);
  });

  it("does not mutate source descriptors", () => {
    const artifactBefore = JSON.stringify(firstStaticDemoArtifact);
    const readinessBefore = JSON.stringify(firstStaticDemoReadinessReport);

    buildHumanReadableFirstStaticDemoPreview();

    expect(JSON.stringify(firstStaticDemoArtifact)).toBe(artifactBefore);
    expect(JSON.stringify(firstStaticDemoReadinessReport)).toBe(
      readinessBefore,
    );
  });

  it("keeps unsafe strings absent from rendered_text and metadata", () => {
    const preview = builtPreview();
    const previewMetadataStrings = collectStrings(preview.metadata);

    expect(UNSAFE_PREVIEW_STRING_PATTERN.test(preview.rendered_text)).toBe(
      false,
    );
    expect(
      previewMetadataStrings.filter((value) =>
        UNSAFE_PREVIEW_STRING_PATTERN.test(value),
      ),
    ).toEqual([]);
  });

  it("respects the first static demo descriptor set validation", () => {
    const descriptorSet = validateFirstStaticDemoDescriptors();
    const preview = builtPreview();

    expect(descriptorSet.ok).toBe(true);
    if (descriptorSet.ok) {
      expect(preview.tenant_id).toBe(
        descriptorSet.value.static_demo_artifact.tenant_id,
      );
      expect(preview.generated_from_artifact_id).toBe(
        descriptorSet.value.static_demo_artifact.static_demo_artifact_id,
      );
    }
  });

  it("uses the static demo text renderer result", () => {
    const rendered = renderStaticDemoArtifactText({
      tenant_id: firstStaticDemoArtifact.tenant_id,
      artifact: firstStaticDemoArtifact,
      include_limitations: true,
    });
    const preview = builtPreview();

    expect(rendered.ok).toBe(true);
    if (rendered.ok) {
      expect(preview.rendered_text).toBe(rendered.value.rendered_text);
      expect(preview.character_count).toBe(rendered.value.character_count);
      expect(preview.section_count).toBe(rendered.value.section_count);
    }
  });

  it("fails closed for malformed preview", () => {
    const missing = validateHumanReadableFirstStaticDemoPreview(undefined);
    const malformed = validateHumanReadableFirstStaticDemoPreview({
      tenant_id: firstStaticDemoArtifact.tenant_id,
    });
    const failClosed = failClosedHumanReadableStaticDemoPreview();

    expect(missing.ok).toBe(false);
    expect(malformed.ok).toBe(false);
    expect(failClosed.code).toBe(
      "HUMAN_READABLE_STATIC_DEMO_PREVIEW_INVALID",
    );
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createHumanReadableStaticDemoPreviewDenial({
      code: "HUMAN_READABLE_STATIC_DEMO_PREVIEW_INVALID",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain(firstStaticDemoArtifact.tenant_id);
    expect(serialized).not.toContain("artifact_internals");
    expect(serialized).not.toContain("fixture_internals");
    expect(serialized).not.toContain("readiness_internals");
    expect(serialized).not.toContain("rendering_internals");
    expect(serialized).not.toContain("filesystem_internals");
    expect(serialized).not.toContain("runtime_internals");
    expect(serialized).not.toContain("external_service_details");
    expect(serialized).not.toContain("secret-token");
  });

  it("keeps descriptor-only guarantees", () => {
    const preview = builtPreview();
    const previewKeys = collectKeys(preview);

    for (const forbiddenKey of DESCRIPTOR_ONLY_FORBIDDEN_KEYS) {
      expect(previewKeys).not.toContain(forbiddenKey);
    }

    expect(preview.rendered_text).not.toContain("<html");
    expect(preview.rendered_text).not.toContain("<script");
    expect(preview.rendered_text).not.toContain("runtime executed");
    expect(preview.rendered_text).not.toContain("replay simulated");
    expect(preview.rendered_text).not.toContain("persisted");
    expect(preview.rendered_text).not.toContain("event emitted");
    expect(preview.rendered_text).not.toContain("tool called");
    expect(preview.rendered_text).not.toContain("external service called");
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
