import { describe, expect, it } from "vitest";

import {
  assertStaticDemoArtifactValid,
  createStaticDemoArtifactDenial,
  failClosedStaticDemoArtifact,
  isStaticDemoArtifactOrdered,
  validateStaticDemoArtifact,
  validateStaticDemoArtifactExposure,
  validateStaticDemoArtifactKind,
  validateStaticDemoArtifactSection,
} from ".";
import type { DemoReadinessReportInput } from "../demo-readiness-report";
import type { DemoScenarioInput } from "../demo-scenario";
import type {
  DemoScenarioFixtureInput,
  DemoScenarioFixtureManifestInput,
} from "../demo-scenario-fixture";
import type { StaticDemoArtifactInput } from "./static-demo-artifact";
import type { StaticDemoArtifactSectionInput } from "./static-demo-artifact-section";

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

function validReadinessReportForTenant(
  tenantId: string,
  overrides: Partial<DemoReadinessReportInput> = {},
): DemoReadinessReportInput {
  return {
    demo_readiness_report_id: `demo_readiness_report_${tenantId}`,
    tenant_id: tenantId,
    workspace_id: "workspace_001",
    project_id: "project_001",
    status: "READY",
    subject_kind: "DEMO_SCENARIO_FIXTURE",
    fixture: validFixtureForTenant(tenantId),
    findings: [
      {
        demo_readiness_finding_id: `demo_readiness_finding_${tenantId}`,
        tenant_id: tenantId,
        severity: "INFO",
        finding_code: "DEMO_READINESS_DESCRIPTOR_READY",
        message: "Descriptor readiness check passed.",
        data_classification: "INTERNAL",
        observed_at: "2026-06-01T00:06:00.000Z",
        descriptor_ref: `demo_scenario_fixture_${tenantId}`,
        metadata: {
          descriptor: "only",
        },
      },
    ],
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

function validSection(
  order: number,
  overrides: Partial<StaticDemoArtifactSectionInput> = {},
): StaticDemoArtifactSectionInput {
  return {
    static_demo_artifact_section_id: `static_demo_artifact_section_${order}`,
    tenant_id: "tenant_001",
    section_order: order,
    section_kind: order === 1 ? "SCENARIO_OVERVIEW" : "READINESS_SUMMARY",
    title: `Artifact section ${order}`,
    summary: `Safe artifact descriptor summary ${order}.`,
    descriptor_ref: `artifact_section_descriptor_${order}`,
    data_classification: "INTERNAL",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validArtifact(
  overrides: Partial<StaticDemoArtifactInput> = {},
): StaticDemoArtifactInput {
  return {
    static_demo_artifact_id: "static_demo_artifact_001",
    tenant_id: "tenant_001",
    workspace_id: "workspace_001",
    project_id: "project_001",
    artifact_kind: "EXECUTIVE_WALKTHROUGH",
    exposure: "EXECUTIVE_SAFE",
    title: "Executive walkthrough artifact",
    summary: "Safe static artifact descriptor.",
    readiness_report: validReadinessReportForTenant("tenant_001"),
    sections: [validSection(1), validSection(2)],
    data_classification: "INTERNAL",
    created_at: "2026-06-01T00:08:00.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

describe("StaticDemoArtifact", () => {
  it("accepts a valid executive walkthrough artifact with embedded readiness report", () => {
    const result = validateStaticDemoArtifact(validArtifact());

    expect(result.ok).toBe(true);
    expect(assertStaticDemoArtifactValid(validArtifact()).ok).toBe(true);
    if (result.ok) {
      expect(result.value.artifact_kind).toBe("EXECUTIVE_WALKTHROUGH");
      expect(result.value.readiness_report?.status).toBe("READY");
    }
  });

  it("accepts a valid technical trace artifact with opaque refs", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        static_demo_artifact_id: "static_demo_artifact_trace_001",
        artifact_kind: "TECHNICAL_TRACE",
        exposure: "TECHNICAL_REVIEW_ONLY",
        title: "Technical trace artifact",
        summary: "Safe technical descriptor.",
        readiness_report: undefined,
        fixture_manifest_ref: "demo_scenario_fixture_manifest_tenant_001",
        readiness_report_ref: "demo_readiness_report_tenant_001",
        sections: [
          validSection(1, {
            section_kind: "GOVERNANCE_TRACE",
            data_classification: "CONFIDENTIAL",
          }),
        ],
        data_classification: "CONFIDENTIAL",
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fixture_manifest_ref).toBe(
        "demo_scenario_fixture_manifest_tenant_001",
      );
    }
  });

  it("rejects missing tenant_id", () => {
    const artifact = validArtifact() as Record<string, unknown>;
    delete artifact.tenant_id;
    artifact.metadata = {
      display: "alice@example.com",
    };

    const result = validateStaticDemoArtifact(artifact);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects project_id without workspace_id", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        workspace_id: undefined,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STATIC_DEMO_ARTIFACT_SCOPE_INVALID");
    }
  });

  it("rejects invalid artifact kind", () => {
    expect(validateStaticDemoArtifactKind("EXECUTABLE_DEMO").ok).toBe(false);

    const artifact = validArtifact() as Record<string, unknown>;
    artifact.artifact_kind = "EXECUTABLE_DEMO";

    const result = validateStaticDemoArtifact(artifact);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STATIC_DEMO_ARTIFACT_KIND_INVALID");
    }
  });

  it("rejects invalid exposure", () => {
    expect(validateStaticDemoArtifactExposure("PUBLIC_EXPORT").ok).toBe(false);

    const artifact = validArtifact() as Record<string, unknown>;
    artifact.exposure = "PUBLIC_EXPORT";

    const result = validateStaticDemoArtifact(artifact);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_ARTIFACT_EXPOSURE_INVALID",
      );
    }
  });

  it("rejects missing all fixture and readiness refs and embeddings", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        fixture_manifest_ref: undefined,
        readiness_report_ref: undefined,
        fixture_manifest: undefined,
        readiness_report: undefined,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STATIC_DEMO_ARTIFACT_SUBJECT_REQUIRED");
    }
  });

  it("rejects unsafe fixture_manifest_ref", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        readiness_report: undefined,
        fixture_manifest_ref: "https://example.test/manifest",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_REF_INVALID",
      );
    }
  });

  it("rejects unsafe readiness_report_ref", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        readiness_report: undefined,
        readiness_report_ref: "C:\\demo\\readiness",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_ARTIFACT_READINESS_REPORT_REF_INVALID",
      );
    }
  });

  it("rejects embedded fixture_manifest tenant mismatch", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        readiness_report: undefined,
        fixture_manifest: validManifestForTenant("tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_ARTIFACT_FIXTURE_MANIFEST_TENANT_MISMATCH",
      );
    }
  });

  it("rejects embedded readiness_report tenant mismatch", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        readiness_report: validReadinessReportForTenant("tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_ARTIFACT_READINESS_REPORT_TENANT_MISMATCH",
      );
    }
  });

  it("rejects empty sections", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        sections: [],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("STATIC_DEMO_ARTIFACT_SECTIONS_REQUIRED");
    }
  });

  it("rejects invalid section kind", () => {
    const section = validSection(1) as Record<string, unknown>;
    section.section_kind = "RENDER_UI";

    const result = validateStaticDemoArtifactSection(section);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_ARTIFACT_SECTION_KIND_INVALID",
      );
    }
  });

  it("rejects non-positive section_order", () => {
    const result = validateStaticDemoArtifactSection(
      validSection(1, {
        section_order: 0,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_ARTIFACT_SECTION_ORDER_INVALID",
      );
    }
  });

  it("rejects unordered sections", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        sections: [validSection(2), validSection(1)],
      }),
    );

    expect(isStaticDemoArtifactOrdered([
      { section_order: 2 },
      { section_order: 1 },
    ])).toBe(false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_ARTIFACT_SECTION_ORDER_INVALID",
      );
    }
  });

  it("rejects duplicate section_order", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        sections: [
          validSection(1, {
            static_demo_artifact_section_id: "static_section_a",
          }),
          validSection(1, {
            static_demo_artifact_section_id: "static_section_b",
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_ARTIFACT_SECTION_ORDER_INVALID",
      );
    }
  });

  it("rejects section tenant mismatch", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        sections: [
          validSection(1, {
            tenant_id: "tenant_002",
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_ARTIFACT_SECTION_TENANT_MISMATCH",
      );
    }
  });

  it("rejects unsafe descriptor_ref", () => {
    const result = validateStaticDemoArtifactSection(
      validSection(1, {
        descriptor_ref: "token_descriptor_ref",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_ARTIFACT_SECTION_REF_INVALID",
      );
    }
  });

  it("rejects unsafe title and summary", () => {
    const unsafeTitle = validateStaticDemoArtifact(
      validArtifact({
        title: "Artifact secret token",
      }),
    );
    const unsafeSummary = validateStaticDemoArtifactSection(
      validSection(1, {
        summary: "Summary reveals descriptor_internals.",
      }),
    );

    expect(unsafeTitle.ok).toBe(false);
    if (!unsafeTitle.ok) {
      expect(unsafeTitle.error.code).toBe(
        "UNSAFE_STATIC_DEMO_ARTIFACT_TEXT",
      );
    }

    expect(unsafeSummary.ok).toBe(false);
    if (!unsafeSummary.ok) {
      expect(unsafeSummary.error.code).toBe(
        "UNSAFE_STATIC_DEMO_ARTIFACT_TEXT",
      );
    }
  });

  it("rejects exposure and data classification incompatibility", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        exposure: "CUSTOMER_SAFE",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "STATIC_DEMO_ARTIFACT_EXPOSURE_INCOMPATIBLE",
      );
    }
  });

  it("rejects invalid created_at", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        created_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INVALID_STATIC_DEMO_ARTIFACT_TIMESTAMP",
      );
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateStaticDemoArtifact(
      validArtifact({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_STATIC_DEMO_ARTIFACT_METADATA");
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const artifact = validArtifact() as Record<string, unknown>;
    delete artifact.tenant_id;
    artifact.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateStaticDemoArtifact(artifact);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("keeps artifacts descriptor-only without execution, replay, seed data, persistence, events, UI, export, downloads or tools", () => {
    const result = validateStaticDemoArtifact(validArtifact());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty("executed_at");
      expect(result.value).not.toHaveProperty("simulation_result");
      expect(result.value).not.toHaveProperty("seed_data");
      expect(result.value).not.toHaveProperty("persisted_at");
      expect(result.value).not.toHaveProperty("emitted_event_id");
      expect(result.value).not.toHaveProperty("ui_component");
      expect(result.value).not.toHaveProperty("export_path");
      expect(result.value).not.toHaveProperty("download_url");
      expect(result.value).not.toHaveProperty("tool_invocation_id");
    }
  });

  it("fails closed for malformed or missing artifacts", () => {
    const missing = validateStaticDemoArtifact(undefined);
    const malformed = validateStaticDemoArtifact({
      static_demo_artifact_id: "static_demo_artifact_001",
    });
    const failClosed = failClosedStaticDemoArtifact();

    expect(missing.ok).toBe(false);
    expect(malformed.ok).toBe(false);
    expect(failClosed.code).toBe("STATIC_DEMO_ARTIFACT_NOT_VALID");
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createStaticDemoArtifactDenial({
      code: "STATIC_DEMO_ARTIFACT_INVALID",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("scenario_internals");
    expect(serialized).not.toContain("fixture_internals");
    expect(serialized).not.toContain("manifest_internals");
    expect(serialized).not.toContain("readiness_internals");
    expect(serialized).not.toContain("artifact_internals");
    expect(serialized).not.toContain("audit_internals");
    expect(serialized).not.toContain("replay_internals");
    expect(serialized).not.toContain("descriptor_internals");
    expect(serialized).not.toContain("secret-token");
  });
});
