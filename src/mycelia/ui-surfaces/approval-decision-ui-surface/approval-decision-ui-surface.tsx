import type { CSSProperties, ReactElement } from "react";

import {
  type ApprovalDecisionUiDisplayValue,
  type ApprovalDecisionUiPreview,
  type ApprovalDecisionUiTone,
  type ApprovalDecisionUiWarning,
} from "./approval-decision-ui-contract";
import { DEFAULT_APPROVAL_DECISION_UI_PREVIEW } from "./approval-decision-ui-fixtures";
import { presentApprovalDecisionUiPreview } from "./approval-decision-ui-presenter";

export type ApprovalDecisionUiSurfaceProps = {
  readonly preview?: ApprovalDecisionUiPreview | unknown;
};

const toneStyles = {
  neutral: {
    border: "#c9d4cb",
    background: "#ffffff",
    color: "#2b4033",
  },
  success: {
    border: "#9dc2a4",
    background: "#f0f8f1",
    color: "#1f5f32",
  },
  info: {
    border: "#a9bed5",
    background: "#f2f7fc",
    color: "#244866",
  },
  warning: {
    border: "#d4bf83",
    background: "#fff9e8",
    color: "#604812",
  },
  critical: {
    border: "#d49a9a",
    background: "#fff2f2",
    color: "#743131",
  },
} satisfies Record<ApprovalDecisionUiTone, {
  readonly border: string;
  readonly background: string;
  readonly color: string;
}>;

const styles = {
  page: {
    width: "min(1180px, calc(100% - 40px))",
    margin: "0 auto",
    padding: "34px 0 48px",
  },
  hero: {
    border: "1px solid #cbd8ce",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "28px",
  },
  eyebrow: {
    margin: 0,
    color: "#496257",
    fontSize: "0.78rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  title: {
    margin: "10px 0 0",
    color: "#15231c",
    fontSize: "clamp(1.55rem, 2.4vw, 2.35rem)",
    lineHeight: 1.15,
    letterSpacing: 0,
  },
  summary: {
    margin: "12px 0 0",
    maxWidth: "820px",
    color: "#46594f",
    fontSize: "0.98rem",
    lineHeight: 1.65,
  },
  statusRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "18px",
  },
  badge: {
    border: "1px solid #c1cec5",
    borderRadius: "999px",
    background: "#f9fbf8",
    color: "#263d30",
    padding: "6px 10px",
    fontSize: "0.78rem",
    fontWeight: 800,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))",
    gap: "18px",
    marginTop: "20px",
  },
  section: {
    border: "1px solid #d7e1d8",
    borderRadius: "8px",
    background: "#ffffff",
    padding: "20px",
  },
  wideSection: {
    gridColumn: "1 / -1",
  },
  sectionTitle: {
    margin: 0,
    color: "#1c3025",
    fontSize: "1.02rem",
    lineHeight: 1.35,
    letterSpacing: 0,
  },
  sectionText: {
    margin: "8px 0 0",
    color: "#53665b",
    fontSize: "0.88rem",
    lineHeight: 1.55,
  },
  dl: {
    display: "grid",
    gridTemplateColumns: "minmax(140px, 0.8fr) minmax(0, 1.2fr)",
    gap: "10px 14px",
    margin: "16px 0 0",
  },
  dt: {
    color: "#52645a",
    fontSize: "0.82rem",
    fontWeight: 800,
    lineHeight: 1.45,
  },
  dd: {
    margin: 0,
    color: "#1e3227",
    fontSize: "0.9rem",
    lineHeight: 1.45,
    overflowWrap: "anywhere",
  },
  muted: {
    color: "#7a857f",
  },
  list: {
    margin: "14px 0 0",
    paddingLeft: "20px",
    color: "#2e4637",
    fontSize: "0.9rem",
    lineHeight: 1.55,
  },
  warningList: {
    listStyle: "none",
    margin: "14px 0 0",
    padding: 0,
    display: "grid",
    gap: "10px",
  },
  warningItem: {
    borderRadius: "8px",
    padding: "12px",
  },
  code: {
    display: "block",
    fontSize: "0.76rem",
    fontWeight: 850,
    marginBottom: "4px",
  },
} satisfies Record<string, CSSProperties>;

function toneForStatus(status: string): ApprovalDecisionUiTone {
  if (status === "APPROVAL_DECISION_PREVIEW_READY") {
    return "success";
  }

  if (status === "APPROVAL_DECISION_PREVIEW_INCOMPLETE") {
    return "warning";
  }

  if (
    status === "APPROVAL_DECISION_PREVIEW_BLOCKED" ||
    status === "APPROVAL_DECISION_PREVIEW_FAILED_SAFE"
  ) {
    return "critical";
  }

  return "neutral";
}

function renderBadge(text: string, tone: ApprovalDecisionUiTone): ReactElement {
  const colors = toneStyles[tone];

  return (
    <span
      key={text}
      style={{
        ...styles.badge,
        borderColor: colors.border,
        background: colors.background,
        color: colors.color,
      }}
    >
      {text}
    </span>
  );
}

