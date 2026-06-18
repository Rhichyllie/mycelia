import type { CSSProperties, ReactElement, ReactNode } from "react";

import { PRODUCT_SURFACE_INDEX_ITEMS } from "../product-surface-index";

export const PRODUCT_SURFACE_SHELL_NAV_ITEMS = [
  {
    label: "Home",
    href: PRODUCT_SURFACE_INDEX_ITEMS[0].route,
  },
  {
    label: "MYCELIA",
    href: PRODUCT_SURFACE_INDEX_ITEMS[1].route,
  },
  {
    label: "Executive",
    href: PRODUCT_SURFACE_INDEX_ITEMS[2].route,
  },
  {
    label: "Static Demo",
    href: PRODUCT_SURFACE_INDEX_ITEMS[3].route,
  },
  {
    label: "Walkthrough",
    href: PRODUCT_SURFACE_INDEX_ITEMS[4].route,
  },
  {
    label: "Request Draft",
    href: PRODUCT_SURFACE_INDEX_ITEMS[5].route,
  },
  {
    label: "Investigation",
    href: PRODUCT_SURFACE_INDEX_ITEMS[6].route,
  },
  {
    label: "Roadmap",
    href: PRODUCT_SURFACE_INDEX_ITEMS[7].route,
  },
] as const;

export const PRODUCT_SURFACE_SHELL_SAFETY_BADGES = [
  "Static",
  "Read-only",
  "Descriptor-level",
  "No runtime execution",
  "No DB writes",
  "No API calls",
  "No external services",
] as const;

export type ProductSurfaceShellNavItem = {
  readonly label: string;
  readonly href:
    | "/"
    | "/mycelia"
    | "/mycelia/static-demo"
    | "/mycelia/roadmap"
    | "/mycelia/walkthrough"
    | "/mycelia/request/new"
    | "/mycelia/investigation"
    | "/mycelia/executive";
};

export type ProductSurfaceShellModel = {
  readonly brand: "MYCELIA";
  readonly positioning: string;
  readonly nav_items: readonly ProductSurfaceShellNavItem[];
  readonly safety_badges: readonly string[];
  readonly footer_note: string;
};

export function getProductSurfaceShellModel(): ProductSurfaceShellModel {
  return {
    brand: "MYCELIA",
    positioning:
      "Governed operational intelligence and governed agentic runtime.",
    nav_items: PRODUCT_SURFACE_SHELL_NAV_ITEMS,
    safety_badges: PRODUCT_SURFACE_SHELL_SAFETY_BADGES,
    footer_note:
      "Current surfaces are product previews only. They do not execute runtime or mutate persisted data.",
  };
}

const styles = {
  shell: {
    minHeight: "100vh",
    background: "#f4f6f3",
    color: "#17231d",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  header: {
    borderBottom: "1px solid #d5ded5",
    background: "#ffffff",
  },
  headerInner: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "18px 0",
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) auto",
    gap: "20px",
    alignItems: "center",
  },
  brand: {
    margin: 0,
    color: "#17231d",
    fontSize: "1.05rem",
    fontWeight: 800,
    letterSpacing: "0.05em",
  },
  positioning: {
    margin: "4px 0 0",
    color: "#53665c",
    fontSize: "0.86rem",
    lineHeight: 1.45,
  },
  nav: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "flex-end",
  },
  navLink: {
    border: "1px solid #c7d2c9",
    borderRadius: "6px",
    color: "#22342a",
    background: "#fbfcfa",
    padding: "8px 10px",
    fontSize: "0.86rem",
    fontWeight: 700,
    textDecoration: "none",
  },
  safetyBar: {
    borderBottom: "1px solid #dbe3db",
    background: "#f8faf7",
  },
  safetyInner: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "10px 0",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  badge: {
    border: "1px solid #c2cec5",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#2b4033",
    padding: "5px 9px",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  content: {
    minHeight: "calc(100vh - 180px)",
  },
  footer: {
    borderTop: "1px solid #d5ded5",
    background: "#ffffff",
  },
  footerInner: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "18px 0",
    color: "#53665c",
    fontSize: "0.84rem",
    lineHeight: 1.5,
  },
} satisfies Record<string, CSSProperties>;

function renderNavItems(
  navItems: readonly ProductSurfaceShellNavItem[],
): ReactElement[] {
  return navItems.map((item) => (
    <a key={item.href} href={item.href} style={styles.navLink}>
      {item.label}
    </a>
  ));
}

function renderSafetyBadges(badges: readonly string[]): ReactElement[] {
  return badges.map((badge) => (
    <span key={badge} style={styles.badge}>
      {badge}
    </span>
  ));
}

export function ProductSurfaceShell({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const model = getProductSurfaceShellModel();

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <p style={styles.brand}>{model.brand}</p>
            <p style={styles.positioning}>{model.positioning}</p>
          </div>
          <nav aria-label="MYCELIA product surfaces" style={styles.nav}>
            {renderNavItems(model.nav_items)}
          </nav>
        </div>
      </header>

      <div aria-label="Product safety status" style={styles.safetyBar}>
        <div style={styles.safetyInner}>
          {renderSafetyBadges(model.safety_badges)}
        </div>
      </div>

      <div style={styles.content}>{children}</div>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>{model.footer_note}</div>
      </footer>
    </div>
  );
}

export default ProductSurfaceShell;
