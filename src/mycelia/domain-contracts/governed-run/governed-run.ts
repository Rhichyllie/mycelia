import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  DataClassificationSchema,
  EventIdSchema,
  ProjectIdSchema,
  RequestIdSchema,
  RunIdSchema,
  TenantIdSchema,
  WorkspaceIdSchema,
} from "../../foundation/shared-kernel";
import { PolicyPurposeSchema } from "../../domain-contracts/policy-decision-gateway";
import {
  RuntimeAdmissionDecisionIdSchema,
  RuntimeAdmissionDecisionSchema,
} from "../../domain-contracts/runtime-admission-gateway";
import {
  RuntimeEnvelopeIdSchema,
  RuntimeEnvelopeSchema,
} from "../../foundation/runtime-envelope";

import { GovernedRunOriginSchema } from "./governed-run-origin";
import { GovernedRunStatusSchema } from "./governed-run-status";

const MAX_GOVERNED_RUN_METADATA_KEYS = 32;
const MAX_GOVERNED_RUN_SAFE_TEXT_LENGTH = 240;
const UNSAFE_GOVERNED_RUN_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|\/|\\|;|&&|\|\||`|\$\(|authorization|api[_-]?key|bearer|credential|display[_-]?name|external[_-]?id|password|path|permission|policy[_-]?internals|private[_-]?key|raw|request[_-]?internals|resource[_-]?name|role[_-]?name|secret|tenant[_-]?name|token|workspace[_-]?name|project[_-]?name|prefix)/i;

const SafeGovernedRunMetadataKeySchema = z
  .string()
  .min(1)
  .max(80)
  .refine(
    (key) => !UNSAFE_GOVERNED_RUN_TEXT_PATTERN.test(key),
    "governed run metadata key is unsafe.",
  );

const SafeGovernedRunMetadataValueSchema = z.union([
  z
    .string()
    .max(MAX_GOVERNED_RUN_SAFE_TEXT_LENGTH)
    .refine(
      (value) => !UNSAFE_GOVERNED_RUN_TEXT_PATTERN.test(value),
      "governed run metadata value is unsafe.",
    ),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const SafeGovernedRunMetadataSchema = z
  .record(SafeGovernedRunMetadataKeySchema, SafeGovernedRunMetadataValueSchema)
  .refine(
    (metadata) => Object.keys(metadata).length <= MAX_GOVERNED_RUN_METADATA_KEYS,
    `governed run metadata must not exceed ${MAX_GOVERNED_RUN_METADATA_KEYS} keys.`,
  );

export type SafeGovernedRunMetadata = z.infer<
  typeof SafeGovernedRunMetadataSchema
>;

export function isGovernedRunIsoDateTime(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return false;
  }

  if (!/(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function isBeforeIsoDateTime(left: string, right: string): boolean {
  return Date.parse(left) < Date.parse(right);
}

export const GovernedRunSchema = z
  .object({
    run_id: RunIdSchema,
    tenant_id: TenantIdSchema,
    workspace_id: WorkspaceIdSchema.optional(),
    project_id: ProjectIdSchema.optional(),
    status: GovernedRunStatusSchema,
    origin: GovernedRunOriginSchema,
    runtime_envelope_id: RuntimeEnvelopeIdSchema.optional(),
    runtime_envelope: RuntimeEnvelopeSchema.optional(),
    admission_decision_id: RuntimeAdmissionDecisionIdSchema.optional(),
    admission_decision: RuntimeAdmissionDecisionSchema.optional(),
    request_id: RequestIdSchema,
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    declared_purpose: PolicyPurposeSchema,
    data_classification: DataClassificationSchema,
    created_at: z
      .string()
      .refine(
        isGovernedRunIsoDateTime,
        "created_at must be an ISO datetime string.",
      ),
    admitted_at: z
      .string()
      .refine(
        isGovernedRunIsoDateTime,
        "admitted_at must be an ISO datetime string.",
      )
      .optional(),
    rejected_at: z
      .string()
      .refine(
        isGovernedRunIsoDateTime,
        "rejected_at must be an ISO datetime string.",
      )
      .optional(),
    cancelled_at: z
      .string()
      .refine(
        isGovernedRunIsoDateTime,
        "cancelled_at must be an ISO datetime string.",
      )
      .optional(),
    metadata: SafeGovernedRunMetadataSchema.optional(),
  })
  .strict()
  .superRefine((run, context) => {
    if (run.project_id !== undefined && run.workspace_id === undefined) {
      context.addIssue({
        code: "custom",
        message: "project_id requires workspace_id.",
        path: ["project_id"],
      });
    }

    if (
      run.runtime_envelope_id === undefined &&
      run.runtime_envelope === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "runtime envelope reference is required.",
        path: ["runtime_envelope_id"],
      });
    }

    if (
      run.admission_decision_id === undefined &&
      run.admission_decision === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "admission decision reference is required.",
        path: ["admission_decision_id"],
      });
    }

    if (
      run.runtime_envelope !== undefined &&
      run.runtime_envelope.tenant_id !== run.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message: "runtime envelope tenant_id must match governed run tenant_id.",
        path: ["runtime_envelope", "tenant_id"],
      });
    }

    if (
      run.runtime_envelope !== undefined &&
      run.runtime_envelope.request_id !== run.request_id
    ) {
      context.addIssue({
        code: "custom",
        message: "runtime envelope request_id must match governed run request_id.",
        path: ["runtime_envelope", "request_id"],
      });
    }

    if (
      run.runtime_envelope !== undefined &&
      run.runtime_envelope.correlation_id !== run.correlation_id
    ) {
      context.addIssue({
        code: "custom",
        message:
          "runtime envelope correlation_id must match governed run correlation_id.",
        path: ["runtime_envelope", "correlation_id"],
      });
    }

    if (
      run.runtime_envelope !== undefined &&
      run.runtime_envelope.declared_purpose !== run.declared_purpose
    ) {
      context.addIssue({
        code: "custom",
        message:
          "runtime envelope declared purpose must match governed run purpose.",
        path: ["runtime_envelope", "declared_purpose"],
      });
    }

    if (
      run.runtime_envelope !== undefined &&
      run.runtime_envelope.data_classification !== run.data_classification
    ) {
      context.addIssue({
        code: "custom",
        message:
          "runtime envelope classification must match governed run classification.",
        path: ["runtime_envelope", "data_classification"],
      });
    }

    if (
      run.runtime_envelope !== undefined &&
      run.workspace_id !== undefined &&
      run.runtime_envelope.scope.workspace_id !== undefined &&
      run.runtime_envelope.scope.workspace_id !== run.workspace_id
    ) {
      context.addIssue({
        code: "custom",
        message: "runtime envelope workspace scope must match governed run.",
        path: ["runtime_envelope", "scope", "workspace_id"],
      });
    }

    if (
      run.runtime_envelope !== undefined &&
      run.project_id !== undefined &&
      run.runtime_envelope.scope.project_id !== undefined &&
      run.runtime_envelope.scope.project_id !== run.project_id
    ) {
      context.addIssue({
        code: "custom",
        message: "runtime envelope project scope must match governed run.",
        path: ["runtime_envelope", "scope", "project_id"],
      });
    }

    if (
      run.admission_decision !== undefined &&
      run.admission_decision.tenant_id !== run.tenant_id
    ) {
      context.addIssue({
        code: "custom",
        message:
          "admission decision tenant_id must match governed run tenant_id.",
        path: ["admission_decision", "tenant_id"],
      });
    }

    if (
      run.admission_decision !== undefined &&
      run.admission_decision_id !== undefined &&
      run.admission_decision.admission_decision_id !==
        run.admission_decision_id
    ) {
      context.addIssue({
        code: "custom",
        message:
          "admission decision object must match its opaque decision reference.",
        path: ["admission_decision", "admission_decision_id"],
      });
    }

    if (
      run.status === "ADMITTED" &&
      run.admission_decision?.outcome !== "ADMIT"
    ) {
      context.addIssue({
        code: "custom",
        message: "ADMITTED status requires an ADMIT admission decision.",
        path: ["admission_decision", "outcome"],
      });
    }

    if (
      run.status === "REJECTED" &&
      run.admission_decision?.outcome !== "DENY" &&
      run.admission_decision?.outcome !== "REQUIRE_APPROVAL"
    ) {
      context.addIssue({
        code: "custom",
        message:
          "REJECTED status requires a DENY or REQUIRE_APPROVAL admission decision.",
        path: ["admission_decision", "outcome"],
      });
    }

    if (run.admitted_at !== undefined && run.status !== "ADMITTED") {
      context.addIssue({
        code: "custom",
        message: "admitted_at requires ADMITTED status.",
        path: ["admitted_at"],
      });
    }

    if (run.rejected_at !== undefined && run.status !== "REJECTED") {
      context.addIssue({
        code: "custom",
        message: "rejected_at requires REJECTED status.",
        path: ["rejected_at"],
      });
    }

    if (run.cancelled_at !== undefined && run.status !== "CANCELLED") {
      context.addIssue({
        code: "custom",
        message: "cancelled_at requires CANCELLED status.",
        path: ["cancelled_at"],
      });
    }

    if (
      run.admitted_at !== undefined &&
      isBeforeIsoDateTime(run.admitted_at, run.created_at)
    ) {
      context.addIssue({
        code: "custom",
        message: "admitted_at must not be before created_at.",
        path: ["admitted_at"],
      });
    }

    if (
      run.rejected_at !== undefined &&
      isBeforeIsoDateTime(run.rejected_at, run.created_at)
    ) {
      context.addIssue({
        code: "custom",
        message: "rejected_at must not be before created_at.",
        path: ["rejected_at"],
      });
    }

    if (
      run.cancelled_at !== undefined &&
      isBeforeIsoDateTime(run.cancelled_at, run.created_at)
    ) {
      context.addIssue({
        code: "custom",
        message: "cancelled_at must not be before created_at.",
        path: ["cancelled_at"],
      });
    }
  });

export type GovernedRun = z.infer<typeof GovernedRunSchema>;
export type GovernedRunInput = z.input<typeof GovernedRunSchema>;

export function isSafeGovernedRunMetadata(
  input: unknown,
): input is SafeGovernedRunMetadata {
  return SafeGovernedRunMetadataSchema.safeParse(input).success;
}
