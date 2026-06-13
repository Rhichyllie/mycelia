import {
  DataClassificationSchema,
  err,
  ok,
  type Result,
} from "../shared-kernel";
import { type CorrelationId } from "../shared-kernel";
import {
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../audit-record";
import {
  DemoScenarioDescriptionSchema,
  DemoScenarioReferenceSchema,
  DemoScenarioTitleSchema,
} from "../demo-scenario";
import { validateDemoReadinessReport } from "../demo-readiness-report";
import { validateDemoScenarioFixtureManifest } from "../demo-scenario-fixture";

import {
  createStaticDemoArtifactDenial,
  type StaticDemoArtifactDenial,
} from "./static-demo-artifact-denial";
import {
  StaticDemoArtifactExposureSchema,
  isStaticDemoArtifactExposureCompatible,
  type StaticDemoArtifactExposure,
} from "./static-demo-artifact-exposure";
import {
  StaticDemoArtifactKindSchema,
  type StaticDemoArtifactKind,
} from "./static-demo-artifact-kind";
import {
  StaticDemoArtifactSectionKindSchema,
  StaticDemoArtifactSectionSchema,
  type StaticDemoArtifactSection,
} from "./static-demo-artifact-section";
import {
  StaticDemoArtifactSchema,
  type StaticDemoArtifact,
} from "./static-demo-artifact";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasUnsafeMetadata(input: Record<string, unknown>): boolean {
  return (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  );
}

export function validateStaticDemoArtifactKind(
  input: unknown,
): Result<StaticDemoArtifactKind, StaticDemoArtifactDenial> {
  const parsed = StaticDemoArtifactKindSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_KIND_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateStaticDemoArtifactExposure(
  input: unknown,
): Result<StaticDemoArtifactExposure, StaticDemoArtifactDenial> {
  const parsed = StaticDemoArtifactExposureSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_EXPOSURE_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateStaticDemoArtifactSection(
  input: unknown,
): Result<StaticDemoArtifactSection, StaticDemoArtifactDenial> {
  if (!isRecord(input)) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_SECTION_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(
      createStaticDemoArtifactDenial({ code: "TENANT_ID_REQUIRED" }),
    );
  }

  if (
    !Number.isInteger(input.section_order) ||
    typeof input.section_order !== "number" ||
    input.section_order <= 0
  ) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_SECTION_ORDER_INVALID",
      }),
    );
  }

  if (
    !StaticDemoArtifactSectionKindSchema.safeParse(
      input.section_kind,
    ).success
  ) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_SECTION_KIND_INVALID",
      }),
    );
  }

  if (
    !DemoScenarioTitleSchema.safeParse(input.title).success ||
    !DemoScenarioDescriptionSchema.safeParse(input.summary).success
  ) {
    return err(
      createStaticDemoArtifactDenial({
        code: "UNSAFE_STATIC_DEMO_ARTIFACT_TEXT",
      }),
    );
  }

  if (
    input.descriptor_ref !== undefined &&
    !DemoScenarioReferenceSchema.safeParse(input.descriptor_ref).success
  ) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_SECTION_REF_INVALID",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createStaticDemoArtifactDenial({
        code: "UNSAFE_STATIC_DEMO_ARTIFACT_METADATA",
      }),
    );
  }

  const parsed = StaticDemoArtifactSectionSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_SECTION_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function isStaticDemoArtifactOrdered(
  sections: readonly Pick<StaticDemoArtifactSection, "section_order">[],
): boolean {
  for (let index = 1; index < sections.length; index += 1) {
    if (sections[index].section_order <= sections[index - 1].section_order) {
      return false;
    }
  }

  return true;
}

