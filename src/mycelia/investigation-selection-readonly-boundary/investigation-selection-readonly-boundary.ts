import { z } from "zod";

import {
  MINIMAL_INVESTIGATION_REFERENCE_SCENARIO,
  MINIMAL_INVESTIGATION_UI_FIXTURES,
  createMinimalInvestigationReadonlyRepositoryClient,
  loadMinimalInvestigationUiDescriptor,
  type MinimalInvestigationUiDescriptor,
  type MinimalInvestigationUiLoadStatus,
} from "../minimal-investigation-ui-surface";
import type {
  PersistedInvestigationReadModelScenario,
} from "../persisted-investigation-read-model";
import type { RuntimeRepositoryClient } from "../runtime-repository-layer";
import { err, ok, type Result } from "../shared-kernel";

export const INVESTIGATION_SELECTION_READONLY_BOUNDARY_PHASE = "3G";

export const INVESTIGATION_SELECTION_READONLY_BOUNDARY_NAME =
  "Investigation Selection & Read-Only Boundary";

export const INVESTIGATION_SELECTION_READONLY_BOUNDARY_STATUS =
  "controlled read-only investigation target selection";

export const InvestigationSelectionVerdicts = [
  "INVESTIGATION_TARGET_RESOLVED",
  "INVESTIGATION_TARGET_NOT_FOUND",
  "INVESTIGATION_TARGET_INCOMPLETE",
  "INVESTIGATION_TARGET_BLOCKED",
  "INVESTIGATION_TARGET_FAILED_SAFE",
] as const;

export type InvestigationSelectionVerdict =
  (typeof InvestigationSelectionVerdicts)[number];

export const InvestigationSelectionTargetModes = [
  "CONTROLLED_REFERENCE",
  "RUN_SCOPE",
] as const;

export type InvestigationSelectionTargetMode =
  (typeof InvestigationSelectionTargetModes)[number];

export const InvestigationSelectionDenialCodeSchema = z.enum([
  "INVESTIGATION_SELECTION_INPUT_INVALID",
  "INVESTIGATION_SELECTION_SOURCE_DENIED",
]);

export type InvestigationSelectionDenialCode = z.infer<
  typeof InvestigationSelectionDenialCodeSchema
>;

const UNSAFE_INVESTIGATION_SELECTION_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|binary|blob|credential|document[_-]?content|file[_-]?blob|password|payload|private[_-]?key|raw|secret|token)/i;

const InvestigationSelectionSafeRefSchema = z
  .string()
  .min(1)
  .max(160)
  .refine((value) => value.trim() === value)
  .refine(
    (value) => !UNSAFE_INVESTIGATION_SELECTION_TEXT_PATTERN.test(value),
  );

const InvestigationSelectionSafeSummarySchema = z
  .string()
  .min(1)
  .max(360)
  .refine(
    (value) => !UNSAFE_INVESTIGATION_SELECTION_TEXT_PATTERN.test(value),
  );

const ControlledReferenceTargetSchema = z
  .object({
    selectionMode: z.literal("CONTROLLED_REFERENCE"),
  })
  .strict();

const RunScopeTargetSchema = z
  .object({
    selectionMode: z.literal("RUN_SCOPE"),
    tenantId: InvestigationSelectionSafeRefSchema,
    governedRunId: InvestigationSelectionSafeRefSchema,
    correlationId: InvestigationSelectionSafeRefSchema,
    investigationPurpose: InvestigationSelectionSafeSummarySchema.optional(),
    requestedByRef: InvestigationSelectionSafeRefSchema.optional(),
  })
  .strict();

export const InvestigationSelectionTargetSchema = z.union([
  ControlledReferenceTargetSchema,
  RunScopeTargetSchema,
]);

export type InvestigationSelectionTarget = z.infer<
  typeof InvestigationSelectionTargetSchema
>;

export const InvestigationSelectionDenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    verdict: z.literal("INVESTIGATION_TARGET_FAILED_SAFE"),
    code: InvestigationSelectionDenialCodeSchema,
    safeReason: z.string().min(1).max(240),
    safe: z.literal(true),
  })
  .strict();

export type InvestigationSelectionDenial = z.infer<
  typeof InvestigationSelectionDenialSchema
> & {
  readonly uiDescriptor: MinimalInvestigationUiDescriptor;
};

