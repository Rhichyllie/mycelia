import type { CSSProperties, ReactElement } from "react";

import { PilotDemoEndToEndSurface } from "@/mycelia/demo/pilot-demo-end-to-end";
import { prisma } from "@/mycelia/runtime/db/client";
import { getMyceliaDemoDatabaseConfig } from "@/mycelia/runtime/db/demo-config";
import { LIVE_DEMO_SCENARIO } from "@/mycelia/runtime/demo-scenario";
import { LiveOutcomeBanner } from "@/mycelia/runtime/ui/live-outcome-banner";
import { LiveRouteNav } from "@/mycelia/runtime/ui/live-route-nav";
import { parseLiveOutcomeSearchParams } from "@/mycelia/runtime/ui/format-live-label";
import {
  createPrismaDemoReadRepository,
  type DemoPersistedRunSummary,
} from "@/mycelia/runtime/repositories/prisma-demo-read.repository";
import { createGovernedRequest, resetDemo } from "./actions";

export const dynamic = "force-dynamic";

type LivePageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type DemoLiveState =
  | {
      readonly status: "READY";
      readonly latestRun: DemoPersistedRunSummary | null;
    }
  | {
      readonly status: "UNAVAILABLE";
      readonly latestRun: null;
    };

const styles = {
  liveShell: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "34px 0 0",
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
  liveGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "16px",
    marginTop: "16px",
  },
  panel: {
    border: "1px solid #d7e1d8",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "18px",
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
    fontSize: "1.28rem",
    lineHeight: 1.3,
    letterSpacing: 0,
  },
  text: {
    margin: "8px 0 0",
    color: "#4e6156",
    fontSize: "0.9rem",
    lineHeight: 1.55,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))",
    gap: "10px",
    marginTop: "14px",
  },
  detail: {
    border: "1px solid #e0e8e1",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "10px",
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
  button: {
    border: "1px solid #274835",
    borderRadius: "6px",
    background: "#1f3b2b",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "0.92rem",
    fontWeight: 850,
    marginTop: "16px",
    padding: "11px 14px",
  },
  resetButton: {
    border: "1px solid #b8a36f",
    borderRadius: "6px",
    background: "#fff9e8",
    color: "#604812",
    cursor: "pointer",
    fontSize: "0.88rem",
    fontWeight: 850,
    marginTop: "12px",
    padding: "10px 13px",
  },
  resetCaption: {
    margin: "7px 0 0",
    color: "#6b5a2a",
    fontSize: "0.82rem",
    lineHeight: 1.45,
  },
  hint: {
    border: "1px solid #d9c48d",
    borderRadius: "8px",
    background: "#fff9e8",
    color: "#604812",
    marginTop: "14px",
    padding: "12px",
    fontSize: "0.86rem",
    fontWeight: 750,
    lineHeight: 1.45,
  },
} satisfies Record<string, CSSProperties>;

async function loadDemoLiveState(): Promise<DemoLiveState> {
  try {
    const tenantId = getMyceliaDemoDatabaseConfig().tenantId;
    const repository = createPrismaDemoReadRepository(prisma);
    const latestRun = await repository.findLatestRun({ tenantId });

    return { status: "READY", latestRun };
  } catch {
    return { status: "UNAVAILABLE", latestRun: null };
  }
}

function shortId(value: string): string {
  return value.length <= 12 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function renderPersistedRun(state: DemoLiveState): ReactElement {
  if (state.status === "UNAVAILABLE") {
    return (
      <p style={styles.text}>
        Local SQLite state is not available yet. Run the local database setup
        before creating a governed request.
      </p>
    );
  }

  if (state.latestRun === null) {
    return (
      <p style={styles.text}>
        No governed request has been created in the local demo database yet.
      </p>
    );
  }

  const { run, latestPolicy, latestAdmission, latestSnapshot, auditCount } =
    state.latestRun;

  return (
    <div style={styles.detailGrid}>
      <div style={styles.detail}>
        <p style={styles.label}>Run</p>
        <p style={styles.value}>{shortId(run.id)}</p>
      </div>
      <div style={styles.detail}>
        <p style={styles.label}>Current state</p>
        <p style={styles.value}>{run.currentState}</p>
      </div>
      <div style={styles.detail}>
        <p style={styles.label}>Risk</p>
        <p style={styles.value}>{latestPolicy?.riskLevel ?? "Not evaluated"}</p>
      </div>
      <div style={styles.detail}>
        <p style={styles.label}>Policy</p>
        <p style={styles.value}>{latestPolicy?.safeSummary ?? "Pending"}</p>
      </div>
      <div style={styles.detail}>
        <p style={styles.label}>Admission</p>
        <p style={styles.value}>{latestAdmission?.safeSummary ?? "Pending"}</p>
      </div>
      <div style={styles.detail}>
        <p style={styles.label}>Audit records</p>
        <p style={styles.value}>{auditCount}</p>
      </div>
      <div style={styles.detail}>
        <p style={styles.label}>Latest snapshot</p>
        <p style={styles.value}>
          {latestSnapshot === null
            ? "No snapshot"
            : `${latestSnapshot.sequence}: ${latestSnapshot.state}`}
        </p>
      </div>
    </div>
  );
}

export default async function MyceliaPilotDemoPage({
  searchParams,
}: {
  readonly searchParams?: LivePageSearchParams;
}) {
  const outcome = parseLiveOutcomeSearchParams(
    searchParams === undefined ? undefined : await searchParams,
  );
  const demoMode = getMyceliaDemoDatabaseConfig().demoMode;
  const liveState = await loadDemoLiveState();

  return (
    <>
      <section aria-label="LIVE-2 governed request creation" style={styles.liveShell}>
        <div style={styles.banner}>
          Controlled Demo Environment -- fixture data, no production auth
        </div>
        <LiveRouteNav currentStage="request" />
        <LiveOutcomeBanner outcome={outcome} />
        <div style={styles.liveGrid}>
          <article style={styles.panel}>
            <p style={styles.eyebrow}>Seeded scenario</p>
            <h1 style={styles.title}>{LIVE_DEMO_SCENARIO.title}</h1>
            <p style={styles.text}>{LIVE_DEMO_SCENARIO.purpose}</p>
            <p style={styles.text}>{LIVE_DEMO_SCENARIO.fixtureSummary}</p>
            <form action={createGovernedRequest}>
              <button type="submit" style={styles.button}>
                Start governed request
              </button>
            </form>
            {demoMode ? (
              <form action={resetDemo}>
                <button type="submit" style={styles.resetButton}>
                  Reset demo
                </button>
                <p style={styles.resetCaption}>
                  Resets local demo data only -- restores the seeded scenario.
                </p>
              </form>
            ) : null}
            <div style={styles.hint}>
              The approval page can approve or reject the latest waiting run now; the investigation page reads the persisted trail after that decision.
            </div>
          </article>

          <article style={styles.panel}>
            <p style={styles.eyebrow}>Persisted local state</p>
            <h2 style={styles.title}>SQLite-backed governed run</h2>
            <p style={styles.text}>
              This panel reads from the local database on render. Refreshing the
              page shows persisted state, not an in-memory fixture.
            </p>
            {renderPersistedRun(liveState)}
          </article>
        </div>
      </section>
      <PilotDemoEndToEndSurface />
    </>
  );
}
