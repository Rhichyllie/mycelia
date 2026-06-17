import { z } from "zod";

import { err, ok, type Result } from "../shared-kernel";

export const RUNTIME_REPOSITORY_LAYER_PHASE = "3B";

export const RUNTIME_REPOSITORY_LAYER_NAME = "Runtime Repository Layer";

export const RUNTIME_REPOSITORY_LAYER_STATUS =
  "injected-client repository boundary only";

export const RuntimeRepositoryRecordKinds = [
  "GOVERNED_RUN",
  "RUNTIME_STATE_SNAPSHOT",
  "POLICY_DECISION_RECORD",
  "ADMISSION_DECISION_RECORD",
  "APPROVAL_REQUEST",
  "AUDIT_RECORD",
] as const;

export type RuntimeRepositoryRecordKind =
  (typeof RuntimeRepositoryRecordKinds)[number];

export const RuntimeRepositoryWriteIntents = [
  "CREATE_GOVERNED_RUN",
  "CREATE_RUNTIME_STATE_SNAPSHOT",
  "CREATE_POLICY_DECISION_RECORD",
  "CREATE_ADMISSION_DECISION_RECORD",
  "CREATE_APPROVAL_REQUEST",
  "UPDATE_APPROVAL_REQUEST_DECISION",
  "CREATE_AUDIT_RECORD",
] as const;

export type RuntimeRepositoryWriteIntent =
  (typeof RuntimeRepositoryWriteIntents)[number];

export const RuntimeRepositoryReadIntents = [
  "FIND_GOVERNED_RUN_BY_TENANT_AND_CORRELATION",
  "LIST_RUNTIME_STATE_SNAPSHOTS_BY_RUN",
  "LIST_POLICY_DECISION_RECORDS_BY_RUN",
  "LIST_ADMISSION_DECISION_RECORDS_BY_RUN",
  "LIST_APPROVAL_REQUESTS_BY_RUN",
  "LIST_AUDIT_RECORDS_BY_RUN",
] as const;

export type RuntimeRepositoryReadIntent =
  (typeof RuntimeRepositoryReadIntents)[number];

export type RuntimeRepositoryIntent =
  | RuntimeRepositoryWriteIntent
  | RuntimeRepositoryReadIntent;

export const RuntimeRepositoryRecordKindSchema = z.enum(
  RuntimeRepositoryRecordKinds,
);

export const RuntimeRepositoryWriteIntentSchema = z.enum(
  RuntimeRepositoryWriteIntents,
);

export const RuntimeRepositoryReadIntentSchema = z.enum(
  RuntimeRepositoryReadIntents,
);

export const RuntimeRepositoryDenialCodeSchema = z.enum([
  "RUNTIME_REPOSITORY_CLIENT_REQUIRED",
  "RUNTIME_REPOSITORY_CLIENT_INVALID",
  "RUNTIME_REPOSITORY_INPUT_INVALID",
  "RUNTIME_REPOSITORY_CLIENT_ERROR",
  "RUNTIME_REPOSITORY_CLIENT_RETURN_INVALID",
]);

export type RuntimeRepositoryDenialCode = z.infer<
  typeof RuntimeRepositoryDenialCodeSchema
>;

const UNSAFE_REPOSITORY_TEXT_PATTERN =
  /(@|https?:\/\/|www\.|authorization|api[_-]?key|bearer|binary|blob|credential|document[_-]?content|file[_-]?blob|password|payload|private[_-]?key|raw|secret|token)/i;

const RuntimeRepositorySafeRefSchema = z
  .string()
  .min(1)
  .max(160)
  .refine(
    (value) => value.trim() === value,
    "repository refs must not contain leading or trailing whitespace.",
  )
  .refine(
    (value) => !UNSAFE_REPOSITORY_TEXT_PATTERN.test(value),
    "repository refs must be safe opaque references.",
  );

const RuntimeRepositorySafeSummarySchema = z
  .string()
  .min(1)
  .max(360)
  .refine(
    (value) => !UNSAFE_REPOSITORY_TEXT_PATTERN.test(value),
    "repository summaries must be safe.",
  );

const RuntimeRepositoryReasonCodeSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Z][A-Z0-9_]*$/);

const RuntimeRepositoryDateTimeSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$/);

const GovernedRunRecordSchema = z
  .object({
    id: RuntimeRepositorySafeRefSchema,
    tenantId: RuntimeRepositorySafeRefSchema,
    correlationId: RuntimeRepositorySafeRefSchema,
    currentState: RuntimeRepositorySafeRefSchema,
    status: RuntimeRepositorySafeRefSchema,
    resourceRef: RuntimeRepositorySafeRefSchema,
    requesterRef: RuntimeRepositorySafeRefSchema,
    purpose: RuntimeRepositorySafeSummarySchema,
    createdAt: RuntimeRepositoryDateTimeSchema,
    updatedAt: RuntimeRepositoryDateTimeSchema,
  })
  .strict();

const RuntimeStateSnapshotRecordSchema = z
  .object({
    id: RuntimeRepositorySafeRefSchema,
    tenantId: RuntimeRepositorySafeRefSchema,
    governedRunId: RuntimeRepositorySafeRefSchema,
    state: RuntimeRepositorySafeRefSchema,
    sequence: z.number().int().positive(),
    reasonCode: RuntimeRepositoryReasonCodeSchema,
    safeSummary: RuntimeRepositorySafeSummarySchema,
    createdAt: RuntimeRepositoryDateTimeSchema,
  })
  .strict();

const PolicyDecisionRecordSchema = z
  .object({
    id: RuntimeRepositorySafeRefSchema,
    tenantId: RuntimeRepositorySafeRefSchema,
    governedRunId: RuntimeRepositorySafeRefSchema,
    riskLevel: RuntimeRepositorySafeRefSchema,
    outcome: RuntimeRepositorySafeRefSchema,
    reasonCode: RuntimeRepositoryReasonCodeSchema,
    safeSummary: RuntimeRepositorySafeSummarySchema,
    policyRef: RuntimeRepositorySafeRefSchema,
    createdAt: RuntimeRepositoryDateTimeSchema,
  })
  .strict();

const AdmissionDecisionRecordSchema = z
  .object({
    id: RuntimeRepositorySafeRefSchema,
    tenantId: RuntimeRepositorySafeRefSchema,
    governedRunId: RuntimeRepositorySafeRefSchema,
    outcome: RuntimeRepositorySafeRefSchema,
    reasonCode: RuntimeRepositoryReasonCodeSchema,
    safeSummary: RuntimeRepositorySafeSummarySchema,
    lifecycleIntentHint: RuntimeRepositorySafeRefSchema,
    createdAt: RuntimeRepositoryDateTimeSchema,
  })
  .strict();

const ApprovalRequestRecordSchema = z
  .object({
    id: RuntimeRepositorySafeRefSchema,
    tenantId: RuntimeRepositorySafeRefSchema,
    governedRunId: RuntimeRepositorySafeRefSchema,
    admissionDecisionRecordId: RuntimeRepositorySafeRefSchema,
    status: RuntimeRepositorySafeRefSchema,
    requestedRole: RuntimeRepositorySafeRefSchema,
    requesterRef: RuntimeRepositorySafeRefSchema,
    approverRef: RuntimeRepositorySafeRefSchema.optional(),
    decisionOutcome: RuntimeRepositorySafeRefSchema.optional(),
    decisionReasonCode: RuntimeRepositoryReasonCodeSchema.optional(),
    safeDecisionSummary: RuntimeRepositorySafeSummarySchema.optional(),
    createdAt: RuntimeRepositoryDateTimeSchema,
    decidedAt: RuntimeRepositoryDateTimeSchema.optional(),
  })
  .strict();

const AuditRecordSchema = z
  .object({
    id: RuntimeRepositorySafeRefSchema,
    tenantId: RuntimeRepositorySafeRefSchema,
    governedRunId: RuntimeRepositorySafeRefSchema,
    moment: RuntimeRepositorySafeRefSchema,
    requirement: RuntimeRepositorySafeRefSchema,
    recordKindHint: RuntimeRepositorySafeRefSchema,
    reasonCode: RuntimeRepositoryReasonCodeSchema,
    safeSummary: RuntimeRepositorySafeSummarySchema,
    subjectRef: RuntimeRepositorySafeRefSchema,
    actorRef: RuntimeRepositorySafeRefSchema.optional(),
    evidenceRef: RuntimeRepositorySafeRefSchema.optional(),
    createdAt: RuntimeRepositoryDateTimeSchema,
  })
  .strict();

