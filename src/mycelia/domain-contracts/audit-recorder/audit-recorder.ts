import type {
  Result,
} from "../../foundation/shared-kernel";
import type {
  AuditRecord,
  AuditRecordInput,
} from "../../domain-contracts/audit-record";

import type { AuditRecorderDenial } from "./audit-recorder-denial";
import type { AuditRecordingRequest } from "./audit-recording-request";
import type { AuditRecordingResult } from "./audit-recording-result";

export function createAuditRecordDescriptorInput(
  request: AuditRecordingRequest,
): AuditRecordInput {
  return {
    audit_record_id: `${request.audit_recording_request_id}.audit_record`,
    tenant_id: request.tenant_id,
    kind: request.kind,
    actor_ref: request.actor_ref,
    subject_ref: request.subject_ref,
    evidence_ref: request.evidence_ref,
    outcome: request.outcome,
    reason_code: request.reason_code,
    message: request.message,
    data_classification: request.data_classification,
    recorded_at: request.requested_at,
    correlation_id: request.correlation_id,
    causation_id: request.causation_id,
    source_event_id: request.source_event_id,
    metadata: request.metadata,
  };
}

export type AuditRecorderRecordedDescriptor = {
  readonly audit_record: AuditRecord;
};

export type AuditRecorder = {
  readonly record: (
    input: unknown,
  ) => Result<AuditRecordingResult, AuditRecorderDenial>;
};
