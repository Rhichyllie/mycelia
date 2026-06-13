import { describe, expect, it } from "vitest";

import type { AuditRecordInput } from "../audit-record";
import type {
  AuditTimelineEntryInput,
  AuditTimelineInput,
} from "../audit-timeline";

import {
  assertInvestigationBundleValid,
  createInvestigationBundleDenial,
  failClosedInvestigationBundle,
  validateInvestigationBundle,
  validateInvestigationBundleItem,
  validateInvestigationBundleSummary,
} from ".";
import type { InvestigationBundleInput } from "./investigation-bundle";
import type { InvestigationBundleItemInput } from "./investigation-bundle-item";
import type { InvestigationBundleSummaryInput } from "./investigation-bundle-summary";

function validActorRef(tenant_id = "tenant_001") {
  return {
    actor_type: "RUNTIME_ACTOR",
    actor_ref_id: "runtime_actor_ref_001",
    tenant_id,
    actor_id: "actor_001",
    runtime_identity_id: "runtime_identity_001",
    correlation_id: "correlation_001",
    metadata: {
      source: "runtime",
    },
  } as const;
}

function validSubjectRef(tenant_id = "tenant_001") {
  return {
    subject_type: "POLICY_DECISION",
    subject_ref_id: "policy_decision_ref_001",
    tenant_id,
    workspace_id: "workspace_001",
    project_id: "project_001",
    run_id: "run_001",
    request_id: "request_001",
    event_id: "event_001",
    correlation_id: "correlation_001",
    metadata: {
      source: "descriptor",
    },
  } as const;
}

function validEvidenceRef(tenant_id = "tenant_001") {
  return {
    evidence_ref_id: "policy_decision_evidence_ref_001",
    tenant_id,
    evidence_kind: "DECISION_RESULT",
    created_at: "2026-06-01T00:00:01.000Z",
    data_classification: "INTERNAL",
    correlation_id: "correlation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
  } as const;
}

function validAuditRecord(
  overrides: Partial<AuditRecordInput> = {},
  tenant_id = "tenant_001",
): AuditRecordInput {
  return {
    audit_record_id: "audit_record_001",
    tenant_id,
    kind: "POLICY_DECISION",
    actor_ref: validActorRef(tenant_id),
    subject_ref: validSubjectRef(tenant_id),
    evidence_ref: validEvidenceRef(tenant_id),
    outcome: "RECORDED",
    reason_code: "AUDIT_RECORDED",
    message: "The audit descriptor is recorded.",
    data_classification: "INTERNAL",
    recorded_at: "2026-06-01T00:00:02.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      phase: "one_p",
    },
    ...overrides,
  };
}

