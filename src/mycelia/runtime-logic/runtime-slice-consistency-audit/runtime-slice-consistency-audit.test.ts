import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  evaluateInternalRuntimeOrchestratorV1,
  type InternalRuntimeOrchestratorV1InputCandidate,
} from "../../runtime-logic/internal-runtime-orchestrator-v1";
import {
  getRuntimeSliceConsistencyAudit,
  RuntimeSliceConsistencyAuditSections,
  RuntimeSliceConsistencyAuditVerdicts,
  RuntimeSliceConsistencyFindingSeverities,
  RuntimeSliceConsistencyRuntimeModules,
} from ".";

const tenantId = "tenant_01";
const runId = "run_01";
const correlationId = "correlation_01";

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

function persistenceRefs(tenant = tenantId) {
  return [
    {
      record: "GovernedRun" as const,
      tenant_id: tenant,
      ref: "governed_run_persistence_ref",
    },
    {
      record: "RuntimeStateSnapshot" as const,
      tenant_id: tenant,
      ref: "runtime_state_persistence_ref",
    },
    {
      record: "PolicyDecisionRecord" as const,
      tenant_id: tenant,
      ref: "policy_decision_persistence_ref",
    },
    {
      record: "AdmissionDecisionRecord" as const,
      tenant_id: tenant,
      ref: "admission_decision_persistence_ref",
    },
    {
      record: "ApprovalRequest" as const,
      tenant_id: tenant,
      ref: "approval_request_persistence_ref",
    },
    {
      record: "AuditRecord" as const,
      tenant_id: tenant,
      ref: "audit_record_persistence_ref",
    },
  ];
}

function approvalDecision(decisionOutcome: "APPROVE" | "REJECT" | "TIMEOUT") {
  return {
    approval_request_id: "approval_request_ref",
    requested_role: "compliance_reviewer",
    approver_ref: "approver_ref",
    decision_outcome: decisionOutcome,
    decision_reason_code: "APPROVAL_DECISION",
    safe_decision_summary: "approval_decision_ref",
  };
}

function baseInput(
  overrides: Partial<InternalRuntimeOrchestratorV1InputCandidate> = {},
): InternalRuntimeOrchestratorV1InputCandidate {
  return {
    tenant_id: tenantId,
    run_id: runId,
    correlation_id: correlationId,
    requester_ref: "requester_ref",
    resource_ref: "resource_ref",
    action: "document.review",
    purpose: "COMPLIANCE_REVIEW",
    risk_level: "LOW",
    context_status: "RESOLVED",
    tenant_boundary_status: "MATCHED",
    has_required_context: true,
    policy_ref: "policy_ref",
    orchestration_purpose: "Assemble descriptor-only orchestration.",
    requested_by_ref: "orchestrator_ref",
    persistence_record_refs: persistenceRefs(),
    ...overrides,
  };
}

function orchestratorStatusFor(input: unknown) {
  const result = evaluateInternalRuntimeOrchestratorV1(input);

  if (result.ok) {
    return result.value.orchestration_status;
  }

  return result.error.orchestration_status;
}

