import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { LIVE_ROUTE_NAV_ITEMS, LiveRouteNav } from "./live-route-nav";

function collectAnchors(node: ReactNode): { href?: string; text: string; current?: unknown }[] {
  if (!isValidElement(node)) {
    return [];
  }

  const element = node as ReactElement<{
    readonly children?: ReactNode;
    readonly href?: string;
    readonly "aria-current"?: unknown;
  }>;
  const children = Array.isArray(element.props.children)
    ? element.props.children
    : [element.props.children];
  const nested = children.flatMap(collectAnchors);

  if (element.type === "a") {
    return [
      {
        href: element.props.href,
        text: children.filter((child): child is string => typeof child === "string").join(""),
        current: element.props["aria-current"],
      },
      ...nested,
    ];
  }

  return nested;
}

describe("live route nav", () => {
  it("defines the three governed demo stages", () => {
    expect(LIVE_ROUTE_NAV_ITEMS.map((item) => item.href)).toEqual([
      "/mycelia/runs",
      "/mycelia/approvals",
      "/mycelia/investigations",
    ]);
  });

  it("marks the current stage", () => {
    const anchors = collectAnchors(LiveRouteNav({ currentStage: "approval" }));

    expect(anchors.map((anchor) => anchor.text)).toEqual([
      "Run",
      "Approval",
      "Investigation",
    ]);
    expect(anchors.find((anchor) => anchor.text === "Approval")?.current).toBe("page");
    expect(anchors.find((anchor) => anchor.text === "Run")?.current).toBeUndefined();
  });
});
