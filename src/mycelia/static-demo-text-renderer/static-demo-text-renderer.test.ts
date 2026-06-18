import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { isAuditIsoDateTime } from "../audit-record";
import { firstStaticDemoArtifact } from "../first-static-demo";

import {
  assertStaticDemoTextRenderRequestValid,
  createStaticDemoTextRenderDenial,
  failClosedStaticDemoTextRender,
  renderStaticDemoArtifactText,
  validateStaticDemoTextRenderRequest,
} from ".";

function validRequest(overrides: Record<string, unknown> = {}) {
  return {
    tenant_id: firstStaticDemoArtifact.tenant_id,
    artifact: firstStaticDemoArtifact,
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function cloneArtifact() {
  return JSON.parse(JSON.stringify(firstStaticDemoArtifact));
}

describe("StaticDemoTextRenderer", () => {
  it("renders valid plain text for firstStaticDemoArtifact", () => {
    const result = renderStaticDemoArtifactText(validRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rendered_text).toContain(
        "MYCELIA Static Demo Artifact",
      );
      expect(result.value.rendered_text).toContain(
        firstStaticDemoArtifact.title,
      );
      expect(result.value.truncated).toBe(false);
    }
  });

  it("validates render requests for firstStaticDemoArtifact", () => {
    const result = validateStaticDemoTextRenderRequest(validRequest());

    expect(result.ok).toBe(true);
    expect(assertStaticDemoTextRenderRequestValid(validRequest()).ok).toBe(
      true,
    );
  });

  it("rejects tenant mismatch", () => {
    const result = validateStaticDemoTextRenderRequest(
      validRequest({
        tenant_id: "tenant_demo_public_002",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_TEXT_RENDER_TENANT_MISMATCH",
      );
    }
  });

  it("rejects invalid artifact", () => {
    const artifact = cloneArtifact();
    artifact.sections = [];

    const result = validateStaticDemoTextRenderRequest(
      validRequest({
        artifact,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_TEXT_RENDER_ARTIFACT_INVALID",
      );
    }
  });

  it("rejects invalid max_output_chars", () => {
    const zero = validateStaticDemoTextRenderRequest(
      validRequest({
        max_output_chars: 0,
      }),
    );
    const tooLarge = validateStaticDemoTextRenderRequest(
      validRequest({
        max_output_chars: 20_001,
      }),
    );

    expect(zero.ok).toBe(false);
    expect(tooLarge.ok).toBe(false);
    if (!zero.ok) {
      expect(zero.error.code).toBe(
        "STATIC_DEMO_TEXT_RENDER_MAX_OUTPUT_INVALID",
      );
    }
    if (!tooLarge.ok) {
      expect(tooLarge.error.code).toBe(
        "STATIC_DEMO_TEXT_RENDER_MAX_OUTPUT_INVALID",
      );
    }
  });

  it("rejects unsafe request metadata", () => {
    const result = validateStaticDemoTextRenderRequest(
      validRequest({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "UNSAFE_STATIC_DEMO_TEXT_RENDER_METADATA",
      );
    }
  });

  it("includes title, summary, artifact kind, exposure and ordered section titles", () => {
    const result = renderStaticDemoArtifactText(validRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rendered_text).toContain(
        `Title: ${firstStaticDemoArtifact.title}`,
      );
      expect(result.value.rendered_text).toContain(
        `Summary: ${firstStaticDemoArtifact.summary}`,
      );
      expect(result.value.rendered_text).toContain(
        `Artifact Kind: ${firstStaticDemoArtifact.artifact_kind}`,
      );
      expect(result.value.rendered_text).toContain(
        `Exposure: ${firstStaticDemoArtifact.exposure}`,
      );

      for (const section of firstStaticDemoArtifact.sections) {
        expect(result.value.rendered_text).toContain(section.title);
      }
    }
  });

  it("includes limitations and non-goals by default", () => {
    const result = renderStaticDemoArtifactText(validRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rendered_text).toContain(
        "Limitations and non goals",
      );
      expect(result.value.section_count).toBe(7);
    }
  });

  it("can omit limitations when include_limitations is false", () => {
    const result = renderStaticDemoArtifactText(
      validRequest({
        include_limitations: false,
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rendered_text).not.toContain(
        "Limitations and non goals",
      );
      expect(result.value.section_count).toBe(6);
    }
  });

  it("does not include metadata by default", () => {
    const result = renderStaticDemoArtifactText(validRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.rendered_text).not.toContain("Metadata Keys:");
    }
  });

  it("truncates safely when max_output_chars is provided", () => {
    const result = renderStaticDemoArtifactText(
      validRequest({
        max_output_chars: 120,
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.truncated).toBe(true);
      expect(result.value.rendered_text.length).toBeLessThanOrEqual(120);
      expect(result.value.character_count).toBe(
        result.value.rendered_text.length,
      );
    }
  });

  it("sets character_count to rendered_text length", () => {
    const result = renderStaticDemoArtifactText(validRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.character_count).toBe(
        result.value.rendered_text.length,
      );
    }
  });

  it("sets section_count to rendered section count", () => {
    const result = renderStaticDemoArtifactText(validRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.section_count).toBe(
        firstStaticDemoArtifact.sections.length,
      );
    }
  });

  it("does not mutate the artifact", () => {
    const before = JSON.stringify(firstStaticDemoArtifact);

    renderStaticDemoArtifactText(validRequest());

    expect(JSON.stringify(firstStaticDemoArtifact)).toBe(before);
  });

  it("returns a valid ISO rendered_at value", () => {
    const result = renderStaticDemoArtifactText(validRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(isAuditIsoDateTime(result.value.rendered_at)).toBe(true);
    }
  });

  it("keeps descriptor-only guarantees", () => {
    const result = renderStaticDemoArtifactText(validRequest());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty("file_path");
      expect(result.value).not.toHaveProperty("html");
      expect(result.value).not.toHaveProperty("markdown_path");
      expect(result.value).not.toHaveProperty("pdf_path");
      expect(result.value).not.toHaveProperty("api_response");
      expect(result.value).not.toHaveProperty("runtime_execution");
      expect(result.value).not.toHaveProperty("replay_simulation");
      expect(result.value).not.toHaveProperty("persisted_at");
      expect(result.value).not.toHaveProperty("emitted_event_id");
      expect(result.value).not.toHaveProperty("tool_invocation_id");
      expect(result.value).not.toHaveProperty("external_service_call");
    }
  });

  it("fails closed for malformed or missing requests", () => {
    const missing = renderStaticDemoArtifactText(undefined);
    const malformed = renderStaticDemoArtifactText({
      tenant_id: firstStaticDemoArtifact.tenant_id,
    });
    const failClosed = failClosedStaticDemoTextRender();

    expect(missing.ok).toBe(false);
    expect(malformed.ok).toBe(false);
    expect(failClosed.code).toBe("STATIC_DEMO_TEXT_RENDER_NOT_RENDERED");
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createStaticDemoTextRenderDenial({
      code: "STATIC_DEMO_TEXT_RENDER_ARTIFACT_INVALID",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_demo_public_002");
    expect(serialized).not.toContain("artifact_internals");
    expect(serialized).not.toContain("fixture_internals");
    expect(serialized).not.toContain("readiness_internals");
    expect(serialized).not.toContain("rendering_internals");
    expect(serialized).not.toContain("filesystem_internals");
    expect(serialized).not.toContain("runtime_internals");
    expect(serialized).not.toContain("external_service_details");
    expect(serialized).not.toContain("secret-token");
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
