import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { INITIAL_USE_CASE_NAME } from "../initial-use-case-freeze";
import { RUNTIME_SLICE_TECHNICAL_PLAN_NAME } from "../runtime-slice-technical-plan";

import {
  RUNTIME_PERSISTENCE_EXPLICITLY_OUT_OF_SCOPE,
  RUNTIME_PERSISTENCE_RECORD_NAMES,
  RuntimePersistenceRecordSchemas,
  getRuntimePersistenceModel,
} from ".";

function collectStrings(input: unknown): string[] {
  if (typeof input === "string") {
    return [input];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => collectStrings(item));
  }

  if (typeof input === "object" && input !== null) {
    return Object.entries(input).flatMap(([key, value]) => [
      key,
      ...collectStrings(value),
    ]);
  }

  return [];
}

function expectIncludesAll(
  actual: readonly string[],
  expected: readonly string[],
): void {
  for (const item of expected) {
    expect(actual).toContain(item);
  }
}

const REQUIRED_FIELDS_BY_RECORD: Record<string, readonly string[]> = {
  GovernedRun: [
    "id",
    "tenantId",
    "workspaceId optional or planned",
    "projectId optional or planned",
    "requestId or correlationId",
    "useCaseName",
    "status",
    "currentState",
    "riskLevel",
    "admissionStatus",
    "approvalStatus",
    "createdAt planned",
    "updatedAt planned",
  ],
  RuntimeStateSnapshot: [
    "id",
    "tenantId",
    "runId",
    "state",
    "sequence",
    "reason",
    "createdAt planned",
    "correlationId",
  ],
  PolicyDecisionRecord: [
    "id",
    "tenantId",
    "runId",
    "policyAction",
    "resource",
    "purpose",
    "riskLevel",
    "decision",
    "reason",
    "obligations",
    "createdAt planned",
  ],
  AdmissionDecisionRecord: [
    "id",
    "tenantId",
    "runId",
    "admissionStatus",
    "reason",
    "requiresApproval",
    "policyDecisionId",
    "createdAt planned",
  ],
  ApprovalRequest: [
    "id",
    "tenantId",
    "runId",
    "admissionDecisionId",
    "approvalStatus",
    "requestedRole",
    "decision",
    "decisionReason",
    "requestedAt planned",
    "decidedAt planned optional",
  ],
  AuditRecord: [
    "id",
    "tenantId",
    "runId",
    "kind",
    "subjectRef",
    "actorRef",
    "evidenceRef",
    "correlationId",
    "createdAt planned",
  ],
};

const TIMESTAMP = "2026-01-01T00:00:00.000Z";

