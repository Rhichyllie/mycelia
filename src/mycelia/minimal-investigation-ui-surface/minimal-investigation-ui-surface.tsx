import type { CSSProperties, ReactElement, ReactNode } from "react";

import {
  DEFAULT_MINIMAL_INVESTIGATION_UI_DESCRIPTOR,
} from "./minimal-investigation-ui-fixtures";
import {
  MinimalInvestigationUiRecordKinds,
  type MinimalInvestigationUiDescriptor,
  type MinimalInvestigationUiDisplayValue,
  type MinimalInvestigationUiFinding,
  type MinimalInvestigationUiPresentedModel,
  type MinimalInvestigationUiTimelineEntry,
  type MinimalInvestigationUiTone,
} from "./minimal-investigation-ui-contract";
import { presentMinimalInvestigationDescriptor } from "./minimal-investigation-ui-presenter";

const toneStyles = {
  neutral: {
    border: "#cbd5d1",
    background: "#ffffff",
    text: "#21342a",
  },
  success: {
    border: "#82b18d",
    background: "#edf8ef",
    text: "#1e4b2a",
  },
  info: {
    border: "#83a7c8",
    background: "#eef6fc",
    text: "#234b6b",
  },
  warning: {
    border: "#c9a24b",
    background: "#fff7df",
    text: "#684b12",
  },
  critical: {
    border: "#ca8178",
    background: "#fff0ee",
    text: "#7c2922",
  },
} satisfies Record<MinimalInvestigationUiTone, {
  readonly border: string;
  readonly background: string;
  readonly text: string;
}>;

const styles = {
  page: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "34px 0 44px",
  },
  hero: {
    border: "1px solid #cbd8d0",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "26px",
  },
  eyebrow: {
    margin: 0,
    color: "#52665c",
    fontSize: "0.78rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: "8px 0 0",
    color: "#17231d",
    fontSize: "2rem",
    lineHeight: 1.15,
    letterSpacing: 0,
  },
  summary: {
    margin: "12px 0 0",
    maxWidth: "860px",
    color: "#46594f",
    fontSize: "1rem",
    lineHeight: 1.6,
  },
  boundaryList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    listStyle: "none",
    margin: "18px 0 0",
    padding: 0,
  },
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: "16px",
    marginTop: "16px",
  },
  section: {
    border: "1px solid #d6dfd8",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "22px",
    marginTop: "18px",
  },
  sectionTitle: {
    margin: 0,
    color: "#1e3126",
    fontSize: "1.16rem",
    lineHeight: 1.3,
    letterSpacing: 0,
  },
  sectionDescription: {
    margin: "8px 0 0",
    color: "#53665c",
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
  dl: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
    gap: "12px",
    margin: "16px 0 0",
  },
  field: {
    border: "1px solid #dbe3dc",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "12px",
    minWidth: 0,
  },
  dt: {
    color: "#5a6d63",
    fontSize: "0.75rem",
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  dd: {
    margin: "6px 0 0",
    color: "#203329",
    fontSize: "0.92rem",
    lineHeight: 1.45,
    overflowWrap: "anywhere",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "0.74rem",
    fontWeight: 800,
    lineHeight: 1.2,
  },
  statusRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "16px",
  },
  timeline: {
    listStyle: "none",
    margin: "16px 0 0",
    padding: 0,
    display: "grid",
    gap: "10px",
  },
  timelineItem: {
    border: "1px solid #dbe3dc",
    borderRadius: "8px",
    background: "#fbfcfa",
    padding: "12px",
  },
  timelineHeader: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
  },
  timelineState: {
    margin: 0,
    color: "#1f3328",
    fontSize: "0.98rem",
    fontWeight: 800,
  },
  smallText: {
    margin: "6px 0 0",
    color: "#53665c",
    fontSize: "0.86rem",
    lineHeight: 1.45,
  },
  list: {
    margin: "14px 0 0",
    paddingLeft: "20px",
    color: "#263a2f",
    fontSize: "0.9rem",
    lineHeight: 1.55,
  },
  coverageTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "16px",
    fontSize: "0.9rem",
  },
  th: {
    borderBottom: "1px solid #cbd8d0",
    color: "#52665c",
    padding: "8px",
    textAlign: "left",
    fontSize: "0.76rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  td: {
    borderBottom: "1px solid #e3e9e4",
    color: "#22352a",
    padding: "9px 8px",
    verticalAlign: "top",
  },
  emptyState: {
    border: "1px solid #d7dfd9",
    borderRadius: "8px",
    background: "#f8faf7",
    color: "#4d6056",
    margin: "14px 0 0",
    padding: "12px",
    fontSize: "0.9rem",
    lineHeight: 1.5,
  },
} satisfies Record<string, CSSProperties>;

function toneForSeverity(severity: MinimalInvestigationUiFinding["severity"]): MinimalInvestigationUiTone {
  if (severity === "BLOCKER") {
    return "critical";
  }

  if (severity === "WARNING") {
    return "warning";
  }

  return "info";
}

