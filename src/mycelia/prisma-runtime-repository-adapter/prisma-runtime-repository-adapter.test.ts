import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  assertPrismaRuntimeRepositoryAdapter,
  createPrismaRuntimeRepositoryAdapter,
} from ".";
import {
  assertRuntimeRepositoryResult,
  createRuntimeRepositoryLayer,
  type RuntimeRepositoryAuditRecord,
  type RuntimeRepositoryGovernedRunRecord,
} from "../runtime-repository-layer";

const timestamp = "2026-01-01T00:00:00.000Z";

function governedRun(
  overrides: Partial<RuntimeRepositoryGovernedRunRecord> = {},
): RuntimeRepositoryGovernedRunRecord {
  return {
    id: "run_01",
    tenantId: "tenant_01",
    correlationId: "correlation_01",
    currentState: "CREATED",
    status: "ACTIVE_OR_IN_PROGRESS",
    resourceRef: "resource_01",
    requesterRef: "requester_01",
    purpose: "COMPLIANCE_REVIEW",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function auditRecord(
  overrides: Partial<RuntimeRepositoryAuditRecord> = {},
): RuntimeRepositoryAuditRecord {
  return {
    id: "audit_01",
    tenantId: "tenant_01",
    governedRunId: "run_01",
    moment: "REQUEST_CREATED",
    requirement: "REQUIRED",
    recordKindHint: "GOVERNED_RUN",
    reasonCode: "REQUEST_CREATED",
    safeSummary: "Audit boundary persisted.",
    subjectRef: "run_01",
    actorRef: "requester_01",
    evidenceRef: "policy_01",
    createdAt: timestamp,
    ...overrides,
  };
}

function createMemoryDelegate<T extends { readonly id: string }>() {
  const records: T[] = [];

  return {
    records,
    create({ data }: { readonly data: T }) {
      const record = { ...data };
      records.push(record);
      return record;
    },
    findFirst({ where }: { readonly where: Partial<T> }) {
      return (
        records.find((record) =>
          Object.entries(where).every(
            ([key, value]) => record[key as keyof T] === value,
          )
        ) ?? null
      );
    },
    findMany({ where }: { readonly where: Partial<T> }) {
      return records.filter((record) =>
        Object.entries(where).every(
          ([key, value]) => record[key as keyof T] === value,
        )
      );
    },
  };
}

function createMemoryPrismaLikeClient() {
  return {
    governedRun: createMemoryDelegate(),
    runtimeStateSnapshot: createMemoryDelegate(),
    policyDecisionRecord: createMemoryDelegate(),
    admissionDecisionRecord: createMemoryDelegate(),
    approvalRequest: createMemoryDelegate(),
    auditRecord: createMemoryDelegate(),
  };
}

describe("prisma runtime repository adapter", () => {
  it("exports adapter construction and requires an injected client", () => {
    expect(createPrismaRuntimeRepositoryAdapter(undefined).ok).toBe(false);
    expect(createPrismaRuntimeRepositoryAdapter({}).ok).toBe(false);

    const adapter = assertPrismaRuntimeRepositoryAdapter(
      createPrismaRuntimeRepositoryAdapter(createMemoryPrismaLikeClient()),
    );

    expect(adapter.phase).toBe("3C");
    expect(adapter.implementedMethods).toEqual([
      "createGovernedRun",
      "createRuntimeStateSnapshot",
      "createPolicyDecisionRecord",
      "createAdmissionDecisionRecord",
      "createApprovalRequest",
      "createAuditRecord",
      "findGovernedRunByTenantAndCorrelation",
      "listRuntimeStateSnapshotsByRun",
      "listPolicyDecisionRecordsByRun",
      "listAdmissionDecisionRecordsByRun",
      "listApprovalRequestsByRun",
      "listAuditRecordsByRun",
    ]);
  });

  it("implements the Phase 3B repository client methods through the adapter", async () => {
    const adapter = assertPrismaRuntimeRepositoryAdapter(
      createPrismaRuntimeRepositoryAdapter(createMemoryPrismaLikeClient()),
    );
    const repository = assertRuntimeRepositoryResult(
      createRuntimeRepositoryLayer(adapter.client),
    );

    expect(
      assertRuntimeRepositoryResult(
        await repository.createGovernedRun(governedRun()),
      ).recordKind,
    ).toBe("GOVERNED_RUN");

    expect(
      assertRuntimeRepositoryResult(
        await repository.createRuntimeStateSnapshot({
          id: "state_01",
          tenantId: "tenant_01",
          governedRunId: "run_01",
          state: "CREATED",
          sequence: 1,
          reasonCode: "STATE_CREATED",
          safeSummary: "State snapshot persisted.",
          createdAt: timestamp,
        }),
      ).recordKind,
    ).toBe("RUNTIME_STATE_SNAPSHOT");

    expect(
      assertRuntimeRepositoryResult(
        await repository.createPolicyDecisionRecord({
          id: "policy_01",
          tenantId: "tenant_01",
          governedRunId: "run_01",
          riskLevel: "LOW",
          outcome: "ADMIT",
          reasonCode: "LOW_RISK_ADMITTED",
          safeSummary: "Low risk admitted.",
          policyRef: "policy_01",
          createdAt: timestamp,
        }),
      ).recordKind,
    ).toBe("POLICY_DECISION_RECORD");

    expect(
      assertRuntimeRepositoryResult(
        await repository.createAdmissionDecisionRecord({
          id: "admission_01",
          tenantId: "tenant_01",
          governedRunId: "run_01",
          outcome: "ADMIT",
          reasonCode: "LOW_RISK_ADMITTED",
          safeSummary: "Admission granted.",
          lifecycleIntentHint: "GRANT_ADMISSION",
          createdAt: timestamp,
        }),
      ).recordKind,
    ).toBe("ADMISSION_DECISION_RECORD");

    expect(
      assertRuntimeRepositoryResult(
        await repository.createApprovalRequest({
          id: "approval_01",
          tenantId: "tenant_01",
          governedRunId: "run_01",
          admissionDecisionRecordId: "admission_01",
          status: "PENDING",
          requestedRole: "compliance_reviewer",
          requesterRef: "requester_01",
          createdAt: timestamp,
        }),
      ).recordKind,
    ).toBe("APPROVAL_REQUEST");

    expect(
      assertRuntimeRepositoryResult(
        await repository.createAuditRecord(auditRecord()),
      ).recordKind,
    ).toBe("AUDIT_RECORD");

    expect(
      assertRuntimeRepositoryResult(
        await repository.findGovernedRunByTenantAndCorrelation({
          tenantId: "tenant_01",
          correlationId: "correlation_01",
        }),
      ).found,
    ).toBe(true);
    expect(
      assertRuntimeRepositoryResult(
        await repository.listAuditRecordsByRun({
          tenantId: "tenant_01",
          governedRunId: "run_01",
        }),
      ).records,
    ).toHaveLength(1);
  });

  it("sanitizes client errors before the repository layer returns denial", async () => {
    const client = createMemoryPrismaLikeClient();

    client.governedRun.create = () => {
      throw new Error("SQLITE failure with stack and secret payload details");
    };

    const adapter = assertPrismaRuntimeRepositoryAdapter(
      createPrismaRuntimeRepositoryAdapter(client),
    );
    const repository = assertRuntimeRepositoryResult(
      createRuntimeRepositoryLayer(adapter.client),
    );
    const result = await repository.createGovernedRun(governedRun());

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const denial = JSON.stringify(result.error);

      expect(denial).not.toContain("SQLITE");
      expect(denial).not.toContain("secret");
      expect(denial).not.toContain("stack");
    }
  });

  it("does not accept raw content fields through the repository boundary", async () => {
    const adapter = assertPrismaRuntimeRepositoryAdapter(
      createPrismaRuntimeRepositoryAdapter(createMemoryPrismaLikeClient()),
    );
    const repository = assertRuntimeRepositoryResult(
      createRuntimeRepositoryLayer(adapter.client),
    );

    const result = await repository.createGovernedRun({
      ...governedRun(),
      rawDocument: "unsafe",
    });

    expect(result.ok).toBe(false);
  });

  it("does not modify package files or Phase 3A schema/migration", () => {
    const packageStatus = execFileSync(
      "git",
      ["status", "--short", "--", "package.json", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );
    const schemaDiff = execFileSync(
      "git",
      [
        "diff",
        "--name-only",
        "--",
        "prisma/schema.prisma",
        "prisma/migrations/000001_minimal_runtime_slice/migration.sql",
      ],
      { encoding: "utf8" },
    );

    expect(packageStatus.trim()).toBe("");
    expect(schemaDiff.trim()).toBe("");
  });
});
