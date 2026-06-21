import type { CSSProperties, ReactElement } from "react";

import { MYCELIA_TOKENS } from "./design-tokens";

export type RiskLevel = string | null | undefined;

const baseRiskPillStyle = {
  borderRadius: MYCELIA_TOKENS.radius.full,
  display: "inline-flex",
  alignItems: "center",
  marginTop: MYCELIA_TOKENS.spacing[2],
  padding: `${MYCELIA_TOKENS.spacing[1]} ${MYCELIA_TOKENS.spacing[2]}`,
  fontSize: MYCELIA_TOKENS.type.badge,
  fontWeight: 850,
  textTransform: "uppercase",
} satisfies CSSProperties;

export function riskTone(riskLevel: RiskLevel): CSSProperties {
  if (riskLevel === "HIGH") {
    return {
      border: `1px solid ${MYCELIA_TOKENS.color.state.danger}`,
      background: MYCELIA_TOKENS.color.intent.dangerBg,
      color: MYCELIA_TOKENS.color.state.danger,
    };
  }

  if (riskLevel === "MEDIUM") {
    return {
      border: `1px solid ${MYCELIA_TOKENS.color.state.warning}`,
      background: MYCELIA_TOKENS.color.intent.warningBg,
      color: MYCELIA_TOKENS.color.state.warning,
    };
  }

  return {
    border: `1px solid ${MYCELIA_TOKENS.color.state.success}`,
    background: MYCELIA_TOKENS.color.intent.successBg,
    color: MYCELIA_TOKENS.color.state.success,
  };
}

export function riskLabel(riskLevel: RiskLevel): string {
  return riskLevel === undefined || riskLevel === null
    ? "not checked"
    : riskLevel.toLowerCase();
}

export function renderRiskPill(riskLevel: RiskLevel): ReactElement {
  return (
    <span style={{ ...baseRiskPillStyle, ...riskTone(riskLevel) }}>
      {riskLabel(riskLevel)}
    </span>
  );
}
