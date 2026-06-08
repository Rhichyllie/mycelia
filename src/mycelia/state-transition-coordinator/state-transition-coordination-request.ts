import { z } from "zod";

import {
  CausationIdSchema,
  CorrelationIdSchema,
  EventIdSchema,
  RunIdSchema,
  TenantIdSchema,
} from "../shared-kernel";
import { RuntimeStateSchema } from "../runtime-state";
import {
  SafeStateTransitionMetadataSchema,
  StateTransitionIntentSchema,
  StateTransitionOpaqueReferenceSchema,
  isStateTransitionIsoDateTime,
} from "../state-transition";

export const StateTransitionCoordinationRequestIdSchema =
  StateTransitionOpaqueReferenceSchema;

export const StateTransitionCoordinationRequestSchema = z
  .object({
    coordination_request_id: StateTransitionCoordinationRequestIdSchema,
    tenant_id: TenantIdSchema,
    run_id: RunIdSchema,
    current_state: RuntimeStateSchema,
    transition_intent: StateTransitionIntentSchema,
    requested_at: z.string().refine(
      isStateTransitionIsoDateTime,
      "requested_at must be an ISO datetime string.",
    ),
    correlation_id: CorrelationIdSchema,
    causation_id: CausationIdSchema.optional(),
    source_event_id: EventIdSchema.optional(),
    metadata: SafeStateTransitionMetadataSchema.optional(),
  })
  .strict()
  .superRefine((request, context) => {
    if (request.current_state.tenant_id !== request.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "current_state tenant_id must match request tenant_id.",
        path: ["current_state", "tenant_id"],
      });
    }

    if (request.current_state.run_id !== request.run_id) {
      context.addIssue({
        code: "custom",
        message: "current_state run_id must match request run_id.",
        path: ["current_state", "run_id"],
      });
    }

    if (request.transition_intent.tenant_id !== request.tenant_id) {
      context.addIssue({
        code: "custom",
        message: "transition_intent tenant_id must match request tenant_id.",
        path: ["transition_intent", "tenant_id"],
      });
    }

    if (request.transition_intent.run_id !== request.run_id) {
      context.addIssue({
        code: "custom",
        message: "transition_intent run_id must match request run_id.",
        path: ["transition_intent", "run_id"],
      });
    }

    if (request.transition_intent.from_kind !== request.current_state.kind) {
      context.addIssue({
        code: "custom",
        message: "transition_intent from_kind must match current_state kind.",
        path: ["transition_intent", "from_kind"],
      });
    }

    if (
      request.transition_intent.from_state_id !== request.current_state.state_id
    ) {
      context.addIssue({
        code: "custom",
        message:
          "transition_intent from_state_id must match current_state state_id.",
        path: ["transition_intent", "from_state_id"],
      });
    }

    if (
      request.transition_intent.expected_from_version !==
      request.current_state.version
    ) {
      context.addIssue({
        code: "custom",
        message:
          "transition_intent expected_from_version must match current_state version.",
        path: ["transition_intent", "expected_from_version"],
      });
    }
  });

export type StateTransitionCoordinationRequest = z.infer<
  typeof StateTransitionCoordinationRequestSchema
>;
export type StateTransitionCoordinationRequestInput = z.input<
  typeof StateTransitionCoordinationRequestSchema
>;
