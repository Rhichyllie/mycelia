import type {
  AdmissionDecisionRecord,
  ApprovalRequest,
  AuditRecord,
  GovernedRun,
  PolicyDecisionRecord,
  PrismaClient,
  RuntimeStateSnapshot,
} from "@prisma/client";

import { prisma } from "../db/client";
import { getMyceliaDemoDatabaseConfig } from "../db/demo-config";
import { createPrismaAdmissionRepository } from "../repositories/prisma-admission.repository";
import { createPrismaApprovalRequestRepository } from "../repositories/prisma-approval-request.repository";
import { createPrismaAuditRepository } from "../repositories/prisma-audit.repository";
import { createPrismaGovernedRunRepository } from "../repositories/prisma-governed-run.repository";
import { createPrismaPolicyRepository } from "../repositories/prisma-policy.repository";
import { createPrismaRuntimeStateRepository } from "../repositories/prisma-runtime-state.repository";

export type InvestigationTimelineEntryKind =
  | "RuntimeStateSnapshot"
  | "PolicyDecisionRecord"
  | "AdmissionDecisionRecord"
  | "AuditRecord"
  | "ApprovalRequestCreated"
  | "ApprovalRequestDecided";

export type InvestigationTimelineEntry = {
  readonly kind: InvestigationTimelineEntryKind;
  readonly id: string;
  readonly occurredAt: Date;
  readonly title: string;
  readonly reasonCode: string | null;
  readonly safeSummary: string;
  readonly details: readonly {
    readonly label: string;
    readonly value: string | number | null;
  }[];
};

export type InvestigationTimelineSummary = {
  readonly auditCount: number;
  readonly finalState: string;
  readonly humanDecisionRequired: boolean;
  readonly humanDecisionOutcome: string;
};

export type InvestigationTimelineReadyResult = {
  readonly status: "READY";
  readonly run: GovernedRun;
  readonly timeline: readonly InvestigationTimelineEntry[];
  readonly snapshots: readonly RuntimeStateSnapshot[];
  readonly policies: readonly PolicyDecisionRecord[];
  readonly admission: AdmissionDecisionRecord | null;
  readonly audits: readonly AuditRecord[];
  readonly approvalRequest: ApprovalRequest | null;
  readonly summary: InvestigationTimelineSummary;
};

export type InvestigationTimelineEmptyResult = {
  readonly status: "EMPTY";
};

export type InvestigationTimelineResult =
  | InvestigationTimelineReadyResult
  | InvestigationTimelineEmptyResult;

export type LoadInvestigationTimelineInput = {
  readonly client?: PrismaClient;
  readonly tenantId?: string;
  readonly runId?: string;
};

function createRepositories(client: PrismaClient) {
  return {
    runs: createPrismaGovernedRunRepository(client),
    states: createPrismaRuntimeStateRepository(client),
    policy: createPrismaPolicyRepository(client),
    admission: createPrismaAdmissionRepository(client),
    audit: createPrismaAuditRepository(client),
    approvals: createPrismaApprovalRequestRepository(client),
  };
}

function displayValue(value: string | number | Date | null | undefined): string | number | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value ?? null;
}

function snapshotEntry(snapshot: RuntimeStateSnapshot): InvestigationTimelineEntry {
  return {
    kind: "RuntimeStateSnapshot",
    id: snapshot.id,
    occurredAt: snapshot.createdAt,
    title: `State ${snapshot.sequence}: ${snapshot.state}`,
    reasonCode: snapshot.reasonCode,
    safeSummary: snapshot.safeSummary,
    details: [
      { label: "Sequence", value: snapshot.sequence },
      { label: "State", value: snapshot.state },
      { label: "Reason", value: snapshot.reasonCode },
    ],
  };
}

function policyEntry(policy: PolicyDecisionRecord): InvestigationTimelineEntry {
  return {
    kind: "PolicyDecisionRecord",
    id: policy.id,
    occurredAt: policy.createdAt,
    title: `Policy check: ${policy.riskLevel}`,
    reasonCode: policy.reasonCode,
    safeSummary: policy.safeSummary,
    details: [
      { label: "Risk level", value: policy.riskLevel },
      { label: "Outcome", value: policy.outcome },
      { label: "Policy ref", value: policy.policyRef },
    ],
  };
}

function admissionEntry(
  admission: AdmissionDecisionRecord,
): InvestigationTimelineEntry {
  return {
    kind: "AdmissionDecisionRecord",
    id: admission.id,
    occurredAt: admission.createdAt,
    title: `Readiness check: ${admission.outcome}`,
    reasonCode: admission.reasonCode,
    safeSummary: admission.safeSummary,
    details: [
      { label: "Outcome", value: admission.outcome },
      { label: "Next state", value: admission.lifecycleIntentHint },
      { label: "Reason", value: admission.reasonCode },
    ],
  };
}

