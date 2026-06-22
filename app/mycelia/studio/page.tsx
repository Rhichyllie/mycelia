import type { CSSProperties, ReactElement } from "react";

import { requireAuthenticatedSession } from "@/mycelia/runtime/auth/session";

import {
  loadStudioGraph,
  type StudioGraphResult,
} from "@/mycelia/runtime/studio/load-studio-graph";
import { MYCELIA_TOKENS } from "@/mycelia/runtime/ui/design-tokens";

export const dynamic = "force-dynamic";

const styles = {
  page: {
    width: MYCELIA_TOKENS.layout.pageWidth,
    margin: "0 auto",
    padding: MYCELIA_TOKENS.layout.pagePadding,
  },
  banner: {
    border: `1px solid ${MYCELIA_TOKENS.color.tenant.boundary}`,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.intent.accentBg,
    color: MYCELIA_TOKENS.color.text.primary,
    padding: `${MYCELIA_TOKENS.spacing[3]} ${MYCELIA_TOKENS.spacing[4]}`,
    fontSize: "0.92rem",
    fontWeight: 850,
  },
  section: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.surface,
    marginTop: MYCELIA_TOKENS.spacing[4],
    padding: MYCELIA_TOKENS.spacing[6],
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
    letterSpacing: 0,
  },
  text: {
    margin: `${MYCELIA_TOKENS.spacing[2]} 0 0`,
    color: MYCELIA_TOKENS.color.text.secondary,
    fontSize: MYCELIA_TOKENS.type.body,
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
    gap: MYCELIA_TOKENS.spacing[4],
    marginTop: MYCELIA_TOKENS.spacing[5],
  },
  card: {
    border: MYCELIA_TOKENS.border.subtle,
    borderRadius: MYCELIA_TOKENS.radius.panel,
    background: MYCELIA_TOKENS.color.bg.panel,
    padding: MYCELIA_TOKENS.spacing[4],
  },
  label: {
    margin: 0,
    color: MYCELIA_TOKENS.color.text.tertiary,
    fontSize: MYCELIA_TOKENS.type.label,
    fontWeight: 850,
    textTransform: "uppercase",
  },
  value: {
    margin: `${MYCELIA_TOKENS.spacing[2]} 0 0`,
    color: MYCELIA_TOKENS.color.text.primary,
    fontSize: MYCELIA_TOKENS.type.data,
    fontWeight: 780,
    overflowWrap: "anywhere",
  },
} satisfies Record<string, CSSProperties>;

function renderDetail(
  label: string,
  value: string | number,
  key?: string,
): ReactElement {
  return (
    <div key={key} style={styles.card}>
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

function renderReadyState(
  result: Extract<StudioGraphResult, { readonly status: "READY" }>,
): ReactElement {
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
            renderDetail(node.kind, node.label, node.id),
          )}
        </div>
      </section>
      <section style={styles.section}>
        <p style={styles.eyebrow}>Edges</p>
        <h2 style={styles.title}>Persisted graph edges</h2>
        <div style={styles.grid}>
          {result.snapshot.edges.map((edge) => {
            const source = result.snapshot.nodes.find(
              (node) => node.id === edge.sourceNodeId,
            );
            const target = result.snapshot.nodes.find(
              (node) => node.id === edge.targetNodeId,
            );

            return renderDetail(
              edge.kind,
              `${source?.label ?? edge.sourceNodeId} -> ${
                target?.label ?? edge.targetNodeId
              }`,
              edge.id,
            );
          })}
        </div>
      </section>
    </>
  );
}

export default async function MyceliaStudioPage() {
  const { actor } = await requireAuthenticatedSession();
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
