import { z } from "zod";

import { err, ok, type Result } from "../../foundation/shared-kernel";
import type {
  RuntimeRepositoryAdmissionDecisionRecord,
  RuntimeRepositoryApprovalRequestDecisionInput,
  RuntimeRepositoryApprovalRequestRecord,
  RuntimeRepositoryAuditRecord,
  RuntimeRepositoryClient,
  RuntimeRepositoryGovernedRunRecord,
  RuntimeRepositoryPolicyDecisionRecord,
  RuntimeRepositoryReadByCorrelationInput,
  RuntimeRepositoryReadByRunInput,
  RuntimeRepositoryStateSnapshotRecord,
} from "../../persistence/runtime-repository-layer";

export const PRISMA_RUNTIME_REPOSITORY_ADAPTER_PHASE = "3C";

export const PRISMA_RUNTIME_REPOSITORY_ADAPTER_NAME =
  "Prisma Runtime Repository Adapter";

export const PRISMA_RUNTIME_REPOSITORY_ADAPTER_STATUS =
  "injected Prisma-like repository adapter only";

type MaybePromise<T> = T | Promise<T>;

type PrismaLikeCreateDelegate = {
  readonly create: (args: { readonly data: Record<string, unknown> }) =>
    MaybePromise<unknown>;
};

type PrismaLikeFindDelegate = {
  readonly findFirst: (args: {
    readonly where: Record<string, unknown>;
  }) => MaybePromise<unknown>;
};

type PrismaLikeListDelegate = {
  readonly findMany: (args: {
    readonly where: Record<string, unknown>;
    readonly orderBy?: Record<string, "asc" | "desc">;
  }) => MaybePromise<unknown>;
};

type PrismaLikeUpdateDelegate = {
  readonly update: (args: {
    readonly where: Record<string, unknown>;
    readonly data: Record<string, unknown>;
  }) => MaybePromise<unknown>;
};

type PrismaLikeModelDelegate =
  & PrismaLikeCreateDelegate
  & Partial<PrismaLikeFindDelegate>
  & Partial<PrismaLikeListDelegate>;

export type PrismaRuntimeRepositoryLikeClient = {
  readonly governedRun: PrismaLikeModelDelegate & PrismaLikeFindDelegate;
  readonly runtimeStateSnapshot:
    PrismaLikeModelDelegate & PrismaLikeListDelegate;
  readonly policyDecisionRecord:
    PrismaLikeModelDelegate & PrismaLikeListDelegate;
  readonly admissionDecisionRecord:
    PrismaLikeModelDelegate & PrismaLikeListDelegate;
  readonly approvalRequest:
    PrismaLikeModelDelegate & PrismaLikeListDelegate & PrismaLikeUpdateDelegate;
  readonly auditRecord: PrismaLikeModelDelegate & PrismaLikeListDelegate;
};

export const PrismaRuntimeRepositoryAdapterDenialCodeSchema = z.enum([
  "PRISMA_RUNTIME_REPOSITORY_CLIENT_REQUIRED",
  "PRISMA_RUNTIME_REPOSITORY_CLIENT_INVALID",
]);

export type PrismaRuntimeRepositoryAdapterDenialCode = z.infer<
  typeof PrismaRuntimeRepositoryAdapterDenialCodeSchema
>;

export const PrismaRuntimeRepositoryAdapterDenialSchema = z
  .object({
    outcome: z.literal("DENIED"),
    code: PrismaRuntimeRepositoryAdapterDenialCodeSchema,
    safeReason: z.string().min(1).max(240),
    safe: z.literal(true),
  })
  .strict();

export type PrismaRuntimeRepositoryAdapterDenial = z.infer<
  typeof PrismaRuntimeRepositoryAdapterDenialSchema
>;

export type PrismaRuntimeRepositoryAdapter = {
  readonly phase: typeof PRISMA_RUNTIME_REPOSITORY_ADAPTER_PHASE;
  readonly name: typeof PRISMA_RUNTIME_REPOSITORY_ADAPTER_NAME;
  readonly status: typeof PRISMA_RUNTIME_REPOSITORY_ADAPTER_STATUS;
  readonly client: RuntimeRepositoryClient;
  readonly implementedMethods: readonly string[];
  readonly boundary: readonly string[];
};

export type PrismaRuntimeRepositoryAdapterResult = Result<
  PrismaRuntimeRepositoryAdapter,
  PrismaRuntimeRepositoryAdapterDenial
>;

const IMPLEMENTED_METHODS = [
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
] as const;

const ADAPTER_BOUNDARY = [
  "client is injected",
  "no global database client is created",
  "no database connection is opened at import time",
  "errors are converted to generic adapter failures",
  "tenant and run filtering are delegated explicitly",
  "raw document content is not accepted by this adapter contract",
] as const;

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function hasFunction(
  input: unknown,
  property: string,
): input is Record<string, unknown> {
  return isRecord(input) && typeof input[property] === "function";
}

