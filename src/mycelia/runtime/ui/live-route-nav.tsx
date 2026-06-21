import type { CSSProperties, ReactElement } from "react";

import { MYCELIA_TOKENS } from "./design-tokens";

export type LiveRouteStage = "request" | "approval" | "investigation";

export const LIVE_ROUTE_NAV_ITEMS = [
  {
    stage: "request",
    label: "Run",
    href: "/mycelia/runs",
  },
  {
    stage: "approval",
    label: "Approval",
    href: "/mycelia/approvals",
  },
  {
    stage: "investigation",
    label: "Investigation",
    href: "/mycelia/investigations",
  },
] as const satisfies readonly {
  readonly stage: LiveRouteStage;
  readonly label: string;
  readonly href: string;
}[];

const styles = {
  nav: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.surface,
    display: "flex",
    flexWrap: "wrap",
    gap: MYCELIA_TOKENS.spacing[2],
    marginTop: MYCELIA_TOKENS.spacing[4],
    padding: MYCELIA_TOKENS.spacing[3],
  },
  link: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.md,
    color: MYCELIA_TOKENS.color.text.secondary,
    background: MYCELIA_TOKENS.color.bg.panel,
    padding: "8px 11px",
    fontSize: "0.84rem",
    fontWeight: 820,
    textDecoration: "none",
  },
  activeLink: {
    border: MYCELIA_TOKENS.border.strong,
    background: MYCELIA_TOKENS.color.intent.accentBg,
    color: MYCELIA_TOKENS.color.brand.sage,
  },
} satisfies Record<string, CSSProperties>;

export function LiveRouteNav({
  currentStage,
}: {
  readonly currentStage: LiveRouteStage;
}): ReactElement {
  return (
    <nav aria-label="Governed demo flow" style={styles.nav}>
      {LIVE_ROUTE_NAV_ITEMS.map((item) => {
        const isActive = item.stage === currentStage;

        return (
          <a
            aria-current={isActive ? "page" : undefined}
            href={item.href}
            key={item.stage}
            style={isActive ? { ...styles.link, ...styles.activeLink } : styles.link}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
