import type {
  StateTransition,
  StateTransitionInput,
  StateTransitionResult,
} from "../state-transition";

import type { StateTransitionCoordinationRequest } from "./state-transition-coordination-request";

export function createStateTransitionDescriptorInput(
  request: StateTransitionCoordinationRequest,
): StateTransitionInput {
  return {
    transition_id: `${request.coordination_request_id}.transition`,
    tenant_id: request.tenant_id,
    run_id: request.run_id,
    from_state: request.current_state,
    to_state_ref: `${request.current_state.state_id}.next`,
    intent: request.transition_intent,
    from_kind: request.current_state.kind,
    to_kind: request.transition_intent.to_kind,
    from_version: request.current_state.version,
    to_version: request.current_state.version + 1,
    correlation_id: request.correlation_id,
    causation_id: request.causation_id,
    source_event_id: request.source_event_id,
    data_classification: request.transition_intent.data_classification,
    validated_at: request.requested_at,
    metadata: request.metadata,
  };
}

export type StateTransitionCoordinatorReadyDescriptors = {
  readonly transition: StateTransition;
  readonly transition_result: StateTransitionResult;
};

export type StateTransitionCoordinator = {
  readonly coordinate: (
    input: unknown,
  ) => import("../shared-kernel").Result<
    import("./state-transition-coordination-result").StateTransitionCoordinationResult,
    import("./state-transition-coordination-denial").StateTransitionCoordinationDenial
  >;
};
