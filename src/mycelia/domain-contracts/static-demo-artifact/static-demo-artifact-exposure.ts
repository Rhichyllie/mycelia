import { z } from "zod";

import { type DataClassification } from "../../foundation/shared-kernel";

export const StaticDemoArtifactExposures = [
  "INTERNAL_ONLY",
  "CUSTOMER_SAFE",
  "EXECUTIVE_SAFE",
  "TECHNICAL_REVIEW_ONLY",
] as const;

export type StaticDemoArtifactExposure =
  (typeof StaticDemoArtifactExposures)[number];

export const StaticDemoArtifactExposureSchema = z.enum(
  StaticDemoArtifactExposures,
);

const CUSTOMER_SAFE_CLASSIFICATIONS: readonly DataClassification[] = [
  "PUBLIC",
];

const EXECUTIVE_SAFE_CLASSIFICATIONS: readonly DataClassification[] = [
  "PUBLIC",
  "INTERNAL",
];

export function isStaticDemoArtifactClassificationCompatible(
  exposure: StaticDemoArtifactExposure,
  dataClassification: DataClassification,
): boolean {
  if (exposure === "CUSTOMER_SAFE") {
    return CUSTOMER_SAFE_CLASSIFICATIONS.includes(dataClassification);
  }

  if (exposure === "EXECUTIVE_SAFE") {
    return EXECUTIVE_SAFE_CLASSIFICATIONS.includes(dataClassification);
  }

  return true;
}

export function isStaticDemoArtifactExposureCompatible(
  exposure: StaticDemoArtifactExposure,
  classifications: readonly DataClassification[],
): boolean {
  return classifications.every((classification) =>
    isStaticDemoArtifactClassificationCompatible(
      exposure,
      classification,
    ),
  );
}