function renderDisplayList(
  values: readonly ApprovalDecisionUiDisplayValue[],
): ReactElement {
  return (
    <dl style={styles.dl}>
      {values.map((item) => (
        <div key={item.label}>
          <dt style={styles.dt}>{item.label}</dt>
          <dd
            style={{
              ...styles.dd,
              ...(item.state === "missing" ? styles.muted : {}),
            }}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function renderPlainList(items: readonly string[]): ReactElement {
  return (
    <ul style={styles.list}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function warningTone(
  warning: ApprovalDecisionUiWarning,
): ApprovalDecisionUiTone {
  if (warning.severity === "BLOCKER") {
    return "critical";
  }

  if (warning.severity === "WARNING") {
    return "warning";
  }

  return "info";
}

function renderWarnings(
  warnings: readonly ApprovalDecisionUiWarning[],
  emptyMessage: string | null,
): ReactElement {
  if (warnings.length === 0) {
    return <p style={styles.sectionText}>{emptyMessage}</p>;
  }

  return (
    <ul style={styles.warningList}>
      {warnings.map((warning) => {
        const colors = toneStyles[warningTone(warning)];

        return (
          <li
            key={`${warning.code}-${warning.safeSummary}`}
            style={{
              ...styles.warningItem,
              border: `1px solid ${colors.border}`,
              background: colors.background,
              color: colors.color,
            }}
          >
            <span style={styles.code}>{warning.code}</span>
            {warning.safeSummary}
          </li>
        );
      })}
    </ul>
  );
}

export function ApprovalDecisionUiSurface({
  preview = DEFAULT_APPROVAL_DECISION_UI_PREVIEW,
}: ApprovalDecisionUiSurfaceProps): ReactElement {
  const model = presentApprovalDecisionUiPreview(preview);
  const statusTone = toneForStatus(model.status);

  return (
    <main aria-labelledby="approval-decision-title" style={styles.page}>
      <section aria-label="Approval decision preview status" style={styles.hero}>
        <p style={styles.eyebrow}>Phase 3I controlled approval preview</p>
        <h1 id="approval-decision-title" style={styles.title}>
          Approval decision UI surface
        </h1>
        <p style={styles.summary}>{model.safeDecisionSummary}</p>
        <div aria-label="Approval decision boundary" style={styles.statusRow}>
          {renderBadge(model.status, statusTone)}
          {renderBadge("Read-only preview", "info")}
          {renderBadge("No approval action", "warning")}
          {renderBadge("No live DB write", "warning")}
        </div>
      </section>

      <div style={styles.grid}>
        <section aria-labelledby="approval-overview-heading" style={styles.section}>
          <h2 id="approval-overview-heading" style={styles.sectionTitle}>
            Approval overview
          </h2>
          <p style={styles.sectionText}>
            Safe approval request references only. These values are previews,
            not a submitted approval form.
          </p>
          {renderDisplayList(model.approvalOverview)}
        </section>

        <section
          aria-labelledby="governance-context-heading"
          style={styles.section}
        >
          <h2 id="governance-context-heading" style={styles.sectionTitle}>
            Governance context
          </h2>
          <p style={styles.sectionText}>
            Policy/admission context that explains why approval is expected.
          </p>
          {renderDisplayList(model.governanceContext)}
        </section>

        <section aria-labelledby="decision-preview-heading" style={styles.section}>
          <h2 id="decision-preview-heading" style={styles.sectionTitle}>
            Decision preview
          </h2>
          <p style={styles.sectionText}>
            Decision options are displayed for review only. No action is
            submitted in this phase.
          </p>
          {renderDisplayList(model.decisionPreview)}
        </section>

        <section
          aria-labelledby="runtime-effect-heading"
          style={styles.section}
        >
          <h2 id="runtime-effect-heading" style={styles.sectionTitle}>
            Expected runtime effect
          </h2>
          <p style={styles.sectionText}>
            Expected approval, lifecycle, audit and investigation consequences
            if a future live action boundary accepts this decision.
          </p>
          {renderDisplayList(model.expectedRuntimeEffect)}
        </section>

        <section
          aria-labelledby="safety-boundary-heading"
          style={{ ...styles.section, ...styles.wideSection }}
        >
          <h2 id="safety-boundary-heading" style={styles.sectionTitle}>
            Safety boundary
          </h2>
          {renderPlainList(model.safetyBoundary)}
        </section>

        <section aria-labelledby="warnings-heading" style={styles.section}>
          <h2 id="warnings-heading" style={styles.sectionTitle}>
            Warnings
          </h2>
          {renderWarnings(model.warnings, model.emptyWarningMessage)}
        </section>

        <section aria-labelledby="next-actions-heading" style={styles.section}>
          <h2 id="next-actions-heading" style={styles.sectionTitle}>
            Next actions
          </h2>
          {model.nextActions.length > 0
            ? renderPlainList(model.nextActions)
            : <p style={styles.sectionText}>{model.emptyNextActionMessage}</p>}
        </section>
      </div>
    </main>
  );
}

export default ApprovalDecisionUiSurface;
