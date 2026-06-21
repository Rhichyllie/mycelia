import type { CSSProperties, ReactElement } from "react";

import {
  loadInvestigationTimeline,
  type InvestigationTimelineEntry,
  type InvestigationTimelineReadyResult,
} from "@/mycelia/runtime/investigation/load-investigation-timeline";
import { MYCELIA_TOKENS } from "@/mycelia/runtime/ui/design-tokens";
import { parseLiveOutcomeSearchParams } from "@/mycelia/runtime/ui/format-live-label";
import { LiveOutcomeBanner } from "@/mycelia/runtime/ui/live-outcome-banner";
import { LiveRouteNav } from "@/mycelia/runtime/ui/live-route-nav";

export const dynamic = "force-dynamic";

type LivePageSearchParams = Promise<Record<string, string | string[] | undefined>>;

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
  section: {
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
    margin: `${MYCELIA_TOKENS.spacing[2]} 0 0`,
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: MYCELIA_TOKENS.type.heading1,
    lineHeight: 1.15,
    letterSpacing: 0,
  },
  text: {
    margin: `${MYCELIA_TOKENS.spacing[2]} 0 0`,
    color: MYCELIA_TOKENS.color.text.secondary,
    fontSize: MYCELIA_TOKENS.type.body,
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
    gap: MYCELIA_TOKENS.spacing[3],
    marginTop: MYCELIA_TOKENS.spacing[5],
  },
  detail: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.panel,
    padding: MYCELIA_TOKENS.spacing[3],
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
    fontWeight: 780,
    overflowWrap: "anywhere",
  },
  timeline: {
    listStyle: "none",
    margin: `${MYCELIA_TOKENS.spacing[5]} 0 0`,
    padding: 0,
    display: "grid",
    gap: MYCELIA_TOKENS.spacing[3],
  },
  timelineItem: {
    border: MYCELIA_TOKENS.border.subtle,
    borderLeft: `2px solid ${MYCELIA_TOKENS.color.evidence.sealed}`,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.panel,
    padding: MYCELIA_TOKENS.spacing[4],
  },
  timelineHeader: {
    display: "flex",
    flexWrap: "wrap",
    gap: MYCELIA_TOKENS.spacing[2],
    alignItems: "center",
  },
  badge: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.full,
    background: MYCELIA_TOKENS.color.intent.neutralBg,
    color: MYCELIA_TOKENS.color.text.secondary,
    padding: `${MYCELIA_TOKENS.spacing[1]} ${MYCELIA_TOKENS.spacing[2]}`,
    fontSize: MYCELIA_TOKENS.type.badge,
    fontWeight: 850,
  },
  timelineTitle: {
    margin: `${MYCELIA_TOKENS.spacing[3]} 0 0`,
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: "0.98rem",
    fontWeight: 850,
  },
  link: {
    color: MYCELIA_TOKENS.color.brand.sage,
    fontWeight: 850,
  },
  hint: {
    border: `1px solid ${MYCELIA_TOKENS.color.evidence.sealed}`,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.intent.accentBg,
    color: MYCELIA_TOKENS.color.text.primary,
    marginTop: MYCELIA_TOKENS.spacing[5],
    padding: MYCELIA_TOKENS.spacing[3],
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

function renderDetail(
  label: string,
  value: string | number | null,
  key?: string,
): ReactElement {
  return (
    <div key={key} style={styles.detail}>
      <p style={styles.label}>{label}</p>
      <p style={styles.value}>{value ?? "Not recorded"}</p>
    </div>
  );
}

function timelineKindLabel(entry: InvestigationTimelineEntry): string {
  switch (entry.kind) {
    case "RuntimeStateSnapshot":
      return "State step";
    case "PolicyDecisionRecord":
      return "Policy check";
    case "AdmissionDecisionRecord":
      return "Readiness check";
    case "AuditRecord":
      return "Evidence record";
    case "ApprovalRequestCreated":
      return "Approval opened";
    case "ApprovalRequestDecided":
      return "Approval result";
  }
}

function renderEmptyState(): ReactElement {
  return (
    <section aria-label="No investigation run" style={styles.section}>
      <p style={styles.eyebrow}>Investigation</p>
      <h1 style={styles.title}>No governed run has been created yet</h1>
      <p style={styles.text}>
        Create a governed request from the controlled demo scenario first. The
        investigation view only renders persisted SQLite history and lineage.
      </p>
      <p style={styles.text}>
        <a href="/mycelia/runs" style={styles.link}>
          Return to Runs
        </a>
      </p>
    </section>
  );
}

function renderRunOverview(result: InvestigationTimelineReadyResult): ReactElement {
  const { run } = result;

  return (
    <section aria-labelledby="investigation-title" style={styles.section}>
      <p style={styles.eyebrow}>Persisted run</p>
      <h1 id="investigation-title" style={styles.title}>
        History and lineage
      </h1>
      <p style={styles.text}>
        This page reads the latest governed run directly from local SQLite and
        assembles its state, policy check, readiness check, approval and evidence history.
      </p>
      <div style={styles.grid}>
        {renderDetail("Run", shortId(run.id))}
        {renderDetail("Current state", run.currentState)}
        {renderDetail("Status", run.status)}
        {renderDetail("Run scope", run.resourceRef)}
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
        <span style={styles.badge}>{timelineKindLabel(entry)}</span>
        <span style={styles.badge}>{formatDate(entry.occurredAt)}</span>
        {entry.reasonCode === null ? null : (
          <span style={styles.badge}>{entry.reasonCode}</span>
        )}
      </div>
      <p style={styles.timelineTitle}>{entry.title}</p>
      <p style={styles.text}>{entry.safeSummary}</p>
      <div style={styles.grid}>
        {entry.details.map((detail) =>
          renderDetail(detail.label, detail.value, `${entry.id}:${detail.label}`),
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
        Persisted case events
      </h2>
      <p style={styles.text}>
        Timeline entries are assembled from state snapshots, policy checks,
        readiness checks, approval requests and evidence records.
      </p>
      <ol style={styles.timeline}>{result.timeline.map(renderTimelineEntry)}</ol>
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
        {renderDetail("Evidence records", result.summary.auditCount)}
        {renderDetail("Final state", result.summary.finalState)}
        {renderDetail(
          "Approval required",
          result.summary.humanDecisionRequired ? "yes" : "no",
        )}
        {renderDetail("Approval outcome", result.summary.humanDecisionOutcome)}
        {renderDetail("State snapshots", result.snapshots.length)}
        {renderDetail("Policy checks", result.policies.length)}
        {renderDetail("Readiness check", result.admission?.outcome ?? null)}
        {renderDetail("Approval status", result.approvalRequest?.status ?? null)}
      </div>
      <div style={styles.hint}>
        This is the full governed run lifecycle: created, checked for risk,
        confirmed for readiness, decided, and recorded.
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
