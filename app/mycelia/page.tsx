import type { CSSProperties, ReactElement } from "react";

import {
  getControlCenterSummary,
  type ControlCenterSummary,
} from "@/mycelia/runtime/control-center/get-control-center-summary";
import { MYCELIA_TOKENS } from "@/mycelia/runtime/ui/design-tokens";

export const dynamic = "force-dynamic";

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
  card: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.panel,
    padding: MYCELIA_TOKENS.spacing[4],
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

function renderMetric(label: string, value: number): ReactElement {
  return (
    <article style={styles.card}>
      <p style={styles.label}>{label}</p>
      <p style={styles.value}>{value}</p>
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

export default async function MyceliaControlCenterPage() {
  const summary = await getControlCenterSummary();

  return (
    <main aria-labelledby="control-center-title" style={styles.page}>
      <div style={styles.banner}>
        Live local product environment -- SQLite persistence, controlled run workspace, demo tenant
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
          {renderMetric("Total governed runs", summary.totalRuns)}
          {renderMetric("Waiting approval", summary.runsByState.waitingApproval)}
          {renderMetric("Approved", summary.runsByState.approved)}
          {renderMetric("Rejected", summary.runsByState.rejected)}
          {renderMetric("Completed", summary.runsByState.completed)}
          {renderMetric("Pending approvals", summary.pendingApprovals)}
          {renderMetric("Evidence records", summary.auditEvents)}
          {renderMetric("Workspaces", summary.workspaces)}
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