export type RuntimeRepositoryGovernedRunRecord = z.infer<
  typeof GovernedRunRecordSchema
>;
export type RuntimeRepositoryStateSnapshotRecord = z.infer<
  typeof RuntimeStateSnapshotRecordSchema
>;
export type RuntimeRepositoryPolicyDecisionRecord = z.infer<
  typeof PolicyDecisionRecordSchema
>;
export type RuntimeRepositoryAdmissionDecisionRecord = z.infer<
  typeof AdmissionDecisionRecordSchema
>;
export type RuntimeRepositoryApprovalRequestRecord = z.infer<
  typeof ApprovalRequestRecordSchema
>;
export type RuntimeRepositoryAuditRecord = z.infer<typeof AuditRecordSchema>;

const ApprovalRequestDecisionInputSchema = z
  .object({
    tenantId: RuntimeRepositorySafeRefSchema,
    governedRunId: RuntimeRepositorySafeRefSchema,
    approvalRequestId: RuntimeRepositorySafeRefSchema,
    nextStatus: RuntimeRepositorySafeRefSchema,
    approverRef: RuntimeRepositorySafeRefSchema.optional(),
    decisionOutcome: RuntimeRepositorySafeRefSchema,
    decisionReasonCode: RuntimeRepositoryReasonCodeSchema,
    safeDecisionSummary: RuntimeRepositorySafeSummarySchema,
    decidedAt: RuntimeRepositoryDateTimeSchema,
  })
  .strict();

export type RuntimeRepositoryApprovalRequestDecisionInput = z.infer<
  typeof ApprovalRequestDecisionInputSchema
>;

export type RuntimeRepositoryRecord =
  | RuntimeRepositoryGovernedRunRecord
  | RuntimeRepositoryStateSnapshotRecord
  | RuntimeRepositoryPolicyDecisionRecord
  | RuntimeRepositoryAdmissionDecisionRecord
  | RuntimeRepositoryApprovalRequestRecord
  | RuntimeRepositoryAuditRecord;

export const RuntimeRepositoryRecordSchemas = {
  GOVERNED_RUN: GovernedRunRecordSchema,
  RUNTIME_STATE_SNAPSHOT: RuntimeStateSnapshotRecordSchema,
  POLICY_DECISION_RECORD: PolicyDecisionRecordSchema,
  ADMISSION_DECISION_RECORD: AdmissionDecisionRecordSchema,
  APPROVAL_REQUEST: ApprovalRequestRecordSchema,
  AUDIT_RECORD: AuditRecordSchema,
} as const;

const ReadByCorrelationInputSchema = z
  .object({
    tenantId: RuntimeRepositorySafeRefSchema,
    correlationId: RuntimeRepositorySafeRefSchema,
  })
  .strict();

const ReadByRunInputSchema = z
  .object({
    tenantId: RuntimeRepositorySafeRefSchema,
    governedRunId: RuntimeRepositorySafeRefSchema,
  })
  .strict();

export type RuntimeRepositoryReadByCorrelationInput = z.infer<
  typeof ReadByCorrelationInputSchema
>;
export type RuntimeRepositoryReadByRunInput = z.infer<
  typeof ReadByRunInputSchema
>;

export const RuntimeRepositoryDenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    code: RuntimeRepositoryDenialCodeSchema,
    safeReason: RuntimeRepositorySafeSummarySchema,
    intent: z
      .union([RuntimeRepositoryWriteIntentSchema, RuntimeRepositoryReadIntentSchema])
      .optional(),
    recordKind: RuntimeRepositoryRecordKindSchema.optional(),
    safe: z.literal(true),
  })
  .strict();

export type RuntimeRepositoryDenial = z.infer<
  typeof RuntimeRepositoryDenialSchema
>;

