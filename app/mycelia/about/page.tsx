import type { CSSProperties, ReactElement } from "react";

import { MYCELIA_TOKENS } from "@/mycelia/runtime/ui/design-tokens";

const styles = {
  page: {
    width: MYCELIA_TOKENS.layout.pageWidth,
    margin: "0 auto",
    padding: MYCELIA_TOKENS.layout.pagePadding,
  },
  section: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.surface,
    padding: MYCELIA_TOKENS.spacing[6],
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: MYCELIA_TOKENS.spacing[4],
    marginTop: MYCELIA_TOKENS.spacing[5],
  },
  card: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.panel,
    padding: MYCELIA_TOKENS.spacing[4],
  },
  eyebrow: {
    margin: 0,
    color: MYCELIA_TOKENS.color.brand.sage,
    fontSize: MYCELIA_TOKENS.type.label,
    fontWeight: 850,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: `${MYCELIA_TOKENS.spacing[2]} 0 0`,
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: MYCELIA_TOKENS.type.heading1,
    lineHeight: 1.15,
  },
  text: {
    margin: `${MYCELIA_TOKENS.spacing[2]} 0 0`,
    color: MYCELIA_TOKENS.color.text.secondary,
    fontSize: MYCELIA_TOKENS.type.body,
    lineHeight: 1.6,
  },
  link: {
    color: MYCELIA_TOKENS.color.brand.sage,
    fontWeight: 850,
    textDecoration: "none",
  },
} satisfies Record<string, CSSProperties>;

function renderCard(title: string, body: string, href: string): ReactElement {
  return (
    <article style={styles.card}>
      <p style={styles.eyebrow}>{title}</p>
      <p style={styles.text}>{body}</p>
      <p style={styles.text}>
        <a href={href} style={styles.link}>
          Open
        </a>
      </p>
    </article>
  );
}

export default function MyceliaAboutPage() {
  return (
    <main aria-labelledby="about-title" style={styles.page}>
      <section style={styles.section}>
        <p style={styles.eyebrow}>About</p>
        <h1 id="about-title" style={styles.title}>
          MYCELIA is governed operational intelligence
        </h1>
        <p style={styles.text}>
          The live product surfaces focus on runs, approvals, investigations and
          Studio. These reference pages keep the product story available without
          crowding the primary workspace.
        </p>
        <div style={styles.grid}>
          {renderCard(
            "Executive view",
            "Positioning and operating model for governed AI operations.",
            "/mycelia/executive",
          )}
          {renderCard(
            "Static demo",
            "Historical read-only preview retained as product background.",
            "/mycelia/static-demo",
          )}
          {renderCard(
            "Walkthrough",
            "Narrative walkthrough for the original controlled scenario.",
            "/mycelia/walkthrough",
          )}
          {renderCard(
            "Roadmap",
            "Product direction and staged capability boundaries.",
            "/mycelia/roadmap",
          )}
        </div>
      </section>
    </main>
  );
}
