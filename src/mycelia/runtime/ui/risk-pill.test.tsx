import { describe, expect, it } from "vitest";

import { MYCELIA_TOKENS } from "./design-tokens";
import { renderRiskPill, riskLabel, riskTone } from "./risk-pill";

describe("risk pill UI helper", () => {
  it("maps HIGH risk to the danger tone", () => {
    expect(riskTone("HIGH")).toMatchObject({
      border: `1px solid ${MYCELIA_TOKENS.color.state.danger}`,
      background: MYCELIA_TOKENS.color.intent.dangerBg,
      color: MYCELIA_TOKENS.color.state.danger,
    });
  });

  it("maps MEDIUM risk to the warning tone", () => {
    expect(riskTone("MEDIUM")).toMatchObject({
      border: `1px solid ${MYCELIA_TOKENS.color.state.warning}`,
      background: MYCELIA_TOKENS.color.intent.warningBg,
      color: MYCELIA_TOKENS.color.state.warning,
    });
  });

  it("uses a neutral success tone for unchecked or low risk", () => {
    expect(riskLabel(null)).toBe("not checked");
    expect(riskTone(null)).toMatchObject({
      border: `1px solid ${MYCELIA_TOKENS.color.state.success}`,
      background: MYCELIA_TOKENS.color.intent.successBg,
      color: MYCELIA_TOKENS.color.state.success,
    });
  });

  it("renders the visible pill label without changing callers", () => {
    const pill = renderRiskPill("HIGH");
    const props = pill.props as {
      readonly children: string;
      readonly style: { readonly color: string };
    };

    expect(props.children).toBe("high");
    expect(props.style).toMatchObject({
      color: MYCELIA_TOKENS.color.state.danger,
    });
  });
});
