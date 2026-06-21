import type { CSSProperties, ReactElement } from "react";

import {
  getControlCenterSummary,
  type ControlCenterSummary,
} from "@/mycelia/runtime/control-center/get-control-center-summary";

export const dynamic = "force-dynamic";

const styles = {
  page: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "34px 0 48px",
  },
  banner: {
    border: "1px solid #a8c6b1",
    borderRadius: "8px",
    background: "#f1f8f2",
    color: "#21382a",
    padding: "14px 16px",
    fontSize: "0.92rem",
    fontWeight: 850,
  },
  hero: {
    border: "1px solid #d7e1d8",
    borderRadius: "8px",
    background: "#ffffff",
    marginTop: "16px",
    padding: "24px",
  },
  eyebrow: {
    margin: 0,
    color: "#52685b",
    fontSize: "0.76rem",
    fontWeight: 850,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: "8px 0 0",
    color: "#17281f",
    fontSize: "clamp(1.7rem, 2.8vw, 2.6rem)",
    lineHeight: 1.12,
    letterSpacing: 0,
  },
  text: {
    margin: "10px 0 0",
    color: "#4e6156",
    fontSize: "0.94rem",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
    gap: "14px",
    marginTop: "18px",
  },
  card: {
    border: "1px solid #e0e8e1",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "16px",
  },
  label: {
    margin: 0,
    color: "#637468",
    fontSize: "0.72rem",
    fontWeight: 850,
    textTransform: "uppercase",
  },
  value: {
    margin: "7px 0 0",
    color: "#1d3327",
    fontSize: "1.75rem",
    fontWeight: 850,
    lineHeight: 1.1,
  },
  linkRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "18px",
  },
  link: {
    border: "1px solid #355642",
    borderRadius: "6px",
    background: "#263f30",
    color: "#ffffff",
    padding: "10px 13px",
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
        Live local product environment -- SQLite persistence, governed runtime, demo tenant
      </div>
      <section style={styles.hero}>
        <p style={styles.eyebrow}>Control Center</p>
        <h1 id="control-center-title" style={styles.title}>
          MYCELIA governed operations
        </h1>
        <p style={styles.text}>
          This page reads persisted local state on every render. It summarizes
          governed runs, approval demand, audit events and workspace graph data.
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
          {renderMetric("Audit events", summary.auditEvents)}
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
