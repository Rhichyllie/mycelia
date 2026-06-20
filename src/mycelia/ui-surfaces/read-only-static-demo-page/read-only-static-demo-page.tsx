import type { CSSProperties, ReactElement } from "react";

import {
  buildHumanReadableFirstStaticDemoPreview,
  type HumanReadableStaticDemoPreview,
} from "../../demo/human-readable-static-demo-preview";

export const READ_ONLY_STATIC_DEMO_BADGES = [
  "Descriptor-level preview only",
  "Static route",
  "Read-only",
  "Non-executing",
  "No runtime execution",
  "No persistence",
  "No API calls",
  "No external services",
  "No export",
  "No replay simulation",
] as const;

export const READ_ONLY_STATIC_DEMO_LIMITATIONS = [
  "no runtime execution",
  "no replay simulation",
  "no persistence",
  "no UI rendering",
  "no file export",
  "no downloadable artifact",
  "no API calls",
  "no tools",
  "no external services",
] as const;

export type ReadOnlyStaticDemoPageStatus = "READY" | "FALLBACK";

export type ReadOnlyStaticDemoPageModel = {
  readonly status: ReadOnlyStaticDemoPageStatus;
  readonly page_title: "MYCELIA";
  readonly product_framing: string;
  readonly preview_warning: "Descriptor-level preview only";
  readonly route_status: "Static, read-only, non-executing";
  readonly preview_title: string;
  readonly preview_summary: string;
  readonly rendered_text: string;
  readonly section_titles: readonly string[];
  readonly section_count: number;
  readonly character_count: number;
  readonly data_classification: string;
  readonly generated_from_artifact_id?: string;
  readonly generated_from_readiness_report_id?: string;
  readonly badges: readonly string[];
  readonly limitations: readonly string[];
};

const FALLBACK_RENDERED_TEXT =
  "The read-only static demo preview is unavailable in this descriptor-level view.";

function modelFromPreview(
  preview: HumanReadableStaticDemoPreview,
): ReadOnlyStaticDemoPageModel {
  return {
    status: "READY",
    page_title: "MYCELIA",
    product_framing:
      "Governed operational intelligence and governed agentic runtime, presented here as a safe descriptor-level product preview.",
    preview_warning: "Descriptor-level preview only",
    route_status: "Static, read-only, non-executing",
    preview_title: preview.title,
    preview_summary: preview.summary,
    rendered_text: preview.rendered_text,
    section_titles: preview.section_titles,
    section_count: preview.section_count,
    character_count: preview.character_count,
    data_classification: preview.data_classification,
    generated_from_artifact_id: preview.generated_from_artifact_id,
    generated_from_readiness_report_id:
      preview.generated_from_readiness_report_id,
    badges: READ_ONLY_STATIC_DEMO_BADGES,
    limitations: preview.limitations,
  };
}

function fallbackModel(): ReadOnlyStaticDemoPageModel {
  return {
    status: "FALLBACK",
    page_title: "MYCELIA",
    product_framing:
      "Governed operational intelligence and governed agentic runtime, presented here as a safe descriptor-level product preview.",
    preview_warning: "Descriptor-level preview only",
    route_status: "Static, read-only, non-executing",
    preview_title: "Static demo preview unavailable",
    preview_summary:
      "A safe fallback state is shown because the static preview could not be validated.",
    rendered_text: FALLBACK_RENDERED_TEXT,
    section_titles: [],
    section_count: 0,
    character_count: FALLBACK_RENDERED_TEXT.length,
    data_classification: "PUBLIC",
    badges: READ_ONLY_STATIC_DEMO_BADGES,
    limitations: READ_ONLY_STATIC_DEMO_LIMITATIONS,
  };
}

