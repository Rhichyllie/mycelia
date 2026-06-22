import type { CSSProperties, ReactElement } from "react";

import { requireAuthenticatedSession } from "@/mycelia/runtime/auth/session";

import { prisma } from "@/mycelia/runtime/db/client";
import { getMyceliaDemoDatabaseConfig } from "@/mycelia/runtime/db/demo-config";
import {
  loadInvestigationTimeline,
  type InvestigationTimelineEntry,
  type InvestigationTimelineReadyResult,
} from "@/mycelia/runtime/investigation/load-investigation-timeline";
import { createPrismaGovernedRunRepository } from "@/mycelia/runtime/repositories/prisma-governed-run.repository";
import { MYCELIA_TOKENS } from "@/mycelia/runtime/ui/design-tokens";
import { parseLiveOutcomeSearchParams } from "@/mycelia/runtime/ui/format-live-label";
import { LiveOutcomeBanner } from "@/mycelia/runtime/ui/live-outcome-banner";
import { LiveRouteNav } from "@/mycelia/runtime/ui/live-route-nav";

export const dynamic = "force-dynamic";

type LivePageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type RecentRunOption = {
  readonly id: string;
  readonly currentState: string;
  readonly status: string;
  readonly purpose: string;
  readonly createdAt: Date;
};

const RECENT_RUN_SELECTOR_LIMIT = 8;

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
  selector: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.surface,
    marginTop: MYCELIA_TOKENS.spacing[4],
    padding: MYCELIA_TOKENS.spacing[4],
  },
  selectorList: {
    listStyle: "none",
    margin: `${MYCELIA_TOKENS.spacing[3]} 0 0`,
    padding: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
    gap: MYCELIA_TOKENS.spacing[2],
  },
  selectorItem: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.bg.panel,
    padding: MYCELIA_TOKENS.spacing[3],
  },
  activeSelectorItem: {
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
  selectorLink: {
    color: MYCELIA_TOKENS.color.brand.sage,
    display: "inline-flex",
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    fontWeight: 850,
    textDecoration: "none",
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

function firstParam(value: string | string[] | undefined): string | undefined {
  const resolved = Array.isArray(value) ? value[0] : value;

  return resolved === undefined || resolved.trim() === "" ? undefined : resolved;
}

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
        investigation view only renders persisted PostgreSQL history and lineage.
      </p>
      <p style={styles.text}>
        <a href="/mycelia/runs" style={styles.link}>
          Return to Runs
        </a>
      </p>
    </section>
  );
}

async function loadRecentRuns(): Promise<readonly RecentRunOption[]> {
  const tenantId = getMyceliaDemoDatabaseConfig().tenantId;

  return createPrismaGovernedRunRepository(prisma).listRecent({
    tenantId,
    take: RECENT_RUN_SELECTOR_LIMIT,
  });
}

function renderRunSelector(
  recentRuns: readonly RecentRunOption[],
  selectedRunId: string | undefined,
): ReactElement {
  if (recentRuns.length === 0) {
    return (
      <section aria-label="Recent governed runs" style={styles.selector}>
        <p style={styles.eyebrow}>Run selector</p>
        <p style={styles.text}>
          Recent governed runs will appear here once local PostgreSQL has persisted
          activity.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Recent governed runs" style={styles.selector}>
      <p style={styles.eyebrow}>Run selector</p>
      <p style={styles.text}>
        Open a specific run investigation, or leave the URL without a run id to
        inspect the most recent run.
      </p>
      <ol style={styles.selectorList}>
        {recentRuns.map((run) => {
          const isSelected = run.id === selectedRunId;

          return (
            <li
              key={run.id}
              style={
                isSelected
                  ? { ...styles.selectorItem, ...styles.activeSelectorItem }
                  : styles.selectorItem
              }
            >
              <a
                aria-current={isSelected ? "page" : undefined}
                href={`/mycelia/investigations?runId=${encodeURIComponent(run.id)}`}
                style={styles.selectorLink}
              >
                {shortId(run.id)}
              </a>
              <p style={styles.value}>{run.currentState}</p>
              <p style={styles.text}>{formatDate(run.createdAt)}</p>
            </li>
          );
        })}
      </ol>
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
        This page reads the latest governed run directly from local PostgreSQL and
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

function isNarrativeEntry(entry: InvestigationTimelineEntry): boolean {
  return entry.kind !== "AuditRecord";
}

function isEvidenceEntry(entry: InvestigationTimelineEntry): boolean {
  return entry.kind === "AuditRecord";
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

function renderTimelineSection(input: {
  readonly id: string;
  readonly eyebrow: string;
  readonly heading: string;
  readonly description: string;
  readonly entries: readonly InvestigationTimelineEntry[];
  readonly emptyText: string;
}): ReactElement {
  return (
    <section aria-labelledby={input.id} style={styles.section}>
      <p style={styles.eyebrow}>{input.eyebrow}</p>
      <h2 id={input.id} style={styles.title}>
        {input.heading}
      </h2>
      <p style={styles.text}>{input.description}</p>
      {input.entries.length === 0 ? (
        <p style={styles.text}>{input.emptyText}</p>
      ) : (
        <ol style={styles.timeline}>{input.entries.map(renderTimelineEntry)}</ol>
      )}
    </section>
  );
}

function renderNarrativeTimeline(
  result: InvestigationTimelineReadyResult,
): ReactElement {
  return renderTimelineSection({
    id: "narrative-timeline-heading",
    eyebrow: "Narrative timeline",
    heading: "What happened, in order",
    description:
      "This sequence keeps state progression, policy checks, readiness checks and approval moments in strict chronological order.",
    entries: result.timeline.filter(isNarrativeEntry),
    emptyText: "Narrative events will appear once the governed run records state changes.",
  });
}

function renderEvidenceRecords(
  result: InvestigationTimelineReadyResult,
): ReactElement {
  return renderTimelineSection({
    id: "evidence-records-heading",
    eyebrow: "Evidence records",
    heading: "Audit evidence captured for this run",
    description:
      "Evidence records are the persisted audit entries that support the narrative above.",
    entries: result.timeline.filter(isEvidenceEntry),
    emptyText: "Evidence records will appear once the governed run writes audit entries.",
  });
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
      {renderNarrativeTimeline(result)}
      {renderEvidenceRecords(result)}
      {renderControlledSummary(result)}
    </>
  );
}

export default async function MyceliaInvestigationsPage({
  searchParams,
}: {
  readonly searchParams?: LivePageSearchParams;
}) {
  const { actor } = await requireAuthenticatedSession();
  const resolvedSearchParams =
    searchParams === undefined ? undefined : await searchParams;
  const outcome = parseLiveOutcomeSearchParams(resolvedSearchParams);
  const requestedRunId = firstParam(resolvedSearchParams?.runId);
  const [result, recentRuns] = await Promise.all([
    loadInvestigationTimeline(
      requestedRunId === undefined ? {} : { runId: requestedRunId },
    ),
    loadRecentRuns(),
  ]);
  const selectedRunId = result.status === "READY" ? result.run.id : requestedRunId;

  return (
    <main aria-labelledby="investigation-title" style={styles.page}>
      <div style={styles.banner}>
        Controlled Demo Environment -- fixture data, no production auth
      </div>
      <LiveRouteNav currentStage="investigation" />
      <LiveOutcomeBanner outcome={outcome} />
      {renderRunSelector(recentRuns, selectedRunId)}
      {result.status === "EMPTY" ? renderEmptyState() : renderReadyState(result)}
    </main>
  );
}
