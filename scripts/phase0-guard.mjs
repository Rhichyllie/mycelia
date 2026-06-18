import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const command = process.argv[2] ?? "command";

function printPhase0Message() {
  console.error(`MYCELIA is currently in Phase 0.`);
  console.error(
    `The active runtime and UI shell are intentionally not implemented yet.`,
  );
  console.error(
    `The former MapIA implementation was quarantined under legacy/mapia-active-snapshot/.`,
  );
  console.error(`Use "pnpm validate:phase0" for the current safe baseline.`);
  console.error(
    `Use "pnpm demo:local" only for local MYCELIA demo preview inspection.`,
  );
  console.error(
    `Future app/runtime work must follow docs/mycelia/19-codex-operational-alignment-and-engineering-constitution.md.`,
  );
}

function listActiveTestFiles() {
  const roots = ["src", "prisma", "public", "contracts", "docs"];
  const ignoredSegments = new Set(["legacy", "node_modules", ".next", ".git"]);
  const testPattern = /(?:\.test|\.spec)\.[cm]?[jt]sx?$/u;
  const found = [];

  function walk(directory) {
    let entries = [];
    try {
      entries = readdirSync(directory);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (ignoredSegments.has(entry)) {
        continue;
      }

      const path = join(directory, entry);
      const stats = statSync(path);
      if (stats.isDirectory()) {
        walk(path);
        continue;
      }

      if (testPattern.test(entry)) {
        found.push(relative(process.cwd(), path));
      }
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return found;
}

if (command === "test") {
  const activeTests = listActiveTestFiles();

  if (activeTests.length > 0) {
    console.error("Phase 0 test guard found active test files:");
    for (const testFile of activeTests) {
      console.error(`- ${testFile}`);
    }
    console.error(
      "Run Vitest only after Phase 0E defines the active test baseline for these files.",
    );
    process.exit(1);
  }

  console.log(
    "Phase 0 test guard passed: no active tests found outside quarantined legacy folders.",
  );
  console.log(
    "vitest.config.ts excludes legacy/** for the future Vitest baseline.",
  );
  process.exit(0);
}

printPhase0Message();
console.error(`Refusing to run inactive product command: ${command}`);

process.exit(1);
