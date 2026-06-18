import type { CSSProperties, ReactElement } from "react";

import type {
  PilotDemoEndToEndModel,
  PilotDemoEndToEndStatus,
  PilotDemoPresenterScriptItem,
  PilotDemoRouteLink,
  PilotDemoStepCard,
} from "./pilot-demo-end-to-end-contract";
import { presentPilotDemoEndToEnd } from "./pilot-demo-end-to-end-presenter";

export type PilotDemoEndToEndSurfaceProps = {
  readonly scenario?: unknown;
};

type PilotDemoTone = "neutral" | "success" | "info" | "warning" | "critical";

const toneStyles = {
  neutral: {
    border: "#c9d4cb",
    background: "#ffffff",
    color: "#2b4033",
  },
  success: {
    border: "#9dc2a4",
    background: "#f0f8f1",
    color: "#1f5f32",
  },
  info: {
    border: "#a9bed5",
    background: "#f2f7fc",
    color: "#244866",
  },
  warning: {
    border: "#d4bf83",
    background: "#fff9e8",
    color: "#604812",
  },
  critical: {
    border: "#d49a9a",
    background: "#fff2f2",
    color: "#743131",
  },
} satisfies Record<PilotDemoTone, {
  readonly border: string;
  readonly background: string;
  readonly color: string;
}>;

const styles = {
  page: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "34px 0 48px",
  },
  hero: {
    border: "1px solid #cbd8ce",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "28px",
  },
  eyebrow: {
    margin: 0,
    color: "#496257",
    fontSize: "0.78rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: "10px 0 0",
    color: "#15231c",
    fontSize: "clamp(1.55rem, 2.4vw, 2.35rem)",
    lineHeight: 1.15,
    letterSpacing: 0,
  },
  summary: {
    margin: "12px 0 0",
    maxWidth: "860px",
    color: "#46594f",
    fontSize: "0.98rem",
    lineHeight: 1.65,
  },
  statusRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "18px",
  },
  badge: {
    border: "1px solid #c1cec5",
    borderRadius: "999px",
    background: "#f9fbf8",
    color: "#263d30",
    padding: "6px 10px",
    fontSize: "0.78rem",
    fontWeight: 800,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: "18px",
    marginTop: "20px",
  },
  section: {
    border: "1px solid #d7e1d8",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "20px",
  },
  wideSection: {
    gridColumn: "1 / -1",
  },
  sectionTitle: {
    margin: 0,
    color: "#1c3025",
    fontSize: "1.02rem",
    lineHeight: 1.35,
    letterSpacing: 0,
  },
  sectionText: {
    margin: "8px 0 0",
    color: "#53665b",
    fontSize: "0.88rem",
    lineHeight: 1.55,
  },
  stepGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: "14px",
    marginTop: "16px",
  },
  stepCard: {
    border: "1px solid #dce5dd",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "16px",
  },
  stepTitle: {
    margin: 0,
    color: "#203629",
    fontSize: "0.95rem",
    lineHeight: 1.35,
  },
  stepMeta: {
    margin: "8px 0 0",
    color: "#5a6b62",
    fontSize: "0.78rem",
    fontWeight: 800,
    lineHeight: 1.45,
  },
  list: {
    margin: "14px 0 0",
    paddingLeft: "20px",
    color: "#2e4637",
    fontSize: "0.9rem",
    lineHeight: 1.55,
  },
  linkList: {
    listStyle: "none",
    margin: "14px 0 0",
    padding: 0,
    display: "grid",
    gap: "10px",
  },
  link: {
    display: "inline-flex",
    border: "1px solid #355642",
    borderRadius: "6px",
    background: "#263f30",
    color: "#ffffff",
    padding: "9px 12px",
    fontSize: "0.86rem",
    fontWeight: 800,
    textDecoration: "none",
  },
  warningList: {
    listStyle: "none",
    margin: "14px 0 0",
    padding: 0,
    display: "grid",
    gap: "10px",
  },
  warningItem: {
    borderRadius: "8px",
    padding: "12px",
  },
  code: {
    display: "block",
    fontSize: "0.76rem",
    fontWeight: 850,
    marginBottom: "4px",
  },
} satisfies Record<string, CSSProperties>;

function toneForStatus(status: PilotDemoEndToEndStatus): PilotDemoTone {
  if (status === "PILOT_DEMO_READY") {
    return "success";
  }

  if (status === "PILOT_DEMO_INCOMPLETE") {
    return "warning";
  }

  if (
    status === "PILOT_DEMO_BLOCKED" ||
    status === "PILOT_DEMO_FAILED_SAFE"
  ) {
    return "critical";
  }

  return "neutral";
}

function renderBadge(text: string, tone: PilotDemoTone): ReactElement {
  const colors = toneStyles[tone];

  return (
    <span
      key={text}
      style={{
        ...styles.badge,
        borderColor: colors.border,
        background: colors.background,
        color: colors.color,
      }}
    >
      {text}
    </span>
  );
}

