import type { CSSProperties, ReactElement } from "react";

import {
  loadStudioGraph,
  type StudioGraphResult,
} from "@/mycelia/runtime/studio/load-studio-graph";

export const dynamic = "force-dynamic";

const styles = {
  page: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "34px 0 48px",
  },
  banner: {
    border: "1px solid #a8c6b1",
    borderRadius: "8px",
    background: "#f1f8f2",
    color: "#21382a",
    padding: "14px 16px",
    fontSize: "0.92rem",
    fontWeight: 850,
  },
  section: {
    border: "1px solid #d7e1d8",
    borderRadius: "8px",
    background: "#ffffff",
    marginTop: "16px",
    padding: "24px",
  },
  eyebrow: {
    margin: 0,
    color: "#52685b",
    fontSize: "0.76rem",
    fontWeight: 850,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: "8px 0 0",
    color: "#17281f",
    fontSize: "clamp(1.55rem, 2.4vw, 2.35rem)",
    lineHeight: 1.15,
    letterSpacing: 0,
  },
  text: {
    margin: "10px 0 0",
    color: "#4e6156",
    fontSize: "0.94rem",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
    gap: "14px",
    marginTop: "18px",
  },
  card: {
    border: "1px solid #e0e8e1",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "14px",
  },
  label: {
    margin: 0,
    color: "#637468",
    fontSize: "0.72rem",
    fontWeight: 850,
    textTransform: "uppercase",
  },
  value: {
    margin: "6px 0 0",
    color: "#1d3327",
    fontSize: "0.92rem",
    fontWeight: 780,
    overflowWrap: "anywhere",
  },
} satisfies Record<string, CSSProperties>;

function renderDetail(label: string, value: string | number): ReactElement {
  return (
    <div style={styles.card}>
      <p style={styles.label}>{label}</p>
      <p style={styles.value}>{value}</p>
    </div>
  );
}

function renderEmptyState(): ReactElement {
  return (
    <section style={styles.section}>
      <p style={styles.eyebrow}>Studio</p>
      <h1 style={styles.title}>No workspace graph is available</h1>
      <p style={styles.text}>
        Seed or reset the local demo database to restore the persisted workspace
        and graph snapshot used by Studio.
      </p>
    </section>
  );
}

function renderReadyState(result: Extract<StudioGraphResult, { readonly status: "READY" }>): ReactElement {
  return (
    <>
      <section style={styles.section}>
        <p style={styles.eyebrow}>Studio</p>
        <h1 style={styles.title}>{result.workspace.name}</h1>
        <p style={styles.text}>
          Studio is a read-only view of the persisted workspace graph. Canvas
          editing and graph mutation belong to a later product phase.
        </p>
        <div style={styles.grid}>
          {renderDetail("Workspace", result.workspace.slug)}
          {renderDetail("Project", result.project.name)}
          {renderDetail("Template", result.project.template)}
          {renderDetail("Nodes", result.snapshot.nodes.length)}
          {renderDetail("Edges", result.snapshot.edges.length)}
        </div>
      </section>
      <section style={styles.section}>
        <p style={styles.eyebrow}>Nodes</p>
        <h2 style={styles.title}>Persisted graph nodes</h2>
        <div style={styles.grid}>
          {result.snapshot.nodes.map((node) =>
            renderDetail(node.kind, node.label),
          )}
        </div>
      </section>
      <section style={styles.section}>
        <p style={styles.eyebrow}>Edges</p>
        <h2 style={styles.title}>Persisted graph edges</h2>
        <div style={styles.grid}>
          {result.snapshot.edges.map((edge) => {
            const source = result.snapshot.nodes.find((node) => node.id === edge.sourceNodeId);
            const target = result.snapshot.nodes.find((node) => node.id === edge.targetNodeId);
            return renderDetail(
              edge.kind,
              `${source?.label ?? edge.sourceNodeId} -> ${target?.label ?? edge.targetNodeId}`,
            );
          })}
        </div>
      </section>
    </>
  );
}

export default async function MyceliaStudioPage() {
  const result = await loadStudioGraph();

  return (
    <main aria-labelledby="studio-title" style={styles.page}>
      <div id="studio-title" style={styles.banner}>
        Live local Studio -- persisted workspace graph, read-only
      </div>
      {result.status === "EMPTY" ? renderEmptyState() : renderReadyState(result)}
    </main>
  );
}
