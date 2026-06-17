import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  RuntimeRepositoryReadIntents,
  RuntimeRepositoryRecordKinds,
  RuntimeRepositoryWriteIntents,
  assertRuntimeRepositoryResult,
  createRuntimeRepositoryLayer,
  type RuntimeRepositoryAdmissionDecisionRecord,
  type RuntimeRepositoryApprovalRequestRecord,
  type RuntimeRepositoryAuditRecord,
  type RuntimeRepositoryClient,
  type RuntimeRepositoryGovernedRunRecord,
  type RuntimeRepositoryPolicyDecisionRecord,
  type RuntimeRepositoryStateSnapshotRecord,
} from ".";

const timestamp = "2026-01-01T00:00:00.000Z";

function governedRun(
  overrides: Partial<RuntimeRepositoryGovernedRunRecord> = {},
): RuntimeRepositoryGovernedRunRecord {
  return {
    id: "run_01",
    tenantId: "tenant_01",
    correlationId: "correlation_01",
    currentState: "CREATED",
    status: "CREATED",
    resourceRef: "resource_01",
    requesterRef: "requester_01",
    purpose: "COMPLIANCE_REVIEW",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function stateSnapshot(
  overrides: Partial<RuntimeRepositoryStateSnapshotRecord> = {},
): RuntimeRepositoryStateSnapshotRecord {
  return {
    id: "state_01",
    tenantId: "tenant_01",
    governedRunId: "run_01",
    state: "CREATED",
    sequence: 1,
    reasonCode: "STATE_CREATED",
    safeSummary: "State snapshot recorded.",
    createdAt: timestamp,
    ...overrides,
  };
}

function policyDecision(
  overrides: Partial<RuntimeRepositoryPolicyDecisionRecord> = {},
): RuntimeRepositoryPolicyDecisionRecord {
  return {
    id: "policy_01",
    tenantId: "tenant_01",
    governedRunId: "run_01",
    riskLevel: "LOW",
    outcome: "ADMIT",
    reasonCode: "LOW_RISK",
    safeSummary: "Policy decision recorded.",
    policyRef: "policy_ref_01",
    createdAt: timestamp,
    ...overrides,
  };
}

function admissionDecision(
  overrides: Partial<RuntimeRepositoryAdmissionDecisionRecord> = {},
): RuntimeRepositoryAdmissionDecisionRecord {
  return {
    id: "admission_01",
    tenantId: "tenant_01",
    governedRunId: "run_01",
    outcome: "ADMIT",
    reasonCode: "ADMISSION_GRANTED",
    safeSummary: "Admission decision recorded.",
    lifecycleIntentHint: "GRANT_ADMISSION",
    createdAt: timestamp,
    ...overrides,
  };
}

function approvalRequest(
  overrides: Partial<RuntimeRepositoryApprovalRequestRecord> = {},
): RuntimeRepositoryApprovalRequestRecord {
  return {
    id: "approval_01",
    tenantId: "tenant_01",
    governedRunId: "run_01",
    admissionDecisionRecordId: "admission_01",
    status: "PENDING",
    requestedRole: "compliance_reviewer",
    requesterRef: "requester_01",
    createdAt: timestamp,
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
    recordKindHint: "GOVERNANCE",
    reasonCode: "REQUEST_CREATED",
    safeSummary: "Audit boundary recorded.",
    subjectRef: "subject_01",
    createdAt: timestamp,
    ...overrides,
  };
}

type FakeRuntimeRepositoryClientOptions = {
  readonly throwOnCreateGovernedRun?: boolean;
};

function createFakeClient(
  options: FakeRuntimeRepositoryClientOptions = {},
): RuntimeRepositoryClient {
  const governedRuns: RuntimeRepositoryGovernedRunRecord[] = [];
  const stateSnapshots: RuntimeRepositoryStateSnapshotRecord[] = [];
  const policyDecisions: RuntimeRepositoryPolicyDecisionRecord[] = [];
  const admissionDecisions: RuntimeRepositoryAdmissionDecisionRecord[] = [];
  const approvalRequests: RuntimeRepositoryApprovalRequestRecord[] = [];
  const auditRecords: RuntimeRepositoryAuditRecord[] = [];

  return {
    createGovernedRun(input) {
      if (options.throwOnCreateGovernedRun) {
        throw new Error("SQLITE raw database failure with secret details");
      }

      const record = { ...input };
      governedRuns.push(record);
      return record;
    },
    createRuntimeStateSnapshot(input) {
      const record = { ...input };
      stateSnapshots.push(record);
      return record;
    },
    createPolicyDecisionRecord(input) {
      const record = { ...input };
      policyDecisions.push(record);
      return record;
    },
    createAdmissionDecisionRecord(input) {
      const record = { ...input };
      admissionDecisions.push(record);
      return record;
    },
    createApprovalRequest(input) {
      const record = { ...input };
      approvalRequests.push(record);
      return record;
    },
    createAuditRecord(input) {
      const record = { ...input };
      auditRecords.push(record);
      return record;
    },
    findGovernedRunByTenantAndCorrelation(input) {
      return (
        governedRuns.find(
          (record) =>
            record.tenantId === input.tenantId &&
            record.correlationId === input.correlationId,
        ) ?? null
      );
    },
    listRuntimeStateSnapshotsByRun(input) {
      return stateSnapshots.filter(
        (record) =>
          record.tenantId === input.tenantId &&
          record.governedRunId === input.governedRunId,
      );
    },
    listPolicyDecisionRecordsByRun(input) {
      return policyDecisions.filter(
        (record) =>
          record.tenantId === input.tenantId &&
          record.governedRunId === input.governedRunId,
      );
    },
    listAdmissionDecisionRecordsByRun(input) {
      return admissionDecisions.filter(
        (record) =>
          record.tenantId === input.tenantId &&
          record.governedRunId === input.governedRunId,
      );
    },
    listApprovalRequestsByRun(input) {
      return approvalRequests.filter(
        (record) =>
          record.tenantId === input.tenantId &&
          record.governedRunId === input.governedRunId,
      );
    },
    listAuditRecordsByRun(input) {
      return auditRecords.filter(
        (record) =>
          record.tenantId === input.tenantId &&
          record.governedRunId === input.governedRunId,
      );
    },
  };
}

function repository(client: RuntimeRepositoryClient = createFakeClient()) {
  return assertRuntimeRepositoryResult(createRuntimeRepositoryLayer(client));
}

describe("runtime repository layer", () => {
  it("exports exact record kinds, write intents and read intents", () => {
    expect(RuntimeRepositoryRecordKinds).toEqual([
      "GOVERNED_RUN",
      "RUNTIME_STATE_SNAPSHOT",
      "POLICY_DECISION_RECORD",
      "ADMISSION_DECISION_RECORD",
      "APPROVAL_REQUEST",
      "AUDIT_RECORD",
    ]);
    expect(RuntimeRepositoryWriteIntents).toEqual([
      "CREATE_GOVERNED_RUN",
      "CREATE_RUNTIME_STATE_SNAPSHOT",
      "CREATE_POLICY_DECISION_RECORD",
      "CREATE_ADMISSION_DECISION_RECORD",
      "CREATE_APPROVAL_REQUEST",
      "CREATE_AUDIT_RECORD",
    ]);
    expect(RuntimeRepositoryReadIntents).toEqual([
      "FIND_GOVERNED_RUN_BY_TENANT_AND_CORRELATION",
      "LIST_RUNTIME_STATE_SNAPSHOTS_BY_RUN",
      "LIST_POLICY_DECISION_RECORDS_BY_RUN",
      "LIST_ADMISSION_DECISION_RECORDS_BY_RUN",
      "LIST_APPROVAL_REQUESTS_BY_RUN",
      "LIST_AUDIT_RECORDS_BY_RUN",
    ]);
  });

  it("requires an injected client", () => {
    expect(createRuntimeRepositoryLayer(undefined).ok).toBe(false);
    expect(createRuntimeRepositoryLayer({}).ok).toBe(false);
  });

  it("creates a governed run with safe input using an injected fake client", async () => {
    const result = await repository().createGovernedRun(governedRun());

    expect(result.ok).toBe(true);
    expect(assertRuntimeRepositoryResult(result).recordKind).toBe(
      "GOVERNED_RUN",
    );
  });

  it("requires tenantId and governedRunId for run-linked writes", async () => {
    const layer = repository();

    const cases = [
      () => layer.createRuntimeStateSnapshot(stateSnapshot({ tenantId: "" })),
      () =>
        layer.createRuntimeStateSnapshot(stateSnapshot({ governedRunId: "" })),
      () => layer.createPolicyDecisionRecord(policyDecision({ tenantId: "" })),
      () =>
        layer.createPolicyDecisionRecord(policyDecision({ governedRunId: "" })),
      () =>
        layer.createAdmissionDecisionRecord(
          admissionDecision({ tenantId: "" }),
        ),
      () =>
        layer.createAdmissionDecisionRecord(
          admissionDecision({ governedRunId: "" }),
        ),
      () => layer.createApprovalRequest(approvalRequest({ tenantId: "" })),
      () =>
        layer.createApprovalRequest(approvalRequest({ governedRunId: "" })),
      () => layer.createAuditRecord(auditRecord({ tenantId: "" })),
      () => layer.createAuditRecord(auditRecord({ governedRunId: "" })),
    ];

    for (const create of cases) {
      const result = await create();
      expect(result.ok).toBe(false);
    }
  });

  it("creates all run-linked records with safe inputs", async () => {
    const layer = repository();

    expect(
      assertRuntimeRepositoryResult(
        await layer.createRuntimeStateSnapshot(stateSnapshot()),
      ).recordKind,
    ).toBe("RUNTIME_STATE_SNAPSHOT");
    expect(
      assertRuntimeRepositoryResult(
        await layer.createPolicyDecisionRecord(policyDecision()),
      ).recordKind,
    ).toBe("POLICY_DECISION_RECORD");
    expect(
      assertRuntimeRepositoryResult(
        await layer.createAdmissionDecisionRecord(admissionDecision()),
      ).recordKind,
    ).toBe("ADMISSION_DECISION_RECORD");
    expect(
      assertRuntimeRepositoryResult(
        await layer.createApprovalRequest(approvalRequest()),
      ).recordKind,
    ).toBe("APPROVAL_REQUEST");
    expect(
      assertRuntimeRepositoryResult(await layer.createAuditRecord(auditRecord()))
        .recordKind,
    ).toBe("AUDIT_RECORD");
  });

  it("requires tenantId and correlationId for read by correlation", async () => {
    const layer = repository();

    expect(
      (await layer.findGovernedRunByTenantAndCorrelation({
        tenantId: "",
        correlationId: "correlation_01",
      })).ok,
    ).toBe(false);
    expect(
      (await layer.findGovernedRunByTenantAndCorrelation({
        tenantId: "tenant_01",
        correlationId: "",
      })).ok,
    ).toBe(false);
  });

  it("requires tenantId and governedRunId for read by run operations", async () => {
    const layer = repository();
    const readers = [
      layer.listRuntimeStateSnapshotsByRun,
      layer.listPolicyDecisionRecordsByRun,
      layer.listAdmissionDecisionRecordsByRun,
      layer.listApprovalRequestsByRun,
      layer.listAuditRecordsByRun,
    ];

    for (const read of readers) {
      expect(
        (await read({ tenantId: "", governedRunId: "run_01" })).ok,
      ).toBe(false);
      expect(
        (await read({ tenantId: "tenant_01", governedRunId: "" })).ok,
      ).toBe(false);
    }
  });

  it("converts client errors to safe denials without leaking raw database errors", async () => {
    const result = await repository(
      createFakeClient({ throwOnCreateGovernedRun: true }),
    ).createGovernedRun(governedRun());

    expect(result.ok).toBe(false);

    if (!result.ok) {
      const denial = JSON.stringify(result.error);
      expect(result.error.code).toBe("RUNTIME_REPOSITORY_CLIENT_ERROR");
      expect(denial).not.toContain("SQLITE");
      expect(denial).not.toContain("secret");
      expect(denial).not.toContain("stack");
    }
  });

  it("returns not-found as non-enumerating safe read result", async () => {
    const result = await repository().findGovernedRunByTenantAndCorrelation({
      tenantId: "tenant_01",
      correlationId: "missing_correlation",
    });

    expect(result.ok).toBe(true);

    const value = assertRuntimeRepositoryResult(result);

    expect(value.found).toBe(false);
    expect(value.record).toBeNull();
    expect(value.safeSummary).not.toContain("does not exist");
  });

  it("read methods return safe descriptors", async () => {
    const client = createFakeClient();
    const layer = repository(client);

    await layer.createGovernedRun(governedRun());
    await layer.createRuntimeStateSnapshot(stateSnapshot());
    await layer.createPolicyDecisionRecord(policyDecision());
    await layer.createAdmissionDecisionRecord(admissionDecision());
    await layer.createApprovalRequest(approvalRequest());
    await layer.createAuditRecord(auditRecord());

    expect(
      assertRuntimeRepositoryResult(
        await layer.findGovernedRunByTenantAndCorrelation({
          tenantId: "tenant_01",
          correlationId: "correlation_01",
        }),
      ).found,
    ).toBe(true);
    expect(
      assertRuntimeRepositoryResult(
        await layer.listRuntimeStateSnapshotsByRun({
          tenantId: "tenant_01",
          governedRunId: "run_01",
        }),
      ).records,
    ).toHaveLength(1);
    expect(
      assertRuntimeRepositoryResult(
        await layer.listPolicyDecisionRecordsByRun({
          tenantId: "tenant_01",
          governedRunId: "run_01",
        }),
      ).records,
    ).toHaveLength(1);
    expect(
      assertRuntimeRepositoryResult(
        await layer.listAdmissionDecisionRecordsByRun({
          tenantId: "tenant_01",
          governedRunId: "run_01",
        }),
      ).records,
    ).toHaveLength(1);
    expect(
      assertRuntimeRepositoryResult(
        await layer.listApprovalRequestsByRun({
          tenantId: "tenant_01",
          governedRunId: "run_01",
        }),
      ).records,
    ).toHaveLength(1);
    expect(
      assertRuntimeRepositoryResult(
        await layer.listAuditRecordsByRun({
          tenantId: "tenant_01",
          governedRunId: "run_01",
        }),
      ).records,
    ).toHaveLength(1);
  });

  it("does not mutate input records", async () => {
    const input = governedRun();
    const before = JSON.stringify(input);

    await repository().createGovernedRun(input);

    expect(JSON.stringify(input)).toBe(before);
  });

  it("does not accept raw document content fields", async () => {
    const layer = repository();
    const rawFields = [
      "rawDocument",
      "documentContent",
      "rawContent",
      "fileBlob",
      "binary",
      "payload",
    ];

    for (const field of rawFields) {
      const result = await layer.createGovernedRun({
        ...governedRun(),
        [field]: "unsafe_content",
      });

      expect(result.ok).toBe(false);
    }
  });

  it("keeps fake client test-only and package files unchanged", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "package.json", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );
    const schemaStatus = execFileSync(
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

    expect(status.trim()).toBe("");
    expect(schemaStatus.trim()).toBe("");
  });
});