function hasDelegate(input: unknown, delegateName: string): boolean {
  if (!isRecord(input)) {
    return false;
  }

  const delegate = input[delegateName];

  return hasFunction(delegate, "create");
}

function hasFindDelegate(input: unknown, delegateName: string): boolean {
  if (!isRecord(input)) {
    return false;
  }

  const delegate = input[delegateName];

  return hasFunction(delegate, "findFirst");
}

function hasListDelegate(input: unknown, delegateName: string): boolean {
  if (!isRecord(input)) {
    return false;
  }

  const delegate = input[delegateName];

  return hasFunction(delegate, "findMany");
}

function hasUpdateDelegate(input: unknown, delegateName: string): boolean {
  if (!isRecord(input)) {
    return false;
  }

  const delegate = input[delegateName];

  return hasFunction(delegate, "update");
}

function isPrismaLikeClient(
  input: unknown,
): input is PrismaRuntimeRepositoryLikeClient {
  const createDelegates = [
    "governedRun",
    "runtimeStateSnapshot",
    "policyDecisionRecord",
    "admissionDecisionRecord",
    "approvalRequest",
    "auditRecord",
  ];
  const listDelegates = [
    "runtimeStateSnapshot",
    "policyDecisionRecord",
    "admissionDecisionRecord",
    "approvalRequest",
    "auditRecord",
  ];

  return (
    createDelegates.every((delegate) => hasDelegate(input, delegate)) &&
    hasFindDelegate(input, "governedRun") &&
    hasUpdateDelegate(input, "approvalRequest") &&
    listDelegates.every((delegate) => hasListDelegate(input, delegate))
  );
}

function safeReasonFor(
  code: PrismaRuntimeRepositoryAdapterDenialCode,
): string {
  if (code === "PRISMA_RUNTIME_REPOSITORY_CLIENT_REQUIRED") {
    return "A Prisma-like repository client must be injected.";
  }

  return "The injected Prisma-like repository client is incomplete.";
}

export function failClosedPrismaRuntimeRepositoryAdapterDenial(
  code: PrismaRuntimeRepositoryAdapterDenialCode =
    "PRISMA_RUNTIME_REPOSITORY_CLIENT_INVALID",
): PrismaRuntimeRepositoryAdapterDenial {
  return PrismaRuntimeRepositoryAdapterDenialSchema.parse({
    outcome: "DENIED",
    code,
    safeReason: safeReasonFor(code),
    safe: true,
  });
}

function normalizeDateTime(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function normalizeRecord(input: unknown): unknown {
  if (!isRecord(input)) {
    return input;
  }

  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [key, normalizeDateTime(value)]),
  );
}

function normalizeClientReturn(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((record) => normalizeRecord(record));
  }

  return normalizeRecord(input);
}

async function safeClientCall(
  call: () => MaybePromise<unknown>,
): Promise<unknown> {
  try {
    return normalizeClientReturn(await call());
  } catch {
    throw new Error("Prisma runtime repository adapter operation failed.");
  }
}

function listByRunArgs(input: RuntimeRepositoryReadByRunInput) {
  return {
    where: {
      tenantId: input.tenantId,
      governedRunId: input.governedRunId,
    },
  };
}

function orderedListByRunArgs(
  input: RuntimeRepositoryReadByRunInput,
  orderBy: Record<string, "asc" | "desc">,
) {
  return {
    ...listByRunArgs(input),
    orderBy,
  };
}

function createThroughDelegate(
  delegate: PrismaLikeCreateDelegate,
  data: Record<string, unknown>,
): MaybePromise<unknown> {
  return delegate["create"]({ data });
}

function findFirstThroughDelegate(
  delegate: PrismaLikeFindDelegate,
  where: Record<string, unknown>,
): MaybePromise<unknown> {
  return delegate["findFirst"]({ where });
}

function findManyThroughDelegate(
  delegate: PrismaLikeListDelegate,
  args: {
    readonly where: Record<string, unknown>;
    readonly orderBy?: Record<string, "asc" | "desc">;
  },
): MaybePromise<unknown> {
  return delegate["findMany"](args);
}

function updateThroughDelegate(
  delegate: PrismaLikeUpdateDelegate,
  where: Record<string, unknown>,
  data: Record<string, unknown>,
): MaybePromise<unknown> {
  return delegate["update"]({ where, data });
}

