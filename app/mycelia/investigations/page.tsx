import type { CSSProperties, ReactElement } from "react";

import {
  loadInvestigationTimeline,
  type InvestigationTimelineEntry,
  type InvestigationTimelineReadyResult,
} from "@/mycelia/runtime/investigation/load-investigation-timeline";
import { LiveOutcomeBanner } from "@/mycelia/runtime/ui/live-outcome-banner";
import { LiveRouteNav } from "@/mycelia/runtime/ui/live-route-nav";
import { parseLiveOutcomeSearchParams } from "@/mycelia/runtime/ui/format-live-label";

export const dynamic = "force-dynamic";

type LivePageSearchParams = Promise<Record<string, string | string[] | undefined>>;

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
  section: {
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
    fontSize: "clamp(1.55rem, 2.4vw, 2.35rem)",
    lineHeight: 1.15,
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
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
    gap: "12px",
    marginTop: "18px",
  },
  detail: {
    border: "1px solid #e0e8e1",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "12px",
  },
  label: {
    margin: 0,
    color: "#637468",
    fontSize: "0.72rem",
    fontWeight: 850,
    textTransform: "uppercase",
  },
  value: {
    margin: "5px 0 0",
    color: "#1d3327",
    fontSize: "0.9rem",
    fontWeight: 780,
    overflowWrap: "anywhere",
  },
  timeline: {
    listStyle: "none",
    margin: "18px 0 0",
    padding: 0,
    display: "grid",
    gap: "12px",
  },
  timelineItem: {
    border: "1px solid #dbe3dc",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "14px",
  },
  timelineHeader: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },
  badge: {
    border: "1px solid #b9c8bd",
    borderRadius: "999px",
    background: "#f4f8f4",
    color: "#274132",
    padding: "5px 9px",
    fontSize: "0.74rem",
    fontWeight: 850,
  },
  timelineTitle: {
    margin: 0,
    color: "#203329",
    fontSize: "0.98rem",
    fontWeight: 850,
  },
  link: {
    color: "#245b37",
    fontWeight: 850,
  },
  hint: {
    border: "1px solid #d9c48d",
    borderRadius: "8px",
    background: "#fff9e8",
    color: "#604812",
    marginTop: "18px",
    padding: "12px",
    fontSize: "0.88rem",
    fontWeight: 760,
    lineHeight: 1.45,
  },
} satisfies Record<string, CSSProperties>;

