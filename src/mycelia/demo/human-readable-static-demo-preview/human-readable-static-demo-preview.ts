import { z } from "zod";

import {
  DataClassificationSchema,
  TenantIdSchema,
  err,
  ok,
  type DataClassification,
  type Result,
  type TenantId,
} from "../../foundation/shared-kernel";
import {
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
  type SafeAuditMetadata,
} from "../../domain-contracts/audit-record";
import {
  validateFirstStaticDemoDescriptors,
} from "../../demo/first-static-demo";
import {
  MAX_STATIC_DEMO_TEXT_OUTPUT_CHARS,
  renderStaticDemoArtifactText,
} from "../../demo/static-demo-text-renderer";

export const HumanReadableStaticDemoPreviewStatuses = [
  "READY",
  "NOT_READY",
] as const;

export type HumanReadableStaticDemoPreviewStatus =
  (typeof HumanReadableStaticDemoPreviewStatuses)[number];

export const HumanReadableStaticDemoPreviewStatusSchema = z.enum(
  HumanReadableStaticDemoPreviewStatuses,
);

export const REQUIRED_HUMAN_READABLE_STATIC_DEMO_LIMITATIONS = [
  "no runtime execution",
  "no replay simulation",
  "no persistence",
  "no UI rendering",
  "no file export",
  "no downloadable artifact",
  "no API calls",
  "no tools",
  "no external services",
] as const;

const MAX_PREVIEW_TITLE_LENGTH = 120;
const MAX_PREVIEW_SUMMARY_LENGTH = 320;
const MAX_PREVIEW_LIMITATION_LENGTH = 80;
const UNSAFE_PREVIEW_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|connection[_-]?string|credential|password|private[_-]?key|select\s|insert\s|update\s|delete\s|drop\s|sql|token)/i;

export const HumanReadableStaticDemoPreviewTextSchema = z
  .string()
  .min(1, "preview text is required.")
  .max(MAX_PREVIEW_SUMMARY_LENGTH, "preview text exceeds safe length.")
  .refine(
    (value) => !UNSAFE_PREVIEW_TEXT_PATTERN.test(value),
    "preview text must be safe and non-enumerating.",
  );

const HumanReadableStaticDemoPreviewTitleSchema =
  HumanReadableStaticDemoPreviewTextSchema.max(
    MAX_PREVIEW_TITLE_LENGTH,
    "preview title exceeds safe length.",
  );

const HumanReadableStaticDemoRenderedTextSchema = z
  .string()
  .min(1, "rendered_text is required.")
  .max(
    MAX_STATIC_DEMO_TEXT_OUTPUT_CHARS,
    "rendered_text exceeds the safe maximum length.",
  )
  .refine(
    (value) => !UNSAFE_PREVIEW_TEXT_PATTERN.test(value),
    "rendered_text must be safe plain text.",
  );

const HumanReadableStaticDemoLimitationSchema = z
  .string()
  .min(1, "limitation is required.")
  .max(
    MAX_PREVIEW_LIMITATION_LENGTH,
    "limitation exceeds safe length.",
  )
  .refine(
    (value) => !UNSAFE_PREVIEW_TEXT_PATTERN.test(value),
    "limitation must be safe and non-enumerating.",
  );

export type HumanReadableStaticDemoPreviewSection = {
  readonly section_order: number;
  readonly title: string;
  readonly data_classification: DataClassification;
};

export const HumanReadableStaticDemoPreviewSectionSchema = z
  .object({
    section_order: z
      .number()
      .int("section_order must be an integer.")
      .positive("section_order must be positive."),
    title: HumanReadableStaticDemoPreviewTitleSchema,
    data_classification: DataClassificationSchema,
  })
  .strict();

export type HumanReadableStaticDemoPreview = {
  readonly tenant_id: TenantId;
  readonly status: HumanReadableStaticDemoPreviewStatus;
  readonly title: string;
  readonly summary: string;
  readonly rendered_text: string;
  readonly section_titles: readonly string[];
  readonly sections: readonly HumanReadableStaticDemoPreviewSection[];
  readonly section_count: number;
  readonly character_count: number;
  readonly data_classification: DataClassification;
  readonly generated_from_artifact_id: string;
  readonly generated_from_readiness_report_id?: string;
  readonly limitations: readonly string[];
  readonly preview_generated_at: string;
  readonly metadata?: SafeAuditMetadata;
};

