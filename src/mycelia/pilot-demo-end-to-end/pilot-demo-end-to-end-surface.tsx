import type { CSSProperties, ReactElement } from "react";

import { DEMO_SCENARIO_SEED_FIXTURES } from "../demo-scenario-seed-package";
import type {
  PilotDemoEndToEndModel,
  PilotDemoEndToEndStatus,
  PilotDemoRouteLink,
  PilotDemoStepCard,
} from "./pilot-demo-end-to-end-contract";
import { presentPilotDemoEndToEnd } from "./pilot-demo-end-to-end-presenter";

export type PilotDemoEndToEndSurfaceProps = {
  readonly scenario?: unknown;
};

type PilotDemoTone = "neutral" | "success" | "info" | "warning" | "critical";

type ScenarioCard = {
  readonly label: string;
  readonly scenarioId: string;
  readonly summary: string;
  readonly buyerSignal: string;
  readonly status: PilotDemoEndToEndStatus;
  readonly selected: boolean;
};

type TimelineDetails = {
  readonly label: string;
  readonly myceliaAction: string;
  readonly humanView: string;
  readonly auditable: string;
};

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
} satisfies Record<
  PilotDemoTone,
  {
    readonly border: string;
    readonly background: string;
    readonly color: string;
  }
>;

const timelineDetailsByStepKind: Record<string, TimelineDetails> = {
  REQUEST_CREATION: {
    label: "Request Draft",
    myceliaAction:
      "Frames the operational request as a governed draft before business impact.",
    humanView:
      "The operator sees purpose, risk hint and safe request references.",
    auditable: "Request intent and safe metadata are ready for audit review.",
  },
  POLICY_ADMISSION: {
    label: "Policy / Admission",
    myceliaAction:
      "Decides whether the request can proceed, pause for approval or stop.",
    humanView:
      "The reviewer sees why the request needs approval or is blocked.",
    auditable: "Admission rationale and policy expectation are explainable.",
  },
  APPROVAL_DECISION: {
    label: "Approval Decision",
    myceliaAction:
      "Prepares the human approval point without submitting a live decision.",
    humanView:
      "The approver sees the decision preview and expected lifecycle result.",
    auditable: "Approval outcome is represented as a controlled audit moment.",
  },
  AUDIT_EXPECTATION: {
    label: "Audit Moment",
    myceliaAction:
      "Marks the moments that should be explainable after the operation.",
    humanView:
      "The client sees which evidence should exist and which gaps matter.",
    auditable: "Expected audit coverage is visible before claiming completion.",
  },
  INVESTIGATION_REVIEW: {
    label: "Investigation",
    myceliaAction:
      "Assembles a safe read-only explanation of the governed path.",
    humanView:
      "The investigator sees state, decisions, findings and missing evidence.",
    auditable: "The final review can be traced without replay execution.",
  },
};

const businessValueItems = [
  "Prevents ungoverned AI-assisted actions from moving straight into operations.",
  "Creates human approval points when policy says the request needs review.",
  "Makes audit expectations visible before the team claims completion.",
  "Supports investigation when a request is rejected, incomplete or questioned.",
  "Reduces invisible operational risk by turning decisions into reviewable checkpoints.",
] as const;

const presenterModePanels = [
  {
    title: "What to say in a client meeting",
    items: [
      "This is the pilot path for a governed AI-assisted operational request.",
      "MYCELIA shows where policy, approval, audit and investigation fit together.",
      "The demo is intentionally controlled so claims stay accurate.",
    ],
  },
  {
    title: "What not to claim yet",
    items: [
      "Do not claim live request submission or live approval action.",
      "Do not claim production auth, RBAC, notifications or API access.",
      "Do not claim replay execution, export packages or broad workflow building.",
    ],
  },
  {
    title: "What this pilot proves",
    items: [
      "The buyer can see the governance story end to end.",
      "Risk and approval decisions become understandable checkpoints.",
      "Investigation and audit expectations are visible from safe descriptors.",
    ],
  },
  {
    title: "What remains simulated",
    items: [
      "Runtime execution and live persistence remain future phases.",
      "Approval actions are previews, not submitted decisions.",
      "Replay, exports and external integrations are outside this demo.",
    ],
  },
] as const;