export type RuntimeRepositoryResult<T> = Result<T, RuntimeRepositoryDenial>;

export type RuntimeRepositoryWriteResult = {
  readonly intent: RuntimeRepositoryWriteIntent;
  readonly recordKind: RuntimeRepositoryRecordKind;
  readonly record: RuntimeRepositoryRecord;
  readonly safeSummary: string;
};

export type RuntimeRepositoryFindResult = {
  readonly intent: "FIND_GOVERNED_RUN_BY_TENANT_AND_CORRELATION";
  readonly recordKind: "GOVERNED_RUN";
  readonly found: boolean;
  readonly record: RuntimeRepositoryGovernedRunRecord | null;
  readonly safeSummary: string;
};

export type RuntimeRepositoryListResult = {
  readonly intent: Exclude<
    RuntimeRepositoryReadIntent,
    "FIND_GOVERNED_RUN_BY_TENANT_AND_CORRELATION"
  >;
  readonly recordKind: Exclude<RuntimeRepositoryRecordKind, "GOVERNED_RUN">;
  readonly records: readonly RuntimeRepositoryRecord[];
  readonly safeSummary: string;
};

type MaybePromise<T> = T | Promise<T>;

export type RuntimeRepositoryClient = {
  readonly createGovernedRun: (
    input: RuntimeRepositoryGovernedRunRecord,
  ) => MaybePromise<unknown>;
  readonly createRuntimeStateSnapshot: (
    input: RuntimeRepositoryStateSnapshotRecord,
  ) => MaybePromise<unknown>;
  readonly createPolicyDecisionRecord: (
    input: RuntimeRepositoryPolicyDecisionRecord,
  ) => MaybePromise<unknown>;
  readonly createAdmissionDecisionRecord: (
    input: RuntimeRepositoryAdmissionDecisionRecord,
  ) => MaybePromise<unknown>;
  readonly createApprovalRequest: (
    input: RuntimeRepositoryApprovalRequestRecord,
  ) => MaybePromise<unknown>;
  readonly updateApprovalRequestDecision: (
    input: RuntimeRepositoryApprovalRequestDecisionInput,
  ) => MaybePromise<unknown>;
  readonly createAuditRecord: (
    input: RuntimeRepositoryAuditRecord,
  ) => MaybePromise<unknown>;
  readonly findGovernedRunByTenantAndCorrelation: (
    input: RuntimeRepositoryReadByCorrelationInput,
  ) => MaybePromise<unknown>;
  readonly listRuntimeStateSnapshotsByRun: (
    input: RuntimeRepositoryReadByRunInput,
  ) => MaybePromise<unknown>;
  readonly listPolicyDecisionRecordsByRun: (
    input: RuntimeRepositoryReadByRunInput,
  ) => MaybePromise<unknown>;
  readonly listAdmissionDecisionRecordsByRun: (
    input: RuntimeRepositoryReadByRunInput,
  ) => MaybePromise<unknown>;
  readonly listApprovalRequestsByRun: (
    input: RuntimeRepositoryReadByRunInput,
  ) => MaybePromise<unknown>;
  readonly listAuditRecordsByRun: (
    input: RuntimeRepositoryReadByRunInput,
  ) => MaybePromise<unknown>;
};

export type RuntimeRepositoryLayer = {
  readonly createGovernedRun: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryWriteResult>>;
  readonly createRuntimeStateSnapshot: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryWriteResult>>;
  readonly createPolicyDecisionRecord: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryWriteResult>>;
  readonly createAdmissionDecisionRecord: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryWriteResult>>;
  readonly createApprovalRequest: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryWriteResult>>;
  readonly updateApprovalRequestDecision: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryWriteResult>>;
  readonly createAuditRecord: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryWriteResult>>;
  readonly findGovernedRunByTenantAndCorrelation: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryFindResult>>;
  readonly listRuntimeStateSnapshotsByRun: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryListResult>>;
  readonly listPolicyDecisionRecordsByRun: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryListResult>>;
  readonly listAdmissionDecisionRecordsByRun: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryListResult>>;
  readonly listApprovalRequestsByRun: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryListResult>>;
  readonly listAuditRecordsByRun: (
    input: unknown,
  ) => Promise<RuntimeRepositoryResult<RuntimeRepositoryListResult>>;
};

