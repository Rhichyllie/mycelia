import type { CSSProperties, ReactElement } from "react";

export const PRODUCT_ROADMAP_ROUTES = [
  "/",
  "/mycelia",
  "/mycelia/static-demo",
  "/mycelia/roadmap",
  "/mycelia/walkthrough",
  "/mycelia/executive",
] as const;

export const PRODUCT_ROADMAP_AVAILABLE_NOW = [
  "Home route /",
  "Product hub /mycelia",
  "Static demo route /mycelia/static-demo",
  "Walkthrough route /mycelia/walkthrough",
  "Executive narrative route /mycelia/executive",
  "Product shell navigation",
  "Static descriptor chain",
  "Human-readable preview",
  "Read-only static demo page",
] as const;

export const PRODUCT_ROADMAP_PLANNED_NEXT = [
  "stronger visual demo walkthrough",
  "static trace explorer",
  "static governance timeline",
  "static audit and replay explanation surface",
  "runtime activation planning",
  "build command activation planning",
  "eventual API boundary planning",
  "eventual persistence boundary planning",
  "eventual authentication boundary planning",
] as const;

export const PRODUCT_ROADMAP_NOT_ACTIVE_YET = [
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

export const PRODUCT_ROADMAP_SAFETY_BOUNDARY = [
  "current routes are static, read-only and descriptor-level",
  "no runtime execution",
  "no persistence",
  "no API calls",
  "no external service calls",
  "no user input",
  "no file export",
  "no PDF or download behavior",
] as const;

export type ProductRoadmapStatus =
  | "Available now"
  | "Static preview"
  | "Planned"
  | "Not active yet";

export type ProductRoadmapSection = {
  readonly title: string;
  readonly status: ProductRoadmapStatus;
  readonly body: string;
  readonly items: readonly string[];
};

export type ProductRoadmapSurfaceModel = {
  readonly title: "MYCELIA";
  readonly positioning: readonly string[];
  readonly routes: readonly (typeof PRODUCT_ROADMAP_ROUTES)[number][];
  readonly status_summary: readonly ProductRoadmapStatus[];
  readonly sections: readonly ProductRoadmapSection[];
  readonly navigation_callouts: readonly {
    readonly label: string;
    readonly href:
      | "/mycelia"
      | "/mycelia/static-demo"
      | "/mycelia/walkthrough"
      | "/mycelia/executive";
    readonly body: string;
  }[];
};

export function getProductRoadmapSurfaceModel():
  ProductRoadmapSurfaceModel {
  return {
    title: "MYCELIA",
    positioning: [
      "governed operational intelligence",
      "governed agentic runtime",
      "descriptor-level execution governance",
    ],
    routes: PRODUCT_ROADMAP_ROUTES,
    status_summary: [
      "Available now",
      "Static preview",
      "Planned",
      "Not active yet",
    ],
    sections: [
      {
        title: "Available now",
        status: "Available now",
        body:
          "The current MYCELIA product surface is a static, read-only set of descriptor-level routes.",
        items: PRODUCT_ROADMAP_AVAILABLE_NOW,
      },
      {
        title: "Planned next",
        status: "Planned",
        body:
          "The next roadmap items deepen the static product story before runtime activation.",
        items: PRODUCT_ROADMAP_PLANNED_NEXT,
      },
      {
        title: "Not active yet",
        status: "Not active yet",
        body:
          "These capabilities remain deliberately unavailable in the current product surface.",
        items: PRODUCT_ROADMAP_NOT_ACTIVE_YET,
      },
      {
        title: "Safety boundary",
        status: "Static preview",
        body:
          "The roadmap preserves the same static, read-only, descriptor-level boundary as the rest of the product surface.",
        items: PRODUCT_ROADMAP_SAFETY_BOUNDARY,
      },
    ],
    navigation_callouts: [
      {
        label: "Read the product hub",
        href: "/mycelia",
        body:
          "Use the product hub for the current information architecture and descriptor-level overview.",
      },
      {
        label: "Open the static demo",
        href: "/mycelia/static-demo",
        body:
          "Use the static demo for the read-only walkthrough of the descriptor chain.",
      },
      {
        label: "Follow the walkthrough",
        href: "/mycelia/walkthrough",
        body:
          "Use the walkthrough for a guided step-by-step explanation of the static demo story.",
      },
      {
        label: "Read the executive narrative",
        href: "/mycelia/executive",
        body:
          "Use the executive narrative for a plain-language product case.",
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
    padding: "32px",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.05fr) minmax(300px, 0.95fr)",
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
    fontSize: "2.65rem",
    lineHeight: 1.08,
    letterSpacing: 0,
  },
  lead: {
    maxWidth: "760px",
    margin: "16px 0 0",
    color: "#46584e",
    fontSize: "1.02rem",
    lineHeight: 1.62,
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },
  statusBadge: {
    border: "1px solid #c2cec5",
    borderRadius: "8px",
    background: "#f8faf7",
    color: "#2b4033",
    padding: "12px",
    fontSize: "0.86rem",
    fontWeight: 750,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))",
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
    fontSize: "1.08rem",
    lineHeight: 1.35,
    letterSpacing: 0,
  },
  statusLabel: {
    display: "inline-flex",
    marginTop: "12px",
    border: "1px solid #c7d2c9",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#33483b",
    padding: "5px 9px",
    fontSize: "0.75rem",
    fontWeight: 750,
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
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
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

function renderStatusSummary(
  statuses: readonly ProductRoadmapStatus[],
): ReactElement[] {
  return statuses.map((status) => (
    <span key={status} style={styles.statusBadge}>
      {status}
    </span>
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
  section: ProductRoadmapSection,
  index: number,
): ReactElement {
  const panelStyle = index % 2 === 0 ? styles.panel : styles.panelMuted;

  return (
    <section key={section.title} style={panelStyle}>
      <h2 style={styles.panelTitle}>{section.title}</h2>
      <span style={styles.statusLabel}>{section.status}</span>
      <p style={styles.bodyText}>{section.body}</p>
      <ul style={styles.list}>{renderItems(section.items)}</ul>
    </section>
  );
}

function renderCallouts(
  callouts: ProductRoadmapSurfaceModel["navigation_callouts"],
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

export function ProductRoadmapSurface(): ReactElement {
  const model = getProductRoadmapSurfaceModel();

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div>
              <p style={styles.eyebrow}>Static product roadmap</p>
              <h1 style={styles.title}>{model.title}</h1>
              <p style={styles.lead}>
                MYCELIA is being shaped as governed operational intelligence,
                a governed agentic runtime and descriptor-level execution
                governance. This roadmap explains what is static today and
                what is planned next.
              </p>
            </div>
            <div aria-label="Roadmap status summary" style={styles.statusGrid}>
              {renderStatusSummary(model.status_summary)}
            </div>
          </div>
        </section>

        <section style={styles.grid}>
          {model.sections.map((section, index) =>
            renderSection(section, index),
          )}
        </section>

        <section aria-label="Roadmap navigation" style={styles.calloutGrid}>
          {renderCallouts(model.navigation_callouts)}
        </section>
      </div>
    </main>
  );
}

export default ProductRoadmapSurface;
