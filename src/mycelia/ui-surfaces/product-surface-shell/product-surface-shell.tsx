import type { CSSProperties, ReactElement, ReactNode } from "react";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";

import { getAuthOptions } from "../../runtime/auth/options";
import { MYCELIA_TOKENS } from "../../runtime/ui/design-tokens";
import { ThemeToggleButton } from "../../runtime/ui/theme-toggle-button";
import { ProductSurfaceSignOutButton } from "./product-surface-sign-out-button";

export const PRODUCT_SURFACE_SHELL_NAV_ITEMS = [
  {
    label: "Control Center",
    href: "/mycelia",
  },
  {
    label: "Runs",
    href: "/mycelia/runs",
  },
  {
    label: "Approvals",
    href: "/mycelia/approvals",
  },
  {
    label: "Investigations",
    href: "/mycelia/investigations",
  },
  {
    label: "Studio",
    href: "/mycelia/studio",
  },
  {
    label: "About",
    href: "/mycelia/about",
  },
] as const;

export const PRODUCT_SURFACE_SHELL_SAFETY_BADGES = [
  "Local PostgreSQL",
  "Real persistence",
  "Governed runtime",
  "Local demo mode",
  "Local sign-in",
  "No cloud deployment",
] as const;

export type ProductSurfaceShellNavItem = {
  readonly label: string;
  readonly href:
    | "/mycelia"
    | "/mycelia/runs"
    | "/mycelia/approvals"
    | "/mycelia/investigations"
    | "/mycelia/studio"
    | "/mycelia/about";
};

export type ProductSurfaceShellModel = {
  readonly brand: "MYCELIA";
  readonly positioning: string;
  readonly nav_items: readonly ProductSurfaceShellNavItem[];
  readonly safety_badges: readonly string[];
  readonly footer_note: string;
};

export type ProductSurfaceSessionUser = {
  readonly name?: string | null;
  readonly email?: string | null;
};

export function getProductSurfaceShellModel(): ProductSurfaceShellModel {
  return {
    brand: "MYCELIA",
    positioning:
      "Governed operational intelligence and governed agentic runtime.",
    nav_items: PRODUCT_SURFACE_SHELL_NAV_ITEMS,
    safety_badges: PRODUCT_SURFACE_SHELL_SAFETY_BADGES,
    footer_note:
      "The governed-run demo lifecycle executes and persists locally in PostgreSQL. Local demo sign-in is active, and cloud deployment remains out of scope.",
  };
}

const styles = {
  shell: {
    minHeight: "100vh",
    background: MYCELIA_TOKENS.color.bg.canvas,
    color: MYCELIA_TOKENS.color.text.primary,
    fontFamily: MYCELIA_TOKENS.type.family,
  },
  header: {
    borderBottom: MYCELIA_TOKENS.border.subtle,
    background: MYCELIA_TOKENS.color.bg.surface,
  },
  headerInner: {
    width: MYCELIA_TOKENS.layout.pageWidth,
    margin: "0 auto",
    padding: `${MYCELIA_TOKENS.spacing[5]} 0`,
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) auto",
    gap: MYCELIA_TOKENS.spacing[5],
    alignItems: "center",
  },
  headerActions: {
    display: "grid",
    gap: MYCELIA_TOKENS.spacing[3],
    justifyItems: "end",
  },
  utilityRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: MYCELIA_TOKENS.spacing[2],
  },
  brand: {
    margin: 0,
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: "1.05rem",
    fontWeight: 800,
    letterSpacing: "0.05em",
  },
  positioning: {
    margin: "4px 0 0",
    color: MYCELIA_TOKENS.color.text.secondary,
    fontSize: "0.86rem",
    lineHeight: 1.45,
  },
  nav: {
    display: "flex",
    flexWrap: "wrap",
    gap: MYCELIA_TOKENS.spacing[2],
    justifyContent: "flex-end",
  },
  navLink: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.md,
    color: MYCELIA_TOKENS.color.text.secondary,
    background: MYCELIA_TOKENS.color.bg.panel,
    padding: "8px 10px",
    fontSize: "0.86rem",
    fontWeight: 700,
    textDecoration: "none",
  },
  session: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: MYCELIA_TOKENS.spacing[2],
    color: MYCELIA_TOKENS.color.text.secondary,
    fontSize: MYCELIA_TOKENS.type.bodySmall,
  },
  sessionName: {
    color: MYCELIA_TOKENS.color.text.primary,
    fontWeight: 800,
  },
  loginLink: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.md,
    background: MYCELIA_TOKENS.color.intent.accentBg,
    color: MYCELIA_TOKENS.color.text.primary,
    padding: "7px 9px",
    fontSize: MYCELIA_TOKENS.type.bodySmall,
    fontWeight: 800,
    textDecoration: "none",
  },
  safetyBar: {
    borderBottom: MYCELIA_TOKENS.border.subtle,
    background: MYCELIA_TOKENS.color.bg.sunken,
  },
  safetyInner: {
    width: MYCELIA_TOKENS.layout.pageWidth,
    margin: "0 auto",
    padding: "10px 0",
    display: "flex",
    flexWrap: "wrap",
    gap: MYCELIA_TOKENS.spacing[2],
  },
  badge: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.full,
    background: MYCELIA_TOKENS.color.intent.accentBg,
    color: MYCELIA_TOKENS.color.brand.sage,
    padding: "5px 9px",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  content: {
    minHeight: "calc(100vh - 180px)",
  },
  footer: {
    borderTop: MYCELIA_TOKENS.border.subtle,
    background: MYCELIA_TOKENS.color.bg.surface,
  },
  footerInner: {
    width: MYCELIA_TOKENS.layout.pageWidth,
    margin: "0 auto",
    padding: `${MYCELIA_TOKENS.spacing[5]} 0`,
    color: MYCELIA_TOKENS.color.text.secondary,
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

function sessionDisplayName(user: ProductSurfaceSessionUser): string {
  return user.name?.trim() || user.email?.trim() || "Authenticated user";
}

function sessionUserFromSession(
  session: Session | null,
): ProductSurfaceSessionUser | null {
  const name = session?.user?.name?.trim() ?? null;
  const email = session?.user?.email?.trim() ?? null;

  return name || email ? { name, email } : null;
}

export function ProductSurfaceSessionIndicator({
  user,
}: {
  readonly user: ProductSurfaceSessionUser | null;
}): ReactElement {
  if (user === null) {
    return (
      <div style={styles.session}>
        <a href="/login" style={styles.loginLink}>
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div aria-label="Signed-in user" style={styles.session}>
      <span>
        Signed in as{" "}
        <strong style={styles.sessionName}>{sessionDisplayName(user)}</strong>
      </span>
      <ProductSurfaceSignOutButton />
    </div>
  );
}

export async function ProductSurfaceShell({
  children,
}: {
  readonly children: ReactNode;
}): Promise<ReactElement> {
  const model = getProductSurfaceShellModel();
  const session = await getServerSession(getAuthOptions());
  const sessionUser = sessionUserFromSession(session);

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <p style={styles.brand}>{model.brand}</p>
            <p style={styles.positioning}>{model.positioning}</p>
          </div>
          <div style={styles.headerActions}>
            <nav aria-label="MYCELIA product surfaces" style={styles.nav}>
              {renderNavItems(model.nav_items)}
            </nav>
            <div style={styles.utilityRow}>
              <ThemeToggleButton />
              <ProductSurfaceSessionIndicator user={sessionUser} />
            </div>
          </div>
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