function Badge({
  children,
  tone,
}: {
  readonly children: ReactNode;
  readonly tone: MinimalInvestigationUiTone;
}): ReactElement {
  const color = toneStyles[tone];

  return (
    <span
      style={{
        ...styles.badge,
        border: `1px solid ${color.border}`,
        background: color.background,
        color: color.text,
      }}
    >
      {children}
    </span>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}): ReactElement {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} id={id} style={styles.section}>
      <h2 id={headingId} style={styles.sectionTitle}>
        {title}
      </h2>
      <p style={styles.sectionDescription}>{description}</p>
      {children}
    </section>
  );
}

function FieldList({
  values,
}: {
  readonly values: readonly MinimalInvestigationUiDisplayValue[];
}): ReactElement {
  return (
    <dl style={styles.dl}>
      {values.map((item) => (
        <div key={item.label} style={styles.field}>
          <dt style={styles.dt}>{item.label}</dt>
          <dd style={styles.dd}>
            <span>{item.value}</span>{" "}
            {item.state !== "present" ? (
              <Badge tone={item.tone}>{item.state.replace("_", " ")}</Badge>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EmptyState({ children }: { readonly children: ReactNode }): ReactElement {
  return <p style={styles.emptyState}>{children}</p>;
}

function renderTimelineEntry(entry: MinimalInvestigationUiTimelineEntry): ReactElement {
  return (
    <li key={`${entry.sequence}-${entry.state}`} style={styles.timelineItem}>
      <div style={styles.timelineHeader}>
        <Badge tone="info">Sequence {entry.sequence}</Badge>
        <p style={styles.timelineState}>{entry.state ?? "State missing"}</p>
      </div>
      <p style={styles.smallText}>Reason: {entry.reasonCode ?? "Missing reason code"}</p>
      <p style={styles.smallText}>{entry.safeSummary ?? "No safe summary supplied."}</p>
    </li>
  );
}

function StateTimeline({
  model,
}: {
  readonly model: MinimalInvestigationUiPresentedModel;
}): ReactElement {
  return (
    <Section
      id="state-timeline"
      title="State timeline"
      description="Ordered persisted state snapshots with explicit warnings for missing or suspicious sequence data."
    >
      {model.stateTimeline.emptyMessage === null ? (
        <ol style={styles.timeline}>
          {model.stateTimeline.entries.map(renderTimelineEntry)}
        </ol>
      ) : (
        <EmptyState>{model.stateTimeline.emptyMessage}</EmptyState>
      )}
      {model.stateTimeline.warnings.length > 0 ? (
        <ul aria-label="State timeline warnings" style={styles.list}>
          {model.stateTimeline.warnings.map((warning) => (
            <li key={warning}>
              <Badge tone="warning">Warning</Badge> {warning}
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}

function AuditTrail({
  model,
}: {
  readonly model: MinimalInvestigationUiPresentedModel;
}): ReactElement {
  return (
    <Section
      id="audit-trail"
      title="Audit trail"
      description="Persisted audit moments expected for the current descriptor and any missing audit coverage."
    >
      <div style={styles.statusRow}>
        <Badge tone={model.auditTrail.coverageStatus.tone}>
          {model.auditTrail.coverageStatus.value}
        </Badge>
      </div>
      {model.auditTrail.emptyMessage === null ? (
        <ul aria-label="Audit moments present" style={styles.list}>
          {model.auditTrail.presentMoments.map((moment) => (
            <li key={moment}>{moment}</li>
          ))}
        </ul>
      ) : (
        <EmptyState>{model.auditTrail.emptyMessage}</EmptyState>
      )}
      <FieldList
        values={[
          {
            label: "Expected moments",
            value: model.auditTrail.expectedMoments.join(", ") || "None supplied",
            state: model.auditTrail.expectedMoments.length === 0 ? "missing" : "present",
            tone: model.auditTrail.expectedMoments.length === 0 ? "warning" : "neutral",
          },
          {
            label: "Missing moments",
            value: model.auditTrail.missingMoments.join(", ") || "None",
            state: "present",
            tone: model.auditTrail.missingMoments.length === 0 ? "success" : "warning",
          },
        ]}
      />
      {model.auditTrail.safeAuditSummaries.length > 0 ? (
        <ul aria-label="Safe audit summaries" style={styles.list}>
          {model.auditTrail.safeAuditSummaries.map((summary) => (
            <li key={summary}>Safe summary: {summary}</li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}

function PersistenceCoverage({
  model,
}: {
  readonly model: MinimalInvestigationUiPresentedModel;
}): ReactElement {
  return (
    <Section
      id="persistence-coverage"
      title="Persistence coverage"
      description="Six first-slice record kinds and whether each is represented by the read model descriptor."
    >
      <table style={styles.coverageTable}>
        <thead>
          <tr>
            <th scope="col" style={styles.th}>Record kind</th>
            <th scope="col" style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {model.persistenceCoverage.map((record) => (
            <tr key={record.recordKind}>
              <td style={styles.td}>{record.recordKind}</td>
              <td style={styles.td}>
                <Badge tone={record.status === "found" ? "success" : "warning"}>
                  {record.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.statusRow}>
        <Badge tone={model.tenantRunAgreement.tone}>
          {model.tenantRunAgreement.label}: {model.tenantRunAgreement.value}
        </Badge>
      </div>
    </Section>
  );
}

function Findings({
  model,
}: {
  readonly model: MinimalInvestigationUiPresentedModel;
}): ReactElement {
  const findings = [...model.findings, ...model.synthesizedFindings];

  return (
    <Section
      id="findings"
      title="Findings"
      description="Read-only INFO, WARNING and BLOCKER findings derived from safe persisted descriptors."
    >
      {findings.length === 0 ? (
        <EmptyState>No findings were supplied or synthesized for this descriptor.</EmptyState>
      ) : (
        <ul style={styles.list}>
          {findings.map((finding) => (
            <li key={`${finding.code}-${finding.section}`}>
              <Badge tone={toneForSeverity(finding.severity)}>
                {finding.severity}
              </Badge>{" "}
              <strong>{finding.code}</strong>: {finding.safeSummary}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function NextActions({
  model,
}: {
  readonly model: MinimalInvestigationUiPresentedModel;
}): ReactElement {
  return (
    <Section
      id="next-actions"
      title="Next actions"
      description="Operator or investigator next steps supplied by the safe read model descriptor."
    >
      {model.emptyNextActionMessage === null ? (
        <ol style={styles.list}>
          {model.nextActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ol>
      ) : (
        <EmptyState>{model.emptyNextActionMessage}</EmptyState>
      )}
    </Section>
  );
}

function BoundaryBanner({
  model,
  sourceSummary,
}: {
  readonly model: MinimalInvestigationUiPresentedModel;
  readonly sourceSummary: string;
}): ReactElement {
  return (
    <aside aria-label="Read-only pilot boundary" style={styles.hero}>
      <p style={styles.eyebrow}>Read-only pilot surface</p>
      <h1 style={styles.title}>Persisted investigation view</h1>
      <p style={styles.summary}>
        This page renders a safe investigation descriptor loaded through the
        persisted investigation read model. It is live read-only at the model
        boundary and does not provide mutation, API routes, auth, replay, tools
        or file artifact behavior.
      </p>
      <p style={styles.summary}>Source: {sourceSummary}</p>
      <ul style={styles.boundaryList}>
        {model.pilotBoundary.map((badge) => (
          <li key={badge}>
            <Badge tone="neutral">{badge}</Badge>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function MinimalInvestigationUiSurface({
  descriptor = DEFAULT_MINIMAL_INVESTIGATION_UI_DESCRIPTOR,
  sourceSummary = "Static fixture supplied directly to the renderer.",
}: {
  readonly descriptor?: MinimalInvestigationUiDescriptor;
  readonly sourceSummary?: string;
}): ReactElement {
  const model = presentMinimalInvestigationDescriptor(descriptor);

  return (
    <main aria-labelledby="investigation-surface-title" style={styles.page}>
      <BoundaryBanner model={model} sourceSummary={sourceSummary} />

      <section
        aria-labelledby="investigation-surface-title"
        style={styles.section}
      >
        <p style={styles.eyebrow}>Phase {model.phase}</p>
        <h2 id="investigation-surface-title" style={styles.sectionTitle}>
          {model.name}
        </h2>
        <p style={styles.sectionDescription}>
          Accessible rendering of the persisted investigation read model. Safe
          summaries are shown as summaries, missing data is explicit, and no
          mutable action is presented.
        </p>
        <div style={styles.statusRow}>
          <Badge tone={model.verdict.tone}>{model.verdict.value}</Badge>
          <Badge tone={model.completeness.tone}>
            {model.completeness.value}
          </Badge>
          <Badge tone="info">{model.status}</Badge>
        </div>
      </section>

      <div style={styles.sectionGrid}>
        <Section
          id="overview"
          title="Overview"
          description="Root run identity, scope, status and safe summary."
        >
          <FieldList values={model.overview} />
        </Section>

        <Section
          id="policy-admission"
          title="Policy and admission"
          description="Risk, policy outcome, admission outcome and reason descriptors."
        >
          <FieldList values={model.policyAdmission} />
        </Section>
      </div>

      <StateTimeline model={model} />

      <Section
        id="approval"
        title="Approval"
        description="Approval requirement, decision status and lifecycle coherence."
      >
        <FieldList values={model.approval} />
      </Section>

      <AuditTrail model={model} />
      <PersistenceCoverage model={model} />
      <Findings model={model} />
      <NextActions model={model} />

      <section aria-label="Static descriptor record kinds" style={styles.section}>
        <h2 style={styles.sectionTitle}>Record contract</h2>
        <p style={styles.sectionDescription}>
          The surface is constrained to the six first-slice persisted record
          kinds and does not claim broader case management.
        </p>
        <ul style={styles.list}>
          {MinimalInvestigationUiRecordKinds.map((recordKind) => (
            <li key={recordKind}>{recordKind}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default MinimalInvestigationUiSurface;