const CLIENT_METHODS = [
  "createGovernedRun",
  "createRuntimeStateSnapshot",
  "createPolicyDecisionRecord",
  "createAdmissionDecisionRecord",
  "createApprovalRequest",
  "updateApprovalRequestDecision",
  "createAuditRecord",
  "findGovernedRunByTenantAndCorrelation",
  "listRuntimeStateSnapshotsByRun",
  "listPolicyDecisionRecordsByRun",
  "listAdmissionDecisionRecordsByRun",
  "listApprovalRequestsByRun",
  "listAuditRecordsByRun",
] as const satisfies readonly (keyof RuntimeRepositoryClient)[];

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function isClient(input: unknown): input is RuntimeRepositoryClient {
  if (!isRecord(input)) {
    return false;
  }

  return CLIENT_METHODS.every((method) => typeof input[method] === "function");
}

function safeReasonFor(code: RuntimeRepositoryDenialCode): string {
  const reasons: Record<RuntimeRepositoryDenialCode, string> = {
    RUNTIME_REPOSITORY_CLIENT_REQUIRED:
      "A runtime repository client must be injected.",
    RUNTIME_REPOSITORY_CLIENT_INVALID:
      "The injected runtime repository client is incomplete.",
    RUNTIME_REPOSITORY_INPUT_INVALID:
      "The runtime repository input is invalid or unsafe.",
    RUNTIME_REPOSITORY_CLIENT_ERROR:
      "The runtime repository client could not complete the operation.",
    RUNTIME_REPOSITORY_CLIENT_RETURN_INVALID:
      "The runtime repository client returned an invalid record descriptor.",
  };

  return reasons[code];
}

export function failClosedRuntimeRepositoryDenial(
  code: RuntimeRepositoryDenialCode = "RUNTIME_REPOSITORY_INPUT_INVALID",
  intent?: RuntimeRepositoryIntent,
  recordKind?: RuntimeRepositoryRecordKind,
): RuntimeRepositoryDenial {
  return RuntimeRepositoryDenialSchema.parse({
    outcome: "DENIED",
    code,
    safeReason: safeReasonFor(code),
    intent,
    recordKind,
    safe: true,
  });
}

function parseRecord(
  recordKind: RuntimeRepositoryRecordKind,
  input: unknown,
): RuntimeRepositoryResult<RuntimeRepositoryRecord> {
  const parsed = RuntimeRepositoryRecordSchemas[recordKind].safeParse(input);

  if (!parsed.success) {
    return err(
      failClosedRuntimeRepositoryDenial(
        "RUNTIME_REPOSITORY_INPUT_INVALID",
        undefined,
        recordKind,
      ),
    );
  }

  return ok(parsed.data);
}

function validateClientReturn(
  recordKind: RuntimeRepositoryRecordKind,
  input: unknown,
  expectedTenantId?: string,
  expectedRunId?: string,
): RuntimeRepositoryResult<RuntimeRepositoryRecord> {
  const parsed = RuntimeRepositoryRecordSchemas[recordKind].safeParse(input);

  if (!parsed.success) {
    return err(
      failClosedRuntimeRepositoryDenial(
        "RUNTIME_REPOSITORY_CLIENT_RETURN_INVALID",
        undefined,
        recordKind,
      ),
    );
  }

  if (
    expectedTenantId !== undefined &&
    parsed.data.tenantId !== expectedTenantId
  ) {
    return err(
      failClosedRuntimeRepositoryDenial(
        "RUNTIME_REPOSITORY_CLIENT_RETURN_INVALID",
        undefined,
        recordKind,
      ),
    );
  }

  if (
    expectedRunId !== undefined &&
    "governedRunId" in parsed.data &&
    parsed.data.governedRunId !== expectedRunId
  ) {
    return err(
      failClosedRuntimeRepositoryDenial(
        "RUNTIME_REPOSITORY_CLIENT_RETURN_INVALID",
        undefined,
        recordKind,
      ),
    );
  }

  return ok(parsed.data);
}