export function getReadOnlyStaticDemoPageModel():
  ReadOnlyStaticDemoPageModel {
  const preview = buildHumanReadableFirstStaticDemoPreview();

  if (!preview.ok) {
    return fallbackModel();
  }

  return modelFromPreview(preview.value);
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
    padding: "40px 0 56px",
  },
  hero: {
    border: "1px solid #d5ded5",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "30px",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 360px)",
    gap: "26px",
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
  framing: {
    maxWidth: "760px",
    margin: "14px 0 0",
    color: "#47584f",
    fontSize: "1rem",
    lineHeight: 1.6,
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
  statusPanel: {
    borderLeft: "4px solid #5f846d",
    background: "#f6f9f6",
    padding: "18px",
  },
  statusLabel: {
    margin: "0 0 6px",
    color: "#52655b",
    fontSize: "0.76rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  statusValue: {
    margin: 0,
    color: "#1d3026",
    fontSize: "1rem",
    fontWeight: 700,
    lineHeight: 1.45,
  },
  statusText: {
    margin: "10px 0 0",
    color: "#506158",
    fontSize: "0.9rem",
    lineHeight: 1.55,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(300px, 0.75fr) minmax(0, 1.25fr)",
    gap: "24px",
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
    fontSize: "1.12rem",
    lineHeight: 1.3,
    letterSpacing: 0,
  },
  panelText: {
    margin: "10px 0 0",
    color: "#4b5b52",
    fontSize: "0.94rem",
    lineHeight: 1.58,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "18px",
    color: "#33453b",
    fontSize: "0.88rem",
  },
  metaItem: {
    border: "1px solid #d7ded6",
    borderRadius: "999px",
    background: "#f9fbf8",
    padding: "7px 10px",
    fontWeight: 650,
  },
  sectionList: {
    display: "grid",
    gap: "10px",
    margin: "16px 0 0",
    padding: 0,
    listStyle: "none",
  },
  sectionItem: {
    borderLeft: "3px solid #8ca894",
    padding: "9px 0 9px 12px",
    color: "#25352c",
    fontSize: "0.92rem",
    lineHeight: 1.45,
  },
  previewText: {
    margin: "18px 0 0",
    border: "1px solid #d1dad2",
    borderRadius: "8px",
    background: "#102019",
    color: "#eef8f0",
    padding: "18px",
    minHeight: "420px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "0.86rem",
    lineHeight: 1.6,
  },
  limitations: {
    display: "grid",
    gap: "8px",
    margin: "18px 0 0",
    paddingLeft: "18px",
    color: "#35483e",
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
  sectionHeading: {
    margin: "24px 0 0",
    color: "#1e3126",
    fontSize: "0.92rem",
    fontWeight: 750,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
} satisfies Record<string, CSSProperties>;

function renderBadges(badges: readonly string[]): ReactElement[] {
  return badges.map((badge) => (
    <span key={badge} style={styles.badge}>
      {badge}
    </span>
  ));
}

function renderSectionTitles(
  sectionTitles: readonly string[],
): ReactElement[] {
  return sectionTitles.map((title, index) => (
    <li key={title} style={styles.sectionItem}>
      {index + 1}. {title}
    </li>
  ));
}

function renderLimitations(limitations: readonly string[]): ReactElement[] {
  return limitations.map((limitation) => (
    <li key={limitation}>{limitation}</li>
  ));
}

export function ReadOnlyStaticDemoPage(): ReactElement {
  const model = getReadOnlyStaticDemoPageModel();

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.heroGrid}>
            <div>
              <p style={styles.eyebrow}>Read-only static demo</p>
              <h1 style={styles.title}>{model.page_title}</h1>
              <p style={styles.framing}>{model.product_framing}</p>
              <div
                aria-label="Preview safety badges"
                style={styles.badgeRow}
              >
                {renderBadges(model.badges)}
              </div>
            </div>

            <aside aria-label="Route status" style={styles.statusPanel}>
              <p style={styles.statusLabel}>Route status</p>
              <p style={styles.statusValue}>{model.route_status}</p>
              <p style={styles.statusText}>
                {model.preview_warning}. This surface renders validated
                descriptors only and does not perform operational work.
              </p>
            </aside>
          </div>
        </section>

        <section style={styles.grid}>
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>{model.preview_title}</h2>
            <p style={styles.panelText}>{model.preview_summary}</p>

            <div style={styles.meta}>
              <span style={styles.metaItem}>
                Classification: {model.data_classification}
              </span>
              <span style={styles.metaItem}>
                Sections: {model.section_count}
              </span>
              <span style={styles.metaItem}>
                Characters: {model.character_count}
              </span>
            </div>

            <h3 style={styles.sectionHeading}>Section overview</h3>
            <ol style={styles.sectionList}>
              {renderSectionTitles(model.section_titles)}
            </ol>
          </div>

          <div style={styles.panelMuted}>
            <h2 style={styles.panelTitle}>Limitations and non-goals</h2>
            <p style={styles.panelText}>
              The preview is intentionally constrained to static descriptor
              presentation.
            </p>
            <ul style={styles.limitations}>
              {renderLimitations(model.limitations)}
            </ul>
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Rendered plain-text preview</h2>
          <p style={styles.panelText}>
            This text is produced by the existing static demo renderer and is
            shown without metadata by default.
          </p>
          <pre style={styles.previewText}>{model.rendered_text}</pre>
        </section>
      </div>
    </main>
  );
}

export default ReadOnlyStaticDemoPage;
