import type { CSSProperties, ReactElement } from "react";

import {
  getControlCenterSummary,
  type ControlCenterSummary,
} from "@/mycelia/runtime/control-center/get-control-center-summary";
import { prisma } from "@/mycelia/runtime/db/client";
import { getMyceliaDemoDatabaseConfig } from "@/mycelia/runtime/db/demo-config";
import {
  createPrismaApprovalRequestRepository,
  type PrismaApprovalRequestRecord,
} from "@/mycelia/runtime/repositories/prisma-approval-request.repository";
import {
  createPrismaDemoReadRepository,
  type DemoPersistedRunSummary,
} from "@/mycelia/runtime/repositories/prisma-demo-read.repository";
import { createPrismaGovernedRunRepository } from "@/mycelia/runtime/repositories/prisma-governed-run.repository";
import { MYCELIA_TOKENS } from "@/mycelia/runtime/ui/design-tokens";
import { renderRiskPill } from "@/mycelia/runtime/ui/risk-pill";

export const dynamic = "force-dynamic";

type ControlCenterPendingApproval = {
  readonly approvalRequest: PrismaApprovalRequestRecord;
  readonly summary: DemoPersistedRunSummary;
};

type ControlCenterCommandView = {
  readonly recentRuns: readonly DemoPersistedRunSummary[];
  readonly pendingApprovals: readonly ControlCenterPendingApproval[];
};

const COMMAND_VIEW_LIMIT = 8;

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
  hero: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.surface,
    marginTop: MYCELIA_TOKENS.spacing[4],
    padding: MYCELIA_TOKENS.spacing[6],
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
    margin: "8px 0 0",
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: MYCELIA_TOKENS.type.heading1,
    lineHeight: 1.12,
    letterSpacing: 0,
  },
  text: {
    margin: "10px 0 0",
    color: MYCELIA_TOKENS.color.text.secondary,
    fontSize: MYCELIA_TOKENS.type.body,
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
    gap: MYCELIA_TOKENS.spacing[4],
    marginTop: MYCELIA_TOKENS.spacing[5],
  },
  commandGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: MYCELIA_TOKENS.spacing[4],
    marginTop: MYCELIA_TOKENS.spacing[5],
  },
  card: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.panel,
    padding: MYCELIA_TOKENS.spacing[4],
  },
  cardLink: {
    display: "block",
    textDecoration: "none",
  },
  panel: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.surface,
    padding: MYCELIA_TOKENS.spacing[5],
  },
  feedList: {
    listStyle: "none",
    margin: `${MYCELIA_TOKENS.spacing[4]} 0 0`,
    padding: 0,
    display: "grid",
    gap: MYCELIA_TOKENS.spacing[3],
  },
  feedRow: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.panel,
    padding: MYCELIA_TOKENS.spacing[4],
  },
  feedHeader: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: MYCELIA_TOKENS.spacing[2],
  },
  label: {
    margin: 0,
    color: MYCELIA_TOKENS.color.text.tertiary,
    fontSize: MYCELIA_TOKENS.type.label,
    fontWeight: 850,
    textTransform: "uppercase",
  },
  value: {
    margin: "7px 0 0",
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: "1.75rem",
    fontWeight: 850,
    lineHeight: 1.1,
  },
  feedTitle: {
    margin: `${MYCELIA_TOKENS.spacing[3]} 0 0`,
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: MYCELIA_TOKENS.type.body,
    fontWeight: 820,
    lineHeight: 1.45,
  },
  smallText: {
    margin: `${MYCELIA_TOKENS.spacing[2]} 0 0`,
    color: MYCELIA_TOKENS.color.text.tertiary,
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    lineHeight: 1.5,
  },
  sectionTitle: {
    margin: `${MYCELIA_TOKENS.spacing[2]} 0 0`,
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: MYCELIA_TOKENS.type.heading2,
    lineHeight: 1.2,
    letterSpacing: 0,
  },
  statusPill: {
    border: `1px solid ${MYCELIA_TOKENS.color.runtime.suspended}`,
    borderRadius: MYCELIA_TOKENS.radius.full,
    background: MYCELIA_TOKENS.color.intent.warningBg,
    color: MYCELIA_TOKENS.color.runtime.suspended,
    display: "inline-flex",
    padding: `${MYCELIA_TOKENS.spacing[1]} ${MYCELIA_TOKENS.spacing[2]}`,
    fontSize: MYCELIA_TOKENS.type.badge,
    fontWeight: 850,
    textTransform: "uppercase",
  },
  linkRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: MYCELIA_TOKENS.spacing[3],
    marginTop: MYCELIA_TOKENS.spacing[5],
  },
  link: {
    border: MYCELIA_TOKENS.border.strong,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.intent.accentBg,
    color: MYCELIA_TOKENS.color.brand.sage,
    padding: `${MYCELIA_TOKENS.spacing[3]} ${MYCELIA_TOKENS.spacing[4]}`,
    fontSize: "0.9rem",
    fontWeight: 800,
    textDecoration: "none",
  },
} satisfies Record<string, CSSProperties>;

