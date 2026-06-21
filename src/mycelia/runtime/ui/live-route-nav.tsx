import type { CSSProperties, ReactElement } from "react";

export type LiveRouteStage = "request" | "approval" | "investigation";

export const LIVE_ROUTE_NAV_ITEMS = [
  {
    stage: "request",
    label: "Request",
    href: "/mycelia/demo",
  },
  {
    stage: "approval",
    label: "Approval",
    href: "/mycelia/approval/decision",
  },
  {
    stage: "investigation",
    label: "Investigation",
    href: "/mycelia/investigation",
  },
] as const satisfies readonly {
  readonly stage: LiveRouteStage;
  readonly label: string;
  readonly href: string;
}[];

const styles = {
  nav: {
    border: "1px solid #d7e1d8",
    borderRadius: "8px",
    background: "#ffffff",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "14px",
    padding: "10px",
  },
  link: {
    border: "1px solid #c7d2c9",
    borderRadius: "6px",
    color: "#22342a",
    background: "#fbfcfa",
    padding: "8px 11px",
    fontSize: "0.84rem",
    fontWeight: 820,
    textDecoration: "none",
  },
  activeLink: {
    border: "1px solid #27603a",
    background: "#245b37",
    color: "#ffffff",
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