export function createPrismaRuntimeRepositoryAdapter(
  client: unknown,
): PrismaRuntimeRepositoryAdapterResult {
  if (client === undefined || client === null) {
    return err(
      failClosedPrismaRuntimeRepositoryAdapterDenial(
        "PRISMA_RUNTIME_REPOSITORY_CLIENT_REQUIRED",
      ),
    );
  }

  if (!isPrismaLikeClient(client)) {
    return err(failClosedPrismaRuntimeRepositoryAdapterDenial());
  }

  const repositoryClient: RuntimeRepositoryClient = {
    createGovernedRun(input: RuntimeRepositoryGovernedRunRecord) {
      return safeClientCall(() =>
        createThroughDelegate(client.governedRun, { ...input })
      );
    },
    createRuntimeStateSnapshot(input: RuntimeRepositoryStateSnapshotRecord) {
      return safeClientCall(() =>
        createThroughDelegate(client.runtimeStateSnapshot, { ...input })
      );
    },
    createPolicyDecisionRecord(input: RuntimeRepositoryPolicyDecisionRecord) {
      return safeClientCall(() =>
        createThroughDelegate(client.policyDecisionRecord, { ...input })
      );
    },
    createAdmissionDecisionRecord(
      input: RuntimeRepositoryAdmissionDecisionRecord,
    ) {
      return safeClientCall(() =>
        createThroughDelegate(client.admissionDecisionRecord, { ...input })
      );
    },
    createApprovalRequest(input: RuntimeRepositoryApprovalRequestRecord) {
      return safeClientCall(() =>
        createThroughDelegate(client.approvalRequest, { ...input })
      );
    },
    updateApprovalRequestDecision(
      input: RuntimeRepositoryApprovalRequestDecisionInput,
    ) {
      return safeClientCall(() =>
        updateThroughDelegate(
          client.approvalRequest,
          {
            id: input.approvalRequestId,
            tenantId: input.tenantId,
            governedRunId: input.governedRunId,
          },
          {
            status: input.nextStatus,
            approverRef: input.approverRef,
            decisionOutcome: input.decisionOutcome,
            decisionReasonCode: input.decisionReasonCode,
            safeDecisionSummary: input.safeDecisionSummary,
            decidedAt: input.decidedAt,
          },
        )
      );
    },
    createAuditRecord(input: RuntimeRepositoryAuditRecord) {
      return safeClientCall(() =>
        createThroughDelegate(client.auditRecord, { ...input })
      );
    },
    findGovernedRunByTenantAndCorrelation(
      input: RuntimeRepositoryReadByCorrelationInput,
    ) {
      return safeClientCall(() =>
        findFirstThroughDelegate(client.governedRun, {
            tenantId: input.tenantId,
            correlationId: input.correlationId,
        })
      );
    },
    listRuntimeStateSnapshotsByRun(input: RuntimeRepositoryReadByRunInput) {
      return safeClientCall(() =>
        findManyThroughDelegate(
          client.runtimeStateSnapshot,
          orderedListByRunArgs(input, { sequence: "asc" }),
        )
      );
    },
    listPolicyDecisionRecordsByRun(input: RuntimeRepositoryReadByRunInput) {
      return safeClientCall(() =>
        findManyThroughDelegate(
          client.policyDecisionRecord,
          orderedListByRunArgs(input, { createdAt: "asc" }),
        )
      );
    },
    listAdmissionDecisionRecordsByRun(input: RuntimeRepositoryReadByRunInput) {
      return safeClientCall(() =>
        findManyThroughDelegate(
          client.admissionDecisionRecord,
          orderedListByRunArgs(input, { createdAt: "asc" }),
        )
      );
    },
    listApprovalRequestsByRun(input: RuntimeRepositoryReadByRunInput) {
      return safeClientCall(() =>
        findManyThroughDelegate(
          client.approvalRequest,
          orderedListByRunArgs(input, { createdAt: "asc" }),
        )
      );
    },
    listAuditRecordsByRun(input: RuntimeRepositoryReadByRunInput) {
      return safeClientCall(() =>
        findManyThroughDelegate(
          client.auditRecord,
          orderedListByRunArgs(input, { createdAt: "asc" }),
        )
      );
    },
  };

  return ok({
    phase: PRISMA_RUNTIME_REPOSITORY_ADAPTER_PHASE,
    name: PRISMA_RUNTIME_REPOSITORY_ADAPTER_NAME,
    status: PRISMA_RUNTIME_REPOSITORY_ADAPTER_STATUS,
    client: repositoryClient,
    implementedMethods: IMPLEMENTED_METHODS,
    boundary: ADAPTER_BOUNDARY,
  });
}

export function assertPrismaRuntimeRepositoryAdapter(
  result: PrismaRuntimeRepositoryAdapterResult,
): PrismaRuntimeRepositoryAdapter {
  if (!result.ok) {
    throw new Error("Prisma runtime repository adapter denied.");
  }

  return result.value;
}
