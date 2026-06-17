import { describe, expect, it } from "vitest";

import {
  INVESTIGATION_SELECTION_READONLY_BOUNDARY_PHASE,
  InvestigationSelectionTargetModes,
  InvestigationSelectionVerdicts,
  createInvestigationSelectionReadonlyBoundary,
  failClosedInvestigationSelectionDenial,
  resolveInvestigationSelectionTarget,
} from ".";
import {
  MINIMAL_INVESTIGATION_REFERENCE_RECORDS,
  MINIMAL_INVESTIGATION_REFERENCE_SCENARIO,
  createMinimalInvestigationReadonlyRepositoryClient,
} from "../minimal-investigation-ui-surface";

describe("investigation selection readonly boundary", () => {
  it("exports exact phase, target modes and verdicts", () => {
    expect(INVESTIGATION_SELECTION_READONLY_BOUNDARY_PHASE).toBe("3G");
    expect(InvestigationSelectionTargetModes).toEqual([
      "CONTROLLED_REFERENCE",
      "RUN_SCOPE",
    ]);
    expect(InvestigationSelectionVerdicts).toEqual([
      "INVESTIGATION_TARGET_RESOLVED",
      "INVESTIGATION_TARGET_NOT_FOUND",
      "INVESTIGATION_TARGET_INCOMPLETE",
      "INVESTIGATION_TARGET_BLOCKED",
      "INVESTIGATION_TARGET_FAILED_SAFE",
    ]);
    expect(createInvestigationSelectionReadonlyBoundary).toBeTypeOf("function");
    expect(resolveInvestigationSelectionTarget).toBeTypeOf("function");
    expect(failClosedInvestigationSelectionDenial).toBeTypeOf("function");
  });

  it("creates a read-only boundary with explicit supported target modes", () => {
    const boundary = createInvestigationSelectionReadonlyBoundary();

    expect(boundary.ok).toBe(true);

    if (!boundary.ok) {
      throw new Error("Boundary setup denied.");
    }

    expect(boundary.value.readOnly).toBe(true);
    expect(boundary.value.supportedTargetModes).toEqual([
      "CONTROLLED_REFERENCE",
      "RUN_SCOPE",
    ]);
    expect(boundary.value.boundaryNotes.join(" ")).toContain("read-only");
  });

  it("resolves the controlled reference target through the persisted read model", async () => {
    const result = await resolveInvestigationSelectionTarget();

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Selection unexpectedly denied.");
    }

    expect(result.value.verdict).toBe("INVESTIGATION_TARGET_RESOLVED");
    expect(result.value.source).toBe("controlled-reference");
    expect(result.value.readOnly).toBe(true);
    expect(result.value.targetRef).toEqual({
      tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
      governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
      correlationId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.correlationId,
    });
    expect(result.value.uiDescriptor.overview.governedRunId).toBe(
      "run_approved_reference",
    );
    expect(result.value.uiDescriptor.auditTrail.presentMoments).toContain(
      "APPROVAL_DECIDED",
    );
  });

  it("resolves an explicit run-scope target without broad listing or search", async () => {
    const result = await resolveInvestigationSelectionTarget({
      target: {
        selectionMode: "RUN_SCOPE",
        tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
        governedRunId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.governedRunId,
        correlationId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.correlationId,
      },
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Selection unexpectedly denied.");
    }

    expect(result.value.verdict).toBe("INVESTIGATION_TARGET_RESOLVED");
    expect(result.value.source).toBe("repository-read-model");
    expect(result.value.uiDescriptor.persistenceCoverage.foundRecords).toEqual([
      "GovernedRun",
      "RuntimeStateSnapshot",
      "PolicyDecisionRecord",
      "AdmissionDecisionRecord",
      "ApprovalRequest",
      "AuditRecord",
    ]);
  });

  it("handles not found without leaking tenant existence", async () => {
    const result = await resolveInvestigationSelectionTarget({
      target: {
        selectionMode: "RUN_SCOPE",
        tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
        governedRunId: "run_missing_reference",
        correlationId: "run_missing_reference_correlation",
      },
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Selection unexpectedly denied.");
    }

    expect(result.value.verdict).toBe("INVESTIGATION_TARGET_NOT_FOUND");
    expect(result.value.uiDescriptor.verdict).toBe("INVESTIGATION_BLOCKED");
    expect(result.value.uiDescriptor.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "GOVERNED_RUN_MISSING",
          severity: "BLOCKER",
        }),
      ]),
    );
    expect(JSON.stringify(result.value)).not.toMatch(/tenant exists/i);
  });

  it("handles incomplete reconstruction when audit coverage is missing", async () => {
    const repositoryClient = createMinimalInvestigationReadonlyRepositoryClient({
      ...MINIMAL_INVESTIGATION_REFERENCE_RECORDS,
      auditRecords: MINIMAL_INVESTIGATION_REFERENCE_RECORDS.auditRecords.filter(
        (record) => record.moment !== "ADMISSION_DECIDED",
      ),
    });
    const result = await resolveInvestigationSelectionTarget({
      repositoryClient,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Selection unexpectedly denied.");
    }

    expect(result.value.verdict).toBe("INVESTIGATION_TARGET_INCOMPLETE");
    expect(result.value.uiDescriptor.auditTrail.missingMoments).toContain(
      "ADMISSION_DECIDED",
    );
  });

  it("handles incomplete reconstruction when approval is missing", async () => {
    const repositoryClient = createMinimalInvestigationReadonlyRepositoryClient({
      ...MINIMAL_INVESTIGATION_REFERENCE_RECORDS,
      approvalRequests: [],
    });
    const result = await resolveInvestigationSelectionTarget({
      repositoryClient,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Selection unexpectedly denied.");
    }

    expect(result.value.verdict).toBe("INVESTIGATION_TARGET_INCOMPLETE");
    expect(result.value.uiDescriptor.approval.approvalRequired).toBe(true);
    expect(result.value.uiDescriptor.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "APPROVAL_RECORD_MISSING",
          severity: "WARNING",
        }),
      ]),
    );
  });

  it("blocks tenant or run boundary mismatch safely", async () => {
    const result = await resolveInvestigationSelectionTarget({
      target: {
        selectionMode: "RUN_SCOPE",
        tenantId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.tenantId,
        governedRunId: "run_other_scope",
        correlationId: MINIMAL_INVESTIGATION_REFERENCE_SCENARIO.correlationId,
      },
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Selection unexpectedly denied.");
    }

    expect(result.value.verdict).toBe("INVESTIGATION_TARGET_BLOCKED");
    expect(result.value.uiDescriptor.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "GOVERNED_RUN_SCOPE_MISMATCH",
          severity: "BLOCKER",
        }),
      ]),
    );
  });

  it("fails closed for unsafe raw target input", async () => {
    const result = await resolveInvestigationSelectionTarget({
      target: {
        selectionMode: "RUN_SCOPE",
        tenantId: "tenant_01",
        governedRunId: "run_01",
        correlationId: "correlation_01",
        rawDocument: "unsafe",
      },
    });

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error("Selection unexpectedly succeeded.");
    }

    expect(result.error.verdict).toBe("INVESTIGATION_TARGET_FAILED_SAFE");
    expect(result.error.safeReason).toBe(
      "The investigation selection target is invalid or unsafe.",
    );
    expect(JSON.stringify(result.error)).not.toContain("rawDocument");
  });

  it("fails closed for null target instead of silently using the default", async () => {
    const result = await resolveInvestigationSelectionTarget({
      target: null,
    });

    expect(result.ok).toBe(false);
  });

  it("fails closed when required run-scope identifiers are missing", async () => {
    const result = await resolveInvestigationSelectionTarget({
      target: {
        selectionMode: "RUN_SCOPE",
        tenantId: "tenant_01",
        correlationId: "correlation_01",
      },
    });

    expect(result.ok).toBe(false);
  });

  it("sanitizes repository client errors", async () => {
    const repositoryClient = {
      ...createMinimalInvestigationReadonlyRepositoryClient(),
      findGovernedRunByTenantAndCorrelation() {
        throw new Error("SQL SELECT rawDocument password stack trace");
      },
    };
    const result = await resolveInvestigationSelectionTarget({
      repositoryClient,
    });
    const serialized = JSON.stringify(result);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("Selection unexpectedly denied.");
    }

    expect(result.value.verdict).toBe("INVESTIGATION_TARGET_FAILED_SAFE");
    expect(serialized).not.toMatch(
      /SQL SELECT|rawDocument|password|stack trace/i,
    );
  });
});