export const HumanReadableStaticDemoPreviewSchema = z
  .object({
    tenant_id: TenantIdSchema,
    status: HumanReadableStaticDemoPreviewStatusSchema,
    title: HumanReadableStaticDemoPreviewTitleSchema,
    summary: HumanReadableStaticDemoPreviewTextSchema,
    rendered_text: HumanReadableStaticDemoRenderedTextSchema,
    section_titles: z
      .array(HumanReadableStaticDemoPreviewTitleSchema)
      .min(1, "section_titles must be non-empty."),
    sections: z
      .array(HumanReadableStaticDemoPreviewSectionSchema)
      .min(1, "sections must be non-empty."),
    section_count: z
      .number()
      .int("section_count must be an integer.")
      .positive("section_count must be positive."),
    character_count: z
      .number()
      .int("character_count must be an integer.")
      .positive("character_count must be positive."),
    data_classification: DataClassificationSchema.refine(
      (classification) => classification === "PUBLIC",
      "data_classification must be customer-safe.",
    ),
    generated_from_artifact_id:
      HumanReadableStaticDemoPreviewTitleSchema,
    generated_from_readiness_report_id:
      HumanReadableStaticDemoPreviewTitleSchema.optional(),
    limitations: z
      .array(HumanReadableStaticDemoLimitationSchema)
      .min(
        REQUIRED_HUMAN_READABLE_STATIC_DEMO_LIMITATIONS.length,
        "limitations must include all required non-goals.",
      ),
    preview_generated_at: z.string().refine(
      isAuditIsoDateTime,
      "preview_generated_at must be an ISO datetime string.",
    ),
    metadata: SafeAuditMetadataSchema.optional(),
  })
  .strict()
  .superRefine((preview, context) => {
    if (preview.section_count !== preview.section_titles.length) {
      context.addIssue({
        code: "custom",
        message: "section_count must match section_titles length.",
        path: ["section_count"],
      });
    }

    if (preview.section_count !== preview.sections.length) {
      context.addIssue({
        code: "custom",
        message: "section_count must match sections length.",
        path: ["sections"],
      });
    }

    if (preview.character_count !== preview.rendered_text.length) {
      context.addIssue({
        code: "custom",
        message: "character_count must match rendered_text length.",
        path: ["character_count"],
      });
    }

    for (const limitation of REQUIRED_HUMAN_READABLE_STATIC_DEMO_LIMITATIONS) {
      if (!preview.limitations.includes(limitation)) {
        context.addIssue({
          code: "custom",
          message: "limitations must include all required non-goals.",
          path: ["limitations"],
        });
      }
    }
  });

export type HumanReadableStaticDemoPreviewDenialCode =
  | "HUMAN_READABLE_STATIC_DEMO_PREVIEW_REQUIRED"
  | "TENANT_ID_REQUIRED"
  | "HUMAN_READABLE_STATIC_DEMO_PREVIEW_INVALID"
  | "UNSAFE_HUMAN_READABLE_STATIC_DEMO_PREVIEW_TEXT"
  | "UNSAFE_HUMAN_READABLE_STATIC_DEMO_PREVIEW_METADATA"
  | "HUMAN_READABLE_STATIC_DEMO_PREVIEW_LIMITATIONS_INVALID"
  | "HUMAN_READABLE_STATIC_DEMO_PREVIEW_TIMESTAMP_INVALID"
  | "HUMAN_READABLE_STATIC_DEMO_DESCRIPTOR_SET_INVALID"
  | "HUMAN_READABLE_STATIC_DEMO_RENDER_FAILED";

export type HumanReadableStaticDemoPreviewDenial = {
  readonly code: HumanReadableStaticDemoPreviewDenialCode;
  readonly message: string;
};

const denialMessages: Record<
  HumanReadableStaticDemoPreviewDenialCode,
  string
> = {
  HUMAN_READABLE_STATIC_DEMO_PREVIEW_REQUIRED:
    "Human-readable static demo preview is required.",
  TENANT_ID_REQUIRED: "Tenant scope is required.",
  HUMAN_READABLE_STATIC_DEMO_PREVIEW_INVALID:
    "Human-readable static demo preview is invalid.",
  UNSAFE_HUMAN_READABLE_STATIC_DEMO_PREVIEW_TEXT:
    "Human-readable static demo preview contains unsafe text.",
  UNSAFE_HUMAN_READABLE_STATIC_DEMO_PREVIEW_METADATA:
    "Human-readable static demo preview metadata is unsafe.",
  HUMAN_READABLE_STATIC_DEMO_PREVIEW_LIMITATIONS_INVALID:
    "Human-readable static demo preview limitations are invalid.",
  HUMAN_READABLE_STATIC_DEMO_PREVIEW_TIMESTAMP_INVALID:
    "Human-readable static demo preview timestamp is invalid.",
  HUMAN_READABLE_STATIC_DEMO_DESCRIPTOR_SET_INVALID:
    "Static demo descriptor set is invalid.",
  HUMAN_READABLE_STATIC_DEMO_RENDER_FAILED:
    "Static demo text rendering failed.",
};

