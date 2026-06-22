import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ThemeToggleButton } from "./theme-toggle-button";

describe("ThemeToggleButton", () => {
  it("renders the current theme and a toggle affordance", () => {
    const html = renderToStaticMarkup(
      createElement(ThemeToggleButton, { initialTheme: "light" }),
    );

    expect(html).toContain("Theme: Light");
    expect(html).toContain("Switch to dark theme");
    expect(html).toContain("var(--mycelia-color-bg-panel)");
    expect(html).toContain("var(--mycelia-border-subtle)");
  });
});
