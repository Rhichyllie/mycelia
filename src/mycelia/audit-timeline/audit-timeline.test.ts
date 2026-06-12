import { describe, expect, it } from "vitest";

import {
  assertAuditTimelineValid,
  createAuditTimelineDenial,
  failClosedAuditTimeline,
  isAuditTimelineOrdered,
  validateAuditTimeline,
  validateAuditTimelineCursor,
  validateAuditTimelineEntry,
} from ".";
import type { AuditRecordInput } from "../audit-record";
import type {
  AuditEmissionResultInput,
  AuditEmissionTargetInput,
} from "../audit-emission";
import type { AuditTimelineInput } from "./audit-timeline";
import type { AuditTimelineCursorInput } from "./audit-timeline-cursor";
import type { AuditTimelineEntryInput } from "./audit-timeline-entry";

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
      phase: "one_o",
    },
    ...overrides,
  };
}

function validEmissionTarget(
  overrides: Partial<AuditEmissionTargetInput> = {},
): AuditEmissionTargetInput {
  return {
    target_type: "DESCRIPTOR_ONLY",
    tenant_id: "tenant_001",
    target_ref: "audit_emission_target_ref_001",
    data_classification: "INTERNAL",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validAuditEmissionResult(
  overrides: Partial<AuditEmissionResultInput> = {},
): AuditEmissionResultInput {
  return {
    audit_emission_result_id: "audit_emission_intent_001.ready",
    audit_emission_intent_id: "audit_emission_intent_001",
    tenant_id: "tenant_001",
    outcome: "READY",
    reason_code: "AUDIT_EMISSION_READY",
    message: "The audit emission intent is ready.",
    decided_at: "2026-06-01T00:00:03.000Z",
    correlation_id: "correlation_001",
    target: validEmissionTarget(),
    audit_record_ref: "audit_record_001",
    metadata: {
      descriptor: "only",
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

function validCursor(
  overrides: Partial<AuditTimelineCursorInput> = {},
): AuditTimelineCursorInput {
  return {
    cursor_id: "audit_timeline_cursor_001",
    tenant_id: "tenant_001",
    timeline_id: "audit_timeline_001",
    position_sequence_number: 1,
    created_at: "2026-06-01T00:00:05.000Z",
    data_classification: "INTERNAL",
    correlation_id: "correlation_001",
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

function validTimeline(
  overrides: Partial<AuditTimelineInput> = {},
): AuditTimelineInput {
  return {
    audit_timeline_id: "audit_timeline_001",
    tenant_id: "tenant_001",
    scope: {
      workspace_id: "workspace_001",
      project_id: "project_001",
      run_id: "run_001",
      correlation_id: "correlation_001",
    },
    entries: [validTimelineEntry()],
    created_at: "2026-06-01T00:00:06.000Z",
    data_classification: "INTERNAL",
    cursor: validCursor(),
    metadata: {
      descriptor: "only",
    },
    ...overrides,
  };
}

describe("AuditTimeline", () => {
  it("accepts a valid audit timeline with an audit record entry", () => {
    const result = validateAuditTimeline(validTimeline());

    expect(result.ok).toBe(true);
    expect(assertAuditTimelineValid(validTimeline()).ok).toBe(true);
    if (result.ok) {
      expect(result.value.entries[0]?.entry_kind).toBe("AUDIT_RECORD");
      expect(result.value.entries[0]?.audit_record?.tenant_id).toBe(
        "tenant_001",
      );
    }
  });

  it("accepts a valid audit timeline with an audit emission result entry", () => {
    const result = validateAuditTimeline(
      validTimeline({
        entries: [
          validTimelineEntry({
            audit_timeline_entry_id: "audit_timeline_entry_emission_001",
            entry_kind: "AUDIT_EMISSION_RESULT",
            audit_record: undefined,
            audit_emission_result: validAuditEmissionResult(),
          }),
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.entries[0]?.audit_emission_result?.outcome).toBe(
        "READY",
      );
    }
  });

  it("rejects missing tenant_id", () => {
    const timeline = validTimeline() as Record<string, unknown>;
    delete timeline.tenant_id;
    timeline.metadata = {
      display: "alice@example.com",
    };

    const result = validateAuditTimeline(timeline);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("rejects project_id without workspace_id", () => {
    const result = validateAuditTimeline(
      validTimeline({
        scope: {
          project_id: "project_001",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_TIMELINE_SCOPE_INVALID");
    }
  });

  it("rejects empty entries", () => {
    const result = validateAuditTimeline(
      validTimeline({
        entries: [],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_TIMELINE_ENTRIES_REQUIRED");
    }
  });

  it("rejects invalid entry kind", () => {
    const result = validateAuditTimelineEntry({
      ...validTimelineEntry(),
      entry_kind: "QUERY_RESULT",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_TIMELINE_ENTRY_KIND_INVALID");
    }
  });

  it("rejects invalid occurred_at", () => {
    const result = validateAuditTimelineEntry(
      validTimelineEntry({
        occurred_at: "not-a-date",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_AUDIT_TIMELINE_TIMESTAMP");
    }
  });

  it("rejects non-positive sequence_number", () => {
    const result = validateAuditTimelineEntry(
      validTimelineEntry({
        sequence_number: 0,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "AUDIT_TIMELINE_ENTRY_SEQUENCE_INVALID",
      );
    }
  });

  it("rejects embedded audit_record tenant mismatch", () => {
    const result = validateAuditTimelineEntry(
      validTimelineEntry({
        audit_record: validAuditRecord({}, "tenant_002"),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "AUDIT_TIMELINE_AUDIT_RECORD_TENANT_MISMATCH",
      );
    }
  });

  it("rejects unordered entries", () => {
    const result = validateAuditTimeline(
      validTimeline({
        entries: [
          validTimelineEntry({
            audit_timeline_entry_id: "audit_timeline_entry_002",
            sequence_number: 2,
          }),
          validTimelineEntry({
            audit_timeline_entry_id: "audit_timeline_entry_001",
            sequence_number: 1,
          }),
        ],
      }),
    );

    expect(isAuditTimelineOrdered([
      { sequence_number: 2 },
      { sequence_number: 1 },
    ])).toBe(false);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_TIMELINE_ENTRY_ORDER_INVALID");
    }
  });

  it("rejects duplicate sequence_number", () => {
    const result = validateAuditTimeline(
      validTimeline({
        entries: [
          validTimelineEntry({
            audit_timeline_entry_id: "audit_timeline_entry_a",
            sequence_number: 1,
          }),
          validTimelineEntry({
            audit_timeline_entry_id: "audit_timeline_entry_b",
            sequence_number: 1,
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_TIMELINE_ENTRY_ORDER_INVALID");
    }
  });

  it("rejects cursor tenant mismatch", () => {
    const result = validateAuditTimeline(
      validTimeline({
        cursor: validCursor({
          tenant_id: "tenant_002",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUDIT_TIMELINE_CURSOR_TENANT_MISMATCH");
    }
  });

  it("rejects cursor timeline_id mismatch", () => {
    const result = validateAuditTimeline(
      validTimeline({
        cursor: validCursor({
          timeline_id: "audit_timeline_002",
        }),
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(
        "AUDIT_TIMELINE_CURSOR_TIMELINE_MISMATCH",
      );
    }
  });

  it("rejects unsafe cursor metadata", () => {
    const result = validateAuditTimelineCursor(
      validCursor({
        metadata: {
          raw_query: "select * from audit_records",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_AUDIT_TIMELINE_METADATA");
    }
  });

  it("rejects unsafe timeline metadata", () => {
    const result = validateAuditTimeline(
      validTimeline({
        metadata: {
          raw_token: "secret-token",
        },
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNSAFE_AUDIT_TIMELINE_METADATA");
    }
  });

  it("does not infer tenant from metadata, display name, email, URL, path, prefix or external ID", () => {
    const timeline = validTimeline() as Record<string, unknown>;
    delete timeline.tenant_id;
    timeline.metadata = {
      display: "Alice Example alice@example.com",
      external: "external-id-123",
      hint: "tenant-from-prefix",
      route: "https://tenant.example.test/path",
    };

    const result = validateAuditTimeline(timeline);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("keeps cursors as descriptors only without storage pagination", () => {
    const result = validateAuditTimelineCursor(validCursor());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty("database_cursor");
      expect(result.value).not.toHaveProperty("query");
      expect(result.value).not.toHaveProperty("sql");
      expect(result.value).not.toHaveProperty("storage_page_token");
    }
  });

  it("keeps timelines as descriptors only without query, persistence, emission, indexes, replay or UI", () => {
    const result = validateAuditTimeline(validTimeline());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toHaveProperty("query_handle");
      expect(result.value).not.toHaveProperty("persisted_at");
      expect(result.value).not.toHaveProperty("emitted_event_id");
      expect(result.value).not.toHaveProperty("index_name");
      expect(result.value).not.toHaveProperty("replay_session_id");
      expect(result.value).not.toHaveProperty("ui_component");
    }
  });

  it("fails closed for malformed or missing timelines", () => {
    const missing = validateAuditTimeline(undefined);
    const malformed = validateAuditTimeline({
      audit_timeline_id: "audit_timeline_001",
    });
    const failClosed = failClosedAuditTimeline();

    expect(missing.ok).toBe(false);
    expect(malformed.ok).toBe(false);
    expect(failClosed.code).toBe("AUDIT_TIMELINE_NOT_VALID");
  });

  it("keeps denial messages safe and non-enumerating", () => {
    const denial = createAuditTimelineDenial({
      code: "AUDIT_TIMELINE_CURSOR_INVALID",
    });
    const serialized = JSON.stringify(denial);

    expect(serialized).not.toContain("tenant_002");
    expect(serialized).not.toContain("workspace_002");
    expect(serialized).not.toContain("project_002");
    expect(serialized).not.toContain("alice@example.com");
    expect(serialized).not.toContain("storage_internals");
    expect(serialized).not.toContain("query_internals");
    expect(serialized).not.toContain("replay_internals");
    expect(serialized).not.toContain("secret-token");
  });
});
