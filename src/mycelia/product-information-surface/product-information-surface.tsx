import type { CSSProperties, ReactElement } from "react";

import {
  ProductSurfaceIndex,
  getProductSurfaceIndexModel,
  type ProductSurfaceIndexItem,
  type ProductSurfaceIndexRoute,
} from "../product-surface-index";

export const PRODUCT_INFORMATION_ROUTES = [
  "/",
  "/mycelia",
  "/mycelia/executive",
  "/mycelia/static-demo",
  "/mycelia/walkthrough",
  "/mycelia/roadmap",
] as const satisfies readonly ProductSurfaceIndexRoute[];

export const PRODUCT_INFORMATION_STATIC_DEMO_PROOFS = [
  "request framing",
  "policy and admission",
  "state transition",
  "audit trail",
  "investigation bundle",
  "replay plan",
  "readiness report",
  "static artifact rendering",
] as const;

export const PRODUCT_INFORMATION_NOT_IMPLEMENTED = [
  "runtime execution",
  "workflow execution",
  "persistence",
  "authentication",
  "API routes",
  "external integrations",
  "real replay simulation",
  "file export and generated artifacts",
] as const;

export type ProductInformationSection = {
  readonly title: string;
  readonly body?: string;
  readonly items: readonly string[];
};

export type ProductInformationSurfaceModel = {
  readonly title: "MYCELIA";
  readonly positioning: readonly string[];
  readonly routes: readonly (typeof PRODUCT_INFORMATION_ROUTES)[number][];
  readonly sections: readonly ProductInformationSection[];
  readonly product_surfaces: readonly ProductSurfaceIndexItem[];
  readonly static_demo_route: "/mycelia/static-demo";
  readonly static_demo_label: string;
  readonly safety_badges: readonly string[];
};

export function getProductInformationSurfaceModel():
  ProductInformationSurfaceModel {
  const productSurfaceIndex = getProductSurfaceIndexModel();

  return {
    title: "MYCELIA",
    positioning: [
      "governed operational intelligence",
      "governed agentic runtime",
      "descriptor-level execution governance",
    ],
    routes: PRODUCT_INFORMATION_ROUTES,
    product_surfaces: productSurfaceIndex.items,
    static_demo_route: "/mycelia/static-demo",
    static_demo_label: "Open the static demo",
    safety_badges: [
      "static",
      "read-only",
      "descriptor-level",
      "no runtime execution",
      "no persistence",
      "no API calls",
      "no external services",
      "no user input",
    ],
    sections: [
      {
        title: "What MYCELIA is",
        body:
          "MYCELIA governs operational execution before actions happen. It models the safe shape of governed work before runtime behavior exists.",
        items: [
          "Identity and tenant boundaries are explicit.",
          "Policy, admission, state, audit, investigation and replay descriptors are represented safely.",
          "The current product surface proves governed execution shape without executing runtime.",
        ],
      },
      {
        title: "What exists now",
        body:
          "The current product surface is a static information architecture over descriptor-level foundations.",
        items: [
          "Home surface at /",
          "Product hub at /mycelia",
          "Executive narrative at /mycelia/executive",
          "Static demo at /mycelia/static-demo",
          "Walkthrough at /mycelia/walkthrough",
          "Roadmap at /mycelia/roadmap",
          "Shared product shell",
          "Descriptor-level static demo preview",
        ],
      },
      {
        title: "What the static demo proves",
        body:
          "The demo shows how a governed operation can be described safely before any operational execution is enabled.",
        items: PRODUCT_INFORMATION_STATIC_DEMO_PROOFS,
      },
      {
        title: "Not implemented yet",
        body:
          "These capabilities remain intentionally absent from the current product surface.",
        items: PRODUCT_INFORMATION_NOT_IMPLEMENTED,
      },
      {
        title: "Safety boundary",
        body:
          "Current routes are static, read-only and descriptor-level. They are product previews only.",
        items: [
          "no runtime execution",
          "no persistence",
          "no API calls",
          "no external service calls",
          "no user input",
        ],
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
  callout: {
    borderLeft: "4px solid #5f846d",
    background: "#f6f9f6",
    padding: "20px",
  },
  calloutTitle: {
    margin: 0,
    color: "#1d3026",
    fontSize: "1.05rem",
    fontWeight: 750,
    lineHeight: 1.4,
  },
  calloutText: {
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
} satisfies Record<string, CSSProperties>;

function renderBadges(badges: readonly string[]): ReactElement[] {
  return badges.map((badge) => (
    <span key={badge} style={styles.badge}>
      {badge}
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
  section: ProductInformationSection,
  index: number,
): ReactElement {
  const panelStyle = index % 2 === 0 ? styles.panel : styles.panelMuted;

  return (
    <section key={section.title} style={panelStyle}>
      <h2 style={styles.panelTitle}>{section.title}</h2>
      {section.body === undefined ? null : (
        <p style={styles.bodyText}>{section.body}</p>
      )}
      <ul style={styles.list}>{renderItems(section.items)}</ul>
    </section>
  );
}

export function ProductInformationSurface(): ReactElement {
  const model = getProductInformationSurfaceModel();

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div>
              <p style={styles.eyebrow}>Product information hub</p>
              <h1 style={styles.title}>{model.title}</h1>
              <p style={styles.lead}>
                MYCELIA is a governed operational intelligence and governed
                agentic runtime platform. The current product hub organizes
                static descriptor-level surfaces for understanding governance
                before execution exists.
              </p>
              <div aria-label="Product hub safety badges" style={styles.badgeRow}>
                {renderBadges(model.safety_badges)}
              </div>
            </div>

            <aside aria-label="Static demo callout" style={styles.callout}>
              <h2 style={styles.calloutTitle}>Static demo available</h2>
              <p style={styles.calloutText}>
                The static demo explains how request framing, policy,
                admission, state, audit, investigation and replay descriptors
                fit together without executing runtime.
              </p>
              <a href={model.static_demo_route} style={styles.primaryLink}>
                {model.static_demo_label}
              </a>
            </aside>
          </div>
        </section>

        <ProductSurfaceIndex />

        <section style={styles.grid}>
          {model.sections.map((section, index) =>
            renderSection(section, index),
          )}
        </section>
      </div>
    </main>
  );
}

export default ProductInformationSurface;
