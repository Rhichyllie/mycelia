import { describe, expect, it } from "vitest";

import { isErr, isOk } from "../shared-kernel";

import { validateRequestEnvelope } from "./identity-checks";
import { RequestEnvelopeSchema } from "./request-envelope";

const validEnvelopeInput = {
  request_id: "request-01HZ000000000000000",
  tenant_id: "tenant-01HZ000000000000000",
  workspace_id: "workspace-01HZ000000000000000",
  project_id: "project-01HZ000000000000000",
  actor_id: "actor-01HZ000000000000000",
  runtime_identity_id: "runtime-identity-01HZ000000000000000",
  correlation_id: "corr-01HZ000000000000000",
  causation_id: "cause-01HZ000000000000000",
  origin: "HUMAN_UI",
  purpose: "phase-1c-runtime-identity-test",
  data_classification: "CONFIDENTIAL",
  received_at: "2026-06-06T14:30:00.000Z",
  idempotency_key: "idempotency-01HZ000000000000000",
  metadata: {
    source: "phase-1c",
    attempt: 1,
    dry_run: false,
  },
} as const;

function withoutEnvelopeKey<Key extends keyof typeof validEnvelopeInput>(
  key: Key,
) {
  const input: Partial<typeof validEnvelopeInput> = { ...validEnvelopeInput };
  delete input[key];
  return input;
}

describe("RequestEnvelope", () => {
  it("requires request_id", () => {
    const result = validateRequestEnvelope(withoutEnvelopeKey("request_id"));

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("REQUEST_ID_REQUIRED");
    }
  });

  it("requires tenant_id", () => {
    const result = validateRequestEnvelope(withoutEnvelopeKey("tenant_id"));

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("TENANT_ID_REQUIRED");
    }
  });

  it("requires runtime_identity_id", () => {
    const result = validateRequestEnvelope(
      withoutEnvelopeKey("runtime_identity_id"),
    );

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("RUNTIME_IDENTITY_REQUIRED");
    }
  });

  it("requires correlation_id", () => {
    const result = validateRequestEnvelope(
      withoutEnvelopeKey("correlation_id"),
    );

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("CORRELATION_ID_REQUIRED");
    }
  });

  it("requires purpose", () => {
    const result = validateRequestEnvelope({
      ...validEnvelopeInput,
      purpose: "",
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("PURPOSE_REQUIRED");
    }
  });

  it("rejects project_id without workspace_id", () => {
    expect(
      RequestEnvelopeSchema.safeParse(withoutEnvelopeKey("workspace_id"))
        .success,
    ).toBe(false);
  });

  it("rejects invalid received_at", () => {
    expect(
      RequestEnvelopeSchema.safeParse({
        ...validEnvelopeInput,
        received_at: "not-a-date",
      }).success,
    ).toBe(false);
  });

  it("rejects unsafe metadata keys", () => {
    const result = validateRequestEnvelope({
      ...validEnvelopeInput,
      metadata: {
        token: "redacted",
      },
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("UNSAFE_REQUEST_METADATA");
    }
  });

  it("rejects unsafe metadata values", () => {
    const result = validateRequestEnvelope({
      ...validEnvelopeInput,
      metadata: {
        source: "contains secret value",
      },
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe("UNSAFE_REQUEST_METADATA");
    }
  });

  it("derives organizational_scope when not provided", () => {
    const result = validateRequestEnvelope(validEnvelopeInput);

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.organizational_scope).toEqual({
        tenant_id: validEnvelopeInput.tenant_id,
        workspace_id: validEnvelopeInput.workspace_id,
        project_id: validEnvelopeInput.project_id,
      });
    }
  });
});