function renderPlainList(items: readonly string[]): ReactElement {
  return (
    <ul style={styles.list}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function renderStepCards(cards: readonly PilotDemoStepCard[]): ReactElement {
  return (
    <div style={styles.stepGrid}>
      {cards.map((card) => (
        <article key={`${card.stepKind}-${card.routePath}`} style={styles.stepCard}>
          <h3 style={styles.stepTitle}>{card.title}</h3>
          <p style={styles.stepMeta}>
            {card.stepKind} · {card.status}
          </p>
          <p style={styles.sectionText}>{card.safeSummary}</p>
          <p style={styles.stepMeta}>Expected outcome</p>
          <p style={styles.sectionText}>{card.expectedOutcome}</p>
          <p style={styles.stepMeta}>What to say</p>
          <p style={styles.sectionText}>{card.whatToSay}</p>
          <p style={styles.stepMeta}>What not to claim</p>
          <p style={styles.sectionText}>{card.whatNotToClaim}</p>
        </article>
      ))}
    </div>
  );
}

function renderRouteLinks(links: readonly PilotDemoRouteLink[]): ReactElement {
  return (
    <ul aria-label="Controlled demo route links" style={styles.linkList}>
      {links.map((link) => (
        <li key={link.routePath}>
          <a href={link.routePath} style={styles.link}>
            {link.routePath}
          </a>
          <p style={styles.sectionText}>{link.safeSummary}</p>
        </li>
      ))}
    </ul>
  );
}

function renderPresenterScript(
  script: readonly PilotDemoPresenterScriptItem[],
): ReactElement {
  return (
    <div style={styles.stepGrid}>
      {script.map((item) => (
        <article key={item.stepKind} style={styles.stepCard}>
          <h3 style={styles.stepTitle}>{item.stepKind}</h3>
          <p style={styles.stepMeta}>What to say</p>
          <p style={styles.sectionText}>{item.whatToSay}</p>
          <p style={styles.stepMeta}>What not to claim</p>
          <p style={styles.sectionText}>{item.whatNotToClaim}</p>
        </article>
      ))}
    </div>
  );
}

function renderReadiness(model: PilotDemoEndToEndModel): ReactElement {
  if (model.demoReadiness.warnings.length === 0) {
    return <p style={styles.sectionText}>No readiness warnings were produced.</p>;
  }

  return (
    <ul style={styles.warningList}>
      {model.demoReadiness.warnings.map((item) => {
        const tone = item.severity === "BLOCKER"
          ? "critical"
          : item.severity === "WARNING"
            ? "warning"
            : "info";
        const colors = toneStyles[tone];

        return (
          <li
            key={`${item.code}-${item.safeSummary}`}
            style={{
              ...styles.warningItem,
              border: `1px solid ${colors.border}`,
              background: colors.background,
              color: colors.color,
            }}
          >
            <span style={styles.code}>{item.code}</span>
            {item.safeSummary}
          </li>
        );
      })}
    </ul>
  );
}

export function PilotDemoEndToEndSurface({
  scenario,
}: PilotDemoEndToEndSurfaceProps): ReactElement {
  const model = presentPilotDemoEndToEnd(scenario);
  const statusTone = toneForStatus(model.status);

  return (
    <main aria-labelledby="pilot-demo-title" style={styles.page}>
      <section aria-label="Pilot demo overview" style={styles.hero}>
        <p style={styles.eyebrow}>Phase 3K controlled pilot walkthrough</p>
        <h1 id="pilot-demo-title" style={styles.title}>
          {model.demoTitle}
        </h1>
        <p style={styles.summary}>{model.demoThesis}</p>
        <div aria-label="Pilot demo boundary" style={styles.statusRow}>
          {renderBadge(model.status, statusTone)}
          {renderBadge("Guided demo only", "info")}
          {renderBadge("No runtime execution", "warning")}
          {renderBadge("No live DB write", "warning")}
        </div>
      </section>

      <div style={styles.grid}>
        <section aria-labelledby="demo-overview-heading" style={styles.section}>
          <h2 id="demo-overview-heading" style={styles.sectionTitle}>
            Demo overview
          </h2>
          <p style={styles.sectionText}>Selected scenario: {model.selectedScenarioId}</p>
          <p style={styles.sectionText}>Target audience: {model.targetAudience}</p>
          <p style={styles.sectionText}>Scenario summary: {model.scenarioSummary}</p>
        </section>

        <section
          aria-labelledby="end-to-end-path-heading"
          style={{ ...styles.section, ...styles.wideSection }}
        >
          <h2 id="end-to-end-path-heading" style={styles.sectionTitle}>
            End-to-end path
          </h2>
          <p style={styles.sectionText}>
            Step cards connect the existing controlled MYCELIA surfaces without
            executing the scenario.
          </p>
          {renderStepCards(model.stepCards)}
          {renderRouteLinks(model.routeLinks)}
        </section>

        <section
          aria-labelledby="governance-story-heading"
          style={styles.section}
        >
          <h2 id="governance-story-heading" style={styles.sectionTitle}>
            Governance story
          </h2>
          {renderPlainList(model.expectedGovernancePath)}
        </section>

        <section
          aria-labelledby="presenter-script-heading"
          style={{ ...styles.section, ...styles.wideSection }}
        >
          <h2 id="presenter-script-heading" style={styles.sectionTitle}>
            Presenter script
          </h2>
          <p style={styles.sectionText}>
            Use these talking points to keep the demo accurate and avoid
            unsupported live-product claims.
          </p>
          {renderPresenterScript(model.presenterScript)}
        </section>

        <section
          aria-labelledby="safety-boundary-heading"
          style={styles.section}
        >
          <h2 id="safety-boundary-heading" style={styles.sectionTitle}>
            Safety boundary
          </h2>
          {renderPlainList(model.safetyBoundary)}
        </section>

        <section
          aria-labelledby="demo-readiness-heading"
          style={styles.section}
        >
          <h2 id="demo-readiness-heading" style={styles.sectionTitle}>
            Demo readiness
          </h2>
          <p style={styles.sectionText}>Readiness status: {model.demoReadiness.status}</p>
          {model.demoReadiness.missingPieces.length > 0
            ? renderPlainList(model.demoReadiness.missingPieces)
            : <p style={styles.sectionText}>No missing demo pieces were detected.</p>}
          {renderReadiness(model)}
          {renderPlainList(model.nextActions)}
        </section>
      </div>
    </main>
  );
}

export default PilotDemoEndToEndSurface;
