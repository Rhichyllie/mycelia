import {
  err,
  ok,
  type Result,
} from "../../foundation/shared-kernel";
import { type CorrelationId } from "../../foundation/shared-kernel";
import {
  AuditMessageSchema,
  AuditReasonCodeSchema,
  SafeAuditMetadataSchema,
  isAuditIsoDateTime,
} from "../../domain-contracts/audit-record";
import { DemoScenarioReferenceSchema } from "../../domain-contracts/demo-scenario";
import {
  validateDemoScenarioFixture,
  validateDemoScenarioFixtureManifest,
} from "../../domain-contracts/demo-scenario-fixture";

import {
  createDemoReadinessDenial,
  type DemoReadinessDenial,
} from "./demo-readiness-denial";
import {
  DemoReadinessDescriptorRefSchema,
  DemoReadinessFindingSchema,
  DemoReadinessFindingSeveritySchema,
  type DemoReadinessFinding,
} from "./demo-readiness-finding";
import {
  DemoReadinessReportSchema,
  DemoReadinessReportSubjectKindSchema,
  type DemoReadinessReport,
} from "./demo-readiness-report";
import {
  DemoReadinessReportStatusSchema,
  type DemoReadinessReportStatus,
} from "./demo-readiness-report-status";

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasUnsafeMetadata(input: Record<string, unknown>): boolean {
  return (
    input.metadata !== undefined &&
    !SafeAuditMetadataSchema.safeParse(input.metadata).success
  );
}

function hasBlockerFinding(
  findings: readonly Pick<DemoReadinessFinding, "severity">[],
): boolean {
  return findings.some((finding) => finding.severity === "BLOCKER");
}

