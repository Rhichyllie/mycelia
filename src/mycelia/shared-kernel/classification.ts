import { z } from "zod";

import { err, ok, type Result } from "./result";

export const DataClassifications = [
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "RESTRICTED",
  "SECRET",
] as const;

export type DataClassification = (typeof DataClassifications)[number];

export const DataClassificationSchema = z.enum(DataClassifications);

const classificationRank: Record<DataClassification, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
  RESTRICTED: 3,
  SECRET: 4,
};

export type ClassificationDowngradeError = {
  readonly code: "CLASSIFICATION_DOWNGRADE";
  readonly current: DataClassification;
  readonly proposed: DataClassification;
  readonly message: string;
};

export function compareClassification(
  left: DataClassification,
  right: DataClassification,
): number {
  return classificationRank[left] - classificationRank[right];
}

export function isClassificationAtLeast(
  candidate: DataClassification,
  minimum: DataClassification,
): boolean {
  return compareClassification(candidate, minimum) >= 0;
}

export function isClassificationDowngrade(
  current: DataClassification,
  proposed: DataClassification,
): boolean {
  return compareClassification(proposed, current) < 0;
}

export function highestClassification(
  first: DataClassification,
  ...rest: DataClassification[]
): DataClassification {
  return rest.reduce(
    (highest, candidate) =>
      compareClassification(candidate, highest) > 0 ? candidate : highest,
    first,
  );
}

export function validateClassificationChange(
  current: DataClassification,
  proposed: DataClassification,
): Result<DataClassification, ClassificationDowngradeError> {
  if (!isClassificationDowngrade(current, proposed)) {
    return ok(proposed);
  }

  return err({
    code: "CLASSIFICATION_DOWNGRADE",
    current,
    proposed,
    message: "Data classification downgrade requires explicit governance.",
  });
}
