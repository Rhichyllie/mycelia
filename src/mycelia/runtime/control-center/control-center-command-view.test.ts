import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PrismaClient } from "@prisma/client";
import { afterEach, describe, expect, it } from "vitest";

import { seedDemoScenario } from "../demo-seed-scenario";
import { createPrismaAdmissionRepository } from "../repositories/prisma-admission.repository";
import { createPrismaApprovalRequestRepository } from "../repositories/prisma-approval-request.repository";
import { createPrismaAuditRepository } from "../repositories/prisma-audit.repository";
import {
  createPrismaDemoReadRepository,
  type DemoPersistedRunSummary,
} from "../repositories/prisma-demo-read.repository";
import { createPrismaGovernedRunRepository } from "../repositories/prisma-governed-run.repository";
import { createPrismaPolicyRepository } from "../repositories/prisma-policy.repository";
import { createPrismaRuntimeStateRepository } from "../repositories/prisma-runtime-state.repository";
import { riskTone } from "../ui/risk-pill";
import { MYCELIA_TOKENS } from "../ui/design-tokens";

const tempRoots: string[] = [];
const COMMAND_VIEW_LIMIT = 8;

type PendingApprovalPreview = {
  readonly approvalId: string;
  readonly runId: string;
  readonly riskLevel: string | null;
  readonly requesterRef: string;
  readonly approvalHref: string;
};

type RecentRunPreview = {
  readonly runId: string;
  readonly status: string;
  readonly riskLevel: string | null;
  readonly purpose: string;
  readonly resourceRef: string;
  readonly runHref: string;
};

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

function sqliteUrl(dbPath: string): string {
  return `file:${dbPath.replace(/\\/g, "/")}`;
}

async function applyMigrationFile(client: PrismaClient, path: string) {
  const migration = readFileSync(path, "utf8");
  const statements = migration
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await client.$executeRawUnsafe(statement);
  }
}

async function applyMigrations(client: PrismaClient) {
  for (const migration of [
    "000001_minimal_runtime_slice",
    "000002_auth_foundation",
    "000003_workspace_graph_foundation",
  ]) {
    await applyMigrationFile(
      client,
      repoPath("prisma", "migrations", migration, "migration.sql"),
    );
  }
}