export function validateDemoReadinessReportStatus(
  input: unknown,
): Result<DemoReadinessReportStatus, DemoReadinessDenial> {
  const parsed = DemoReadinessReportStatusSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_STATUS_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateDemoReadinessFinding(
  input: unknown,
): Result<DemoReadinessFinding, DemoReadinessDenial> {
  if (!isRecord(input)) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_FINDING_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createDemoReadinessDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (!DemoReadinessFindingSeveritySchema.safeParse(input.severity).success) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_FINDING_SEVERITY_INVALID",
      }),
    );
  }

  if (!AuditReasonCodeSchema.safeParse(input.finding_code).success) {
    return err(
      createDemoReadinessDenial({
        code: "UNSAFE_DEMO_READINESS_FINDING_CODE",
      }),
    );
  }

  if (!AuditMessageSchema.safeParse(input.message).success) {
    return err(
      createDemoReadinessDenial({
        code: "UNSAFE_DEMO_READINESS_FINDING_MESSAGE",
      }),
    );
  }

  if (
    typeof input.observed_at !== "string" ||
    !isAuditIsoDateTime(input.observed_at)
  ) {
    return err(
      createDemoReadinessDenial({
        code: "INVALID_DEMO_READINESS_TIMESTAMP",
      }),
    );
  }

  if (
    input.descriptor_ref !== undefined &&
    !DemoReadinessDescriptorRefSchema.safeParse(
      input.descriptor_ref,
    ).success
  ) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_FINDING_REF_INVALID",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createDemoReadinessDenial({
        code: "UNSAFE_DEMO_READINESS_METADATA",
      }),
    );
  }

  const parsed = DemoReadinessFindingSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_FINDING_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function validateDemoReadinessReport(
  input: unknown,
): Result<DemoReadinessReport, DemoReadinessDenial> {
  if (!isRecord(input)) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_REPORT_REQUIRED",
      }),
    );
  }

  if (input.demo_readiness_report_id === undefined) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_REPORT_ID_REQUIRED",
      }),
    );
  }

  if (input.tenant_id === undefined) {
    return err(createDemoReadinessDenial({ code: "TENANT_ID_REQUIRED" }));
  }

  if (input.project_id !== undefined && input.workspace_id === undefined) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_REPORT_SCOPE_INVALID",
      }),
    );
  }

  if (!DemoReadinessReportStatusSchema.safeParse(input.status).success) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_STATUS_INVALID",
      }),
    );
  }

  if (
    !DemoReadinessReportSubjectKindSchema.safeParse(
      input.subject_kind,
    ).success
  ) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_SUBJECT_KIND_INVALID",
      }),
    );
  }

  if (
    input.subject_ref === undefined &&
    input.fixture === undefined &&
    input.manifest === undefined
  ) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_SUBJECT_REQUIRED",
      }),
    );
  }

  if (
    input.subject_ref !== undefined &&
    !DemoScenarioReferenceSchema.safeParse(input.subject_ref).success
  ) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_SUBJECT_REF_INVALID",
      }),
    );
  }

  if (input.fixture !== undefined) {
    const fixture = validateDemoScenarioFixture(input.fixture);

    if (!fixture.ok) {
      return err(
        createDemoReadinessDenial({
          code: "DEMO_READINESS_FIXTURE_INVALID",
        }),
      );
    }

    if (fixture.value.tenant_id !== input.tenant_id) {
      return err(
        createDemoReadinessDenial({
          code: "DEMO_READINESS_FIXTURE_TENANT_MISMATCH",
          correlation_id: fixture.value.correlation_id,
        }),
      );
    }
  }

  if (input.manifest !== undefined) {
    const manifest = validateDemoScenarioFixtureManifest(input.manifest);

    if (!manifest.ok) {
      return err(
        createDemoReadinessDenial({
          code: "DEMO_READINESS_MANIFEST_INVALID",
        }),
      );
    }

    if (manifest.value.tenant_id !== input.tenant_id) {
      return err(
        createDemoReadinessDenial({
          code: "DEMO_READINESS_MANIFEST_TENANT_MISMATCH",
        }),
      );
    }
  }

  if (!Array.isArray(input.findings)) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_FINDING_INVALID",
      }),
    );
  }

  const findings: DemoReadinessFinding[] = [];

  for (const findingInput of input.findings) {
    const finding = validateDemoReadinessFinding(findingInput);

    if (!finding.ok) {
      return err(finding.error);
    }

    if (finding.value.tenant_id !== input.tenant_id) {
      return err(
        createDemoReadinessDenial({
          code: "DEMO_READINESS_FINDING_TENANT_MISMATCH",
        }),
      );
    }

    findings.push(finding.value);
  }

  const hasBlocker = hasBlockerFinding(findings);

  if (input.status === "READY" && hasBlocker) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_STATUS_CONFLICT",
      }),
    );
  }

  if (input.status === "NOT_READY" && !hasBlocker) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_STATUS_CONFLICT",
      }),
    );
  }

  if (
    typeof input.generated_at !== "string" ||
    !isAuditIsoDateTime(input.generated_at)
  ) {
    return err(
      createDemoReadinessDenial({
        code: "INVALID_DEMO_READINESS_TIMESTAMP",
      }),
    );
  }

  if (hasUnsafeMetadata(input)) {
    return err(
      createDemoReadinessDenial({
        code: "UNSAFE_DEMO_READINESS_METADATA",
      }),
    );
  }

  const parsed = DemoReadinessReportSchema.safeParse(input);

  if (!parsed.success) {
    const issuePath = parsed.error.issues[0]?.path.join(".");

    if (issuePath?.includes("project_id")) {
      return err(
        createDemoReadinessDenial({
          code: "DEMO_READINESS_REPORT_SCOPE_INVALID",
        }),
      );
    }

    if (issuePath?.includes("subject_ref")) {
      return err(
        createDemoReadinessDenial({
          code: "DEMO_READINESS_SUBJECT_REF_INVALID",
        }),
      );
    }

    if (issuePath?.startsWith("fixture")) {
      return err(
        createDemoReadinessDenial({
          code: "DEMO_READINESS_FIXTURE_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("manifest")) {
      return err(
        createDemoReadinessDenial({
          code: "DEMO_READINESS_MANIFEST_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.startsWith("findings")) {
      return err(
        createDemoReadinessDenial({
          code: "DEMO_READINESS_FINDING_TENANT_MISMATCH",
        }),
      );
    }

    if (issuePath?.includes("status")) {
      return err(
        createDemoReadinessDenial({
          code: "DEMO_READINESS_STATUS_CONFLICT",
        }),
      );
    }

    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_REPORT_INVALID",
      }),
    );
  }

  return ok(parsed.data);
}

export function isDemoReadinessReady(input: unknown): boolean {
  const report = validateDemoReadinessReport(input);

  return report.ok && report.value.status === "READY";
}

export function isDemoReadinessNotReady(input: unknown): boolean {
  const report = validateDemoReadinessReport(input);

  return !report.ok || report.value.status === "NOT_READY";
}

export function isDemoReadinessNeedsReview(input: unknown): boolean {
  const report = validateDemoReadinessReport(input);

  return report.ok && report.value.status === "NEEDS_REVIEW";
}

export function ensureDemoReadinessSubjectMatchesTenant(
  report: DemoReadinessReport,
): Result<true, DemoReadinessDenial> {
  if (
    report.fixture !== undefined &&
    report.fixture.tenant_id !== report.tenant_id
  ) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_FIXTURE_TENANT_MISMATCH",
        correlation_id: report.correlation_id,
      }),
    );
  }

  if (
    report.manifest !== undefined &&
    report.manifest.tenant_id !== report.tenant_id
  ) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_MANIFEST_TENANT_MISMATCH",
        correlation_id: report.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function ensureDemoReadinessFindingsMatchTenant(
  report: DemoReadinessReport,
): Result<true, DemoReadinessDenial> {
  const findingsMatchTenant = report.findings.every(
    (finding) => finding.tenant_id === report.tenant_id,
  );

  if (!findingsMatchTenant) {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_FINDING_TENANT_MISMATCH",
        correlation_id: report.correlation_id,
      }),
    );
  }

  return ok(true);
}

export function assertDemoReadinessReady(
  input: unknown,
): Result<DemoReadinessReport, DemoReadinessDenial> {
  const report = validateDemoReadinessReport(input);

  if (!report.ok) {
    return report;
  }

  if (report.value.status !== "READY") {
    return err(
      createDemoReadinessDenial({
        code: "DEMO_READINESS_NOT_READY",
        correlation_id: report.value.correlation_id,
      }),
    );
  }

  return ok(report.value);
}

export function failClosedDemoReadinessReport(
  correlation_id?: CorrelationId,
): DemoReadinessDenial {
  return createDemoReadinessDenial({
    code: "DEMO_READINESS_NOT_READY",
    correlation_id,
  });
}
