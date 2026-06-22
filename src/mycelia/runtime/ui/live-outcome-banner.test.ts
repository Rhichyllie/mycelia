import { isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { LiveOutcomeBanner } from "./live-outcome-banner";

function collectText(node: ReactNode): string[] {
  if (typeof node === "string" || typeof node === "number") {
    return [String(node)];
  }

  if (Array.isArray(node)) {
    return node.flatMap(collectText);
  }

  if (isValidElement(node)) {
    const element = node as ReactElement<{ readonly children?: ReactNode }>;
    return collectText(element.props.children);
  }

  return [];
}

describe("live outcome banner", () => {
  it("renders nothing when there is no outcome", () => {
    expect(LiveOutcomeBanner({ outcome: null })).toBeNull();
  });

  it("renders human-readable failure copy without raw reason codes", () => {
    const element = LiveOutcomeBanner({
      outcome: {
        status: "FAILED_SAFE",
        reasonCode: "NO_WAITING_APPROVAL_RUN",
      },
    });

    expect(isValidElement(element)).toBe(true);

    const text = collectText(element).join(" ");
    expect(text).toContain("The demo action stopped safely before completing.");
    expect(text).toContain("Create a governed request before asking the approval page");
    expect(text).not.toContain("NO_WAITING_APPROVAL_RUN");
  });

  it("renders human-readable run creation reasoning", () => {
    const element = LiveOutcomeBanner({
      outcome: {
        status: "RUN_CREATED",
        reasonCode: "POLICY_ADMITTED_LOW_RISK",
      },
    });

    expect(isValidElement(element)).toBe(true);

    const text = collectText(element).join(" ");
    expect(text).toContain("The governed request was created.");
    expect(text).toContain(
      "The policy check cleared the low-risk request without approval.",
    );
    expect(text).not.toContain("POLICY_ADMITTED_LOW_RISK");
  });

  it("renders human-readable approval decision reasoning", () => {
    const element = LiveOutcomeBanner({
      outcome: {
        status: "APPROVAL_DECIDED",
        reasonCode: "APPROVAL_ACCEPTED",
      },
    });

    expect(isValidElement(element)).toBe(true);

    const text = collectText(element).join(" ");
    expect(text).toContain("The approval decision was recorded.");
    expect(text).toContain("The approval request was accepted and persisted.");
    expect(text).not.toContain("APPROVAL_ACCEPTED");
  });
});
