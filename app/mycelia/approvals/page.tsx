import type { CSSProperties, ReactElement } from "react";

import { prisma } from "@/mycelia/runtime/db/client";
import { getMyceliaDemoDatabaseConfig } from "@/mycelia/runtime/db/demo-config";
import { LIVE_DEMO_SCENARIO } from "@/mycelia/runtime/demo-scenario";
import { MYCELIA_TOKENS } from "@/mycelia/runtime/ui/design-tokens";
import { LiveOutcomeBanner } from "@/mycelia/runtime/ui/live-outcome-banner";
import { LiveRouteNav } from "@/mycelia/runtime/ui/live-route-nav";
import { parseLiveOutcomeSearchParams } from "@/mycelia/runtime/ui/format-live-label";
import {
  createPrismaApprovalRequestRepository,
  type PrismaApprovalRequestRecord,
} from "@/mycelia/runtime/repositories/prisma-approval-request.repository";
import {
  createPrismaDemoReadRepository,
  type DemoPersistedRunSummary,
} from "@/mycelia/runtime/repositories/prisma-demo-read.repository";
import { approveGovernedRequest, rejectGovernedRequest } from "./actions";

export const dynamic = "force-dynamic";

type LivePageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type ApprovalDecisionLiveState =
  | {
      readonly status: "EMPTY";
    }
  | {
      readonly status: "PENDING";
      readonly summary: DemoPersistedRunSummary;
      readonly approvalRequest: PrismaApprovalRequestRecord;
    }
  | {
      readonly status: "DECIDED";
      readonly summary: DemoPersistedRunSummary;
      readonly approvalRequest: PrismaApprovalRequestRecord;
    };

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
    lineHeight: 1.15,
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
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
    gap: MYCELIA_TOKENS.spacing[4],
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
    margin: "5px 0 0",
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: MYCELIA_TOKENS.type.data,
    fontWeight: 780,
    overflowWrap: "anywhere",
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: MYCELIA_TOKENS.spacing[3],
    marginTop: MYCELIA_TOKENS.spacing[5],
  },
  approveButton: {
    border: `1px solid ${MYCELIA_TOKENS.color.state.success}`,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.intent.successBg,
    color: MYCELIA_TOKENS.color.state.success,
    cursor: "pointer",
    fontSize: "0.92rem",
    fontWeight: 850,
    padding: "11px 16px",
  },
  rejectButton: {
    border: `1px solid ${MYCELIA_TOKENS.color.state.danger}`,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.intent.dangerBg,
    color: MYCELIA_TOKENS.color.state.danger,
    cursor: "pointer",
    fontSize: "0.92rem",
    fontWeight: 850,
    padding: "11px 16px",
  },
  link: {
    color: MYCELIA_TOKENS.color.brand.sage,
    fontWeight: 850,
  },
  hint: {
    border: `1px solid ${MYCELIA_TOKENS.color.policy.requiresApproval}`,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.intent.warningBg,
    color: MYCELIA_TOKENS.color.text.primary,
    marginTop: MYCELIA_TOKENS.spacing[5],
    padding: MYCELIA_TOKENS.spacing[3],
    fontSize: "0.88rem",
    fontWeight: 760,
    lineHeight: 1.45,
  },
} satisfies Record<string, CSSProperties>;

function isDecidedApproval(
  approvalRequest: PrismaApprovalRequestRecord,
): boolean {
  return (
    approvalRequest.status === "APPROVED" ||
    approvalRequest.status === "REJECTED"
  );
}

async function loadApprovalDecisionState(): Promise<ApprovalDecisionLiveState> {
  try {
    const tenantId = getMyceliaDemoDatabaseConfig().tenantId;
    const readRepository = createPrismaDemoReadRepository(prisma);
    const approvalRepository = createPrismaApprovalRequestRepository(prisma);
    const waitingRun = await readRepository.findLatestWaitingApprovalRun({
      tenantId,
    });

    if (waitingRun !== null) {
      const approvalRequest = await approvalRepository.findOrCreateForRun({
        tenantId,
        governedRunId: waitingRun.run.id,
      });

      if (approvalRequest === null) {
        return { status: "EMPTY" };
      }

      if (approvalRequest.status === "PENDING") {
        return { status: "PENDING", summary: waitingRun, approvalRequest };
      }

      return { status: "DECIDED", summary: waitingRun, approvalRequest };
    }

    const decidedRun = await readRepository.findLatestDecidedApprovalRun({
      tenantId,
    });

    if (decidedRun === null) {
      return { status: "EMPTY" };
    }

    const approvalRequest = await approvalRepository.findForRun({
      tenantId,
      governedRunId: decidedRun.run.id,
    });

    if (approvalRequest === null || !isDecidedApproval(approvalRequest)) {
      return { status: "EMPTY" };
    }

    return { status: "DECIDED", summary: decidedRun, approvalRequest };
  } catch {
    return { status: "EMPTY" };
  }
}

