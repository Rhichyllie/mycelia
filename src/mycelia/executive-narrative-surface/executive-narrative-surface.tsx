import type { CSSProperties, ReactElement } from "react";

import { PRODUCT_SURFACE_INDEX_ROUTES } from "../product-surface-index";

export const EXECUTIVE_NARRATIVE_ROUTES = PRODUCT_SURFACE_INDEX_ROUTES;

export const EXECUTIVE_NARRATIVE_WHY_IT_MATTERS = [
  "operational control",
  "audit readiness",
  "tenant safety",
  "explainability",
  "safer automation adoption",
  "lower risk before execution",
] as const;

export const EXECUTIVE_NARRATIVE_EXISTS_NOW = [
  "Home /",
  "MYCELIA hub /mycelia",
  "Static demo /mycelia/static-demo",
  "Walkthrough /mycelia/walkthrough",
  "Roadmap /mycelia/roadmap",
  "shared product shell",
  "static descriptor chain",
  "human-readable preview",
] as const;

export const EXECUTIVE_NARRATIVE_DEMO_PROOFS = [
  "request framing",
  "policy and admission",
  "state transition",
  "audit trail",
  "investigation grouping",
  "replay planning",
  "readiness report",
  "static artifact rendering",
  "customer-safe preview",
] as const;

export const EXECUTIVE_NARRATIVE_NOT_ACTIVE = [
  "runtime execution",
  "workflow execution",
  "real agent execution",
  "persistence",
  "authentication",
  "API routes",
  "external integrations",
  "real replay simulation",
  "file export",
  "PDF generation",
  "downloadable artifacts",
] as const;

export const EXECUTIVE_NARRATIVE_SAFETY_BOUNDARY = [
  "current routes are static, read-only and descriptor-level",
  "no runtime execution",
  "no persistence",
  "no API calls",
  "no external service calls",
  "no user input",
  "no file export",
  "no PDF or download behavior",
] as const;

export type ExecutiveNarrativeSection = {
  readonly title:
    | "Problem"
    | "Solution"
    | "Why it matters"
    | "What exists now"
    | "What the demo proves"
    | "Not active yet"
    | "Safety boundary";
  readonly body: string;
  readonly items: readonly string[];
};

export type ExecutiveNarrativeSurfaceModel = {
  readonly title: "MYCELIA";
  readonly tagline: "Govern operations before they execute.";
  readonly positioning: readonly string[];
  readonly routes: readonly (typeof EXECUTIVE_NARRATIVE_ROUTES)[number][];
  readonly audience: readonly string[];
  readonly sections: readonly ExecutiveNarrativeSection[];
  readonly navigation_callouts: readonly {
    readonly label: string;
    readonly href:
      | "/mycelia"
      | "/mycelia/static-demo"
      | "/mycelia/walkthrough"
      | "/mycelia/roadmap";
    readonly body: string;
  }[];
};