export function validateStaticDemoArtifact(
  input: unknown,
): Result<StaticDemoArtifact, StaticDemoArtifactDenial> {
  if (!isRecord(input)) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_REQUIRED",
      }),
    );
  }

  if (input.static_demo_artifact_id === undefined) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_ID_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(
      createStaticDemoArtifactDenial({ code: "TENANT_ID_REQUIRED" }),
    );
  }

  if (input.project_id !== undefined && input.workspace_id === undefined) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_SCOPE_INVALID",
      }),
    );
  }

  if (!StaticDemoArtifactKindSchema.safeParse(input.artifact_kind).success) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_KIND_INVALID",
      }),
    );
  }

  const exposure = validateStaticDemoArtifactExposure(input.exposure);

  if (!exposure.ok) {
    return exposure;
  }

  if (
    !DemoScenarioTitleSchema.safeParse(input.title).success ||
    !DemoScenarioDescriptionSchema.safeParse(input.summary).success
  ) {
    return err(
      createStaticDemoArtifactDenial({
        code: "UNSAFE_STATIC_DEMO_ARTIFACT_TEXT",
      }),
    );
  }

  if (
    input.fixture_manifest_ref === undefined &&
    input.readiness_report_ref === undefined &&
    input.fixture_manifest === undefined &&
    input.readiness_report === undefined
  ) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_SUBJECT_REQUIRED",
      }),
    );
  }

  if (
    input.fixture_manifest_ref !== undefined &&
    !DemoScenarioReferenceSchema.safeParse(
      input.fixture_manifest_ref,
    ).success
  ) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_REF_INVALID",
      }),
    );
  }

  if (
    input.readiness_report_ref !== undefined &&
    !DemoScenarioReferenceSchema.safeParse(
      input.readiness_report_ref,
    ).success
  ) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_READINESS_REPORT_REF_INVALID",
      }),
    );
  }

  if (input.fixture_manifest !== undefined) {
    const manifest = validateDemoScenarioFixtureManifest(
      input.fixture_manifest,
    );

    if (!manifest.ok) {
      return err(
        createStaticDemoArtifactDenial({
          code: "STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_INVALID",
        }),
      );
    }

    if (manifest.value.tenant_id !== input.tenant_id) {
      return err(
        createStaticDemoArtifactDenial({
          code: "STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_TENANT_MISMATCH",
        }),
      );
    }
  }

  if (input.readiness_report !== undefined) {
    const report = validateDemoReadinessReport(input.readiness_report);

    if (!report.ok) {
      return err(
        createStaticDemoArtifactDenial({
          code: "STATIC_DEMO_ARTIFACT_READINESS_REPORT_INVALID",
        }),
      );
    }

    if (report.value.tenant_id !== input.tenant_id) {
      return err(
        createStaticDemoArtifactDenial({
          code: "STATIC_DEMO_ARTIFACT_READINESS_REPORT_TENANT_MISMATCH",
          correlation_id: report.value.correlation_id,
        }),
      );
    }
  }

  if (!Array.isArray(input.sections) || input.sections.length === 0) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_SECTIONS_REQUIRED",
      }),
    );
  }

  const sections: StaticDemoArtifactSection[] = [];

  for (const sectionInput of input.sections) {
    const section = validateStaticDemoArtifactSection(sectionInput);

    if (!section.ok) {
      return err(section.error);
    }

    if (section.value.tenant_id !== input.tenant_id) {
      return err(
        createStaticDemoArtifactDenial({
          code: "STATIC_DEMO_ARTIFACT_SECTION_TENANT_MISMATCH",
        }),
      );
    }

    sections.push(section.value);
  }

  if (!isStaticDemoArtifactOrdered(sections)) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_SECTION_ORDER_INVALID",
      }),
    );
  }

  const artifactClassification = DataClassificationSchema.safeParse(
    input.data_classification,
  );

  if (!artifactClassification.success) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_INVALID",
      }),
    );
  }

  if (
    !isStaticDemoArtifactExposureCompatible(exposure.value, [
      artifactClassification.data,
      ...sections.map((section) => section.data_classification),
    ])
  ) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_EXPOSURE_INCOMPATIBLE",
      }),
    );
  }

  if (
    typeof input.created_at !== "string" ||
    !isAuditIsoDateTime(input.created_at)
  ) {
    return err(
      createStaticDemoArtifactDenial({
        code: "INVALID_STATIC_DEMO_ARTIFACT_TIMESTAMP",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createStaticDemoArtifactDenial({
        code: "UNSAFE_STATIC_DEMO_ARTIFACT_METADATA",
      }),
    );
  }

  const parsed = StaticDemoArtifactSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (issuePath?.includes("project_id")) {
      return err(
        createStaticDemoArtifactDenial({
          code: "STATIC_DEMO_ARTIFACT_SCOPE_INVALID",
        }),
      );
    }

    if (issuePath?.includes("fixture_manifest_ref")) {
      return err(
        createStaticDemoArtifactDenial({
          code: "STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_REF_INVALID",
        }),
      );
    }

    if (issuePath?.includes("readiness_report_ref")) {
      return err(
        createStaticDemoArtifactDenial({
          code: "STATIC_DEMO_ARTIFACT_READINESS_REPORT_REF_INVALID",
        }),
      );
    }

    if (issuePath?.startsWith("fixture_manifest")) {
      return err(
        createStaticDemoArtifactDenial({
          code: "STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("readiness_report")) {
      return err(
        createStaticDemoArtifactDenial({
          code: "STATIC_DEMO_ARTIFACT_READINESS_REPORT_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("sections")) {
      return err(
        createStaticDemoArtifactDenial({
          code: "STATIC_DEMO_ARTIFACT_SECTION_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.includes("exposure")) {
      return err(
        createStaticDemoArtifactDenial({
          code: "STATIC_DEMO_ARTIFACT_EXPOSURE_INCOMPATIBLE",
        }),
      );
    }

    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function ensureStaticDemoArtifactSectionsMatchTenant(
  artifact: StaticDemoArtifact,
): Result<true, StaticDemoArtifactDenial> {
  const sectionsMatchTenant = artifact.sections.every(
    (section) => section.tenant_id === artifact.tenant_id,
  );

  if (!sectionsMatchTenant) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_SECTION_TENANT_MISMATCH",
        correlation_id: artifact.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureStaticDemoArtifactReferencesMatchTenant(
  artifact: StaticDemoArtifact,
): Result<true, StaticDemoArtifactDenial> {
  if (
    artifact.fixture_manifest !== undefined &&
    artifact.fixture_manifest.tenant_id !== artifact.tenant_id
  ) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_TENANT_MISMATCH",
        correlation_id: artifact.correlation_id,
      }),
    );
  }

  if (
    artifact.readiness_report !== undefined &&
    artifact.readiness_report.tenant_id !== artifact.tenant_id
  ) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_READINESS_REPORT_TENANT_MISMATCH",
        correlation_id: artifact.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureStaticDemoArtifactExposureCompatible(
  artifact: StaticDemoArtifact,
): Result<true, StaticDemoArtifactDenial> {
  const compatible = isStaticDemoArtifactExposureCompatible(
    artifact.exposure,
    [
      artifact.data_classification,
      ...artifact.sections.map((section) => section.data_classification),
    ],
  );

  if (!compatible) {
    return err(
      createStaticDemoArtifactDenial({
        code: "STATIC_DEMO_ARTIFACT_EXPOSURE_INCOMPATIBLE",
        correlation_id: artifact.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function assertStaticDemoArtifactValid(
  input: unknown,
): Result<StaticDemoArtifact, StaticDemoArtifactDenial> {
  return validateStaticDemoArtifact(input);
}

export function failClosedStaticDemoArtifact(
  correlation_id?: CorrelationId,
): StaticDemoArtifactDenial {
  return createStaticDemoArtifactDenial({
    code: "STATIC_DEMO_ARTIFACT_NOT_VALID",
    correlation_id,
  });
}