function validTimelineEntry(
  overrides: Partial<AuditTimelineEntryInput> = {},
): AuditTimelineEntryInput {
  return {
    audit_timeline_entry_id: "audit_timeline_entry_001",
    tenant_id: "tenant_001",
    entry_kind: "AUDIT_RECORD",
    occurred_at: "2026-06-01T00:00:04.000Z",
    sequence_number: 1,
    data_classification: "INTERNAL",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    run_id: "run_001",
    audit_record: validAuditRecord(),
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validAuditTimeline(
  overrides: Partial<AuditTimelineInput> = {},
  tenant_id = "tenant_001",
): AuditTimelineInput {
  return {
    audit_timeline_id: "audit_timeline_001",
    tenant_id,
    scope: {
      workspace_id: "workspace_001",
      project_id: "project_001",
      run_id: "run_001",
      correlation_id: "correlation_001",
    },
    entries: [
      validTimelineEntry({
        tenant_id,
        audit_record: validAuditRecord({}, tenant_id),
      }),
    ],
    created_at: "2026-06-01T00:00:06.000Z",
    data_classification: "INTERNAL",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validInvestigationItem(
  overrides: Partial<InvestigationBundleItemInput> = {},
): InvestigationBundleItemInput {
  return {
    investigation_bundle_item_id: "investigation_bundle_item_001",
    tenant_id: "tenant_001",
    item_kind: "AUDIT_RECORD",
    item_ref: "audit_record_001",
    data_classification: "INTERNAL",
    observed_at: "2026-06-01T00:00:04.000Z",
    correlation_id: "correlation_001",
    causation_id: "causation_001",
    source_event_id: "event_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validSummary(
  overrides: Partial<InvestigationBundleSummaryInput> = {},
): InvestigationBundleSummaryInput {
  return {
    summary_id: "investigation_bundle_summary_001",
    tenant_id: "tenant_001",
    item_count: 1,
    earliest_observed_at: "2026-06-01T00:00:04.000Z",
    latest_observed_at: "2026-06-01T00:00:04.000Z",
    data_classification: "INTERNAL",
    generated_at: "2026-06-01T00:00:07.000Z",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validBundle(
  overrides: Partial<InvestigationBundleInput> = {},
): InvestigationBundleInput {
  return {
    investigation_bundle_id: "investigation_bundle_001",
    tenant_id: "tenant_001",
    scope: {
      tenant_id: "tenant_001",
      workspace_id: "workspace_001",
      project_id: "project_001",
      run_id: "run_001",
      correlation_id: "correlation_001",
      causation_id: "causation_001",
      source_event_id: "event_001",
    },
    items: [validInvestigationItem()],
    audit_timeline: validAuditTimeline(),
    summary: validSummary(),
    created_at: "2026-06-01T00:00:08.000Z",
    data_classification: "INTERNAL",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

describe("InvestigationBundle", () => {
  it("accepts a valid investigation bundle with audit timeline and audit record item", () => {
    const result = validateInvestigationBundle(validBundle());

    expect(result.ok).toBe(true);
    expect(assertInvestigationBundleValid(validBundle()).ok).toBe(true);
    if (result.ok) {
      expect(result.value.audit_timeline?.audit_timeline_id).toBe(
        "audit_timeline_001",
      );
      expect(result.value.items[0]?.item_kind).toBe("AUDIT_RECORD");
    }
  });

  it("accepts a valid investigation bundle with only an opaque timeline ref", () => {
    const result = validateInvestigationBundle(
      validBundle({
        audit_timeline: undefined,
        audit_timeline_ref: "audit_timeline_ref_001",
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.audit_timeline).toBeUndefined();
      expect(result.value.audit_timeline_ref).toBe("audit_timeline_ref_001");
    }
  });

  it("rejects missing tenant_id", () => {
    const bundle = validBundle() as Record<string, unknown>;
    delete bundle.tenant_id;
    bundle.metadata = {
      display: "alice@example.com",
    };

    const result = validateInvestigationBundle(bundle);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects project_id without workspace_id", () => {
    const result = validateInvestigationBundle(
      validBundle({
        scope: {
          tenant_id: "tenant_001",
          project_id: "project_001",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVESTIGATION_BUNDLE_SCOPE_INVALID");
    }
  });

  it("rejects empty items", () => {
    const result = validateInvestigationBundle(
      validBundle({
        items: [],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVESTIGATION_BUNDLE_ITEMS_REQUIRED");
    }
  });

  it("rejects invalid item kind", () => {
    const result = validateInvestigationBundleItem({
      ...validInvestigationItem(),
      item_kind: "CASE_MANAGEMENT_RECORD",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INVESTIGATION_BUNDLE_ITEM_KIND_INVALID",
      );
    }
  });

  it("rejects unsafe item_ref values", () => {
    const unsafeRefs = [
      "https://example.test/item",
      "C:\\investigation\\bundle",
      "token_ref_001",
      "credential_ref_001",
      "select * from investigation",
      "item_ref_001 && rm",
    ];

    for (const item_ref of unsafeRefs) {
      const result = validateInvestigationBundleItem(
        validInvestigationItem({ item_ref }),
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(
          "INVESTIGATION_BUNDLE_ITEM_REF_INVALID",
        );
      }
    }
  });

  it("rejects invalid observed_at", () => {
    const result = validateInvestigationBundleItem(
      validInvestigationItem({
        observed_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INVESTIGATION_BUNDLE_ITEM_TIMESTAMP_INVALID",
      );
    }
  });

  it("rejects item tenant mismatch", () => {
    const result = validateInvestigationBundle(
      validBundle({
        items: [
          validInvestigationItem({
            tenant_id: "tenant_002",
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INVESTIGATION_BUNDLE_ITEM_TENANT_MISMATCH",
      );
    }
  });

  it("rejects embedded audit_timeline tenant mismatch", () => {
    const result = validateInvestigationBundle(
      validBundle({
        audit_timeline: validAuditTimeline({}, "tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INVESTIGATION_BUNDLE_TIMELINE_TENANT_MISMATCH",
      );
    }
  });

  it("rejects unsafe audit_timeline_ref", () => {
    const result = validateInvestigationBundle(
      validBundle({
        audit_timeline: undefined,
        audit_timeline_ref: "https://example.test/timeline",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INVESTIGATION_BUNDLE_TIMELINE_REF_INVALID",
      );
    }
  });

  it("rejects summary item_count mismatch", () => {
    const result = validateInvestigationBundle(
      validBundle({
        summary: validSummary({
          item_count: 2,
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INVESTIGATION_BUNDLE_SUMMARY_ITEM_COUNT_MISMATCH",
      );
    }
  });

  it("rejects summary tenant mismatch", () => {
    const result = validateInvestigationBundle(
      validBundle({
        summary: validSummary({
          tenant_id: "tenant_002",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INVESTIGATION_BUNDLE_SUMMARY_TENANT_MISMATCH",
      );
    }
  });

  it("rejects summary date range that does not cover items", () => {
    const result = validateInvestigationBundle(
      validBundle({
        summary: validSummary({
          earliest_observed_at: "2026-06-01T00:00:05.000Z",
          latest_observed_at: "2026-06-01T00:00:06.000Z",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INVESTIGATION_BUNDLE_SUMMARY_RANGE_INVALID",
      );
    }
  });

  it("rejects latest_observed_at before earliest_observed_at", () => {
    const result = validateInvestigationBundleSummary(
      validSummary({
        earliest_observed_at: "2026-06-01T00:00:06.000Z",
        latest_observed_at: "2026-06-01T00:00:04.000Z",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "INVESTIGATION_BUNDLE_SUMMARY_RANGE_INVALID",
      );
    }
  });

  it("rejects invalid created_at", () => {
    const result = validateInvestigationBundle(
      validBundle({
        created_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_INVESTIGATION_BUNDLE_TIMESTAMP");
    }
  });

  it("rejects unsafe metadata", () => {
    const result = validateInvestigationBundle(
      validBundle({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_INVESTIGATION_BUNDLE_METADATA");
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const bundle = validBundle() as Record<string, unknown>;
    delete bundle.tenant_id;
    bundle.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateInvestigationBundle(bundle);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("keeps bundles descriptor-only without storage query, UI, replay or export", () => {
    const result = validateInvestigationBundle(validBundle());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty("query_handle");
      expect(result.value).not.toHaveProperty("storage_cursor");
      expect(result.value).not.toHaveProperty("ui_component");
      expect(result.value).not.toHaveProperty("replay_session_id");
      expect(result.value).not.toHaveProperty("export_url");
      expect(result.value).not.toHaveProperty("download_artifact_id");
    }
  });

  it("fails closed for malformed or missing bundles", () => {
    const missing = validateInvestigationBundle(undefined);
    const malformed = validateInvestigationBundle({
      investigation_bundle_id: "investigation_bundle_001",
    });
    const failClosed = failClosedInvestigationBundle();

    expect(missing.ok).toBe(false);
    expect(malformed.ok).toBe(false);
    expect(failClosed.code).toBe("INVESTIGATION_BUNDLE_NOT_VALID");
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createInvestigationBundleDenial({
      code: "INVESTIGATION_BUNDLE_TIMELINE_INVALID",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("storage_internals");
    expect(serialized).not.toContain("query_internals");
    expect(serialized).not.toContain("replay_internals");
    expect(serialized).not.toContain("policy_internals");
    expect(serialized).not.toContain("investigation_internals");
    expect(serialized).not.toContain("secret-token");
  });
});