function shortId(value: string): string {
  return value.length <= 12 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function formatDate(value: Date): string {
  return value.toISOString();
}

function renderDetail(label: string, value: string | number | null): ReactElement {
  return (
    <div style={styles.detail}>
      <p style={styles.label}>{label}</p>
      <p style={styles.value}>{value ?? "Not recorded"}</p>
    </div>
  );
}

function renderEmptyState(): ReactElement {
  return (
    <section aria-label="No investigation run" style={styles.section}>
      <p style={styles.eyebrow}>Investigation</p>
      <h1 style={styles.title}>No governed run has been created yet</h1>
      <p style={styles.text}>
        Create a governed request from the controlled demo scenario first. The
        investigation view only renders persisted SQLite history.
      </p>
      <p style={styles.text}>
        <a href="/mycelia/runs" style={styles.link}>
          Return to the demo request flow
        </a>
      </p>
    </section>
  );
}

function renderRunOverview(result: InvestigationTimelineReadyResult): ReactElement {
  const { run } = result;

  return (
    <section aria-labelledby="investigation-title" style={styles.section}>
      <p style={styles.eyebrow}>Persisted governed run</p>
      <h1 id="investigation-title" style={styles.title}>
        Investigation timeline
      </h1>
      <p style={styles.text}>
        This page reads the latest governed run directly from local SQLite and
        assembles its state, policy, admission, approval and audit history.
      </p>
      <div style={styles.grid}>
        {renderDetail("Run", shortId(run.id))}
        {renderDetail("Current state", run.currentState)}
        {renderDetail("Status", run.status)}
        {renderDetail("Resource", run.resourceRef)}
        {renderDetail("Requester", run.requesterRef)}
        {renderDetail("Purpose", run.purpose)}
        {renderDetail("Created", formatDate(run.createdAt))}
        {renderDetail("Updated", formatDate(run.updatedAt))}
      </div>
    </section>
  );
}

function renderTimelineEntry(entry: InvestigationTimelineEntry): ReactElement {
  return (
    <li key={entry.id} style={styles.timelineItem}>
      <div style={styles.timelineHeader}>
        <span style={styles.badge}>{entry.kind}</span>
        <span style={styles.badge}>{formatDate(entry.occurredAt)}</span>
        {entry.reasonCode === null ? null : (
          <span style={styles.badge}>{entry.reasonCode}</span>
        )}
      </div>
      <p style={styles.timelineTitle}>{entry.title}</p>
      <p style={styles.text}>{entry.safeSummary}</p>
      <div style={styles.grid}>
        {entry.details.map((detail) =>
          renderDetail(detail.label, detail.value),
        )}
      </div>
    </li>
  );
}

function renderTimeline(result: InvestigationTimelineReadyResult): ReactElement {
  return (
    <section aria-labelledby="timeline-heading" style={styles.section}>
      <p style={styles.eyebrow}>Chronological history</p>
      <h2 id="timeline-heading" style={styles.title}>
        Persisted lifecycle events
      </h2>
      <p style={styles.text}>
        Timeline entries are assembled from state snapshots, policy decisions,
        admission decisions, approval requests and audit records.
      </p>
      <ol style={styles.timeline}>
        {result.timeline.map(renderTimelineEntry)}
      </ol>
    </section>
  );
}

function renderControlledSummary(
  result: InvestigationTimelineReadyResult,
): ReactElement {
  return (
    <section aria-labelledby="controlled-summary-heading" style={styles.section}>
      <p style={styles.eyebrow}>What MYCELIA controlled</p>
      <h2 id="controlled-summary-heading" style={styles.title}>
        Governed run summary
      </h2>
      <div style={styles.grid}>
        {renderDetail("Audit records", result.summary.auditCount)}
        {renderDetail("Final state", result.summary.finalState)}
        {renderDetail(
          "Human decision required",
          result.summary.humanDecisionRequired ? "yes" : "no",
        )}
        {renderDetail(
          "Human decision outcome",
          result.summary.humanDecisionOutcome,
        )}
        {renderDetail("State snapshots", result.snapshots.length)}
        {renderDetail("Policy decisions", result.policies.length)}
        {renderDetail("Admission decision", result.admission?.outcome ?? null)}
        {renderDetail("Approval status", result.approvalRequest?.status ?? null)}
      </div>
      <div style={styles.hint}>
        This is the full governed run lifecycle: created, classified, admitted,
        decided, and audited.
      </div>
    </section>
  );
}

function renderReadyState(result: InvestigationTimelineReadyResult): ReactElement {
  return (
    <>
      {renderRunOverview(result)}
      {renderTimeline(result)}
      {renderControlledSummary(result)}
    </>
  );
}

export default async function MyceliaInvestigationsPage({
  searchParams,
}: {
  readonly searchParams?: LivePageSearchParams;
}) {
  const outcome = parseLiveOutcomeSearchParams(
    searchParams === undefined ? undefined : await searchParams,
  );
  const result = await loadInvestigationTimeline();

  return (
    <main aria-labelledby="investigation-title" style={styles.page}>
      <div style={styles.banner}>
        Controlled Demo Environment -- fixture data, no production auth
      </div>
      <LiveRouteNav currentStage="investigation" />
      <LiveOutcomeBanner outcome={outcome} />
      {result.status === "EMPTY" ? renderEmptyState() : renderReadyState(result)}
    </main>
  );
}
