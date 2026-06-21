import type { CSSProperties, ReactElement } from "react";

import {
  formatLiveOutcomeTitle,
  formatLiveReasonLabel,
  type LiveOutcome,
} from "./format-live-label";

const styles = {
  banner: {
    border: "1px solid #d9c48d",
    borderRadius: "8px",
    background: "#fff9e8",
    color: "#604812",
    marginTop: "14px",
    padding: "12px 14px",
  },
  title: {
    margin: 0,
    fontSize: "0.9rem",
    fontWeight: 850,
    lineHeight: 1.35,
  },
  text: {
    margin: "6px 0 0",
    fontSize: "0.86rem",
    fontWeight: 700,
    lineHeight: 1.45,
  },
  caption: {
    margin: "6px 0 0",
    fontSize: "0.78rem",
    fontWeight: 650,
    lineHeight: 1.4,
    opacity: 0.88,
  },
} satisfies Record<string, CSSProperties>;

export function LiveOutcomeBanner({
  outcome,
}: {
  readonly outcome: LiveOutcome | null;
}): ReactElement | null {
  if (outcome === null) {
    return null;
  }

  return (
    <div aria-live="polite" role="status" style={styles.banner}>
      <p style={styles.title}>{formatLiveOutcomeTitle(outcome.status)}</p>
      <p style={styles.text}>{formatLiveReasonLabel(outcome)}</p>
      <p style={styles.caption}>
        This notice clears on the next clean navigation to the page.
      </p>
    </div>
  );
}