export function createHumanReadableStaticDemoPreviewDenial(input: {
  readonly code: HumanReadableStaticDemoPreviewDenialCode;
}): HumanReadableStaticDemoPreviewDenial {
  return {
    code: input.code,
    message: denialMessages[input.code],
  };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return (
    typeof input === "object" &&
    input !== null &&
    !Array.isArray(input)
  );
}

function previewDenialCodeForIssue(
  issuePath: string | undefined,
): HumanReadableStaticDemoPreviewDenialCode {
  if (issuePath === "tenant_id") {
    return "TENANT_ID_REQUIRED";
  }

  if (issuePath === "metadata") {
    return "UNSAFE_HUMAN_READABLE_STATIC_DEMO_PREVIEW_METADATA";
  }

  if (issuePath === "rendered_text" || issuePath === "title") {
    return "UNSAFE_HUMAN_READABLE_STATIC_DEMO_PREVIEW_TEXT";
  }

  if (issuePath === "limitations") {
    return "HUMAN_READABLE_STATIC_DEMO_PREVIEW_LIMITATIONS_INVALID";
  }

  if (issuePath === "preview_generated_at") {
    return "HUMAN_READABLE_STATIC_DEMO_PREVIEW_TIMESTAMP_INVALID";
  }

  return "HUMAN_READABLE_STATIC_DEMO_PREVIEW_INVALID";
}

export function validateHumanReadableFirstStaticDemoPreview(
  input: unknown,
): Result<
  HumanReadableStaticDemoPreview,
  HumanReadableStaticDemoPreviewDenial
> {
  if (!isRecord(input)) {
    return err(
      createHumanReadableStaticDemoPreviewDenial({
        code: "HUMAN_READABLE_STATIC_DEMO_PREVIEW_REQUIRED",
      }),
    );
  }

  const parsed = HumanReadableStaticDemoPreviewSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    return err(
      createHumanReadableStaticDemoPreviewDenial({
        code: previewDenialCodeForIssue(issuePath),
      }),
    );
  }

  return ok(parsed.data);
}

export function assertHumanReadableFirstStaticDemoPreviewValid(
  input: unknown,
): Result<
  HumanReadableStaticDemoPreview,
  HumanReadableStaticDemoPreviewDenial
> {
  return validateHumanReadableFirstStaticDemoPreview(input);
}

export function failClosedHumanReadableStaticDemoPreview(
  code: HumanReadableStaticDemoPreviewDenialCode =
    "HUMAN_READABLE_STATIC_DEMO_PREVIEW_INVALID",
): HumanReadableStaticDemoPreviewDenial {
  return createHumanReadableStaticDemoPreviewDenial({
    code,
  });
}

export function buildHumanReadableFirstStaticDemoPreview(): Result<
  HumanReadableStaticDemoPreview,
  HumanReadableStaticDemoPreviewDenial
> {
  const descriptors = validateFirstStaticDemoDescriptors();

  if (!descriptors.ok) {
    return err(
      failClosedHumanReadableStaticDemoPreview(
        "HUMAN_READABLE_STATIC_DEMO_DESCRIPTOR_SET_INVALID",
      ),
    );
  }

  const artifact = descriptors.value.static_demo_artifact;
  const readinessReport = descriptors.value.readiness_report;
  const rendered = renderStaticDemoArtifactText({
    tenant_id: artifact.tenant_id,
    artifact,
    include_limitations: true,
  });

  if (!rendered.ok) {
    return err(
      failClosedHumanReadableStaticDemoPreview(
        "HUMAN_READABLE_STATIC_DEMO_RENDER_FAILED",
      ),
    );
  }

  const preview: HumanReadableStaticDemoPreview = {
    tenant_id: artifact.tenant_id,
    status: "READY",
    title: artifact.title,
    summary: artifact.summary,
    rendered_text: rendered.value.rendered_text,
    section_titles: artifact.sections.map((section) => section.title),
    sections: artifact.sections.map((section) => ({
      section_order: section.section_order,
      title: section.title,
      data_classification: section.data_classification,
    })),
    section_count: rendered.value.section_count,
    character_count: rendered.value.character_count,
    data_classification: rendered.value.data_classification,
    generated_from_artifact_id: artifact.static_demo_artifact_id,
    generated_from_readiness_report_id:
      readinessReport.demo_readiness_report_id,
    limitations: [...REQUIRED_HUMAN_READABLE_STATIC_DEMO_LIMITATIONS],
    preview_generated_at: rendered.value.rendered_at,
    metadata: {
      descriptor: "only",
      preview: "static",
    },
  };

  return validateHumanReadableFirstStaticDemoPreview(preview);
}