async function createTempClient() {
  const root = mkdtempSync(join(tmpdir(), "mycelia-control-command-"));
  const dbPath = join(root, "control-command.sqlite");
  const client = new PrismaClient({
    datasources: {
      db: { url: sqliteUrl(dbPath) },
    },
  });

  tempRoots.push(root);
  await applyMigrations(client);

  return { client, dbPath };
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function runHref(runId: string): string {
  return `/mycelia/runs?runId=${encodeURIComponent(runId)}`;
}

function approvalHref(approvalId: string): string {
  return `/mycelia/approvals?approvalId=${encodeURIComponent(approvalId)}`;
}

async function createHighRiskWaitingRun(
  client: PrismaClient,
  tenantId: string,
): Promise<{ readonly runId: string; readonly approvalId: string }> {
  const runId = "control_center_high_risk_run";
  const runs = createPrismaGovernedRunRepository(client);
  const states = createPrismaRuntimeStateRepository(client);
  const policies = createPrismaPolicyRepository(client);
  const admissions = createPrismaAdmissionRepository(client);
  const audits = createPrismaAuditRepository(client);
  const approvals = createPrismaApprovalRequestRepository(client);

  await runs.create({
    id: runId,
    tenantId,
    correlationId: "control_center_high_risk_correlation",
    currentState: "WAITING_APPROVAL",
    status: "WAITING_APPROVAL",
    resourceRef: "fixture://documents/high-risk-vendor-review",
    requesterRef: "demo://actor/requester",
    purpose: "high risk vendor exception review",
  });
  await states.createSnapshot({
    id: "control_center_high_state_01",
    tenantId,
    governedRunId: runId,
    state: "WAITING_APPROVAL",
    sequence: 1,
    reasonCode: "POLICY_REQUIRES_APPROVAL",
    safeSummary: "High risk fixture is waiting for a decision.",
  });
  await policies.createDecision({
    id: "control_center_high_policy_01",
    tenantId,
    governedRunId: runId,
    riskLevel: "HIGH",
    outcome: "APPROVAL_REQUIRED",
    reasonCode: "HIGH_RISK_REVIEW_REQUIRED",
    safeSummary: "High risk vendor exception requires review.",
    policyRef: "fixture://policy/high-risk-review",
  });
  await admissions.createDecision({
    id: "control_center_high_admission_01",
    tenantId,
    governedRunId: runId,
    outcome: "APPROVAL_REQUIRED",
    reasonCode: "POLICY_REQUIRES_APPROVAL",
    safeSummary: "Approval is required before this can proceed.",
    lifecycleIntentHint: "WAITING_APPROVAL",
  });
  await audits.create({
    id: "control_center_high_audit_01",
    tenantId,
    governedRunId: runId,
    moment: "POLICY_EVALUATED",
    requirement: "Policy check",
    recordKindHint: "POLICY_DECISION",
    reasonCode: "HIGH_RISK_REVIEW_REQUIRED",
    safeSummary: "High risk policy check was recorded.",
    subjectRef: runId,
    actorRef: "demo://actor/system",
    evidenceRef: "control_center_high_policy_01",
  });

  const approval = await approvals.findOrCreateForRun({
    tenantId,
    governedRunId: runId,
  });

  if (approval === null) {
    throw new Error("Expected high risk approval preview fixture.");
  }

  return { runId, approvalId: approval.id };
}

async function loadCommandPreview(
  client: PrismaClient,
  tenantId: string,
): Promise<{
  readonly recentRuns: readonly RecentRunPreview[];
  readonly pendingApprovals: readonly PendingApprovalPreview[];
}> {
  const runs = createPrismaGovernedRunRepository(client);
  const read = createPrismaDemoReadRepository(client);
  const approvals = createPrismaApprovalRequestRepository(client);
  const [recentRuns, pendingApprovals] = await Promise.all([
    runs.listRecent({ tenantId, take: COMMAND_VIEW_LIMIT }),
    approvals.listPendingForTenant({ tenantId, take: COMMAND_VIEW_LIMIT }),
  ]);
  const summaries = (
    await Promise.all(
      recentRuns.map((run) => read.findRunById({ tenantId, runId: run.id })),
    )
  ).filter((summary): summary is DemoPersistedRunSummary => summary !== null);
  const approvalSummaries = (
    await Promise.all(
      pendingApprovals.map(async (approval) => {
        const summary = await read.findRunById({
          tenantId,
          runId: approval.governedRunId,
        });

        return summary === null
          ? null
          : {
              approvalId: approval.id,
              runId: approval.governedRunId,
              riskLevel: summary.latestPolicy?.riskLevel ?? null,
              requesterRef: approval.requesterRef,
              approvalHref: approvalHref(approval.id),
            };
      }),
    )
  ).filter((preview): preview is PendingApprovalPreview => preview !== null);

  return {
    recentRuns: summaries.map((summary) => ({
      runId: summary.run.id,
      status: summary.run.status,
      riskLevel: summary.latestPolicy?.riskLevel ?? null,
      purpose: summary.run.purpose,
      resourceRef: summary.run.resourceRef,
      runHref: runHref(summary.run.id),
    })),
    pendingApprovals: approvalSummaries,
  };
}

describe("Control Center command view data", () => {
  it("loads recent runs and pending approvals from real SQLite", async () => {
    const { client } = await createTempClient();
    const tenantId = "tenant_control_command";

    try {
      const seed = await seedDemoScenario({ client, tenantId });
      const seedApproval = await createPrismaApprovalRequestRepository(
        client,
      ).findOrCreateForRun({ tenantId, governedRunId: seed.governedRunId });
      const highRisk = await createHighRiskWaitingRun(client, tenantId);
      const preview = await loadCommandPreview(client, tenantId);

      expect(seedApproval).not.toBeNull();
      expect(preview.recentRuns.length).toBeGreaterThanOrEqual(2);
      expect(preview.pendingApprovals.length).toBeGreaterThanOrEqual(2);

      const highRun = preview.recentRuns.find(
        (item) => item.runId === highRisk.runId,
      );
      const highApproval = preview.pendingApprovals.find(
        (item) => item.approvalId === highRisk.approvalId,
      );

      expect(highRun).toMatchObject({
        status: "WAITING_APPROVAL",
        riskLevel: "HIGH",
        purpose: "high risk vendor exception review",
        resourceRef: "fixture://documents/high-risk-vendor-review",
        runHref: runHref(highRisk.runId),
      });
      expect(highApproval).toMatchObject({
        runId: highRisk.runId,
        riskLevel: "HIGH",
        requesterRef: "demo://actor/requester",
        approvalHref: approvalHref(highRisk.approvalId),
      });
      expect(riskTone(highRun?.riskLevel).color).toBe(
        MYCELIA_TOKENS.color.state.danger,
      );
    } finally {
      await client.$disconnect();
    }
  });
});