function shortId(value: string): string {
  return value.length <= 12 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function humanState(value: string): string {
  return value.replaceAll("_", " ").toLowerCase();
}

function renderMetric(input: {
  readonly label: string;
  readonly value: number;
  readonly href?: string;
}): ReactElement {
  if (input.href !== undefined) {
    return (
      <a href={input.href} style={{ ...styles.card, ...styles.cardLink }}>
        <p style={styles.label}>{input.label}</p>
        <p style={styles.value}>{input.value}</p>
        <p style={styles.smallText}>Open related work</p>
      </a>
    );
  }

  return (
    <article style={styles.card}>
      <p style={styles.label}>{input.label}</p>
      <p style={styles.value}>{input.value}</p>
    </article>
  );
}

function hasActivity(summary: ControlCenterSummary): boolean {
  return (
    summary.totalRuns > 0 ||
    summary.pendingApprovals > 0 ||
    summary.auditEvents > 0 ||
    summary.workspaces > 0
  );
}

async function loadControlCenterCommandView(): Promise<ControlCenterCommandView> {
  const tenantId = getMyceliaDemoDatabaseConfig().tenantId;
  const runs = createPrismaGovernedRunRepository(prisma);
  const approvals = createPrismaApprovalRequestRepository(prisma);
  const read = createPrismaDemoReadRepository(prisma);
  const [recentRuns, pendingApprovals] = await Promise.all([
    runs.listRecent({ tenantId, take: COMMAND_VIEW_LIMIT }),
    approvals.listPendingForTenant({ tenantId, take: COMMAND_VIEW_LIMIT }),
  ]);
  const recentRunSummaries = (
    await Promise.all(
      recentRuns.map((run) =>
        read.findRunById({ tenantId, runId: run.id }),
      ),
    )
  ).filter((summary): summary is DemoPersistedRunSummary => summary !== null);
  const pendingApprovalSummaries = (
    await Promise.all(
      pendingApprovals.map(async (approvalRequest) => {
        const summary = await read.findRunById({
          tenantId,
          runId: approvalRequest.governedRunId,
        });

        return summary === null ? null : { approvalRequest, summary };
      }),
    )
  ).filter(
    (item): item is ControlCenterPendingApproval => item !== null,
  );

  return {
    recentRuns: recentRunSummaries,
    pendingApprovals: pendingApprovalSummaries,
  };
}

function renderRecentRuns(
  recentRuns: readonly DemoPersistedRunSummary[],
): ReactElement {
  if (recentRuns.length === 0) {
    return (
      <p style={styles.text}>
        No governed runs have been created yet. Start a run to populate the
        command view.
      </p>
    );
  }

  return (
    <ol style={styles.feedList}>
      {recentRuns.map((summary) => (
        <li key={summary.run.id} style={styles.feedRow}>
          <div style={styles.feedHeader}>
            <span style={styles.statusPill}>
              {humanState(summary.run.currentState)}
            </span>
            {renderRiskPill(summary.latestPolicy?.riskLevel)}
          </div>
          <p style={styles.feedTitle}>{summary.run.purpose}</p>
          <p style={styles.smallText}>{summary.run.resourceRef}</p>
          <p style={styles.text}>
            <a
              href={`/mycelia/runs?runId=${encodeURIComponent(summary.run.id)}`}
              style={styles.link}
            >
              Open run {shortId(summary.run.id)}
            </a>
          </p>
        </li>
      ))}
    </ol>
  );
}

function renderPendingApprovals(
  pendingApprovals: readonly ControlCenterPendingApproval[],
): ReactElement {
  if (pendingApprovals.length === 0) {
    return (
      <p style={styles.text}>
        Nothing is waiting for a decision right now.
      </p>
    );
  }

  return (
    <ol style={styles.feedList}>
      {pendingApprovals.map((item) => (
        <li key={item.approvalRequest.id} style={styles.feedRow}>
          <div style={styles.feedHeader}>
            <span style={styles.statusPill}>approval required</span>
            {renderRiskPill(item.summary.latestPolicy?.riskLevel)}
          </div>
          <p style={styles.feedTitle}>{item.summary.run.purpose}</p>
          <p style={styles.smallText}>Requester: {item.approvalRequest.requesterRef}</p>
          <p style={styles.text}>
            <a
              href={`/mycelia/approvals?approvalId=${encodeURIComponent(
                item.approvalRequest.id,
              )}`}
              style={styles.link}
            >
              Review approval {shortId(item.approvalRequest.id)}
            </a>
          </p>
        </li>
      ))}
    </ol>
  );
}

export default async function MyceliaControlCenterPage() {
  const [summary, commandView] = await Promise.all([
    getControlCenterSummary(),
    loadControlCenterCommandView(),
  ]);

  return (
    <main aria-labelledby="control-center-title" style={styles.page}>
      <div style={styles.banner}>
        Live local product environment -- PostgreSQL persistence, controlled run workspace, demo tenant
      </div>
      <section style={styles.hero}>
        <p style={styles.eyebrow}>Control Center</p>
        <h1 id="control-center-title" style={styles.title}>
          MYCELIA governed operations
        </h1>
        <p style={styles.text}>
          This page reads persisted local state on every render. It summarizes
          governed runs, approval demand, evidence records and workspace graph data.
        </p>
        {hasActivity(summary) ? null : (
          <p style={styles.text}>No governed activity yet -- create a run to get started.</p>
        )}
        <div style={styles.grid}>
          {renderMetric({ label: "Total governed runs", value: summary.totalRuns })}
          {renderMetric({
            label: "Waiting approval",
            value: summary.runsByState.waitingApproval,
            href: "/mycelia/runs",
          })}
          {renderMetric({ label: "Approved", value: summary.runsByState.approved })}
          {renderMetric({ label: "Rejected", value: summary.runsByState.rejected })}
          {renderMetric({ label: "Completed", value: summary.runsByState.completed })}
          {renderMetric({
            label: "Pending approvals",
            value: summary.pendingApprovals,
            href: "/mycelia/approvals",
          })}
          {renderMetric({ label: "Evidence records", value: summary.auditEvents })}
          {renderMetric({ label: "Workspaces", value: summary.workspaces })}
        </div>
        <div style={styles.commandGrid}>
          <section style={styles.panel}>
            <p style={styles.eyebrow}>Recent runs</p>
            <h2 style={styles.sectionTitle}>Latest governed activity</h2>
            <p style={styles.text}>
              The newest persisted runs are listed first, with their current
              state and risk level.
            </p>
            {renderRecentRuns(commandView.recentRuns)}
          </section>
          <section style={styles.panel}>
            <p style={styles.eyebrow}>Needs your attention</p>
            <h2 style={styles.sectionTitle}>Pending approvals</h2>
            <p style={styles.text}>
              Approval requests waiting for a human decision appear here with
              their requester and risk level.
            </p>
            {renderPendingApprovals(commandView.pendingApprovals)}
          </section>
        </div>
        <nav aria-label="Control Center actions" style={styles.linkRow}>
          <a href="/mycelia/runs" style={styles.link}>Open runs</a>
          <a href="/mycelia/approvals" style={styles.link}>Open approvals</a>
          <a href="/mycelia/investigations" style={styles.link}>Open investigations</a>
          <a href="/mycelia/studio" style={styles.link}>Open studio</a>
        </nav>
      </section>
    </main>
  );
}