function auditEntry(audit: AuditRecord): InvestigationTimelineEntry {
  return {
    kind: "AuditRecord",
    id: audit.id,
    occurredAt: audit.createdAt,
    title: `Evidence record: ${audit.moment}`,
    reasonCode: audit.reasonCode,
    safeSummary: audit.safeSummary,
    details: [
      { label: "Moment", value: audit.moment },
      { label: "Record type", value: audit.recordKindHint },
      { label: "Actor", value: audit.actorRef },
      { label: "Evidence", value: audit.evidenceRef },
    ],
  };
}

function approvalCreatedEntry(
  approval: ApprovalRequest,
): InvestigationTimelineEntry {
  return {
    kind: "ApprovalRequestCreated",
    id: approval.id,
    occurredAt: approval.createdAt,
    title: `Approval request: ${approval.status}`,
    reasonCode: null,
    safeSummary: "Approval request was created for the governed run.",
    details: [
      { label: "Status", value: approval.status },
      { label: "Requested role", value: approval.requestedRole },
      { label: "Requester", value: approval.requesterRef },
      { label: "Approver", value: approval.approverRef },
    ],
  };
}

function approvalDecidedEntry(
  approval: ApprovalRequest,
): InvestigationTimelineEntry | null {
  if (approval.decidedAt === null) {
    return null;
  }

  return {
    kind: "ApprovalRequestDecided",
    id: `${approval.id}:decided`,
    occurredAt: approval.decidedAt,
    title: `Approval decided: ${approval.status}`,
    reasonCode: approval.decisionReasonCode,
    safeSummary:
      approval.safeDecisionSummary ?? "Approval decision was persisted.",
    details: [
      { label: "Status", value: approval.status },
      { label: "Decision outcome", value: approval.decisionOutcome },
      { label: "Decision reason", value: approval.decisionReasonCode },
      { label: "Approver", value: approval.approverRef },
      { label: "Decided at", value: displayValue(approval.decidedAt) },
    ],
  };
}

function compareTimelineEntries(
  left: InvestigationTimelineEntry,
  right: InvestigationTimelineEntry,
): number {
  const timeDifference = left.occurredAt.getTime() - right.occurredAt.getTime();

  if (timeDifference !== 0) {
    return timeDifference;
  }

  return left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id);
}

function humanDecisionOutcome(
  run: GovernedRun,
  approvalRequest: ApprovalRequest | null,
): string {
  if (approvalRequest?.decisionOutcome !== null && approvalRequest?.decisionOutcome !== undefined) {
    return approvalRequest.decisionOutcome;
  }

  if (approvalRequest?.status === "PENDING" || run.currentState === "WAITING_APPROVAL") {
    return "pending";
  }

  return "not yet reached";
}

function createSummary(input: {
  readonly run: GovernedRun;
  readonly audits: readonly AuditRecord[];
  readonly approvalRequest: ApprovalRequest | null;
}): InvestigationTimelineSummary {
  const humanDecisionRequired =
    input.approvalRequest !== null || input.run.currentState === "WAITING_APPROVAL";

  return {
    auditCount: input.audits.length,
    finalState: input.run.currentState,
    humanDecisionRequired,
    humanDecisionOutcome: humanDecisionOutcome(input.run, input.approvalRequest),
  };
}

export async function loadInvestigationTimeline(
  input: LoadInvestigationTimelineInput = {},
): Promise<InvestigationTimelineResult> {
  const client = input.client ?? prisma;
  const tenantId = input.tenantId ?? getMyceliaDemoDatabaseConfig().tenantId;
  const repositories = createRepositories(client);
  const run =
    input.runId === undefined
      ? (await repositories.runs.listRecent({ tenantId, take: 1 })).at(0) ?? null
      : await repositories.runs.findById({ tenantId, id: input.runId });

  if (run === null) {
    return { status: "EMPTY" };
  }

  const [snapshots, policies, admission, audits, approvalRequest] =
    await Promise.all([
      repositories.states.listForRun({ tenantId, governedRunId: run.id }),
      repositories.policy.listForRun({ tenantId, governedRunId: run.id }),
      repositories.admission.findLatestForRun({
        tenantId,
        governedRunId: run.id,
      }),
      repositories.audit.listForRun({ tenantId, governedRunId: run.id }),
      repositories.approvals.findForRun({ tenantId, governedRunId: run.id }),
    ]);

  const timeline = [
    ...snapshots.map(snapshotEntry),
    ...policies.map(policyEntry),
    ...(admission === null ? [] : [admissionEntry(admission)]),
    ...audits.map(auditEntry),
    ...(approvalRequest === null ? [] : [approvalCreatedEntry(approvalRequest)]),
    ...(approvalRequest === null
      ? []
      : [approvalDecidedEntry(approvalRequest)].filter(
          (entry): entry is InvestigationTimelineEntry => entry !== null,
        )),
  ].sort(compareTimelineEntries);

  return {
    status: "READY",
    run,
    timeline,
    snapshots,
    policies,
    admission,
    audits,
    approvalRequest,
    summary: createSummary({ run, audits, approvalRequest }),
  };
}