export type InvestigationSelectionResult = {
  readonly phase: typeof INVESTIGATION_SELECTION_READONLY_BOUNDARY_PHASE;
  readonly name: typeof INVESTIGATION_SELECTION_READONLY_BOUNDARY_NAME;
  readonly verdict: InvestigationSelectionVerdict;
  readonly target: InvestigationSelectionTarget;
  readonly targetRef: {
    readonly tenantId: string;
    readonly governedRunId: string;
    readonly correlationId: string;
  };
  readonly loadStatus: MinimalInvestigationUiLoadStatus;
  readonly uiDescriptor: MinimalInvestigationUiDescriptor;
  readonly source:
    | "controlled-reference"
    | "repository-read-model";
  readonly readOnly: true;
  readonly safeSummary: string;
  readonly boundaryNotes: readonly string[];
};

export type InvestigationSelectionResultEnvelope = Result<
  InvestigationSelectionResult,
  InvestigationSelectionDenial
>;

export type InvestigationSelectionReadonlyBoundaryInput = {
  readonly repositoryClient?: RuntimeRepositoryClient;
  readonly defaultTarget?: InvestigationSelectionTarget;
};

export type InvestigationSelectionReadonlyBoundary = {
  readonly phase: typeof INVESTIGATION_SELECTION_READONLY_BOUNDARY_PHASE;
  readonly name: typeof INVESTIGATION_SELECTION_READONLY_BOUNDARY_NAME;
  readonly status: typeof INVESTIGATION_SELECTION_READONLY_BOUNDARY_STATUS;
  readonly readOnly: true;
  readonly supportedTargetModes: readonly InvestigationSelectionTargetMode[];
  readonly boundaryNotes: readonly string[];
  readonly resolve: (
    target?: unknown,
  ) => Promise<InvestigationSelectionResultEnvelope>;
};

export type InvestigationSelectionReadonlyBoundaryEnvelope = Result<
  InvestigationSelectionReadonlyBoundary,
  InvestigationSelectionDenial
>;

export type ResolveInvestigationSelectionTargetInput = {
  readonly repositoryClient?: RuntimeRepositoryClient;
  readonly defaultTarget?: InvestigationSelectionTarget;
  readonly target?: unknown;
};

const DEFAULT_CONTROLLED_REFERENCE_TARGET = {
  selectionMode: "CONTROLLED_REFERENCE",
} as const satisfies InvestigationSelectionTarget;

const BOUNDARY_NOTES = [
  "selection target is resolved before UI rendering",
  "records are loaded through the persisted investigation read model",
  "repository client is injected or controlled reference data is used",
  "result is read-only and cannot mutate persisted state",
  "not found, incomplete, blocked and failed-safe states remain explicit",
  "no API route, auth, replay, export or broad search is created",
] as const;

function safeReasonFor(code: InvestigationSelectionDenialCode): string {
  const reasons: Record<InvestigationSelectionDenialCode, string> = {
    INVESTIGATION_SELECTION_INPUT_INVALID:
      "The investigation selection target is invalid or unsafe.",
    INVESTIGATION_SELECTION_SOURCE_DENIED:
      "The read-only investigation source could not resolve the target safely.",
  };

  return reasons[code];
}

export function failClosedInvestigationSelectionDenial(
  code: InvestigationSelectionDenialCode =
    "INVESTIGATION_SELECTION_INPUT_INVALID",
): InvestigationSelectionDenial {
  return {
    ...InvestigationSelectionDenialSchema.parse({
      outcome: "DENIED",
      verdict: "INVESTIGATION_TARGET_FAILED_SAFE",
      code,
      safeReason: safeReasonFor(code),
      safe: true,
    }),
    uiDescriptor: MINIMAL_INVESTIGATION_UI_FIXTURES.blockedReconstruction,
  };
}

function targetToScenario(
  target: InvestigationSelectionTarget,
): PersistedInvestigationReadModelScenario {
  if (target.selectionMode === "CONTROLLED_REFERENCE") {
    return MINIMAL_INVESTIGATION_REFERENCE_SCENARIO;
  }

  return {
    tenantId: target.tenantId,
    governedRunId: target.governedRunId,
    correlationId: target.correlationId,
    investigationPurpose:
      target.investigationPurpose ?? "READ_ONLY_INVESTIGATION_SELECTION",
    requestedByRef: target.requestedByRef ?? "readonly_investigation_viewer",
  };
}

function targetRefFor(
  scenario: PersistedInvestigationReadModelScenario,
): InvestigationSelectionResult["targetRef"] {
  return {
    tenantId: scenario.tenantId,
    governedRunId: scenario.governedRunId,
    correlationId: scenario.correlationId,
  };
}