describe("runtime slice consistency audit", () => {
  it("exports the audit descriptor and enums", () => {
    const audit = getRuntimeSliceConsistencyAudit();

    expect(audit.name).toBe("Runtime Slice Consistency Audit");
    expect(audit.phase).toBe("2Z");
    expect(audit.verdict).toBe("GREEN");
    expect(RuntimeSliceConsistencyAuditVerdicts).toEqual([
      "GREEN",
      "YELLOW",
      "RED",
    ]);
    expect(RuntimeSliceConsistencyFindingSeverities).toEqual([
      "INFO",
      "WARNING",
      "BLOCKER",
    ]);
  });

  it("contains all required audit sections", () => {
    const audit = getRuntimeSliceConsistencyAudit();

    expect(audit.sections).toEqual([
      "scope",
      "moduleInventory",
      "flowConsistency",
      "orchestratorDecisionPaths",
      "safetyBoundary",
      "sideEffectBoundary",
      "documentationAlignment",
      "persistenceReadiness",
      "phase3AReadiness",
      "risks",
      "requiredNextActions",
    ]);
    expect(audit.sections).toEqual(RuntimeSliceConsistencyAuditSections);
  });

  it("includes all nine runtime slice modules", () => {
    const audit = getRuntimeSliceConsistencyAudit();
    const modules = audit.module_inventory.map((entry) => entry.module);

    expect(modules).toEqual([...RuntimeSliceConsistencyRuntimeModules]);
  });

  it("module inventory includes phase and boundary for each module", () => {
    const audit = getRuntimeSliceConsistencyAudit();

    for (const entry of audit.module_inventory) {
      expect(entry.phase_introduced).toMatch(/^2[QRSTUVWXYZ]$/);
      expect(entry.role.length).toBeGreaterThan(10);
      expect(entry.expected_boundary.length).toBeGreaterThan(10);
      expect(entry.pure_typescript).toBe(true);
      expect(entry.inactive_persistence_runtime_api).toBe(true);
    }
  });

  it("flow order is exactly the expected runtime slice order", () => {
    const audit = getRuntimeSliceConsistencyAudit();

    expect(audit.flow_order).toEqual([
      "runtime-slice-technical-plan",
      "runtime-persistence-model",
      "governed-run-lifecycle",
      "policy-admission-v1",
      "audit-commit-boundary",
      "approval-gate-v1",
      "investigation-view-model-v1",
      "replay-dry-run-descriptor-v1",
      "internal-runtime-orchestrator-v1",
    ]);
  });

  it("includes all required orchestrator decision paths", () => {
    const audit = getRuntimeSliceConsistencyAudit();
    const pathMap = new Map(
      audit.orchestrator_decision_paths.map((path) => [
        path.path,
        path.expected_result,
      ]),
    );

    expect(pathMap.get("low-risk input")).toBe("COMPLETED_DESCRIPTOR");
    expect(pathMap.get("medium-risk without approval")).toBe(
      "WAITING_APPROVAL",
    );
    expect(pathMap.get("medium-risk approved")).toBe("COMPLETED_DESCRIPTOR");
    expect(pathMap.get("medium-risk rejected")).toBe("REJECTED_DESCRIPTOR");
    expect(pathMap.get("medium-risk timeout")).toBe("FAILED_DESCRIPTOR");
    expect(pathMap.get("high-risk input")).toBe("REJECTED_DESCRIPTOR");
    expect(pathMap.get("missing context")).toBe("REJECTED_DESCRIPTOR");
    expect(pathMap.get("tenant boundary mismatch")).toBe(
      "REJECTED_DESCRIPTOR",
    );
    expect(pathMap.get("invalid input")).toBe("BLOCKED");
  });

  it("actual orchestrator paths match audit expectations", () => {
    expect(orchestratorStatusFor(baseInput())).toBe("COMPLETED_DESCRIPTOR");
    expect(orchestratorStatusFor(baseInput({ risk_level: "MEDIUM" }))).toBe(
      "WAITING_APPROVAL",
    );
    expect(
      orchestratorStatusFor(
        baseInput({
          risk_level: "MEDIUM",
          approval_decision_input: approvalDecision("APPROVE"),
        }),
      ),
    ).toBe("COMPLETED_DESCRIPTOR");
    expect(
      orchestratorStatusFor(
        baseInput({
          risk_level: "MEDIUM",
          approval_decision_input: approvalDecision("REJECT"),
        }),
      ),
    ).toBe("REJECTED_DESCRIPTOR");
    expect(
      orchestratorStatusFor(
        baseInput({
          risk_level: "MEDIUM",
          approval_decision_input: approvalDecision("TIMEOUT"),
        }),
      ),
    ).toBe("FAILED_DESCRIPTOR");
    expect(orchestratorStatusFor(baseInput({ risk_level: "HIGH" }))).toBe(
      "REJECTED_DESCRIPTOR",
    );
    expect(
      orchestratorStatusFor(
        baseInput({
          has_required_context: false,
          context_status: "MISSING",
        }),
      ),
    ).toBe("REJECTED_DESCRIPTOR");
    expect(
      orchestratorStatusFor(baseInput({ tenant_boundary_status: "MISMATCHED" })),
    ).toBe("REJECTED_DESCRIPTOR");
    expect(orchestratorStatusFor({ tenant_id: tenantId })).toBe("BLOCKED");
  });

  it("confirms runtime, replay, persistence, DB, API, auth, UI, audit and event boundaries", () => {
    const audit = getRuntimeSliceConsistencyAudit();
    const text = JSON.stringify(audit).toLowerCase();

    expect(text).toContain("runtime execution");
    expect(text).toContain("replay execution");
    expect(text).toContain("persistence");
    expect(text).toContain("storage reads");
    expect(text).toContain("storage writes");
    expect(text).toContain("api routes");
    expect(text).toContain("auth");
    expect(text).toContain("ui");
    expect(text).toContain("audit writing");
    expect(text).toContain("event emission");
    expect(audit.explicitly_not_active).toContain("runtime execution");
    expect(audit.explicitly_not_active).toContain("replay execution");
    expect(audit.explicitly_not_active).toContain("persistence");
  });

  it("confirms Phase 3A is the next recommended phase", () => {
    const audit = getRuntimeSliceConsistencyAudit();

    expect(audit.phase3a_readiness.recommendation).toBe("GO");
    expect(audit.phase3a_readiness.next_phase).toBe(
      "Phase 3A Minimal Persistence Activation",
    );
    expect(audit.phase3a_readiness.go_no_go_statement).toContain("GO");
  });

  it("confirms pnpm-lock.yaml is not modified", () => {
    const status = execFileSync(
      "git",
      ["status", "--short", "--", "pnpm-lock.yaml"],
      { encoding: "utf8" },
    );

    expect(status.trim()).toBe("");
  });

  it("documents runtime slice consistency audit without activating runtime behavior", () => {
    const docPath = repoPath(
      "docs",
      "product",
      "runtime-logic",
      "runtime-slice-consistency-audit.md",
    );

    expect(existsSync(docPath)).toBe(true);

    const doc = readFileSync(docPath, "utf8")
      .toLowerCase()
      .replace(/\s+/g, " ");

    expect(doc).toContain("runtime slice consistency audit");
    expect(doc).toContain("does not execute runtime");
    expect(doc).toContain("does not persist");
    expect(doc).toContain("does not call apis");
    expect(doc).toContain("phase 3a minimal persistence activation");
  });

  it("does not reference or modify protected future docs from audit code or docs", () => {
    const auditFiles = [
      repoPath(
        "src",
        "mycelia",
        "runtime-logic",
        "runtime-slice-consistency-audit",
        "runtime-slice-consistency-audit.ts",
      ),
      repoPath(
        "src",
        "mycelia",
        "runtime-logic",
        "runtime-slice-consistency-audit",
        "README.md",
      ),
      repoPath("docs", "product", "runtime-logic", "runtime-slice-consistency-audit.md"),
    ];

    for (const file of auditFiles) {
      const text = readFileSync(file, "utf8");
      expect(text).not.toMatch(/docs\/mycelia\/2/i);
      expect(text).not.toMatch(/\b2[0-6]-/);
    }

    const diff = execFileSync("git", ["diff", "--name-only", "--", "docs/mycelia"], {
      encoding: "utf8",
    });

    expect(diff).not.toMatch(/docs\/mycelia\/2[0-6]/);
  });
});