async function writeRecord(
  clientCall: () => MaybePromise<unknown>,
  intent: RuntimeRepositoryWriteIntent,
  recordKind: RuntimeRepositoryRecordKind,
  input: RuntimeRepositoryRecord,
): Promise<RuntimeRepositoryResult<RuntimeRepositoryWriteResult>> {
  try {
    const clientRecord = await clientCall();
    const parsed = validateClientReturn(
      recordKind,
      clientRecord,
      input.tenantId,
      "governedRunId" in input ? input.governedRunId : undefined,
    );

    if (!parsed.ok) {
      return parsed;
    }

    return ok({
      intent,
      recordKind,
      record: parsed.value,
      safeSummary: "Runtime repository write completed with safe descriptor.",
    });
  } catch {
    return err(
      failClosedRuntimeRepositoryDenial(
        "RUNTIME_REPOSITORY_CLIENT_ERROR",
        intent,
        recordKind,
      ),
    );
  }
}

async function listRecords(
  clientCall: () => MaybePromise<unknown>,
  intent: RuntimeRepositoryListResult["intent"],
  recordKind: RuntimeRepositoryListResult["recordKind"],
  input: RuntimeRepositoryReadByRunInput,
): Promise<RuntimeRepositoryResult<RuntimeRepositoryListResult>> {
  try {
    const clientRecords = await clientCall();

    if (!Array.isArray(clientRecords)) {
      return err(
        failClosedRuntimeRepositoryDenial(
          "RUNTIME_REPOSITORY_CLIENT_RETURN_INVALID",
          intent,
          recordKind,
        ),
      );
    }

    const records: RuntimeRepositoryRecord[] = [];

    for (const clientRecord of clientRecords) {
      const parsed = validateClientReturn(
        recordKind,
        clientRecord,
        input.tenantId,
        input.governedRunId,
      );

      if (!parsed.ok) {
        return parsed;
      }

      records.push(parsed.value);
    }

    return ok({
      intent,
      recordKind,
      records,
      safeSummary:
        "Runtime repository read returned safe descriptors without inference.",
    });
  } catch {
    return err(
      failClosedRuntimeRepositoryDenial(
        "RUNTIME_REPOSITORY_CLIENT_ERROR",
        intent,
        recordKind,
      ),
    );
  }
}

function parseReadByRun(
  input: unknown,
  intent: RuntimeRepositoryReadIntent,
): RuntimeRepositoryResult<RuntimeRepositoryReadByRunInput> {
  const parsed = ReadByRunInputSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      failClosedRuntimeRepositoryDenial(
        "RUNTIME_REPOSITORY_INPUT_INVALID",
        intent,
      ),
    );
  }

  return ok(parsed.data);
}

function parseApprovalRequestDecisionInput(
  input: unknown,
): RuntimeRepositoryResult<RuntimeRepositoryApprovalRequestDecisionInput> {
  const parsed = ApprovalRequestDecisionInputSchema.safeParse(input);

  if (!parsed.success) {
    return err(
      failClosedRuntimeRepositoryDenial(
        "RUNTIME_REPOSITORY_INPUT_INVALID",
        "UPDATE_APPROVAL_REQUEST_DECISION",
        "APPROVAL_REQUEST",
      ),
    );
  }

  return ok(parsed.data);
}

function createWriteOperation(
  client: RuntimeRepositoryClient,
  intent: RuntimeRepositoryWriteIntent,
  recordKind: RuntimeRepositoryRecordKind,
  clientMethod: keyof Pick<
    RuntimeRepositoryClient,
    | "createGovernedRun"
    | "createRuntimeStateSnapshot"
    | "createPolicyDecisionRecord"
    | "createAdmissionDecisionRecord"
    | "createApprovalRequest"
    | "updateApprovalRequestDecision"
    | "createAuditRecord"
  >,
) {
  return async (
    input: unknown,
  ): Promise<RuntimeRepositoryResult<RuntimeRepositoryWriteResult>> => {
    const parsed = parseRecord(recordKind, input);

    if (!parsed.ok) {
      return err(
        failClosedRuntimeRepositoryDenial(
          parsed.error.code,
          intent,
          recordKind,
        ),
      );
    }

    return writeRecord(
      () => client[clientMethod](parsed.value as never),
      intent,
      recordKind,
      parsed.value,
    );
  };
}

