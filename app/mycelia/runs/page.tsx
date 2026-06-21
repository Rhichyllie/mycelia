import type { CSSProperties, ReactElement } from "react";

import { prisma } from "@/mycelia/runtime/db/client";
import { getMyceliaDemoDatabaseConfig } from "@/mycelia/runtime/db/demo-config";
import { LIVE_DEMO_SCENARIO } from "@/mycelia/runtime/demo-scenario";
import {
  loadInvestigationTimeline,
  type InvestigationTimelineEntry,
  type InvestigationTimelineReadyResult,
} from "@/mycelia/runtime/investigation/load-investigation-timeline";
import {
  createPrismaDemoReadRepository,
  type DemoPersistedRunSummary,
} from "@/mycelia/runtime/repositories/prisma-demo-read.repository";
import { createPrismaGovernedRunRepository } from "@/mycelia/runtime/repositories/prisma-governed-run.repository";
import { MYCELIA_TOKENS } from "@/mycelia/runtime/ui/design-tokens";
import { parseLiveOutcomeSearchParams } from "@/mycelia/runtime/ui/format-live-label";
import { LiveOutcomeBanner } from "@/mycelia/runtime/ui/live-outcome-banner";
import { LiveRouteNav } from "@/mycelia/runtime/ui/live-route-nav";
import { createGovernedRequest, resetDemo } from "./actions";

export const dynamic = "force-dynamic";

type LivePageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type RunWorkspaceState =
  | {
      readonly status: "READY";
      readonly runs: readonly DemoPersistedRunSummary[];
      readonly selected: DemoPersistedRunSummary | null;
      readonly timeline: InvestigationTimelineReadyResult | null;
    }
  | {
      readonly status: "UNAVAILABLE";
      readonly runs: readonly DemoPersistedRunSummary[];
      readonly selected: null;
      readonly timeline: null;
    };

