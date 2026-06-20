import { describe, expect, it } from "vitest";

import {
  assertDemoReadinessReady,
  createDemoReadinessDenial,
  failClosedDemoReadinessReport,
  isDemoReadinessNeedsReview,
  isDemoReadinessNotReady,
  isDemoReadinessReady,
  validateDemoReadinessFinding,
  validateDemoReadinessReport,
  validateDemoReadinessReportStatus,
} from ".";
import type { DemoScenarioInput } from "../../domain-contracts/demo-scenario";
import type {
  DemoScenarioFixtureInput,
  DemoScenarioFixtureManifestInput,
} from "../../domain-contracts/demo-scenario-fixture";
import type { DemoReadinessFindingInput } from "./demo-readiness-finding";
import type { DemoReadinessReportInput } from "./demo-readiness-report";

function validScenarioForTenant(
  tenantId: string,
  overrides: Partial<DemoScenarioInput> = {},
): DemoScenarioInput {
  return {
    demo_scenario_id: `demo_scenario_${tenantId}`,
    tenant_id: tenantId,
    workspace_id: "workspace_001",
    project_id: "project_001",
    kind: "GOVERNED_OPERATION_HAPPY_PATH",
    title: "Governed operation demo",
    description: "Safe descriptor story for a governed operation.",
    steps: [
      {
        demo_scenario_step_id: `demo_scenario_step_${tenantId}_001`,
        tenant_id: tenantId,
        step_order: 1,
        step_kind: "REQUEST_RECEIVED",
        title: "Request received",
        description: "Safe request descriptor.",
        descriptor_ref: `request_descriptor_${tenantId}_001`,
        data_classification: "INTERNAL",
        occurred_at: "2026-06-01T00:01:00.000Z",
        correlation_id: "correlation_001",
        causation_id: "causation_001",
        source_event_id: "event_001",
        metadata: {
          descriptor: "only",
        },
      },
      {
        demo_scenario_step_id: `demo_scenario_step_${tenantId}_002`,
        tenant_id: tenantId,
        step_order: 2,
        step_kind: "REPLAY_PLAN_PREPARED",
        title: "Descriptor prepared",
        description: "Safe planning descriptor.",
        descriptor_ref: `plan_descriptor_${tenantId}_001`,
        data_classification: "INTERNAL",
        occurred_at: "2026-06-01T00:02:00.000Z",
        correlation_id: "correlation_001",
        causation_id: "causation_001",
        source_event_id: "event_001",
        metadata: {
          descriptor: "only",
        },
      },
    ],
    links: [
      {
        demo_scenario_link_id: `demo_scenario_link_${tenantId}_001`,
        tenant_id: tenantId,
        from_step_id: `demo_scenario_step_${tenantId}_001`,
        to_step_id: `demo_scenario_step_${tenantId}_002`,
        link_kind: "PREPARES_NEXT",
        reason_code: "DEMO_STEP_PREPARES_NEXT",
        data_classification: "INTERNAL",
        metadata: {
          descriptor: "only",
        },
      },
    ],
    data_classification: "INTERNAL",
    created_at: "2026-06-01T00:03:00.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validFixtureForTenant(
  tenantId: string,
  overrides: Partial<DemoScenarioFixtureInput> = {},
): DemoScenarioFixtureInput {
  return {
    demo_scenario_fixture_id: `demo_scenario_fixture_${tenantId}`,
    tenant_id: tenantId,
    workspace_id: "workspace_001",
    project_id: "project_001",
    fixture_kind: "GOVERNED_OPERATION_HAPPY_PATH_FIXTURE",
    title: "Governed operation fixture",
    description: "Safe fixture descriptor.",
    scenario: validScenarioForTenant(tenantId),
    expected_scenario_kind: "GOVERNED_OPERATION_HAPPY_PATH",
    data_classification: "INTERNAL",
    created_at: "2026-06-01T00:04:00.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validManifestForTenant(
  tenantId: string,
  overrides: Partial<DemoScenarioFixtureManifestInput> = {},
): DemoScenarioFixtureManifestInput {
  return {
    demo_scenario_fixture_manifest_id:
      `demo_scenario_fixture_manifest_${tenantId}`,
    tenant_id: tenantId,
    fixtures: [validFixtureForTenant(tenantId)],
    manifest_version: 1,
    data_classification: "INTERNAL",
    created_at: "2026-06-01T00:05:00.000Z",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validFinding(
  overrides: Partial<DemoReadinessFindingInput> = {},
): DemoReadinessFindingInput {
  return {
    demo_readiness_finding_id: "demo_readiness_finding_001",
    tenant_id: "tenant_001",
    severity: "INFO",
    finding_code: "DEMO_READINESS_DESCRIPTOR_READY",
    message: "Descriptor readiness check passed.",
    data_classification: "INTERNAL",
    observed_at: "2026-06-01T00:06:00.000Z",
    descriptor_ref: "demo_scenario_fixture_tenant_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validReport(
  overrides: Partial<DemoReadinessReportInput> = {},
): DemoReadinessReportInput {
  return {
    demo_readiness_report_id: "demo_readiness_report_001",
    tenant_id: "tenant_001",
    workspace_id: "workspace_001",
    project_id: "project_001",
    status: "READY",
    subject_kind: "DEMO_SCENARIO_FIXTURE",
    fixture: validFixtureForTenant("tenant_001"),
    findings: [validFinding()],
    data_classification: "INTERNAL",
    generated_at: "2026-06-01T00:07:00.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

describe("DemoReadinessReport", () => {
  it("accepts a valid READY report for embedded fixture without blockers", () => {
    const result = validateDemoReadinessReport(validReport());

    expect(result.ok).toBe(true);
    expect(isDemoReadinessReady(validReport())).toBe(true);
    expect(assertDemoReadinessReady(validReport()).ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("READY");
    }
  });

  it("accepts a valid NOT_READY report with blocker finding", () => {
    const result = validateDemoReadinessReport(
      validReport({
        status: "NOT_READY",
        findings: [
          validFinding({
            severity: "BLOCKER",
            finding_code: "DEMO_READINESS_BLOCKED",
            message: "Descriptor readiness is blocked.",
          }),
        ],
      }),
    );

    expect(result.ok).toBe(true);
    expect(isDemoReadinessNotReady(result.ok ? result.value : undefined)).toBe(
      true,
    );
  });

  it("accepts a valid NEEDS_REVIEW report with warning finding", () => {
    const result = validateDemoReadinessReport(
      validReport({
        status: "NEEDS_REVIEW",
        findings: [
          validFinding({
            severity: "WARNING",
            finding_code: "DEMO_READINESS_REVIEW_RECOMMENDED",
            message: "Descriptor readiness needs review.",
          }),
        ],
      }),
    );

    expect(result.ok).toBe(true);
    expect(
      isDemoReadinessNeedsReview(result.ok ? result.value : undefined),
    ).toBe(true);
  });

  it("rejects missing tenant_id", () => {
    const report = validReport() as Record<string, unknown>;
    delete report.tenant_id;
    report.metadata = {
      display: "alice@example.com",
    };

    const result = validateDemoReadinessReport(report);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects project_id without workspace_id", () => {
    const result = validateDemoReadinessReport(
      validReport({
        workspace_id: undefined,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_READINESS_REPORT_SCOPE_INVALID");
    }
  });

  it("rejects invalid status", () => {
    expect(validateDemoReadinessReportStatus("MAYBE_READY").ok).toBe(false);

    const report = validReport() as Record<string, unknown>;
    report.status = "MAYBE_READY";

    const result = validateDemoReadinessReport(report);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_READINESS_STATUS_INVALID");
    }
  });

  it("rejects invalid subject_kind", () => {
    const report = validReport() as Record<string, unknown>;
    report.subject_kind = "EXECUTABLE_DEMO";

    const result = validateDemoReadinessReport(report);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_READINESS_SUBJECT_KIND_INVALID",
      );
    }
  });

  it("rejects missing subject_ref, fixture and manifest", () => {
    const result = validateDemoReadinessReport(
      validReport({
        subject_ref: undefined,
        fixture: undefined,
        manifest: undefined,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_READINESS_SUBJECT_REQUIRED");
    }
  });

  it("rejects unsafe subject_ref", () => {
    const result = validateDemoReadinessReport(
      validReport({
        fixture: undefined,
        subject_ref: "https://example.test/demo",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_READINESS_SUBJECT_REF_INVALID");
    }
  });

  it("rejects embedded fixture tenant mismatch", () => {
    const result = validateDemoReadinessReport(
      validReport({
        fixture: validFixtureForTenant("tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_READINESS_FIXTURE_TENANT_MISMATCH",
      );
    }
  });

  it("rejects embedded manifest tenant mismatch", () => {
    const result = validateDemoReadinessReport(
      validReport({
        subject_kind: "DEMO_SCENARIO_FIXTURE_MANIFEST",
        fixture: undefined,
        manifest: validManifestForTenant("tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_READINESS_MANIFEST_TENANT_MISMATCH",
      );
    }
  });

  it("rejects finding tenant mismatch", () => {
    const result = validateDemoReadinessReport(
      validReport({
        findings: [
          validFinding({
            tenant_id: "tenant_002",
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_READINESS_FINDING_TENANT_MISMATCH",
      );
    }
  });

  it("rejects READY report with BLOCKER finding", () => {
    const result = validateDemoReadinessReport(
      validReport({
        findings: [
          validFinding({
            severity: "BLOCKER",
            finding_code: "DEMO_READINESS_BLOCKED",
            message: "Descriptor readiness is blocked.",
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_READINESS_STATUS_CONFLICT");
    }
  });

  it("rejects NOT_READY report without BLOCKER finding", () => {
    const result = validateDemoReadinessReport(
      validReport({
        status: "NOT_READY",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_READINESS_STATUS_CONFLICT");
    }
  });

  it("rejects invalid finding severity", () => {
    const finding = validFinding() as Record<string, unknown>;
    finding.severity = "CRITICAL";

    const result = validateDemoReadinessFinding(finding);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "DEMO_READINESS_FINDING_SEVERITY_INVALID",
      );
    }
  });

  it("rejects unsafe finding_code", () => {
    const result = validateDemoReadinessFinding(
      validFinding({
        finding_code: "unsafe code",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "UNSAFE_DEMO_READINESS_FINDING_CODE",
      );
    }
  });

  it("rejects unsafe finding message", () => {
    const result = validateDemoReadinessFinding(
      validFinding({
        message: "This message reveals policy_internals.",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "UNSAFE_DEMO_READINESS_FINDING_MESSAGE",
      );
    }
  });

  it("rejects unsafe descriptor_ref", () => {
    const result = validateDemoReadinessFinding(
      validFinding({
        descriptor_ref: "C:\\demo\\descriptor",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DEMO_READINESS_FINDING_REF_INVALID");
    }
  });

  it("rejects invalid generated_at", () => {
    const result = validateDemoReadinessReport(
      validReport({
        generated_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_DEMO_READINESS_TIMESTAMP");
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateDemoReadinessReport(
      validReport({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_DEMO_READINESS_METADATA");
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const report = validReport() as Record<string, unknown>;
    delete report.tenant_id;
    report.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateDemoReadinessReport(report);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("keeps reports descriptor-only without runtime, replay, seed data, persistence, events, UI, export or tools", () => {
    const result = validateDemoReadinessReport(validReport());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty("executed_at");
      expect(result.value).not.toHaveProperty("simulation_result");
      expect(result.value).not.toHaveProperty("seed_data");
      expect(result.value).not.toHaveProperty("persisted_at");
      expect(result.value).not.toHaveProperty("emitted_event_id");
      expect(result.value).not.toHaveProperty("ui_component");
      expect(result.value).not.toHaveProperty("export_path");
      expect(result.value).not.toHaveProperty("tool_invocation_id");
    }
  });

  it("fails closed for malformed or missing reports", () => {
    const missing = validateDemoReadinessReport(undefined);
    const malformed = validateDemoReadinessReport({
      demo_readiness_report_id: "demo_readiness_report_001",
    });
    const failClosed = failClosedDemoReadinessReport();

    expect(missing.ok).toBe(false);
    expect(malformed.ok).toBe(false);
    expect(failClosed.code).toBe("DEMO_READINESS_NOT_READY");
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createDemoReadinessDenial({
      code: "DEMO_READINESS_REPORT_INVALID",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("scenario_internals");
    expect(serialized).not.toContain("fixture_internals");
    expect(serialized).not.toContain("manifest_internals");
    expect(serialized).not.toContain("policy_internals");
    expect(serialized).not.toContain("audit_internals");
    expect(serialized).not.toContain("replay_internals");
    expect(serialized).not.toContain("descriptor_internals");
    expect(serialized).not.toContain("secret-token");
  });
});
