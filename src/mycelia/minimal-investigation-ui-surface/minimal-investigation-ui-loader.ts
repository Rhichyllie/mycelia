import {
  createPersistedInvestigationReadModel,
  type PersistedInvestigationReadModelScenario,
} from "../persisted-investigation-read-model";
import type { RuntimeRepositoryClient } from "../runtime-repository-layer";
import type { MinimalInvestigationUiDescriptor } from "./minimal-investigation-ui-contract";
import { MINIMAL_INVESTIGATION_UI_FIXTURES } from "./minimal-investigation-ui-fixtures";
import { mapPersistedInvestigationReadModelToUiDescriptor } from "./minimal-investigation-ui-mapper";
import {
  MINIMAL_INVESTIGATION_REFERENCE_SCENARIO,
  createMinimalInvestigationReadonlyRepositoryClient,
} from "./minimal-investigation-ui-readonly-source";

export const MINIMAL_INVESTIGATION_UI_LIVE_READONLY_PHASE = "3G";

export const MINIMAL_INVESTIGATION_UI_LIVE_READONLY_NAME =
  "Live Read-Only Investigation Surface";

export const MinimalInvestigationUiLoadStatuses = [
  "LOADED",
  "INCOMPLETE",
  "NOT_FOUND",
  "FAILED_SAFE",
] as const;

export type MinimalInvestigationUiLoadStatus =
  (typeof MinimalInvestigationUiLoadStatuses)[number];

export type MinimalInvestigationUiLoadInput = {
  readonly repositoryClient?: RuntimeRepositoryClient;
  readonly scenario?: PersistedInvestigationReadModelScenario;
};

export type MinimalInvestigationUiLoadResult = {
  readonly phase: typeof MINIMAL_INVESTIGATION_UI_LIVE_READONLY_PHASE;
  readonly name: typeof MINIMAL_INVESTIGATION_UI_LIVE_READONLY_NAME;
  readonly status: MinimalInvestigationUiLoadStatus;
  readonly descriptor: MinimalInvestigationUiDescriptor;
  readonly source: "persisted-investigation-read-model";
  readonly readOnly: true;
  readonly safeSummary: string;
};

function statusForDescriptor(
  descriptor: MinimalInvestigationUiDescriptor,
): MinimalInvestigationUiLoadStatus {
  if (descriptor.verdict === "INVESTIGATION_BLOCKED") {
    return "NOT_FOUND";
  }

  if (descriptor.verdict === "INVESTIGATION_FAILED_SAFE") {
    return "FAILED_SAFE";
  }

  if (descriptor.verdict === "INVESTIGATION_INCOMPLETE") {
    return "INCOMPLETE";
  }

  return "LOADED";
}

function failedSafeResult(): MinimalInvestigationUiLoadResult {
  return {
    phase: MINIMAL_INVESTIGATION_UI_LIVE_READONLY_PHASE,
    name: MINIMAL_INVESTIGATION_UI_LIVE_READONLY_NAME,
    status: "FAILED_SAFE",
    descriptor: MINIMAL_INVESTIGATION_UI_FIXTURES.blockedReconstruction,
    source: "persisted-investigation-read-model",
    readOnly: true,
    safeSummary:
      "Investigation read-only loader failed safe before rendering.",
  };
}

export async function loadMinimalInvestigationUiDescriptor(
  input: MinimalInvestigationUiLoadInput = {},
): Promise<MinimalInvestigationUiLoadResult> {
  const repositoryClient =
    input.repositoryClient ??
    createMinimalInvestigationReadonlyRepositoryClient();
  const scenario = input.scenario ?? MINIMAL_INVESTIGATION_REFERENCE_SCENARIO;
  const readModel = createPersistedInvestigationReadModel({
    repositoryClient,
  });

  if (!readModel.ok) {
    return failedSafeResult();
  }

  const result = await readModel.value.reconstruct(scenario);

  if (!result.ok) {
    return failedSafeResult();
  }

  const descriptor = mapPersistedInvestigationReadModelToUiDescriptor(
    result.value,
  );
  const status = statusForDescriptor(descriptor);

  return {
    phase: MINIMAL_INVESTIGATION_UI_LIVE_READONLY_PHASE,
    name: MINIMAL_INVESTIGATION_UI_LIVE_READONLY_NAME,
    status,
    descriptor,
    source: "persisted-investigation-read-model",
    readOnly: true,
    safeSummary:
      status === "LOADED"
        ? "Investigation read model loaded through the read-only repository boundary."
        : "Investigation read model loaded with explicit incomplete or blocked status.",
  };
}