const RUN_LIST_LIMIT = 8;

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
    gridTemplateColumns: "minmax(min(100%, 330px), 0.9fr) minmax(min(100%, 520px), 1.45fr)",
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
  formRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: MYCELIA_TOKENS.spacing[3],
    marginTop: MYCELIA_TOKENS.spacing[4],
  },
  primaryButton: {
    border: `1px solid ${MYCELIA_TOKENS.color.brand.sage}`,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.intent.accentBg,
    color: MYCELIA_TOKENS.color.brand.sage,
    cursor: "pointer",
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    fontWeight: 850,
    padding: `${MYCELIA_TOKENS.spacing[3]} ${MYCELIA_TOKENS.spacing[4]}`,
  },
  secondaryButton: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.bg.panel,
    color: MYCELIA_TOKENS.color.text.secondary,
    cursor: "pointer",
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    fontWeight: 820,
    padding: `${MYCELIA_TOKENS.spacing[3]} ${MYCELIA_TOKENS.spacing[4]}`,
  },
  runList: {
    listStyle: "none",
    margin: `${MYCELIA_TOKENS.spacing[4]} 0 0`,
    padding: 0,
    display: "grid",
    gap: MYCELIA_TOKENS.spacing[3],
  },
  runRow: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.panel,
    padding: MYCELIA_TOKENS.spacing[4],
  },
  activeRunRow: {
    border: `1px solid ${MYCELIA_TOKENS.color.brand.sage}`,
    background: MYCELIA_TOKENS.color.intent.accentBg,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
    gap: MYCELIA_TOKENS.spacing[3],
    marginTop: MYCELIA_TOKENS.spacing[4],
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
    borderRadius: MYCELIA_TOKENS.radius.full,
    display: "inline-flex",
    alignItems: "center",
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
  timelineList: {
    listStyle: "none",
    margin: `${MYCELIA_TOKENS.spacing[4]} 0 0`,
    padding: 0,
    display: "grid",
    gap: MYCELIA_TOKENS.spacing[2],
  },
  timelineItem: {
    borderLeft: `2px solid ${MYCELIA_TOKENS.color.policy.boundary}`,
    paddingLeft: MYCELIA_TOKENS.spacing[3],
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

function riskTone(riskLevel: string | null | undefined): CSSProperties {
  if (riskLevel === "HIGH") {
    return {
      border: `1px solid ${MYCELIA_TOKENS.color.state.danger}`,
      background: MYCELIA_TOKENS.color.intent.dangerBg,
      color: MYCELIA_TOKENS.color.state.danger,
    };
  }

  if (riskLevel === "MEDIUM") {
    return {
      border: `1px solid ${MYCELIA_TOKENS.color.state.warning}`,
      background: MYCELIA_TOKENS.color.intent.warningBg,
      color: MYCELIA_TOKENS.color.state.warning,
    };
  }

  return {
    border: `1px solid ${MYCELIA_TOKENS.color.state.success}`,
    background: MYCELIA_TOKENS.color.intent.successBg,
    color: MYCELIA_TOKENS.color.state.success,
  };
}

function stateTone(state: string): CSSProperties {
  if (state === "REJECTED" || state === "FAILED") {
    return {
      border: `1px solid ${MYCELIA_TOKENS.color.runtime.failed}`,
      background: MYCELIA_TOKENS.color.intent.dangerBg,
      color: MYCELIA_TOKENS.color.runtime.failed,
    };
  }

  if (state === "WAITING_APPROVAL") {
    return {
      border: `1px solid ${MYCELIA_TOKENS.color.runtime.suspended}`,
      background: MYCELIA_TOKENS.color.intent.warningBg,
      color: MYCELIA_TOKENS.color.runtime.suspended,
    };
  }

  return {
    border: `1px solid ${MYCELIA_TOKENS.color.runtime.active}`,
    background: MYCELIA_TOKENS.color.intent.successBg,
    color: MYCELIA_TOKENS.color.runtime.active,
  };
}

async function loadRunWorkspaceState(
  selectedRunId: string | undefined,
): Promise<RunWorkspaceState> {
  try {
    const tenantId = getMyceliaDemoDatabaseConfig().tenantId;
    const runRepository = createPrismaGovernedRunRepository(prisma);
    const readRepository = createPrismaDemoReadRepository(prisma);
    const recentRuns = await runRepository.listRecent({
      tenantId,
      take: RUN_LIST_LIMIT,
    });
    const summaries = (
      await Promise.all(
        recentRuns.map((run) =>
          readRepository.findRunById({ tenantId, runId: run.id }),
        ),
      )
    ).filter((summary): summary is DemoPersistedRunSummary => summary !== null);
    const selectedId = selectedRunId ?? summaries.at(0)?.run.id;
    const selected =
      selectedId === undefined
        ? null
        : summaries.find((summary) => summary.run.id === selectedId) ??
          (await readRepository.findRunById({ tenantId, runId: selectedId }));
    const timeline =
      selected === null
        ? null
        : await loadInvestigationTimeline({ tenantId, runId: selected.run.id });

    return {
      status: "READY",
      runs: summaries,
      selected,
      timeline: timeline?.status === "READY" ? timeline : null,
    };
  } catch {
    return { status: "UNAVAILABLE", runs: [], selected: null, timeline: null };
  }
}

function renderDetail(label: string, value: string | number | null): ReactElement {
  return (
    <div style={styles.raisedPanel}>
      <p style={styles.label}>{label}</p>
      <p style={styles.value}>{value ?? "Not recorded"}</p>
    </div>
  );
}

function renderStatePill(state: string): ReactElement {
  return (
    <span style={{ ...styles.statusPill, ...stateTone(state) }}>
      {humanState(state)}
    </span>
  );
}

function renderRiskPill(riskLevel: string | null | undefined): ReactElement {
  const label = riskLevel === undefined || riskLevel === null ? "not checked" : riskLevel.toLowerCase();

  return (
    <span style={{ ...styles.statusPill, ...riskTone(riskLevel) }}>
      {label}
    </span>
  );
}

function renderRunRow(
  summary: DemoPersistedRunSummary,
  selectedRun: DemoPersistedRunSummary["run"] | null,
): ReactElement {
  const isSelected = selectedRun?.id === summary.run.id;

  return (
    <li key={summary.run.id} style={isSelected ? { ...styles.runRow, ...styles.activeRunRow } : styles.runRow}>
      <p style={styles.label}>Run case</p>
      <p style={styles.value}>{shortId(summary.run.id)}</p>
      {renderStatePill(summary.run.currentState)}
      {renderRiskPill(summary.latestPolicy?.riskLevel)}
      <p style={styles.smallText}>{summary.run.purpose}</p>
      <a href={`/mycelia/runs?runId=${encodeURIComponent(summary.run.id)}`} style={styles.link}>
        Open case file
      </a>
    </li>
  );
}

function renderRunList(state: RunWorkspaceState): ReactElement {
  if (state.status === "UNAVAILABLE") {
    return (
      <p style={styles.text}>
        Local run data could not be loaded. Confirm the local SQLite database is migrated and seeded.
      </p>
    );
  }

  if (state.runs.length === 0) {
    return (
      <p style={styles.text}>
        Runs will appear here once a governed request is created.
      </p>
    );
  }

  return (
    <ol style={styles.runList}>
      {state.runs.map((summary) => renderRunRow(summary, state.selected?.run ?? null))}
    </ol>
  );
}

function renderTimelineSummary(
  timeline: InvestigationTimelineReadyResult | null,
): ReactElement {
  const entries = timeline?.timeline.slice(0, 5) ?? [];

  if (entries.length === 0) {
    return <p style={styles.text}>History will appear once the run records its first persisted step.</p>;
  }

  return (
    <ol style={styles.timelineList}>
      {entries.map((entry: InvestigationTimelineEntry) => (
        <li key={entry.id} style={styles.timelineItem}>
          <p style={styles.label}>{entry.title}</p>
          <p style={styles.smallText}>{entry.safeSummary}</p>
        </li>
      ))}
    </ol>
  );
}

function renderCaseFile(state: RunWorkspaceState): ReactElement {
  if (state.selected === null) {
    return (
      <section style={styles.panel}>
        <p style={styles.eyebrow}>Run Workspace</p>
        <h1 style={styles.title}>No run selected</h1>
        <p style={styles.text}>
          Create a governed request or open a run from the list to inspect its case file.
        </p>
      </section>
    );
  }

  const { run, latestPolicy, latestAdmission, latestSnapshot, auditCount } =
    state.selected;
  const approvalStatus =
    state.timeline?.approvalRequest?.status ??
    (run.currentState === "WAITING_APPROVAL" ? "Approval is required" : "Not requested");

  return (
    <section style={styles.panel}>
      <p style={styles.eyebrow}>Run Workspace</p>
      <h1 style={styles.title}>{LIVE_DEMO_SCENARIO.title}</h1>
      <p style={styles.text}>{run.purpose}</p>
      <div style={styles.detailGrid}>
        {renderDetail("Request summary", LIVE_DEMO_SCENARIO.fixtureSummary)}
        {renderDetail("Run scope", run.resourceRef)}
        {renderDetail("Affected systems", "Fixture document workspace")}
        {renderDetail("Requester", run.requesterRef)}
        {renderDetail("Current state", humanState(run.currentState))}
        {renderDetail("Risk level", latestPolicy?.riskLevel ?? null)}
        {renderDetail("Policy check", latestPolicy?.safeSummary ?? null)}
        {renderDetail("Readiness check", latestAdmission?.safeSummary ?? null)}
        {renderDetail("Approval status", approvalStatus)}
        {renderDetail("Evidence records", auditCount)}
        {renderDetail(
          "Latest step",
          latestSnapshot === null
            ? null
            : `${latestSnapshot.sequence}: ${humanState(latestSnapshot.state)}`,
        )}
      </div>
      <section style={{ ...styles.raisedPanel, marginTop: MYCELIA_TOKENS.spacing[4] }}>
        <p style={styles.eyebrow}>History and lineage</p>
        <h2 style={styles.sectionTitle}>Recent case timeline</h2>
        {renderTimelineSummary(state.timeline)}
        <p style={styles.text}>
          <a href="/mycelia/investigations" style={styles.link}>
            Open the full investigation trail
          </a>
        </p>
      </section>
    </section>
  );
}

export default async function MyceliaRunsPage({
  searchParams,
}: {
  readonly searchParams?: LivePageSearchParams;
}) {
  const resolvedSearchParams =
    searchParams === undefined ? undefined : await searchParams;
  const outcome = parseLiveOutcomeSearchParams(resolvedSearchParams);
  const selectedRunId = firstParam(resolvedSearchParams?.runId);
  const demoMode = getMyceliaDemoDatabaseConfig().demoMode;
  const workspace = await loadRunWorkspaceState(selectedRunId);

  return (
    <main aria-labelledby="runs-title" style={styles.page}>
      <div id="runs-title" style={styles.banner}>
        Live local product environment -- fixture data, controlled run workspace, no production auth
      </div>
      <LiveRouteNav currentStage="request" />
      <LiveOutcomeBanner outcome={outcome} />
      <section style={{ ...styles.panel, marginTop: MYCELIA_TOKENS.spacing[4] }}>
        <p style={styles.eyebrow}>New work</p>
        <h1 style={styles.title}>Start a governed request</h1>
        <p style={styles.text}>
          Create a real local run from fixture metadata. Approval is required before this can proceed.
        </p>
        <div style={styles.formRow}>
          <form action={createGovernedRequest}>
            <button type="submit" style={styles.primaryButton}>
              Start governed request
            </button>
          </form>
          {demoMode ? (
            <form action={resetDemo}>
              <button type="submit" style={styles.secondaryButton}>
                Reset demo
              </button>
            </form>
          ) : null}
        </div>
        {demoMode ? (
          <p style={styles.smallText}>
            Reset restores local demo data only, including the seeded run and Studio workspace.
          </p>
        ) : null}
      </section>
      <div style={styles.workspaceGrid}>
        <section style={styles.panel}>
          <p style={styles.eyebrow}>Runs</p>
          <h2 style={styles.sectionTitle}>Recent governed work</h2>
          <p style={styles.text}>
            Most recent runs are listed first. Each row is read from local SQLite.
          </p>
          {renderRunList(workspace)}
        </section>
        {renderCaseFile(workspace)}
      </div>
    </main>
  );
}