const styles = {
  page: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "34px 0 52px",
  },
  hero: {
    border: "1px solid #c9d8cf",
    borderRadius: "8px",
    background:
      "linear-gradient(135deg, #ffffff 0%, #f4faf5 55%, #eef6f8 100%)",
    padding: "30px",
  },
  eyebrow: {
    margin: 0,
    color: "#496257",
    fontSize: "0.78rem",
    fontWeight: 850,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: "10px 0 0",
    maxWidth: "900px",
    color: "#15231c",
    fontSize: "clamp(2rem, 4vw, 3.35rem)",
    lineHeight: 1.04,
    letterSpacing: 0,
  },
  heroCopy: {
    margin: "14px 0 0",
    maxWidth: "790px",
    color: "#34483d",
    fontSize: "1.06rem",
    lineHeight: 1.58,
  },
  statusRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "20px",
  },
  badge: {
    border: "1px solid #c1cec5",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#263d30",
    padding: "6px 10px",
    fontSize: "0.76rem",
    fontWeight: 850,
  },
  heroOutcomeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
    gap: "12px",
    marginTop: "24px",
  },
  outcomeTile: {
    border: "1px solid #d3ded6",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.76)",
    padding: "14px",
  },
  outcomeLabel: {
    margin: 0,
    color: "#5a6b62",
    fontSize: "0.74rem",
    fontWeight: 850,
    textTransform: "uppercase",
  },
  outcomeText: {
    margin: "6px 0 0",
    color: "#1d3327",
    fontSize: "0.9rem",
    fontWeight: 750,
    lineHeight: 1.42,
  },
  section: {
    border: "1px solid #d7e1d8",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "22px",
    marginTop: "20px",
  },
  sectionHeader: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sectionTitle: {
    margin: 0,
    color: "#1c3025",
    fontSize: "1.08rem",
    lineHeight: 1.35,
    letterSpacing: 0,
  },
  sectionText: {
    margin: "8px 0 0",
    color: "#53665b",
    fontSize: "0.89rem",
    lineHeight: 1.55,
  },
  scenarioGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
    gap: "14px",
    marginTop: "16px",
  },
  scenarioCard: {
    border: "1px solid #dce5dd",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "16px",
  },
  selectedScenarioCard: {
    borderColor: "#54745f",
    background: "#f2f8f3",
    boxShadow: "inset 0 0 0 1px #54745f",
  },
  cardTitle: {
    margin: 0,
    color: "#203629",
    fontSize: "0.98rem",
    lineHeight: 1.35,
  },
  cardMeta: {
    margin: "8px 0 0",
    color: "#5a6b62",
    fontSize: "0.76rem",
    fontWeight: 850,
    lineHeight: 1.45,
    textTransform: "uppercase",
  },
  timeline: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
    gap: "14px",
    marginTop: "16px",
  },
  timelineCard: {
    position: "relative",
    border: "1px solid #dce5dd",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "16px",
  },
  timelineNumber: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    border: "1px solid #355642",
    borderRadius: "999px",
    background: "#263f30",
    color: "#ffffff",
    fontSize: "0.8rem",
    fontWeight: 850,
  },
  timelineTitle: {
    margin: "12px 0 0",
    color: "#203629",
    fontSize: "0.98rem",
    lineHeight: 1.35,
  },
  link: {
    display: "inline-flex",
    marginTop: "10px",
    border: "1px solid #355642",
    borderRadius: "6px",
    background: "#263f30",
    color: "#ffffff",
    padding: "8px 10px",
    fontSize: "0.82rem",
    fontWeight: 850,
    textDecoration: "none",
  },
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
    gap: "18px",
    marginTop: "20px",
  },
  panel: {
    border: "1px solid #dce5dd",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "16px",
  },
  list: {
    margin: "12px 0 0",
    paddingLeft: "20px",
    color: "#2e4637",
    fontSize: "0.89rem",
    lineHeight: 1.55,
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

function scenarioCards(defaultModel: PilotDemoEndToEndModel): ScenarioCard[] {
  const selectedScenarioId = defaultModel.selectedScenarioId;
  const scenarios = [
    {
      label: "Medium-risk approval required",
      seed: DEMO_SCENARIO_SEED_FIXTURES.mediumRiskApprovalRequired,
      buyerSignal: "Shows the normal pilot path with a human checkpoint.",
    },
    {
      label: "Rejected approval",
      seed: DEMO_SCENARIO_SEED_FIXTURES.mediumRiskRejectedDecision,
      buyerSignal: "Shows that rejection is a governed outcome, not a failure.",
    },
    {
      label: "High-risk blocked",
      seed: DEMO_SCENARIO_SEED_FIXTURES.highRiskBlockedRejectedPath,
      buyerSignal: "Shows policy stopping a risky operation before it proceeds.",
    },
    {
      label: "Incomplete evidence",
      seed: DEMO_SCENARIO_SEED_FIXTURES.incompleteEvidencePath,
      buyerSignal: "Shows how missing audit evidence becomes visible.",
    },
  ] as const;

  return scenarios.map((item) => {
    const model = presentPilotDemoEndToEnd(item.seed);

    return {
      label: item.label,
      scenarioId: model.selectedScenarioId,
      summary: model.scenarioSummary,
      buyerSignal: item.buyerSignal,
      status: model.status,
      selected: model.selectedScenarioId === selectedScenarioId,
    };
  });
}

function routeForStep(
  card: PilotDemoStepCard,
  links: readonly PilotDemoRouteLink[],
): PilotDemoRouteLink | undefined {
  return links.find((link) => link.routePath === card.routePath);
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

function renderScenarioCards(cards: readonly ScenarioCard[]): ReactElement {
  return (
    <div style={styles.scenarioGrid}>
      {cards.map((card) => {
        const tone = toneForStatus(card.status);
        const selectedStyle = card.selected ? styles.selectedScenarioCard : {};

        return (
          <article
            key={card.scenarioId}
            aria-label={card.label}
            style={{ ...styles.scenarioCard, ...selectedStyle }}
          >
            <div style={styles.statusRow}>
              {renderBadge(card.selected ? "Selected demo path" : "Scenario option", "info")}
              {renderBadge(card.status, tone)}
            </div>
            <h3 style={styles.cardTitle}>{card.label}</h3>
            <p style={styles.sectionText}>{card.summary}</p>
            <p style={styles.cardMeta}>Buyer signal</p>
            <p style={styles.sectionText}>{card.buyerSignal}</p>
          </article>
        );
      })}
    </div>
  );
}

function renderTimeline(model: PilotDemoEndToEndModel): ReactElement {
  return (
    <div aria-label="Request Draft to Investigation timeline" style={styles.timeline}>
      {model.stepCards.map((card, index) => {
        const detail = timelineDetailsByStepKind[card.stepKind] ?? {
          label: card.title,
          myceliaAction: card.expectedOutcome,
          humanView: card.whatToSay,
          auditable: card.safeSummary,
        };
        const route = routeForStep(card, model.routeLinks);

        return (
          <article key={`${card.stepKind}-${index}`} style={styles.timelineCard}>
            <span style={styles.timelineNumber}>{index + 1}</span>
            <h3 style={styles.timelineTitle}>{detail.label}</h3>
            <div style={styles.statusRow}>
              {renderBadge(card.status, toneForStatus(card.status))}
            </div>
            <p style={styles.cardMeta}>What MYCELIA decides or prepares</p>
            <p style={styles.sectionText}>{detail.myceliaAction}</p>
            <p style={styles.cardMeta}>What the human sees</p>
            <p style={styles.sectionText}>{detail.humanView}</p>
            <p style={styles.cardMeta}>What is auditable</p>
            <p style={styles.sectionText}>{detail.auditable}</p>
            {route ? (
              <a href={route.routePath} style={styles.link}>
                Open {route.routePath}
              </a>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function renderPresenterMode(): ReactElement {
  return (
    <div style={styles.twoColumn}>
      {presenterModePanels.map((panel) => (
        <article key={panel.title} style={styles.panel}>
          <h3 style={styles.cardTitle}>{panel.title}</h3>
          {renderPlainList(panel.items)}
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
        const tone =
          item.severity === "BLOCKER"
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
  const cards = scenarioCards(model);

  return (
    <main aria-labelledby="pilot-demo-title" style={styles.page}>
      <section aria-label="Pilot demo hero" style={styles.hero}>
        <p style={styles.eyebrow}>MYCELIA pilot walkthrough</p>
        <h1 id="pilot-demo-title" style={styles.title}>
          Governed AI operations, from request to approval to investigation.
        </h1>
        <p style={styles.heroCopy}>
          See how MYCELIA controls an AI-assisted operational request before it
          can affect the business.
        </p>
        <div aria-label="Pilot demo status" style={styles.statusRow}>
          {renderBadge("Controlled pilot demo", "info")}
          {renderBadge("Read-only", "success")}
          {renderBadge("No live execution", "warning")}
          {renderBadge(model.status, toneForStatus(model.status))}
        </div>
        <div style={styles.heroOutcomeGrid}>
          <article style={styles.outcomeTile}>
            <p style={styles.outcomeLabel}>Default scenario</p>
            <p style={styles.outcomeText}>{model.selectedScenarioId}</p>
          </article>
          <article style={styles.outcomeTile}>
            <p style={styles.outcomeLabel}>Demo outcome</p>
            <p style={styles.outcomeText}>
              Request, policy, approval, audit and investigation are visible in
              one controlled path.
            </p>
          </article>
          <article style={styles.outcomeTile}>
            <p style={styles.outcomeLabel}>Boundary</p>
            <p style={styles.outcomeText}>
              Customer-safe simulation with no runtime mutation.
            </p>
          </article>
        </div>
      </section>

      <section aria-labelledby="demo-overview-heading" style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 id="demo-overview-heading" style={styles.sectionTitle}>
              Demo overview
            </h2>
            <p style={styles.sectionText}>{model.demoTitle}</p>
          </div>
          {renderBadge(model.demoReadiness.status, toneForStatus(model.status))}
        </div>
        <p style={styles.sectionText}>{model.scenarioSummary}</p>
        <p style={styles.sectionText}>Target audience: {model.targetAudience}</p>
      </section>

      <section aria-labelledby="scenario-selector-heading" style={styles.section}>
        <h2 id="scenario-selector-heading" style={styles.sectionTitle}>
          Scenario selector
        </h2>
        <p style={styles.sectionText}>
          Four pilot paths communicate how MYCELIA handles normal approval,
          rejection, high-risk blocking and incomplete evidence. This selector is
          static in Phase 3L; the default scenario is visually selected.
        </p>
        {renderScenarioCards(cards)}
      </section>

      <section aria-labelledby="end-to-end-path-heading" style={styles.section}>
        <h2 id="end-to-end-path-heading" style={styles.sectionTitle}>
          End-to-end path
        </h2>
        <p style={styles.sectionText}>
          Request Draft to Policy / Admission to Approval Decision to Audit
          Moment to Investigation.
        </p>
        {renderTimeline(model)}
      </section>

      <div style={styles.twoColumn}>
        <section
          aria-labelledby="client-understanding-heading"
          style={styles.section}
        >
          <h2 id="client-understanding-heading" style={styles.sectionTitle}>
            What the client should understand
          </h2>
          {renderPlainList(businessValueItems)}
        </section>

        <section aria-labelledby="demo-outcome-heading" style={styles.section}>
          <h2 id="demo-outcome-heading" style={styles.sectionTitle}>
            Demo outcome
          </h2>
          <p style={styles.sectionText}>
            The buyer sees that MYCELIA can turn a risky AI-assisted operation
            into a governed sequence of reviewable checkpoints.
          </p>
          <p style={styles.sectionText}>
            The pilot proves the shape of governance before production runtime
            activation exists.
          </p>
        </section>
      </div>

      <section aria-labelledby="governance-story-heading" style={styles.section}>
        <h2 id="governance-story-heading" style={styles.sectionTitle}>
          Governance story
        </h2>
        {renderPlainList(model.expectedGovernancePath)}
      </section>

      <section aria-labelledby="presenter-script-heading" style={styles.section}>
        <h2 id="presenter-script-heading" style={styles.sectionTitle}>
          Presenter mode
        </h2>
        <p style={styles.sectionText}>
          A concise client-meeting script keeps the walkthrough commercially
          useful without overstating live product readiness.
        </p>
        {renderPresenterMode()}
      </section>

      <div style={styles.twoColumn}>
        <section aria-labelledby="safety-boundary-heading" style={styles.section}>
          <h2 id="safety-boundary-heading" style={styles.sectionTitle}>
            Safety boundary
          </h2>
          {renderPlainList(model.safetyBoundary)}
        </section>

        <section aria-labelledby="demo-readiness-heading" style={styles.section}>
          <h2 id="demo-readiness-heading" style={styles.sectionTitle}>
            Demo readiness
          </h2>
          <p style={styles.sectionText}>
            Readiness status: {model.demoReadiness.status}
          </p>
          {model.demoReadiness.missingPieces.length > 0 ? (
            renderPlainList(model.demoReadiness.missingPieces)
          ) : (
            <p style={styles.sectionText}>No missing demo pieces were detected.</p>
          )}
          {renderReadiness(model)}
          {renderPlainList(model.nextActions)}
        </section>
      </div>
    </main>
  );
}

export default PilotDemoEndToEndSurface;