export function createRuntimeRepositoryLayer(
  client: unknown,
): RuntimeRepositoryResult<RuntimeRepositoryLayer> {
  if (client === undefined || client === null) {
    return err(
      failClosedRuntimeRepositoryDenial(
        "RUNTIME_REPOSITORY_CLIENT_REQUIRED",
      ),
    );
  }

  if (!isClient(client)) {
    return err(
      failClosedRuntimeRepositoryDenial("RUNTIME_REPOSITORY_CLIENT_INVALID"),
    );
  }

  return ok({
    createGovernedRun: createWriteOperation(
      client,
      "CREATE_GOVERNED_RUN",
      "GOVERNED_RUN",
      "createGovernedRun",
    ),
    createRuntimeStateSnapshot: createWriteOperation(
      client,
      "CREATE_RUNTIME_STATE_SNAPSHOT",
      "RUNTIME_STATE_SNAPSHOT",
      "createRuntimeStateSnapshot",
    ),
    createPolicyDecisionRecord: createWriteOperation(
      client,
      "CREATE_POLICY_DECISION_RECORD",
      "POLICY_DECISION_RECORD",
      "createPolicyDecisionRecord",
    ),
    createAdmissionDecisionRecord: createWriteOperation(
      client,
      "CREATE_ADMISSION_DECISION_RECORD",
      "ADMISSION_DECISION_RECORD",
      "createAdmissionDecisionRecord",
    ),
    createApprovalRequest: createWriteOperation(
      client,
      "CREATE_APPROVAL_REQUEST",
      "APPROVAL_REQUEST",
      "createApprovalRequest",
    ),
    updateApprovalRequestDecision: async (input) => {
      const parsed = parseApprovalRequestDecisionInput(input);

      if (!parsed.ok) {
        return parsed;
      }

      try {
        const clientRecord = await client.updateApprovalRequestDecision(
          parsed.value,
        );
        const record = validateClientReturn(
          "APPROVAL_REQUEST",
          clientRecord,
          parsed.value.tenantId,
          parsed.value.governedRunId,
        );

        if (!record.ok) {
          return err(
            failClosedRuntimeRepositoryDenial(
              record.error.code,
              "UPDATE_APPROVAL_REQUEST_DECISION",
              "APPROVAL_REQUEST",
            ),
          );
        }

        if (
          !("id" in record.value) ||
          record.value.id !== parsed.value.approvalRequestId
        ) {
          return err(
            failClosedRuntimeRepositoryDenial(
              "RUNTIME_REPOSITORY_CLIENT_RETURN_INVALID",
              "UPDATE_APPROVAL_REQUEST_DECISION",
              "APPROVAL_REQUEST",
            ),
          );
        }

        return ok({
          intent: "UPDATE_APPROVAL_REQUEST_DECISION",
          recordKind: "APPROVAL_REQUEST",
          record: record.value,
          safeSummary:
            "Runtime repository approval decision update completed with safe descriptor.",
        });
      } catch {
        return err(
          failClosedRuntimeRepositoryDenial(
            "RUNTIME_REPOSITORY_CLIENT_ERROR",
            "UPDATE_APPROVAL_REQUEST_DECISION",
            "APPROVAL_REQUEST",
          ),
        );
      }
    },
    createAuditRecord: createWriteOperation(
      client,
      "CREATE_AUDIT_RECORD",
      "AUDIT_RECORD",
      "createAuditRecord",
    ),
    findGovernedRunByTenantAndCorrelation: async (input) => {
      const parsed = ReadByCorrelationInputSchema.safeParse(input);

      if (!parsed.success) {
        return err(
          failClosedRuntimeRepositoryDenial(
            "RUNTIME_REPOSITORY_INPUT_INVALID",
            "FIND_GOVERNED_RUN_BY_TENANT_AND_CORRELATION",
            "GOVERNED_RUN",
          ),
        );
      }

      try {
        const clientRecord =
          await client.findGovernedRunByTenantAndCorrelation(parsed.data);

        if (clientRecord === null || clientRecord === undefined) {
          return ok({
            intent: "FIND_GOVERNED_RUN_BY_TENANT_AND_CORRELATION",
            recordKind: "GOVERNED_RUN",
            found: false,
            record: null,
            safeSummary:
              "Runtime repository read returned no record descriptor.",
          });
        }

        const record = validateClientReturn(
          "GOVERNED_RUN",
          clientRecord,
          parsed.data.tenantId,
        );

        if (!record.ok) {
          return err(
            failClosedRuntimeRepositoryDenial(
              record.error.code,
              "FIND_GOVERNED_RUN_BY_TENANT_AND_CORRELATION",
              "GOVERNED_RUN",
            ),
          );
        }

        return ok({
          intent: "FIND_GOVERNED_RUN_BY_TENANT_AND_CORRELATION",
          recordKind: "GOVERNED_RUN",
          found: true,
          record: record.value as RuntimeRepositoryGovernedRunRecord,
          safeSummary:
            "Runtime repository read returned one safe governed run descriptor.",
        });
      } catch {
        return err(
          failClosedRuntimeRepositoryDenial(
            "RUNTIME_REPOSITORY_CLIENT_ERROR",
            "FIND_GOVERNED_RUN_BY_TENANT_AND_CORRELATION",
            "GOVERNED_RUN",
          ),
        );
      }
    },
    listRuntimeStateSnapshotsByRun: async (input) => {
      const parsed = parseReadByRun(
        input,
        "LIST_RUNTIME_STATE_SNAPSHOTS_BY_RUN",
      );

      if (!parsed.ok) {
        return parsed;
      }

      return listRecords(
        () => client.listRuntimeStateSnapshotsByRun(parsed.value),
        "LIST_RUNTIME_STATE_SNAPSHOTS_BY_RUN",
        "RUNTIME_STATE_SNAPSHOT",
        parsed.value,
      );
    },
    listPolicyDecisionRecordsByRun: async (input) => {
      const parsed = parseReadByRun(
        input,
        "LIST_POLICY_DECISION_RECORDS_BY_RUN",
      );

      if (!parsed.ok) {
        return parsed;
      }

      return listRecords(
        () => client.listPolicyDecisionRecordsByRun(parsed.value),
        "LIST_POLICY_DECISION_RECORDS_BY_RUN",
        "POLICY_DECISION_RECORD",
        parsed.value,
      );
    },
    listAdmissionDecisionRecordsByRun: async (input) => {
      const parsed = parseReadByRun(
        input,
        "LIST_ADMISSION_DECISION_RECORDS_BY_RUN",
      );

      if (!parsed.ok) {
        return parsed;
      }

      return listRecords(
        () => client.listAdmissionDecisionRecordsByRun(parsed.value),
        "LIST_ADMISSION_DECISION_RECORDS_BY_RUN",
        "ADMISSION_DECISION_RECORD",
        parsed.value,
      );
    },
    listApprovalRequestsByRun: async (input) => {
      const parsed = parseReadByRun(input, "LIST_APPROVAL_REQUESTS_BY_RUN");

      if (!parsed.ok) {
        return parsed;
      }

      return listRecords(
        () => client.listApprovalRequestsByRun(parsed.value),
        "LIST_APPROVAL_REQUESTS_BY_RUN",
        "APPROVAL_REQUEST",
        parsed.value,
      );
    },
    listAuditRecordsByRun: async (input) => {
      const parsed = parseReadByRun(input, "LIST_AUDIT_RECORDS_BY_RUN");

      if (!parsed.ok) {
        return parsed;
      }

      return listRecords(
        () => client.listAuditRecordsByRun(parsed.value),
        "LIST_AUDIT_RECORDS_BY_RUN",
        "AUDIT_RECORD",
        parsed.value,
      );
    },
  });
}

export function assertRuntimeRepositoryResult<T>(
  result: RuntimeRepositoryResult<T>,
): T {
  if (!result.ok) {
    throw new Error("Runtime repository operation denied.");
  }

  return result.value;
}
