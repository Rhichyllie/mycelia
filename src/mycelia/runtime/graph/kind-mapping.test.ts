import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { EdgeKind, NodeKind } from "./canonical-graph";
import {
  fromDbEdgeKind,
  fromDbNodeKind,
  toDbEdgeKind,
  toDbNodeKind,
  type DbEdgeKind,
  type DbNodeKind,
} from "./kind-mapping";

function repoPath(...segments: string[]): string {
  return join(process.cwd(), ...segments);
}

const NODE_KIND_CASES: readonly [NodeKind, DbNodeKind][] = [
  ["workspace", "workspace"],
  ["project", "project"],
  ["entity", "entity"],
  ["page", "page"],
  ["flow-step", "flow_step"],
  ["note", "note"],
];

const EDGE_KIND_CASES: readonly [EdgeKind, DbEdgeKind][] = [
  ["contains", "contains"],
  ["references", "references"],
  ["depends-on", "depends_on"],
  ["flows-to", "flows_to"],
  ["relates-to", "relates_to"],
];

function changedFiles(): string[] {
  const tracked = execFileSync("git", ["diff", "--name-only"], {
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
    encoding: "utf8",
  })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return [...new Set([...tracked, ...untracked])]
    .filter((path) => !path.startsWith("legacy/"))
    .filter((path) => existsSync(repoPath(...path.split("/"))));
}

describe("graph kind mapping", () => {
  it("round-trips every node kind between domain and persistence values", () => {
    for (const [domainKind, dbKind] of NODE_KIND_CASES) {
      expect(toDbNodeKind(domainKind)).toBe(dbKind);
      expect(fromDbNodeKind(dbKind)).toBe(domainKind);
    }
  });

  it("round-trips every edge kind between domain and persistence values", () => {
    for (const [domainKind, dbKind] of EDGE_KIND_CASES) {
      expect(toDbEdgeKind(domainKind)).toBe(dbKind);
      expect(fromDbEdgeKind(dbKind)).toBe(domainKind);
    }
  });

  it("fails closed for unrecognized persistence kind values", () => {
    expect(() => fromDbNodeKind("flow-step")).toThrow(
      /Graph persistence kind is not recognized/,
    );
    expect(() => fromDbEdgeKind("depends-on")).toThrow(
      /Graph persistence kind is not recognized/,
    );
  });

  it("keeps changed source files free of the retired source codename", () => {
    const forbidden = new RegExp(["ma", "pia"].join(""), "i");
    const offenders = changedFiles().filter((path) =>
      forbidden.test(readFileSync(repoPath(...path.split("/")), "utf8")),
    );

    expect(offenders).toEqual([]);
  });
});