describe("runtime persistence model scaffold", () => {
  it("builds the deterministic model successfully", () => {
    const model = getRuntimePersistenceModel();

    expect(model.phase).toBe("2R");
    expect(model.name).toBe("Minimal Persistent Model Scaffold");
    expect(model.status).toBe("persistence model scaffold only");
    expect(model.linked_plan).toBe(RUNTIME_SLICE_TECHNICAL_PLAN_NAME);
    expect(model.linked_use_case).toBe(INITIAL_USE_CASE_NAME);
  });

  it("includes exactly six first-slice persistent records", () => {
    const model = getRuntimePersistenceModel();

    expect(model.persistent_records.map((record) => record.name)).toEqual([
      "GovernedRun",
      "RuntimeStateSnapshot",
      "PolicyDecisionRecord",
      "AdmissionDecisionRecord",
      "ApprovalRequest",
      "AuditRecord",
    ]);
    expect(model.persistent_records).toHaveLength(6);
    expect(model.persistent_records.map((record) => record.name)).toEqual(
      [...RUNTIME_PERSISTENCE_RECORD_NAMES],
    );
  });

  it("marks each record as tenant-scoped and first-slice scaffold only", () => {
    const model = getRuntimePersistenceModel();

    for (const record of model.persistent_records) {
      expect(record.tenant_scope).toContain("tenantId");
      expect(record.required_safety_properties).toContain("tenant-scoped");
      expect(record.first_slice_status).toBe("FIRST_SLICE_SCAFFOLD_ONLY");
    }
  });

  it("requires every run-linked record to reference a governed run conceptually", () => {
    const runLinkedRecords = getRuntimePersistenceModel()
      .persistent_records.filter((record) => record.name !== "GovernedRun");

    for (const record of runLinkedRecords) {
      expect(record.minimal_conceptual_fields).toContain("runId");
      expect(record.correlation_run_linkage).toContain("runId references");
    }
  });

  it("includes required minimal fields for each record", () => {
    const model = getRuntimePersistenceModel();

    for (const record of model.persistent_records) {
      expectIncludesAll(
        record.minimal_conceptual_fields,
        REQUIRED_FIELDS_BY_RECORD[record.name],
      );
    }
  });

  it("includes shared invariants", () => {
    const model = getRuntimePersistenceModel();

    expectIncludesAll(model.shared_invariants, [
      "every persisted record is tenant-scoped",
      "every run-linked record references a governed run",
      "every state snapshot has monotonic sequence in future implementation",
      "every policy/admission/approval lifecycle change must be audit-addressable",
      "no record stores raw sensitive document content in the first slice",
      "records use references and safe summaries instead of raw payloads",
      "no external IDs should be treated as trusted without validation",
      "no cross-tenant relationship is allowed",
    ]);
  });

  it("states raw sensitive document content is out of scope", () => {
    const model = getRuntimePersistenceModel();
    const text = collectStrings(model).join("\n").toLowerCase();

    expect(model.shared_invariants).toContain(
      "no record stores raw sensitive document content in the first slice",
    );
    expect(model.explicitly_out_of_scope).toContain(
      "no sensitive document storage",
    );
    expect(text).not.toContain("raw document content is stored");
  });

  it("maps records to existing modules", () => {
    const mapping = getRuntimePersistenceModel().module_mapping;

    expect(mapping.find((item) => item.record === "GovernedRun")?.maps_to)
      .toContain("src/mycelia/governed-run/");
    expect(
      mapping.find((item) => item.record === "RuntimeStateSnapshot")?.maps_to,
    ).toContain("src/mycelia/runtime-state/");
    expect(
      mapping.find((item) => item.record === "PolicyDecisionRecord")?.maps_to,
    ).toContain("src/mycelia/policy-decision-gateway/");
    expect(
      mapping.find((item) => item.record === "AdmissionDecisionRecord")
        ?.maps_to,
    ).toContain("src/mycelia/runtime-admission-gateway/");
    expect(mapping.find((item) => item.record === "ApprovalRequest")?.maps_to)
      .toContain("future approval gate");
    expect(mapping.find((item) => item.record === "AuditRecord")?.maps_to)
      .toContain("src/mycelia/audit-record/");
  });

  it("excludes investigation and replay dry-run records from the first persistence slice", () => {
    const names = getRuntimePersistenceModel().persistent_records.map(
      (record) => record.name,
    );

    expect(names).not.toContain("InvestigationCase");
    expect(names).not.toContain("InvestigationBundleView");
    expect(names).not.toContain("ReplayDryRunPlan");
  });

  it("includes out-of-scope boundaries", () => {
    const model = getRuntimePersistenceModel();

    expect(model.explicitly_out_of_scope).toEqual(
      RUNTIME_PERSISTENCE_EXPLICITLY_OUT_OF_SCOPE,
    );
    expectIncludesAll(model.explicitly_out_of_scope, [
      "no runtime execution",
      "no DB access",
      "no migrations",
      "no Prisma generate",
      "no repository/service layer",
      "no API",
      "no auth",
      "no UI",
      "no event emission",
      "no replay execution",
      "no external integrations",
      "no sensitive document storage",
      "no hash-chain/signing/sealing yet",
      "no export/PDF/download",
    ]);
  });

  it("confirms Phase 3A adds schema contracts while PrismaClient remains inactive", () => {
    const model = getRuntimePersistenceModel();
    const prismaSchema = new URL(
      "../../../prisma/schema.prisma",
      import.meta.url,
    );
    const prismaMigrations = new URL(
      "../../../prisma/migrations",
      import.meta.url,
    );

    expect(model.prisma_scaffold_status).toContain(
      "Phase 3A now adds prisma/schema.prisma as a schema contract for the same six records",
    );
    expect(model.prisma_scaffold_status).toContain(
      "application source does not import PrismaClient or read/write databases",
    );
    expect(existsSync(prismaSchema)).toBe(true);
    expect(existsSync(prismaMigrations)).toBe(true);
  });

  it("defines pure schemas for each first-slice record", () => {
    expect(
      RuntimePersistenceRecordSchemas.GovernedRun.safeParse({
        id: "run_record_01",
        tenant_id: "tenant_01",
        request_id: "request_01",
        correlation_id: "correlation_01",
        use_case_name: INITIAL_USE_CASE_NAME,
        status: "CREATED",
        current_state: "CREATED",
        risk_level: "MEDIUM",
        admission_status: "REQUIRES_APPROVAL",
        approval_status: "REQUESTED",
        data_classification: "INTERNAL",
        created_at: TIMESTAMP,
        updated_at: TIMESTAMP,
      }).success,
    ).toBe(true);

    expect(
      RuntimePersistenceRecordSchemas.RuntimeStateSnapshot.safeParse({
        id: "state_snapshot_01",
        tenant_id: "tenant_01",
        run_id: "run_01",
        state: "WAITING_APPROVAL",
        sequence: 1,
        reason: "Medium risk requires approval.",
        created_at: TIMESTAMP,
        correlation_id: "correlation_01",
      }).success,
    ).toBe(true);

    expect(
      RuntimePersistenceRecordSchemas.PolicyDecisionRecord.safeParse({
        id: "policy_decision_01",
        tenant_id: "tenant_01",
        run_id: "run_01",
        policy_action: "document.review",
        resource: "document.review",
        purpose: "governed compliance review",
        risk_level: "MEDIUM",
        decision: "REQUIRE_APPROVAL",
        reason: "Medium risk requires approval.",
        obligations: [],
        created_at: TIMESTAMP,
      }).success,
    ).toBe(true);

    expect(
      RuntimePersistenceRecordSchemas.AdmissionDecisionRecord.safeParse({
        id: "admission_decision_01",
        tenant_id: "tenant_01",
        run_id: "run_01",
        admission_status: "REQUIRES_APPROVAL",
        reason: "Policy requires approval.",
        requires_approval: true,
        policy_decision_id: "policy_decision_01",
        created_at: TIMESTAMP,
      }).success,
    ).toBe(true);

    expect(
      RuntimePersistenceRecordSchemas.ApprovalRequest.safeParse({
        id: "approval_request_01",
        tenant_id: "tenant_01",
        run_id: "run_01",
        admission_decision_id: "admission_decision_01",
        approval_status: "REQUESTED",
        requested_role: "compliance reviewer",
        requested_at: TIMESTAMP,
      }).success,
    ).toBe(true);

    expect(
      RuntimePersistenceRecordSchemas.AuditRecord.safeParse({
        id: "audit_record_01",
        tenant_id: "tenant_01",
        run_id: "run_01",
        kind: "GOVERNED_RUN",
        subject_ref: "subject_01",
        actor_ref: "actor_01",
        evidence_ref: "evidence_01",
        correlation_id: "correlation_01",
        created_at: TIMESTAMP,
      }).success,
    ).toBe(true);
  });

  it("schemas reject unsafe strings and missing tenant scope", () => {
    expect(
      RuntimePersistenceRecordSchemas.RuntimeStateSnapshot.safeParse({
        id: "state_snapshot_01",
        tenant_id: "tenant_01",
        run_id: "run_01",
        state: "WAITING_APPROVAL",
        sequence: 1,
        reason: "secret token should never be stored",
        created_at: TIMESTAMP,
        correlation_id: "correlation_01",
      }).success,
    ).toBe(false);

    expect(
      RuntimePersistenceRecordSchemas.AdmissionDecisionRecord.safeParse({
        id: "admission_decision_01",
        run_id: "run_01",
        admission_status: "REQUIRES_APPROVAL",
        reason: "Policy requires approval.",
        requires_approval: true,
        policy_decision_id: "policy_decision_01",
        created_at: TIMESTAMP,
      }).success,
    ).toBe(false);
  });

  it("does not imply runtime execution or active persistence exists", () => {
    const model = getRuntimePersistenceModel();
    const text = collectStrings(model).join("\n").toLowerCase();

    expect(model.safety_boundary).toContain(
      "this phase does not execute runtime",
    );
    expect(model.safety_boundary).toContain(
      "this phase does not persist data",
    );
    expect(model.safety_boundary).toContain(
      "this phase does not connect to a database",
    );
    expect(text).not.toContain("runtime execution is available");
    expect(text).not.toContain("active persistence exists");
    expect(text).not.toContain("database access is available");
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
