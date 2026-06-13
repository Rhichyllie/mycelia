import type { CSSProperties, ReactElement } from "react";

import {
  buildHumanReadableFirstStaticDemoPreview,
  type HumanReadableStaticDemoPreview,
} from "../human-readable-static-demo-preview";

export const READ_ONLY_STATIC_DEMO_BADGES = [
  "Descriptor-level preview only",
  "No runtime execution",
  "No persistence",
  "No external service calls",
  "No export",
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
      "Governed operational intelligence for safe descriptor-level review.",
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
      "Governed operational intelligence for safe descriptor-level review.",
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
    background: "#f7f8f6",
    color: "#17201b",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  shell: {
    width: "min(1120px, calc(100% - 48px))",
    margin: "0 auto",
    padding: "48px 0",
  },
  eyebrow: {
    margin: "0 0 10px",
    color: "#476153",
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: "2.4rem",
    lineHeight: 1.08,
    letterSpacing: 0,
  },
  framing: {
    maxWidth: "680px",
    margin: "14px 0 0",
    color: "#4b5b52",
    fontSize: "1rem",
    lineHeight: 1.6,
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "22px",
  },
  badge: {
    border: "1px solid #b8c7bc",
    borderRadius: "999px",
    padding: "6px 10px",
    background: "#ffffff",
    color: "#26372e",
    fontSize: "0.78rem",
    fontWeight: 650,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
    gap: "24px",
    marginTop: "32px",
    alignItems: "start",
  },
  panel: {
    border: "1px solid #d7ddd7",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "22px",
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
    display: "grid",
    gap: "10px",
    marginTop: "18px",
    color: "#33453b",
    fontSize: "0.88rem",
  },
  sectionList: {
    display: "grid",
    gap: "8px",
    margin: "18px 0 0",
    padding: 0,
    listStyle: "none",
  },
  sectionItem: {
    border: "1px solid #e1e6df",
    borderRadius: "6px",
    padding: "10px 12px",
    background: "#fbfcfa",
    color: "#25352c",
    fontSize: "0.92rem",
  },
  previewText: {
    margin: "18px 0 0",
    border: "1px solid #d1dad2",
    borderRadius: "8px",
    background: "#102019",
    color: "#eef8f0",
    padding: "18px",
    minHeight: "360px",
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
        <p style={styles.eyebrow}>Read-only static demo</p>
        <h1 style={styles.title}>{model.page_title}</h1>
        <p style={styles.framing}>{model.product_framing}</p>
        <div aria-label="Preview safety badges" style={styles.badgeRow}>
          {renderBadges(model.badges)}
        </div>

        <section style={styles.grid}>
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>{model.preview_title}</h2>
            <p style={styles.panelText}>{model.preview_summary}</p>

            <div style={styles.meta}>
              <span>Classification: {model.data_classification}</span>
              <span>Sections: {model.section_count}</span>
              <span>Characters: {model.character_count}</span>
            </div>

            <h3 style={styles.panelTitle}>Sections</h3>
            <ol style={styles.sectionList}>
              {renderSectionTitles(model.section_titles)}
            </ol>

            <h3 style={styles.panelTitle}>Limitations</h3>
            <ul style={styles.limitations}>
              {renderLimitations(model.limitations)}
            </ul>
          </div>

          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Plain text preview</h2>
            <pre style={styles.previewText}>{model.rendered_text}</pre>
          </div>
        </section>
      </div>
    </main>
  );
}

export default ReadOnlyStaticDemoPage;
