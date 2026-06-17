import { describe, expect, it } from "vitest";

import {
  MINIMAL_INVESTIGATION_REFERENCE_RECORDS,
  MINIMAL_INVESTIGATION_REFERENCE_SCENARIO,
  MinimalInvestigationUiLoadStatuses,
  createMinimalInvestigationReadonlyRepositoryClient,
  loadMinimalInvestigationUiDescriptor,
  mapPersistedInvestigationReadModelToUiDescriptor,
} from ".";
import {
  assertPersistedInvestigationReadModelResult,
  createPersistedInvestigationReadModel,
} from "../persisted-investigation-read-model";

describe("minimal investigation ui live read-only loader", () => {
  it("exports exact load statuses", () => {
    expect(MinimalInvestigationUiLoadStatuses).toEqual([
      "LOADED",
      "INCOMPLETE",
      "NOT_FOUND",
      "FAILED_SAFE",
    ]);
  });

  it("loads a real persisted investigation read model through the repository boundary", async () => {
    const result = await loadMinimalInvestigationUiDescriptor();

    expect(result.status).toBe("LOADED");
    expect(result.readOnly).toBe(true);
    expect(result.source).toBe("persisted-investigation-read-model");
    expect(result.descriptor.overview.governedRunId).toBe(
      "run_approved_reference",
    );
    expect(result.descriptor.overview.governedRunId).not.toBe(
      "run_approved_static",
    );
    expect(result.descriptor.auditTrail.presentMoments).toContain(
      "APPROVAL_DECIDED",
    );
  });

  it("maps the persisted read model to the UI contract without leaking repository records", async () => {
    const repositoryClient = createMinimalInvestigationReadonlyRepositoryClient();
    const readModel = createPersistedInvestigationReadModel({
      repositoryClient,
    });

    if (!readModel.ok) {
      throw new Error("Read model setup denied.");
    }

    const reconstructed = assertPersistedInvestigationReadModelResult(
      await readModel.value.reconstruct(MINIMAL_INVESTIGATION_REFERENCE_SCENARIO),
    );
    const descriptor = mapPersistedInvestigationReadModelToUiDescriptor(
      reconstructed,
    );

    expect(descriptor.verdict).toBe("INVESTIGATION_RECONSTRUCTED");
    expect(descriptor.stateTimeline.entries?.length).toBeGreaterThan(0);
    expect(descriptor.persistenceCoverage.foundRecords).toEqual([
      "GovernedRun",
      "RuntimeStateSnapshot",
      "PolicyDecisionRecord",
      "AdmissionDecisionRecord",
      "ApprovalRequest",
      "AuditRecord",
    ]);
  });

  it("returns not found when the read model cannot find the governed run", async () => {
    const result = await loadMinimalInvestigationUiDescriptor({
      scenario: {
        ...MINIMAL_INVESTIGATION_REFERENCE_SCENARIO,
        governedRunId: "run_missing_reference",
        correlationId: "run_missing_reference_correlation",
      },
    });

    expect(result.status).toBe("NOT_FOUND");
    expect(result.descriptor.verdict).toBe("INVESTIGATION_BLOCKED");
    expect(result.descriptor.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "BLOCKER",
          code: "GOVERNED_RUN_MISSING",
        }),
      ]),
    );
  });

  it("returns incomplete when expected audit coverage is missing", async () => {
    const repositoryClient = createMinimalInvestigationReadonlyRepositoryClient({
      ...MINIMAL_INVESTIGATION_REFERENCE_RECORDS,
      auditRecords: MINIMAL_INVESTIGATION_REFERENCE_RECORDS.auditRecords.filter(
        (record) => record.moment !== "ADMISSION_DECIDED",
      ),
    });
    const result = await loadMinimalInvestigationUiDescriptor({
      repositoryClient,
    });

    expect(result.status).toBe("INCOMPLETE");
    expect(result.descriptor.verdict).toBe("INVESTIGATION_INCOMPLETE");
    expect(result.descriptor.auditTrail.missingMoments).toContain(
      "ADMISSION_DECIDED",
    );
  });

  it("returns incomplete when approval is required but the approval record is absent", async () => {
    const repositoryClient = createMinimalInvestigationReadonlyRepositoryClient({
      ...MINIMAL_INVESTIGATION_REFERENCE_RECORDS,
      approvalRequests: [],
    });
    const result = await loadMinimalInvestigationUiDescriptor({
      repositoryClient,
    });

    expect(result.status).toBe("INCOMPLETE");
    expect(result.descriptor.approval.approvalRequired).toBe(true);
    expect(result.descriptor.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "APPROVAL_RECORD_MISSING",
          severity: "WARNING",
        }),
      ]),
    );
  });

  it("keeps the reference repository client read-only", () => {
    const client = createMinimalInvestigationReadonlyRepositoryClient();

    expect(() =>
      client.createAuditRecord(MINIMAL_INVESTIGATION_REFERENCE_RECORDS.auditRecords[0])
    ).toThrow("Read-only investigation source denied mutation.");
  });
});