function shortId(value: string): string {
  return value.length <= 12 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function formatDecisionTime(value: Date | null): string {
  return value === null ? "Not decided" : value.toISOString();
}

function renderDetail(label: string, value: string | number | null): ReactElement {
  return (
    <div style={styles.detail}>
      <p style={styles.label}>{label}</p>
      <p style={styles.value}>{value ?? "Pending"}</p>
    </div>
  );
}

function renderRunContext(
  summary: DemoPersistedRunSummary,
  approvalRequest: PrismaApprovalRequestRecord,
): ReactElement {
  const { run, latestPolicy, latestAdmission, latestSnapshot, auditCount } =
    summary;

  return (
    <div style={styles.grid}>
      {renderDetail("Run", shortId(run.id))}
      {renderDetail("Current state", run.currentState)}
      {renderDetail("Risk level", latestPolicy?.riskLevel ?? "Not checked")}
      {renderDetail("Policy check", latestPolicy?.safeSummary ?? "Pending")}
      {renderDetail("Readiness check", latestAdmission?.safeSummary ?? "Pending")}
      {renderDetail("Evidence records", auditCount)}
      {renderDetail(
        "Latest snapshot",
        latestSnapshot === null
          ? "No snapshot"
          : `${latestSnapshot.sequence}: ${latestSnapshot.state}`,
      )}
      {renderDetail("Requested role", approvalRequest.requestedRole)}
      {renderDetail("Requester", approvalRequest.requesterRef)}
    </div>
  );
}

function renderEmptyState(): ReactElement {
  return (
    <section aria-label="No approval waiting" style={styles.hero}>
      <p style={styles.eyebrow}>Approval queue</p>
      <h1 style={styles.title}>No run is waiting for approval</h1>
      <p style={styles.text}>
        Create a governed request from the controlled demo scenario first. The
        approvals page only renders controls for a persisted run that is already
        waiting for approval.
      </p>
      <p style={styles.text}>
        <a href="/mycelia/runs" style={styles.link}>
          Return to Runs
        </a>
      </p>
    </section>
  );
}

function renderPendingState(
  state: Extract<ApprovalDecisionLiveState, { readonly status: "PENDING" }>,
): ReactElement {
  return (
    <section aria-label="Pending approval decision" style={styles.hero}>
      <p style={styles.eyebrow}>Approval required</p>
      <h1 style={styles.title}>{LIVE_DEMO_SCENARIO.title}</h1>
      <p style={styles.text}>
        Approval is required before this can proceed. Approve or reject the run
        using only persisted local demo records.
      </p>
      {renderRunContext(state.summary, state.approvalRequest)}
      <div style={styles.actionRow}>
        <form action={approveGovernedRequest}>
          <button type="submit" style={styles.approveButton}>
            Approve
          </button>
        </form>
        <form action={rejectGovernedRequest}>
          <button type="submit" style={styles.rejectButton}>
            Reject
          </button>
        </form>
      </div>
    </section>
  );
}

function renderDecidedState(
  state: Extract<ApprovalDecisionLiveState, { readonly status: "DECIDED" }>,
): ReactElement {
  const { approvalRequest } = state;

  return (
    <section aria-label="Persisted approval decision" style={styles.hero}>
      <p style={styles.eyebrow}>Approval complete</p>
      <h1 style={styles.title}>{approvalRequest.status}</h1>
      <p style={styles.text}>
        {approvalRequest.safeDecisionSummary ?? "The approval result was persisted."}
      </p>
      {renderRunContext(state.summary, approvalRequest)}
      <div style={styles.grid}>
        {renderDetail("Decision outcome", approvalRequest.decisionOutcome)}
        {renderDetail("Decision reason", approvalRequest.decisionReasonCode)}
        {renderDetail("Approver", approvalRequest.approverRef)}
        {renderDetail("Decided at", formatDecisionTime(approvalRequest.decidedAt))}
      </div>
      <div style={styles.hint}>
        The investigation view reads this run&apos;s full evidence trail from local
        SQLite now.
      </div>
    </section>
  );
}

export default async function MyceliaApprovalDecisionPage({
  searchParams,
}: {
  readonly searchParams?: LivePageSearchParams;
}) {
  const outcome = parseLiveOutcomeSearchParams(
    searchParams === undefined ? undefined : await searchParams,
  );
  const state = await loadApprovalDecisionState();

  return (
    <main aria-labelledby="approval-decision-title" style={styles.page}>
      <div id="approval-decision-title" style={styles.banner}>
        Controlled demo environment -- fixture data, no production auth
      </div>
      <LiveRouteNav currentStage="approval" />
      <LiveOutcomeBanner outcome={outcome} />
      {state.status === "EMPTY" ? renderEmptyState() : null}
      {state.status === "PENDING" ? renderPendingState(state) : null}
      {state.status === "DECIDED" ? renderDecidedState(state) : null}
    </main>
  );
}
