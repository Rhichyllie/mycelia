import type { CSSProperties, ReactElement } from "react";

export const PRODUCT_SURFACE_INDEX_ROUTES = [
  "/",
  "/mycelia",
  "/mycelia/executive",
  "/mycelia/static-demo",
  "/mycelia/walkthrough",
  "/mycelia/investigation",
  "/mycelia/roadmap",
] as const;

export type ProductSurfaceIndexRoute =
  (typeof PRODUCT_SURFACE_INDEX_ROUTES)[number] | "/mycelia/request/new";

export type ProductSurfaceIndexStatus =
  | "Available now"
  | "Static preview"
  | "Live read-only"
  | "Controlled preview"
  | "Descriptor-level";

export type ProductSurfaceIndexItem = {
  readonly label: string;
  readonly route: ProductSurfaceIndexRoute;
  readonly description: string;
  readonly audience: readonly string[];
  readonly status: ProductSurfaceIndexStatus;
  readonly safety_note: string;
  readonly available_now: boolean;
};

export type ProductSurfaceIndexModel = {
  readonly title: "Product surfaces";
  readonly summary: string;
  readonly items: readonly ProductSurfaceIndexItem[];
};

export const PRODUCT_SURFACE_INDEX_ITEMS = [
  {
    label: "Home",
    route: "/",
    description:
      "A concise entry point for MYCELIA's current static product surfaces.",
    audience: ["general viewers", "first-time readers"],
    status: "Available now",
    safety_note: "Static, read-only and descriptor-level.",
    available_now: true,
  },
  {
    label: "MYCELIA Hub",
    route: "/mycelia",
    description:
      "The central product hub explaining the governed execution architecture.",
    audience: ["product evaluators", "technical stakeholders"],
    status: "Available now",
    safety_note: "Static overview with internal navigation only.",
    available_now: true,
  },
  {
    label: "Executive Narrative",
    route: "/mycelia/executive",
    description:
      "A plain-language narrative for leaders, mentors, prospects, partners and investors.",
    audience: ["executives", "partners", "investors"],
    status: "Available now",
    safety_note: "Executive-facing explanation without runtime activation.",
    available_now: true,
  },
  {
    label: "Static Demo",
    route: "/mycelia/static-demo",
    description:
      "A read-only product surface presenting the first static demo descriptor chain.",
    audience: ["prospects", "technical reviewers"],
    status: "Static preview",
    safety_note: "Descriptor rendering only with no operational execution.",
    available_now: true,
  },
  {
    label: "Walkthrough",
    route: "/mycelia/walkthrough",
    description:
      "A guided step-by-step explanation of the governed operation story.",
    audience: ["mentors", "reviewers", "product evaluators"],
    status: "Available now",
    safety_note: "Guided explanation only with no replay simulation.",
    available_now: true,
  },
  {
    label: "Request Draft",
    route: "/mycelia/request/new",
    description:
      "A controlled, non-mutating governed request seed preview for the demo path.",
    audience: ["operators", "reviewers", "technical reviewers"],
    status: "Controlled preview",
    safety_note: "Request seed preview only with no DB writes, API, auth or workflow builder.",
    available_now: true,
  },
  {
    label: "Investigation",
    route: "/mycelia/investigation",
    description:
      "A read-only investigation surface loaded through the controlled investigation selection boundary.",
    audience: ["operators", "investigators", "technical reviewers"],
    status: "Live read-only",
    safety_note: "Read-model loading only with no DB writes, API, auth or replay execution.",
    available_now: true,
  },
  {
    label: "Roadmap",
    route: "/mycelia/roadmap",
    description:
      "A static roadmap describing what exists now, what is planned and what remains inactive.",
    audience: ["planning stakeholders", "technical reviewers"],
    status: "Descriptor-level",
    safety_note: "Static planning surface with no activation of future capabilities.",
    available_now: true,
  },
] as const satisfies readonly ProductSurfaceIndexItem[];

export function getProductSurfaceIndexModel(): ProductSurfaceIndexModel {
  return {
    title: "Product surfaces",
    summary:
      "MYCELIA currently presents a static, read-only set of descriptor-level product surfaces. Each route helps explain the governed operational intelligence story without activating runtime behavior.",
    items: PRODUCT_SURFACE_INDEX_ITEMS,
  };
}

const styles = {
  section: {
    border: "1px solid #d5ded5",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "26px",
    marginTop: "24px",
  },
  title: {
    margin: 0,
    color: "#1e3126",
    fontSize: "1.18rem",
    lineHeight: 1.35,
    letterSpacing: 0,
  },
  summary: {
    margin: "10px 0 0",
    maxWidth: "820px",
    color: "#4b5b52",
    fontSize: "0.95rem",
    lineHeight: 1.58,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
    gap: "16px",
    marginTop: "20px",
  },
  card: {
    border: "1px solid #dbe3db",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "18px",
  },
  cardHeader: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    margin: 0,
    color: "#1d3026",
    fontSize: "1rem",
    lineHeight: 1.35,
  },
  status: {
    border: "1px solid #c2cec5",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#33483b",
    padding: "4px 8px",
    fontSize: "0.72rem",
    fontWeight: 750,
  },
  description: {
    margin: "12px 0 0",
    color: "#4d5f55",
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
  meta: {
    margin: "12px 0 0",
    color: "#2f4638",
    fontSize: "0.82rem",
    fontWeight: 700,
    lineHeight: 1.45,
  },
  safety: {
    margin: "8px 0 0",
    color: "#54655c",
    fontSize: "0.82rem",
    lineHeight: 1.45,
  },
  link: {
    display: "inline-flex",
    marginTop: "14px",
    border: "1px solid #355642",
    borderRadius: "6px",
    background: "#263f30",
    color: "#ffffff",
    padding: "9px 12px",
    fontSize: "0.86rem",
    fontWeight: 700,
    textDecoration: "none",
  },
} satisfies Record<string, CSSProperties>;

function renderSurfaceCards(
  items: readonly ProductSurfaceIndexItem[],
): ReactElement[] {
  return items.map((item) => (
    <article key={item.route} style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>{item.label}</h3>
        <span style={styles.status}>{item.status}</span>
      </div>
      <p style={styles.description}>{item.description}</p>
      <p style={styles.meta}>Audience: {item.audience.join(", ")}</p>
      <p style={styles.safety}>{item.safety_note}</p>
      <a href={item.route} style={styles.link}>
        {item.route}
      </a>
    </article>
  ));
}

export function ProductSurfaceIndex(): ReactElement {
  const model = getProductSurfaceIndexModel();

  return (
    <section aria-label="Product surfaces" style={styles.section}>
      <h2 style={styles.title}>{model.title}</h2>
      <p style={styles.summary}>{model.summary}</p>
      <div style={styles.grid}>{renderSurfaceCards(model.items)}</div>
    </section>
  );
}

export default ProductSurfaceIndex;