export function getExecutiveNarrativeSurfaceModel():
  ExecutiveNarrativeSurfaceModel {
  return {
    title: "MYCELIA",
    tagline: "Govern operations before they execute.",
    positioning: [
      "governed operational intelligence",
      "governed agentic runtime",
    ],
    routes: EXECUTIVE_NARRATIVE_ROUTES,
    audience: ["executives", "mentors", "prospects", "partners", "investors"],
    sections: [
      {
        title: "Problem",
        body:
          "Modern operations increasingly depend on automated decisions. Automation without governance creates risk when organizations cannot see, explain or control what happens before actions are taken.",
        items: [
          "automated decisions are becoming operationally important",
          "ungoverned automation can create uncontrolled risk",
          "teams need visibility, policy, auditability and controlled execution before actions happen",
        ],
      },
      {
        title: "Solution",
        body:
          "MYCELIA models the decision path before runtime activation. It describes requests, identities, tenant boundaries, policies, admission, states, audit records, investigations and replay plans.",
        items: [
          "request and identity descriptors",
          "tenant boundary descriptors",
          "policy and admission descriptors",
          "state and audit descriptors",
          "investigation and replay planning descriptors",
          "current surfaces demonstrate governed execution without activating runtime",
        ],
      },
      {
        title: "Why it matters",
        body:
          "Governance before execution gives leaders a safer path to automation adoption while preserving a clear operational record.",
        items: EXECUTIVE_NARRATIVE_WHY_IT_MATTERS,
      },
      {
        title: "What exists now",
        body:
          "The current product surface is a static, read-only product preview that demonstrates MYCELIA's descriptor-level architecture.",
        items: EXECUTIVE_NARRATIVE_EXISTS_NOW,
      },
      {
        title: "What the demo proves",
        body:
          "The static demo proves that a governed operation can be described from request intake through customer-safe preview without executing runtime behavior.",
        items: EXECUTIVE_NARRATIVE_DEMO_PROOFS,
      },
      {
        title: "Not active yet",
        body:
          "These capabilities remain intentionally inactive while MYCELIA keeps the product surface static and descriptor-level.",
        items: EXECUTIVE_NARRATIVE_NOT_ACTIVE,
      },
      {
        title: "Safety boundary",
        body:
          "The executive narrative preserves the same safety boundary as the rest of the MYCELIA product surface.",
        items: EXECUTIVE_NARRATIVE_SAFETY_BOUNDARY,
      },
    ],
    navigation_callouts: [
      {
        label: "Product hub",
        href: "/mycelia",
        body: "Start with the product information architecture.",
      },
      {
        label: "Static demo",
        href: "/mycelia/static-demo",
        body: "Review the read-only descriptor-level demo.",
      },
      {
        label: "Walkthrough",
        href: "/mycelia/walkthrough",
        body: "Follow the step-by-step governed operation story.",
      },
      {
        label: "Roadmap",
        href: "/mycelia/roadmap",
        body: "See what is available now and what remains inactive.",
      },
    ],
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f6f3",
    color: "#17231d",
  },
  shell: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "44px 0 56px",
  },
  hero: {
    border: "1px solid #d5ded5",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "34px",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.08fr) minmax(300px, 0.92fr)",
    gap: "30px",
    alignItems: "start",
  },
  eyebrow: {
    margin: "0 0 10px",
    color: "#4d6658",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: "2.75rem",
    lineHeight: 1.06,
    letterSpacing: 0,
  },
  tagline: {
    margin: "14px 0 0",
    color: "#23382c",
    fontSize: "1.25rem",
    fontWeight: 760,
    lineHeight: 1.35,
  },
  lead: {
    maxWidth: "760px",
    margin: "14px 0 0",
    color: "#46584e",
    fontSize: "1rem",
    lineHeight: 1.62,
  },
  badgeGrid: {
    display: "grid",
    gap: "10px",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  badge: {
    border: "1px solid #c2cec5",
    borderRadius: "8px",
    background: "#f8faf7",
    color: "#2b4033",
    padding: "12px",
    fontSize: "0.86rem",
    fontWeight: 750,
  },
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
    gap: "22px",
    marginTop: "24px",
    alignItems: "start",
  },
  panel: {
    border: "1px solid #d7ddd7",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "24px",
  },
  panelMuted: {
    border: "1px solid #d7ddd7",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "24px",
  },
  panelTitle: {
    margin: 0,
    color: "#1e3126",
    fontSize: "1.1rem",
    lineHeight: 1.35,
    letterSpacing: 0,
  },
  bodyText: {
    margin: "10px 0 0",
    color: "#4b5b52",
    fontSize: "0.94rem",
    lineHeight: 1.58,
  },
  list: {
    display: "grid",
    gap: "10px",
    margin: "16px 0 0",
    padding: 0,
    listStyle: "none",
  },
  listItem: {
    borderLeft: "3px solid #8ca894",
    padding: "8px 0 8px 12px",
    color: "#25352c",
    fontSize: "0.92rem",
    lineHeight: 1.45,
  },
  calloutGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: "18px",
    marginTop: "24px",
  },
  callout: {
    borderLeft: "4px solid #5f846d",
    background: "#f6f9f6",
    padding: "20px",
  },
  calloutTitle: {
    margin: 0,
    color: "#1d3026",
    fontSize: "1.02rem",
    fontWeight: 750,
    lineHeight: 1.4,
  },
  calloutText: {
    margin: "10px 0 0",
    color: "#506158",
    fontSize: "0.92rem",
    lineHeight: 1.55,
  },
  calloutLink: {
    display: "inline-flex",
    marginTop: "16px",
    border: "1px solid #355642",
    borderRadius: "6px",
    background: "#263f30",
    color: "#ffffff",
    padding: "10px 13px",
    fontSize: "0.9rem",
    fontWeight: 700,
    textDecoration: "none",
  },
} satisfies Record<string, CSSProperties>;

function renderBadges(items: readonly string[]): ReactElement[] {
  return items.map((item) => (
    <li key={item} style={styles.badge}>
      {item}
    </li>
  ));
}

function renderItems(items: readonly string[]): ReactElement[] {
  return items.map((item) => (
    <li key={item} style={styles.listItem}>
      {item}
    </li>
  ));
}

function renderSection(
  section: ExecutiveNarrativeSection,
  index: number,
): ReactElement {
  const panelStyle = index % 2 === 0 ? styles.panel : styles.panelMuted;

  return (
    <section key={section.title} style={panelStyle}>
      <h2 style={styles.panelTitle}>{section.title}</h2>
      <p style={styles.bodyText}>{section.body}</p>
      <ul style={styles.list}>{renderItems(section.items)}</ul>
    </section>
  );
}

function renderCallouts(
  callouts: ExecutiveNarrativeSurfaceModel["navigation_callouts"],
): ReactElement[] {
  return callouts.map((callout) => (
    <aside key={callout.href} style={styles.callout}>
      <h2 style={styles.calloutTitle}>{callout.label}</h2>
      <p style={styles.calloutText}>{callout.body}</p>
      <a href={callout.href} style={styles.calloutLink}>
        {callout.href}
      </a>
    </aside>
  ));
}

export function ExecutiveNarrativeSurface(): ReactElement {
  const model = getExecutiveNarrativeSurfaceModel();

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div>
              <p style={styles.eyebrow}>Executive narrative</p>
              <h1 style={styles.title}>{model.title}</h1>
              <p style={styles.tagline}>{model.tagline}</p>
              <p style={styles.lead}>
                MYCELIA is positioned as governed operational intelligence and
                a governed agentic runtime. This surface explains the product
                case in plain language for decision makers.
              </p>
            </div>
            <ul aria-label="Executive positioning" style={styles.badgeGrid}>
              {renderBadges([...model.positioning, ...model.audience])}
            </ul>
          </div>
        </section>

        <section style={styles.sectionGrid}>
          {model.sections.map((section, index) =>
            renderSection(section, index),
          )}
        </section>

        <section aria-label="Executive navigation" style={styles.calloutGrid}>
          {renderCallouts(model.navigation_callouts)}
        </section>
      </div>
    </main>
  );
}

export default ExecutiveNarrativeSurface;
