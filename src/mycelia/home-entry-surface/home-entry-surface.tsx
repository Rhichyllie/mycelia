import type { CSSProperties, ReactElement } from "react";

export const HOME_ENTRY_SURFACE_ROUTE = "/mycelia/static-demo";

export const HOME_ENTRY_SURFACE_SAFETY_BADGES = [
  "static",
  "read-only",
  "descriptor-level",
  "no runtime execution",
  "no persistence",
  "no API calls",
  "no external services",
] as const;

export const HOME_ENTRY_SURFACE_NOT_YET_IMPLEMENTED = [
  "runtime execution",
  "workflow execution",
  "persistence",
  "authentication",
  "API routes",
  "external integrations",
] as const;

export type HomeEntrySurfaceModel = {
  readonly product_name: "MYCELIA";
  readonly headline: string;
  readonly positioning: readonly string[];
  readonly proof_points: readonly string[];
  readonly static_demo_route: typeof HOME_ENTRY_SURFACE_ROUTE;
  readonly static_demo_label: string;
  readonly safety_badges: readonly string[];
  readonly current_surface: {
    readonly title: string;
    readonly body: string;
  };
  readonly not_yet_implemented: readonly string[];
};

export function getHomeEntrySurfaceModel(): HomeEntrySurfaceModel {
  return {
    product_name: "MYCELIA",
    headline:
      "Governed operational intelligence for accountable agentic operations.",
    positioning: [
      "governed operational intelligence",
      "governed agentic runtime",
      "static descriptor-level demo currently available",
    ],
    proof_points: [
      "Requests can be governed before execution.",
      "Policy, admission, state, audit and replay descriptors can be represented safely.",
      "The current demo is static, read-only and descriptor-level only.",
    ],
    static_demo_route: HOME_ENTRY_SURFACE_ROUTE,
    static_demo_label: "Open the static demo preview",
    safety_badges: HOME_ENTRY_SURFACE_SAFETY_BADGES,
    current_surface: {
      title: "Current surface",
      body:
        "/mycelia/static-demo is the first MYCELIA product surface. It presents a validated static descriptor chain without runtime execution.",
    },
    not_yet_implemented: HOME_ENTRY_SURFACE_NOT_YET_IMPLEMENTED,
  };
}

const styles = {
  page: {
    minHeight: "100vh",
    margin: 0,
    background: "#f4f6f3",
    color: "#17231d",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
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
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, 0.9fr)",
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
  headline: {
    maxWidth: "760px",
    margin: "16px 0 0",
    color: "#46584e",
    fontSize: "1.06rem",
    lineHeight: 1.62,
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "24px",
  },
  badge: {
    border: "1px solid #b8c7bc",
    borderRadius: "999px",
    padding: "6px 10px",
    background: "#ffffff",
    color: "#24362c",
    fontSize: "0.78rem",
    fontWeight: 650,
  },
  routePanel: {
    borderLeft: "4px solid #5f846d",
    background: "#f6f9f6",
    padding: "20px",
  },
  routeTitle: {
    margin: 0,
    color: "#1d3026",
    fontSize: "1.05rem",
    fontWeight: 750,
    lineHeight: 1.4,
  },
  routeText: {
    margin: "10px 0 0",
    color: "#506158",
    fontSize: "0.92rem",
    lineHeight: 1.55,
  },
  primaryLink: {
    display: "inline-flex",
    marginTop: "18px",
    border: "1px solid #355642",
    borderRadius: "6px",
    background: "#263f30",
    color: "#ffffff",
    padding: "10px 13px",
    fontSize: "0.9rem",
    fontWeight: 700,
    textDecoration: "none",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
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
  notYetList: {
    display: "grid",
    gap: "8px",
    margin: "16px 0 0",
    paddingLeft: "18px",
    color: "#35483e",
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
} satisfies Record<string, CSSProperties>;

function renderBadges(badges: readonly string[]): ReactElement[] {
  return badges.map((badge) => (
    <span key={badge} style={styles.badge}>
      {badge}
    </span>
  ));
}

function renderListItems(items: readonly string[]): ReactElement[] {
  return items.map((item) => (
    <li key={item} style={styles.listItem}>
      {item}
    </li>
  ));
}

function renderNotYetImplemented(items: readonly string[]): ReactElement[] {
  return items.map((item) => <li key={item}>{item}</li>);
}

export function HomeEntrySurface(): ReactElement {
  const model = getHomeEntrySurfaceModel();

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div>
              <p style={styles.eyebrow}>Home entry surface</p>
              <h1 style={styles.title}>{model.product_name}</h1>
              <p style={styles.headline}>{model.headline}</p>
              <div aria-label="Home safety badges" style={styles.badgeRow}>
                {renderBadges(model.safety_badges)}
              </div>
            </div>

            <aside aria-label="Static demo route" style={styles.routePanel}>
              <h2 style={styles.routeTitle}>
                Static descriptor-level demo currently available
              </h2>
              <p style={styles.routeText}>
                The first product surface is a read-only route that explains
                the validated static descriptor chain.
              </p>
              <a href={model.static_demo_route} style={styles.primaryLink}>
                {model.static_demo_label}
              </a>
            </aside>
          </div>
        </section>

        <section style={styles.grid}>
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Positioning</h2>
            <p style={styles.bodyText}>
              MYCELIA is being shaped as governed operational intelligence
              and a governed agentic runtime.
            </p>
            <ul style={styles.list}>
              {renderListItems(model.positioning)}
            </ul>
          </div>

          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>What this proves</h2>
            <ul style={styles.list}>
              {renderListItems(model.proof_points)}
            </ul>
          </div>

          <div style={styles.panelMuted}>
            <h2 style={styles.panelTitle}>
              {model.current_surface.title}
            </h2>
            <p style={styles.bodyText}>{model.current_surface.body}</p>
          </div>

          <div style={styles.panelMuted}>
            <h2 style={styles.panelTitle}>Not yet implemented</h2>
            <ul style={styles.notYetList}>
              {renderNotYetImplemented(model.not_yet_implemented)}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

export default HomeEntrySurface;
