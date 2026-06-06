import type { EdgeKind, NodeKind } from "@/src/domain";

export type ProjectProfile =
  | "blank"
  | "data-model"
  | "process"
  | "information-structure"
  | "documents-governance"
  | "system-architecture"
  | "mixed";

export type InitialView =
  | "free"
  | "graph"
  | "hierarchy"
  | "flow"
  | "erd"
  | "sitemap"
  | "timeline"
  | "mindmap";

export type StartStrategy = "blank" | "template" | "import";
export type StartSource = "manual" | "postgres" | "prisma";
export type LayoutChoice = "free" | "auto";

type RecipeRuntime = {
  recipeId: string;
  persona: {
    quickAdd: {
      defaultNodeKind: NodeKind;
      defaultEdgeKind: EdgeKind;
    };
  };
};

export function resolveRecipeRuntime(input: {
  profile: ProjectProfile;
  view: InitialView;
}): RecipeRuntime {
  if (input.profile === "data-model" || input.view === "erd") {
    return {
      recipeId: "mycelia:data-model",
      persona: {
        quickAdd: {
          defaultNodeKind: "entity",
          defaultEdgeKind: "references",
        },
      },
    };
  }

  if (input.profile === "process" || input.view === "flow") {
    return {
      recipeId: "mycelia:process",
      persona: {
        quickAdd: {
          defaultNodeKind: "flow-step",
          defaultEdgeKind: "flows-to",
        },
      },
    };
  }

  return {
    recipeId: "mycelia:blank",
    persona: {
      quickAdd: {
        defaultNodeKind: "note",
        defaultEdgeKind: "relates-to",
      },
    },
  };
}

export function normalizeSourceStatusCode(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "unknown";
}

export function getRedactedValueMask() {
  return "[REDACTED]";
}

export function redactSensitiveStrings(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(
    /(password|token|secret|apikey|api_key|authorization)=([^&\s]+)/gi,
    "$1=[REDACTED]",
  );
}
