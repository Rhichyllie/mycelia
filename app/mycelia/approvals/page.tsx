import type { CSSProperties, ReactElement } from "react";

import { prisma } from "@/mycelia/runtime/db/client";
import { getMyceliaDemoDatabaseConfig } from "@/mycelia/runtime/db/demo-config";
import {
  loadInvestigationTimeline,
  type InvestigationTimelineEntry,
  type InvestigationTimelineReadyResult,
} from "@/mycelia/runtime/investigation/load-investigation-timeline";
import {
  createPrismaApprovalRequestRepository,
  type PrismaApprovalRequestRecord,
} from "@/mycelia/runtime/repositories/prisma-approval-request.repository";
import {
  createPrismaDemoReadRepository,
  type DemoPersistedRunSummary,
} from "@/mycelia/runtime/repositories/prisma-demo-read.repository";
import { createPrismaGovernedRunRepository } from "@/mycelia/runtime/repositories/prisma-governed-run.repository";
import { ConsequentialActionReveal } from "@/mycelia/runtime/ui/consequential-action-reveal";
import { MYCELIA_TOKENS } from "@/mycelia/runtime/ui/design-tokens";
import {
  parseLiveOutcomeSearchParams,
  type LiveOutcome,
} from "@/mycelia/runtime/ui/format-live-label";
import { LiveOutcomeBanner } from "@/mycelia/runtime/ui/live-outcome-banner";
import { LiveRouteNav } from "@/mycelia/runtime/ui/live-route-nav";
import { approveGovernedRequest, rejectGovernedRequest } from "./actions";

export const dynamic = "force-dynamic";

type LivePageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type ApprovalQueueItem = {
  readonly approvalRequest: PrismaApprovalRequestRecord;
  readonly summary: DemoPersistedRunSummary;
};

type ApprovalDecisionCenterState =
  | {
      readonly status: "READY";
      readonly queue: readonly ApprovalQueueItem[];
      readonly selected: ApprovalQueueItem | null;
      readonly timeline: InvestigationTimelineReadyResult | null;
    }
  | {
      readonly status: "UNAVAILABLE";
      readonly queue: readonly ApprovalQueueItem[];
      readonly selected: null;
      readonly timeline: null;
    };

const APPROVAL_QUEUE_LIMIT = 12;
const WAITING_RUN_SCAN_LIMIT = 25;

