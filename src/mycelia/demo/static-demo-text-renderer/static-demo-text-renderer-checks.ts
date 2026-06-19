import {
  TenantIdSchema,
  err,
  ok,
  type CorrelationId,
  type Result,
} from "../../foundation/shared-kernel";
import { SafeAuditMetadataSchema } from "../../domain-contracts/audit-record";
import { validateStaticDemoArtifact } from "../../domain-contracts/static-demo-artifact";

import { type StaticDemoTextRenderRequest } from "./static-demo-text-renderer";
import {
  createStaticDemoTextRenderDenial,
  type StaticDemoTextRenderDenial,
} from "./static-demo-text-renderer-denial";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

const MAX_STATIC_DEMO_TEXT_OUTPUT_CHARS = 20_000;

function hasUnsafeMetadata(input: Record<string, unknown>): boolean {
  return (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  );
}

export function validateStaticDemoTextRenderRequest(
  input: unknown,
): Result<StaticDemoTextRenderRequest, StaticDemoTextRenderDenial> {
  if (!isRecord(input)) {
    return err(
      createStaticDemoTextRenderDenial({
        code: "STATIC_DEMO_TEXT_RENDER_REQUEST_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(
      createStaticDemoTextRenderDenial({ code: "TENANT_ID_REQUIRED" }),
    );
  }

  const tenantId = TenantIdSchema.safeParse(input.tenant_id);

  if (!tenantId.success) {
    return err(
      createStaticDemoTextRenderDenial({ code: "TENANT_ID_REQUIRED" }),
    );
  }

  if (input.artifact === undefined) {
    return err(
      createStaticDemoTextRenderDenial({
        code: "STATIC_DEMO_TEXT_RENDER_ARTIFACT_REQUIRED",
      }),
    );
  }

  const artifact = validateStaticDemoArtifact(input.artifact);

  if (!artifact.ok) {
    return err(
      createStaticDemoTextRenderDenial({
        code: "STATIC_DEMO_TEXT_RENDER_ARTIFACT_INVALID",
      }),
    );
  }

  if (artifact.value.tenant_id !== tenantId.data) {
    return err(
      createStaticDemoTextRenderDenial({
        code: "STATIC_DEMO_TEXT_RENDER_TENANT_MISMATCH",
        correlation_id: artifact.value.correlation_id,
      }),
    );
  }

  if (
    input.include_metadata !== undefined &&
    typeof input.include_metadata !== "boolean"
  ) {
    return err(
      createStaticDemoTextRenderDenial({
        code: "STATIC_DEMO_TEXT_RENDER_REQUEST_REQUIRED",
        correlation_id: artifact.value.correlation_id,
      }),
    );
  }

  if (
    input.include_limitations !== undefined &&
    typeof input.include_limitations !== "boolean"
  ) {
    return err(
      createStaticDemoTextRenderDenial({
        code: "STATIC_DEMO_TEXT_RENDER_REQUEST_REQUIRED",
        correlation_id: artifact.value.correlation_id,
      }),
    );
  }

  if (
    input.max_output_chars !== undefined &&
    (!Number.isInteger(input.max_output_chars) ||
      typeof input.max_output_chars !== "number" ||
      input.max_output_chars <= 0 ||
      input.max_output_chars > MAX_STATIC_DEMO_TEXT_OUTPUT_CHARS)
  ) {
    return err(
      createStaticDemoTextRenderDenial({
        code: "STATIC_DEMO_TEXT_RENDER_MAX_OUTPUT_INVALID",
        correlation_id: artifact.value.correlation_id,
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createStaticDemoTextRenderDenial({
        code: "UNSAFE_STATIC_DEMO_TEXT_RENDER_METADATA",
        correlation_id: artifact.value.correlation_id,
      }),
    );
  }

  return ok({
    tenant_id: tenantId.data,
    artifact: artifact.value,
    include_metadata: input.include_metadata,
    include_limitations: input.include_limitations,
    max_output_chars: input.max_output_chars,
    metadata:
      input.metadata === undefined
        ? undefined
        : SafeAuditMetadataSchema.parse(input.metadata),
  });
}

export function assertStaticDemoTextRenderRequestValid(
  input: unknown,
): Result<StaticDemoTextRenderRequest, StaticDemoTextRenderDenial> {
  return validateStaticDemoTextRenderRequest(input);
}

export function failClosedStaticDemoTextRender(
  correlation_id?: CorrelationId,
): StaticDemoTextRenderDenial {
  return createStaticDemoTextRenderDenial({
    code: "STATIC_DEMO_TEXT_RENDER_NOT_RENDERED",
    correlation_id,
  });
}