function blockedByScope(descriptor: MinimalInvestigationUiDescriptor): boolean {
  return (descriptor.findings ?? []).some(
    (finding) =>
      finding.code === "GOVERNED_RUN_SCOPE_MISMATCH" ||
      finding.code === "TENANT_RUN_SCOPE_MISMATCH",
  );
}

function notFound(descriptor: MinimalInvestigationUiDescriptor): boolean {
  return (descriptor.findings ?? []).some(
    (finding) => finding.code === "GOVERNED_RUN_MISSING",
  );
}

function verdictForLoad(
  status: MinimalInvestigationUiLoadStatus,
  descriptor: MinimalInvestigationUiDescriptor,
): InvestigationSelectionVerdict {
  if (status === "FAILED_SAFE") {
    return "INVESTIGATION_TARGET_FAILED_SAFE";
  }

  if (status === "INCOMPLETE") {
    return "INVESTIGATION_TARGET_INCOMPLETE";
  }

  if (blockedByScope(descriptor)) {
    return "INVESTIGATION_TARGET_BLOCKED";
  }

  if (status === "NOT_FOUND" || notFound(descriptor)) {
    return "INVESTIGATION_TARGET_NOT_FOUND";
  }

  return "INVESTIGATION_TARGET_RESOLVED";
}

async function resolveWithConfig(
  input: InvestigationSelectionReadonlyBoundaryInput,
  target: unknown,
): Promise<InvestigationSelectionResultEnvelope> {
  const defaultTarget = input.defaultTarget ?? DEFAULT_CONTROLLED_REFERENCE_TARGET;
  const parsed = InvestigationSelectionTargetSchema.safeParse(
    target === undefined ? defaultTarget : target,
  );

  if (!parsed.success) {
    return err(failClosedInvestigationSelectionDenial());
  }

  const repositoryClient =
    input.repositoryClient ?? createMinimalInvestigationReadonlyRepositoryClient();
  const scenario = targetToScenario(parsed.data);

  try {
    const loaded = await loadMinimalInvestigationUiDescriptor({
      repositoryClient,
      scenario,
    });
    const verdict = verdictForLoad(loaded.status, loaded.descriptor);

    return ok({
      phase: INVESTIGATION_SELECTION_READONLY_BOUNDARY_PHASE,
      name: INVESTIGATION_SELECTION_READONLY_BOUNDARY_NAME,
      verdict,
      target: parsed.data,
      targetRef: targetRefFor(scenario),
      loadStatus: loaded.status,
      uiDescriptor: loaded.descriptor,
      source:
        parsed.data.selectionMode === "CONTROLLED_REFERENCE"
          ? "controlled-reference"
          : "repository-read-model",
      readOnly: true,
      safeSummary:
        verdict === "INVESTIGATION_TARGET_RESOLVED"
          ? "Investigation target resolved through the read-only selection boundary."
          : "Investigation target resolved with explicit non-complete status.",
      boundaryNotes: BOUNDARY_NOTES,
    });
  } catch {
    return err(
      failClosedInvestigationSelectionDenial(
        "INVESTIGATION_SELECTION_SOURCE_DENIED",
      ),
    );
  }
}

export function createInvestigationSelectionReadonlyBoundary(
  input: InvestigationSelectionReadonlyBoundaryInput = {},
): InvestigationSelectionReadonlyBoundaryEnvelope {
  if (input.defaultTarget !== undefined) {
    const parsed = InvestigationSelectionTargetSchema.safeParse(
      input.defaultTarget,
    );

    if (!parsed.success) {
      return err(failClosedInvestigationSelectionDenial());
    }
  }

  return ok({
    phase: INVESTIGATION_SELECTION_READONLY_BOUNDARY_PHASE,
    name: INVESTIGATION_SELECTION_READONLY_BOUNDARY_NAME,
    status: INVESTIGATION_SELECTION_READONLY_BOUNDARY_STATUS,
    readOnly: true,
    supportedTargetModes: InvestigationSelectionTargetModes,
    boundaryNotes: BOUNDARY_NOTES,
    resolve: (target?: unknown) => resolveWithConfig(input, target),
  });
}

export async function resolveInvestigationSelectionTarget(
  input: ResolveInvestigationSelectionTargetInput = {},
): Promise<InvestigationSelectionResultEnvelope> {
  const boundary = createInvestigationSelectionReadonlyBoundary({
    repositoryClient: input.repositoryClient,
    defaultTarget: input.defaultTarget,
  });

  if (!boundary.ok) {
    return err(boundary.error);
  }

  return boundary.value.resolve(input.target);
}