const styles = {
  page: {
    width: MYCELIA_TOKENS.layout.pageWidth,
    margin: "0 auto",
    padding: MYCELIA_TOKENS.layout.pagePadding,
  },
  banner: {
    border: `1px solid ${MYCELIA_TOKENS.color.tenant.boundary}`,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.intent.accentBg,
    color: MYCELIA_TOKENS.color.text.primary,
    padding: `${MYCELIA_TOKENS.spacing[3]} ${MYCELIA_TOKENS.spacing[4]}`,
    fontSize: "0.92rem",
    fontWeight: 850,
  },
  workspaceGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(min(100%, 340px), 0.9fr) minmax(min(100%, 560px), 1.45fr)",
    gap: MYCELIA_TOKENS.spacing[4],
    marginTop: MYCELIA_TOKENS.spacing[4],
  },
  panel: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.surface,
    padding: MYCELIA_TOKENS.spacing[5],
  },
  raisedPanel: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.panel,
    padding: MYCELIA_TOKENS.spacing[4],
  },
  selectedPanel: {
    border: `1px solid ${MYCELIA_TOKENS.color.brand.sage}`,
    background: MYCELIA_TOKENS.color.intent.accentBg,
  },
  eyebrow: {
    margin: 0,
    color: MYCELIA_TOKENS.color.brand.sage,
    fontSize: MYCELIA_TOKENS.type.label,
    fontWeight: 850,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: `${MYCELIA_TOKENS.spacing[2]} 0 0`,
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: MYCELIA_TOKENS.type.heading1,
    lineHeight: 1.14,
    letterSpacing: 0,
  },
  sectionTitle: {
    margin: `${MYCELIA_TOKENS.spacing[2]} 0 0`,
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: MYCELIA_TOKENS.type.heading2,
    lineHeight: 1.2,
    letterSpacing: 0,
  },
  text: {
    margin: `${MYCELIA_TOKENS.spacing[2]} 0 0`,
    color: MYCELIA_TOKENS.color.text.secondary,
    fontSize: MYCELIA_TOKENS.type.body,
    lineHeight: 1.6,
  },
  smallText: {
    margin: `${MYCELIA_TOKENS.spacing[2]} 0 0`,
    color: MYCELIA_TOKENS.color.text.tertiary,
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    lineHeight: 1.5,
  },
  queueList: {
    listStyle: "none",
    margin: `${MYCELIA_TOKENS.spacing[4]} 0 0`,
    padding: 0,
    display: "grid",
    gap: MYCELIA_TOKENS.spacing[3],
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: MYCELIA_TOKENS.spacing[3],
    marginTop: MYCELIA_TOKENS.spacing[4],
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: MYCELIA_TOKENS.spacing[3],
    marginTop: MYCELIA_TOKENS.spacing[4],
  },
  evidenceList: {
    listStyle: "none",
    margin: `${MYCELIA_TOKENS.spacing[3]} 0 0`,
    padding: 0,
    display: "grid",
    gap: MYCELIA_TOKENS.spacing[2],
  },
  evidenceItem: {
    borderLeft: `2px solid ${MYCELIA_TOKENS.color.evidence.sealed}`,
    paddingLeft: MYCELIA_TOKENS.spacing[3],
  },
  label: {
    margin: 0,
    color: MYCELIA_TOKENS.color.text.tertiary,
    fontSize: MYCELIA_TOKENS.type.label,
    fontWeight: 850,
    textTransform: "uppercase",
  },
  value: {
    margin: `${MYCELIA_TOKENS.spacing[1]} 0 0`,
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: MYCELIA_TOKENS.type.data,
    fontWeight: 760,
    overflowWrap: "anywhere",
  },
  statusPill: {
    border: `1px solid ${MYCELIA_TOKENS.color.policy.requiresApproval}`,
    borderRadius: MYCELIA_TOKENS.radius.full,
    background: MYCELIA_TOKENS.color.intent.warningBg,
    color: MYCELIA_TOKENS.color.policy.requiresApproval,
    display: "inline-flex",
    marginTop: MYCELIA_TOKENS.spacing[2],
    padding: `${MYCELIA_TOKENS.spacing[1]} ${MYCELIA_TOKENS.spacing[2]}`,
    fontSize: MYCELIA_TOKENS.type.badge,
    fontWeight: 850,
    textTransform: "uppercase",
  },
  link: {
    color: MYCELIA_TOKENS.color.brand.sage,
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    fontWeight: 850,
    textDecoration: "none",
  },
  textarea: {
    width: "100%",
    minHeight: "110px",
    boxSizing: "border-box",
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.bg.sunken,
    color: MYCELIA_TOKENS.color.text.primary,
    font: "inherit",
    marginTop: MYCELIA_TOKENS.spacing[3],
    padding: MYCELIA_TOKENS.spacing[3],
    resize: "vertical",
  },
  approveButton: {
    border: `1px solid ${MYCELIA_TOKENS.color.state.success}`,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.intent.successBg,
    color: MYCELIA_TOKENS.color.state.success,
    cursor: "pointer",
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    fontWeight: 850,
    marginTop: MYCELIA_TOKENS.spacing[3],
    padding: `${MYCELIA_TOKENS.spacing[3]} ${MYCELIA_TOKENS.spacing[4]}`,
  },
  rejectButton: {
    border: `1px solid ${MYCELIA_TOKENS.color.state.danger}`,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.intent.dangerBg,
    color: MYCELIA_TOKENS.color.state.danger,
    cursor: "pointer",
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    fontWeight: 850,
    marginTop: MYCELIA_TOKENS.spacing[3],
    padding: `${MYCELIA_TOKENS.spacing[3]} ${MYCELIA_TOKENS.spacing[4]}`,
  },
} satisfies Record<string, CSSProperties>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function shortId(value: string): string {
  return value.length <= 12 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function humanState(value: string): string {
  return value.replaceAll("_", " ").toLowerCase();
}

function formatWaitingTime(createdAt: Date, now: Date): string {
  const minutes = Math.max(
    0,
    Math.floor((now.getTime() - createdAt.getTime()) / 60000),
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr`;
  }

  return `${Math.floor(hours / 24)} day`;
}

function isWaitingRunState(state: string): boolean {
  return state === "WAITING_APPROVAL";
}

async function queueItemForApproval(
  tenantId: string,
  approvalRequest: PrismaApprovalRequestRecord,
): Promise<ApprovalQueueItem | null> {
  const summary = await createPrismaDemoReadRepository(prisma).findRunById({
    tenantId,
    runId: approvalRequest.governedRunId,
  });

  if (summary === null) {
    return null;
  }

  return { approvalRequest, summary };
}

async function ensurePendingApprovalRequests(tenantId: string): Promise<void> {
  const runs = await createPrismaGovernedRunRepository(prisma).listRecent({
    tenantId,
    take: WAITING_RUN_SCAN_LIMIT,
  });
  const approvals = createPrismaApprovalRequestRepository(prisma);

  await Promise.all(
    runs
      .filter(
        (run) =>
          isWaitingRunState(run.currentState) && isWaitingRunState(run.status),
      )
      .map((run) =>
        approvals.findOrCreateForRun({
          tenantId,
          governedRunId: run.id,
        }),
      ),
  );
}

async function loadApprovalDecisionCenterState(
  selectedApprovalId: string | undefined,
): Promise<ApprovalDecisionCenterState> {
  try {
    const tenantId = getMyceliaDemoDatabaseConfig().tenantId;
    const approvals = createPrismaApprovalRequestRepository(prisma);
    const readRepository = createPrismaDemoReadRepository(prisma);

    await ensurePendingApprovalRequests(tenantId);

    const pendingApprovals = await approvals.listPendingForTenant({
      tenantId,
      take: APPROVAL_QUEUE_LIMIT,
    });
    const queue = (
      await Promise.all(
        pendingApprovals.map((approvalRequest) =>
          queueItemForApproval(tenantId, approvalRequest),
        ),
      )
    ).filter((item): item is ApprovalQueueItem => item !== null);
    const selectedApproval =
      selectedApprovalId === undefined
        ? queue.at(0)?.approvalRequest ?? null
        : await approvals.findById({ tenantId, id: selectedApprovalId });
    const fallbackDecided =
      selectedApproval === null && queue.length === 0
        ? await readRepository.findLatestDecidedApprovalRun({ tenantId })
        : null;
    const fallbackApproval =
      fallbackDecided === null
        ? null
        : await approvals.findForRun({
            tenantId,
            governedRunId: fallbackDecided.run.id,
          });
    const selected =
      selectedApproval === null
        ? fallbackApproval === null
          ? null
          : await queueItemForApproval(tenantId, fallbackApproval)
        : await queueItemForApproval(tenantId, selectedApproval);
    const timeline =
      selected === null
        ? null
        : await loadInvestigationTimeline({
            tenantId,
            runId: selected.approvalRequest.governedRunId,
          });

    return {
      status: "READY",
      queue,
      selected,
      timeline: timeline?.status === "READY" ? timeline : null,
    };
  } catch {
    return { status: "UNAVAILABLE", queue: [], selected: null, timeline: null };
  }
}

function renderDetail(label: string, value: string | number | null): ReactElement {
  return (
    <div style={styles.raisedPanel}>
      <p style={styles.label}>{label}</p>
      <p style={styles.value}>{value ?? "Pending"}</p>
    </div>
  );
}

function renderQueueRow(
  item: ApprovalQueueItem,
  selectedApprovalId: string | null,
  now: Date,
): ReactElement {
  const isSelected = selectedApprovalId === item.approvalRequest.id;
  const { run, latestPolicy } = item.summary;

  return (
    <li
      key={item.approvalRequest.id}
      style={
        isSelected
          ? { ...styles.raisedPanel, ...styles.selectedPanel }
          : styles.raisedPanel
      }
    >
      <p style={styles.label}>Approval request</p>
      <p style={styles.value}>{shortId(item.approvalRequest.id)}</p>
      <span style={styles.statusPill}>Approval required</span>
      <p style={styles.smallText}>{run.purpose}</p>
      <div style={styles.detailGrid}>
        {renderDetail("Risk level", latestPolicy?.riskLevel ?? "Not checked")}
        {renderDetail("Run scope", run.resourceRef)}
        {renderDetail("Requested role", item.approvalRequest.requestedRole)}
        {renderDetail("Requester", item.approvalRequest.requesterRef)}
        {renderDetail(
          "Waiting",
          formatWaitingTime(item.approvalRequest.createdAt, now),
        )}
      </div>
      <p style={styles.text}>
        <a
          href={`/mycelia/approvals?approvalId=${encodeURIComponent(
            item.approvalRequest.id,
          )}`}
          style={styles.link}
        >
          Open decision file
        </a>
      </p>
    </li>
  );
}

function renderQueue(state: ApprovalDecisionCenterState, now: Date): ReactElement {
  if (state.status === "UNAVAILABLE") {
    return (
      <p style={styles.text}>
        Local approval data could not be loaded. Confirm the local PostgreSQL
        database is migrated and seeded.
      </p>
    );
  }

  if (state.queue.length === 0) {
    return (
      <p style={styles.text}>
        No approval request is currently pending. Create a governed request to
        add work to this queue.
      </p>
    );
  }

  return (
    <ol style={styles.queueList}>
      {state.queue.map((item) =>
        renderQueueRow(item, state.selected?.approvalRequest.id ?? null, now),
      )}
    </ol>
  );
}

function evidencePreview(
  timeline: InvestigationTimelineReadyResult | null,
): readonly InvestigationTimelineEntry[] {
  return (
    timeline?.timeline
      .filter((entry) => entry.kind === "AuditRecord")
      .slice(0, 3) ?? []
  );
}

function renderEvidencePreview(
  timeline: InvestigationTimelineReadyResult | null,
): ReactElement {
  const entries = evidencePreview(timeline);

  if (entries.length === 0) {
    return (
      <p style={styles.text}>
        Evidence preview appears after the run records its first evidence step.
      </p>
    );
  }

  return (
    <ol style={styles.evidenceList}>
      {entries.map((entry) => (
        <li key={entry.id} style={styles.evidenceItem}>
          <p style={styles.label}>{entry.title}</p>
          <p style={styles.smallText}>{entry.safeSummary}</p>
        </li>
      ))}
    </ol>
  );
}

function renderDecisionForms(
  approvalRequest: PrismaApprovalRequestRecord,
): ReactElement | null {
  if (approvalRequest.status !== "PENDING") {
    return null;
  }

  return (
    <section style={{ ...styles.raisedPanel, marginTop: MYCELIA_TOKENS.spacing[4] }}>
      <p style={styles.eyebrow}>Decision note</p>
      <h2 style={styles.sectionTitle}>Record a defensible decision</h2>
      <p style={styles.text}>
        Approvals can include a note. Rejections require a rationale before the
        decision can be persisted.
      </p>
      <div style={styles.actionGrid}>
        <form action={approveGovernedRequest}>
          <input type="hidden" name="approvalId" value={approvalRequest.id} />
          <label style={styles.label} htmlFor="approve-summary">
            Approval note
          </label>
          <textarea
            id="approve-summary"
            name="safeDecisionSummary"
            placeholder="Optional reason for approving this request."
            style={styles.textarea}
          />
          <button type="submit" style={styles.approveButton}>
            Approve
          </button>
        </form>
        <form action={rejectGovernedRequest}>
          <input type="hidden" name="approvalId" value={approvalRequest.id} />
          <label style={styles.label} htmlFor="reject-summary">
            Rejection rationale
          </label>
          <textarea
            id="reject-summary"
            name="safeDecisionSummary"
            placeholder="Required rationale for rejecting this request."
            required
            style={styles.textarea}
          />
          <button type="submit" style={styles.rejectButton}>
            Reject
          </button>
        </form>
      </div>
    </section>
  );
}

function renderDecisionDetail(
  state: ApprovalDecisionCenterState,
): ReactElement {
  if (state.selected === null) {
    return (
      <section style={styles.panel}>
        <p style={styles.eyebrow}>Decision Center</p>
        <h1 style={styles.title}>No approval selected</h1>
        <p style={styles.text}>
          Select a pending approval request from the queue to review its
          decision file.
        </p>
      </section>
    );
  }

  const { approvalRequest, summary } = state.selected;
  const { run, latestPolicy, latestAdmission, auditCount } = summary;
  const isDecided =
    approvalRequest.status === "APPROVED" ||
    approvalRequest.status === "REJECTED";

  return (
    <section style={styles.panel}>
      <p style={styles.eyebrow}>Decision Center</p>
      <h1 style={styles.title}>Approval Decision Center</h1>
      <p style={styles.text}>
        Review the request summary, business context, risk basis, affected
        scope and evidence preview before deciding.
      </p>
      <div style={styles.detailGrid}>
        {renderDetail("Request summary", run.purpose)}
        {renderDetail("Business context", run.resourceRef)}
        {renderDetail("Submitter", approvalRequest.requesterRef)}
        {renderDetail("Current state", humanState(run.currentState))}
        {renderDetail("Risk level", latestPolicy?.riskLevel ?? "Not checked")}
        {renderDetail("Policy check", latestPolicy?.safeSummary ?? "Pending")}
        {renderDetail("Readiness check", latestAdmission?.safeSummary ?? "Pending")}
        {renderDetail("Run scope", run.resourceRef)}
        {renderDetail("Requested role", approvalRequest.requestedRole)}
        {renderDetail("Evidence records", auditCount)}
        {renderDetail("Approval status", approvalRequest.status)}
        {renderDetail("Decision summary", approvalRequest.safeDecisionSummary)}
      </div>
      <section style={{ ...styles.raisedPanel, marginTop: MYCELIA_TOKENS.spacing[4] }}>
        <p style={styles.eyebrow}>Evidence preview</p>
        <h2 style={styles.sectionTitle}>Relevant evidence before the full trace</h2>
        {renderEvidencePreview(state.timeline)}
        <p style={styles.text}>
          <a
            href={`/mycelia/investigations?runId=${encodeURIComponent(
              approvalRequest.governedRunId,
            )}`}
            style={styles.link}
          >
            Open full history and lineage
          </a>
        </p>
      </section>
      {isDecided ? (
        <section style={{ ...styles.raisedPanel, marginTop: MYCELIA_TOKENS.spacing[4] }}>
          <p style={styles.eyebrow}>Decision recorded</p>
          <h2 style={styles.sectionTitle}>{approvalRequest.status}</h2>
          <div style={styles.detailGrid}>
            {renderDetail("Decision outcome", approvalRequest.decisionOutcome)}
            {renderDetail("Decision reason", approvalRequest.decisionReasonCode)}
            {renderDetail("Approver", approvalRequest.approverRef)}
            {renderDetail(
              "Decided at",
              approvalRequest.decidedAt?.toISOString() ?? null,
            )}
          </div>
        </section>
      ) : (
        renderDecisionForms(approvalRequest)
      )}
    </section>
  );
}

function renderApprovalDecisionReveal(
  outcome: LiveOutcome | null,
  state: ApprovalDecisionCenterState,
): ReactElement | null {
  if (
    outcome === null ||
    outcome.status !== "APPROVAL_DECIDED" ||
    state.selected === null
  ) {
    return null;
  }

  const { approvalRequest, summary } = state.selected;

  if (
    approvalRequest.status !== "APPROVED" &&
    approvalRequest.status !== "REJECTED"
  ) {
    return null;
  }

  return (
    <ConsequentialActionReveal
      input={{
        kind: "APPROVAL_DECIDED",
        decisionReasonCode: approvalRequest.decisionReasonCode,
        finalState: summary.run.currentState,
        decisionOutcome: approvalRequest.decisionOutcome,
      }}
    />
  );
}

export default async function MyceliaApprovalDecisionPage({
  searchParams,
}: {
  readonly searchParams?: LivePageSearchParams;
}) {
  const resolvedSearchParams =
    searchParams === undefined ? undefined : await searchParams;
  const outcome = parseLiveOutcomeSearchParams(resolvedSearchParams);
  const selectedApprovalId = firstParam(resolvedSearchParams?.approvalId);
  const state = await loadApprovalDecisionCenterState(selectedApprovalId);
  const now = new Date();

  return (
    <main aria-labelledby="approval-decision-title" style={styles.page}>
      <div id="approval-decision-title" style={styles.banner}>
        Controlled demo environment -- fixture data, no production auth
      </div>
      <LiveRouteNav currentStage="approval" />
      {renderApprovalDecisionReveal(outcome, state)}
      <LiveOutcomeBanner outcome={outcome} />
      <div style={styles.workspaceGrid}>
        <section style={styles.panel}>
          <p style={styles.eyebrow}>Approval queue</p>
          <h1 style={styles.title}>Pending decisions</h1>
          <p style={styles.text}>
            Most recent pending approval requests appear first. Each row is read
            from local PostgreSQL.
          </p>
          {renderQueue(state, now)}
        </section>
        {renderDecisionDetail(state)}
      </div>
    </main>
  );
}
