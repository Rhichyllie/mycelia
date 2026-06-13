import { z } from "zod";

import {
  compareClassification,
  DataClassificationSchema,
  TenantIdSchema,
  type DataClassification,
  type TenantId,
  err,
  ok,
  type Result,
} from "../shared-kernel";
import {
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
  type SafeAuditMetadata,
} from "../audit-record";
import {
  type StaticDemoArtifact,
  type StaticDemoArtifactSection,
} from "../static-demo-artifact";

import {
  createStaticDemoTextRenderDenial,
  type StaticDemoTextRenderDenial,
} from "./static-demo-text-renderer-denial";
import { validateStaticDemoTextRenderRequest } from "./static-demo-text-renderer-checks";

export const MAX_STATIC_DEMO_TEXT_OUTPUT_CHARS = 20_000;

const UNSAFE_RENDERED_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|connection[_-]?string|credential|password|private[_-]?key|select\s|insert\s|update\s|delete\s|drop\s|sql|token)/i;

export type StaticDemoTextRenderRequest = {
  readonly tenant_id: TenantId;
  readonly artifact: StaticDemoArtifact;
  readonly include_metadata?: boolean;
  readonly include_limitations?: boolean;
  readonly max_output_chars?: number;
  readonly metadata?: SafeAuditMetadata;
};

export type StaticDemoTextRenderResult = {
  readonly tenant_id: TenantId;
  readonly rendered_text: string;
  readonly section_count: number;
  readonly character_count: number;
  readonly truncated: boolean;
  readonly data_classification: DataClassification;
  readonly rendered_at: string;
  readonly metadata?: SafeAuditMetadata;
};

const StaticDemoRenderedTextSchema = z
  .string()
  .min(1, "rendered_text is required.")
  .max(
    MAX_STATIC_DEMO_TEXT_OUTPUT_CHARS,
    "rendered_text exceeds the safe maximum length.",
  )
  .refine(
    (value) => !UNSAFE_RENDERED_TEXT_PATTERN.test(value),
    "rendered_text must be safe plain text.",
  );

export const StaticDemoTextRenderResultSchema = z
  .object({
    tenant_id: TenantIdSchema,
    rendered_text: StaticDemoRenderedTextSchema,
    section_count: z
      .number()
      .int("section_count must be an integer.")
      .nonnegative("section_count must be non-negative."),
    character_count: z
      .number()
      .int("character_count must be an integer.")
      .nonnegative("character_count must be non-negative."),
    truncated: z.boolean(),
    data_classification: DataClassificationSchema,
    rendered_at: z.string().refine(
      isAuditIsoDateTime,
      "rendered_at must be an ISO datetime string.",
    ),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((result, context) => {
    if (result.character_count !== result.rendered_text.length) {
      context.addIssue({
        code: "custom",
        message: "character_count must match rendered_text length.",
        path: ["character_count"],
      });
    }
  });

function shouldRenderSection(
  section: StaticDemoArtifactSection,
  includeLimitations: boolean,
): boolean {
  return (
    includeLimitations ||
    section.section_kind !== "LIMITATIONS_AND_NON_GOALS"
  );
}

function renderMetadataKeys(metadata: SafeAuditMetadata | undefined): string[] {
  if (metadata === undefined) {
    return [];
  }

  return [`Metadata Keys: ${Object.keys(metadata).sort().join(", ")}`];
}

function renderSection(section: StaticDemoArtifactSection): string[] {
  return [
    `${section.section_order}. ${section.title}`,
    `   Kind: ${section.section_kind}`,
    `   Summary: ${section.summary}`,
  ];
}

function buildRenderedText(
  artifact: StaticDemoArtifact,
  sections: readonly StaticDemoArtifactSection[],
  includeMetadata: boolean,
): string {
  const lines = [
    "MYCELIA Static Demo Artifact",
    "",
    `Title: ${artifact.title}`,
    `Summary: ${artifact.summary}`,
    `Artifact Kind: ${artifact.artifact_kind}`,
    `Exposure: ${artifact.exposure}`,
    `Data Classification: ${artifact.data_classification}`,
    "",
    "Sections:",
    ...sections.flatMap((section) => renderSection(section)),
  ];

  if (includeMetadata) {
    lines.push("", ...renderMetadataKeys(artifact.metadata));
  }

  return lines.join("\n");
}

function truncateText(
  renderedText: string,
  maxOutputChars: number | undefined,
): { readonly renderedText: string; readonly truncated: boolean } {
  if (
    maxOutputChars === undefined ||
    renderedText.length <= maxOutputChars
  ) {
    return {
      renderedText,
      truncated: false,
    };
  }

  return {
    renderedText: renderedText.slice(0, maxOutputChars),
    truncated: true,
  };
}

function validateResultAgainstArtifact(
  result: StaticDemoTextRenderResult,
  artifact: StaticDemoArtifact,
): Result<StaticDemoTextRenderResult, StaticDemoTextRenderDenial> {
  if (
    compareClassification(
      result.data_classification,
      artifact.data_classification,
    ) > 0
  ) {
    return err(
      createStaticDemoTextRenderDenial({
        code: "STATIC_DEMO_TEXT_RENDER_RESULT_INVALID",
        correlation_id: artifact.correlation_id,
      }),
    );
  }

  const parsed = StaticDemoTextRenderResultSchema.safeParse(result);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    return err(
      createStaticDemoTextRenderDenial({
        code:
          issuePath === "rendered_text"
            ? "UNSAFE_STATIC_DEMO_TEXT_RENDER_OUTPUT"
            : "STATIC_DEMO_TEXT_RENDER_RESULT_INVALID",
        correlation_id: artifact.correlation_id,
      }),
    );
  }

  return ok(parsed.data);
}

export function renderStaticDemoArtifactText(
  input: unknown,
): Result<StaticDemoTextRenderResult, StaticDemoTextRenderDenial> {
  const request = validateStaticDemoTextRenderRequest(input);

  if (!request.ok) {
    return err(request.error);
  }

  const includeLimitations = request.value.include_limitations ?? true;
  const includeMetadata = request.value.include_metadata ?? false;
  const sections = request.value.artifact.sections.filter((section) =>
    shouldRenderSection(section, includeLimitations),
  );
  const rendered = buildRenderedText(
    request.value.artifact,
    sections,
    includeMetadata,
  );
  const truncated = truncateText(
    rendered,
    request.value.max_output_chars,
  );
  const result: StaticDemoTextRenderResult = {
    tenant_id: request.value.tenant_id,
    rendered_text: truncated.renderedText,
    section_count: sections.length,
    character_count: truncated.renderedText.length,
    truncated: truncated.truncated,
    data_classification: request.value.artifact.data_classification,
    rendered_at: request.value.artifact.created_at,
    metadata: request.value.metadata,
  };

  return validateResultAgainstArtifact(result, request.value.artifact);
}
