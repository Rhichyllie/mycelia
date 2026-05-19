import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getApiSessionIdentity: vi.fn(),
  createServerUseCases: vi.fn(),
}));

vi.mock("@/src/server/auth/api-session", () => ({
  getApiSessionIdentity: routeMocks.getApiSessionIdentity,
}));

vi.mock("@/src/server/app/container", () => ({
  createServerUseCases: routeMocks.createServerUseCases,
}));

import {
  GET as getSnapshotVersions,
  POST as postSnapshotVersions,
} from "@/app/api/projects/[projectId]/snapshot-versions/route";
import { GET as getSnapshotVersionById } from "@/app/api/projects/[projectId]/snapshot-versions/[versionId]/route";
import { GET as getSnapshotVersionDiff } from "@/app/api/projects/[projectId]/snapshot-versions/[versionId]/diff/route";
import { POST as postSnapshotVersionRestore } from "@/app/api/projects/[projectId]/snapshot-versions/[versionId]/restore/route";

const projectId = "58f3ca26-085e-4237-80d9-adcc42f7142b";
const versionId = "1aa7a983-1fda-4438-93d7-b964c82685f4";
const actorUserId = "11111111-1111-4111-8111-111111111111";

function createProjectContext() {
  return {
    params: Promise.resolve({ projectId }),
  };
}

function createVersionContext() {
  return {
    params: Promise.resolve({ projectId, versionId }),
  };
}

function createJsonRequest(url: string, method: string, body: unknown) {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createUseCasesMock() {
  return {
    projects: {
      getProjectAccess: {
        execute: vi.fn().mockResolvedValue({
          project: {
            id: projectId,
            workspaceId: "7c96ab95-fd65-48b7-bb8d-7402c0dd92e2",
          },
          membership: {
            id: "22222222-2222-4222-8222-222222222222",
            workspaceId: "7c96ab95-fd65-48b7-bb8d-7402c0dd92e2",
            userId: actorUserId,
            role: "member",
            createdAt: new Date("2026-04-02T10:00:00.000Z"),
            updatedAt: new Date("2026-04-02T10:00:00.000Z"),
          },
        }),
      },
    },
    versioning: {
      listSnapshotVersions: {
        execute: vi.fn().mockResolvedValue([
          {
            id: versionId,
            projectId,
            label: "Checkpoint manual",
            origin: "manual",
            createdAt: new Date("2026-04-02T10:00:00.000Z"),
          },
        ]),
      },
      createSnapshotVersionFromWorkingSnapshot: {
        execute: vi.fn().mockResolvedValue({
          id: versionId,
          projectId,
          label: "Checkpoint manual",
          origin: "manual",
          createdAt: new Date("2026-04-02T10:00:00.000Z"),
          document: {
            nodes: [],
            edges: [],
          },
          capturedViewport: { x: 0, y: 0, zoom: 1 },
        }),
      },
      getSnapshotVersionById: {
        execute: vi.fn().mockResolvedValue({
          id: versionId,
          projectId,
          label: "Checkpoint manual",
          origin: "manual",
          createdAt: new Date("2026-04-02T10:00:00.000Z"),
          document: {
            nodes: [],
            edges: [],
          },
          capturedViewport: { x: 0, y: 0, zoom: 1 },
        }),
      },
      diffWorkingSnapshotAgainstVersion: {
        execute: vi.fn().mockResolvedValue({
          version: {
            id: versionId,
            projectId,
            label: "Checkpoint manual",
            origin: "manual",
            createdAt: new Date("2026-04-02T10:00:00.000Z"),
          },
          diff: {
            hasChanges: true,
            document: {
              hasChanges: true,
              nodesAdded: ["22222222-2222-4222-8222-222222222222"],
              nodesRemoved: [],
              nodesChanged: ["11111111-1111-4111-8111-111111111111"],
              edgesAdded: [],
              edgesRemoved: [],
              edgesChanged: [],
              diagramTypeChanged: false,
              diagramViewChanged: false,
              presentationMetadataChanged: false,
              summary: { added: 1, removed: 0, changed: 1 },
            },
            editorial: {
              viewportChanged: true,
            },
            summary: { added: 1, removed: 0, changed: 2 },
          },
        }),
      },
      restoreWorkingSnapshotFromVersion: {
        execute: vi.fn().mockResolvedValue({
          message: "Snapshot de trabalho restaurado com sucesso.",
          restoredFromVersionId: versionId,
          workingSnapshot: {
            id: "b22f2835-c768-45f4-a85f-bdc2fd6f2438",
            projectId,
            storageSlot: 1,
            versionNumber: 1,
            revision: 5,
            document: {
              nodes: [],
              edges: [],
            },
            viewport: { x: 10, y: 20, zoom: 1.1 },
            createdAt: new Date("2026-04-02T10:00:00.000Z"),
          },
        }),
      },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  routeMocks.getApiSessionIdentity.mockResolvedValue({
    identity: "owner@mapia.local",
    userId: actorUserId,
    actor: {
      userId: actorUserId,
      email: "owner@mapia.local",
      providerId: "credentials",
      authMode: "development_credentials",
    },
    session: {
      user: {
        id: actorUserId,
        email: "owner@mapia.local",
        authProvider: "credentials",
        authMode: "development_credentials",
      },
    },
  });
});

describe("snapshot version routes", () => {
  it("returns 401 from the collection route when there is no authenticated session", async () => {
    routeMocks.getApiSessionIdentity.mockResolvedValueOnce(null);

    const response = await getSnapshotVersions(
      new Request("http://localhost/api/projects/x/snapshot-versions"),
      createProjectContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      error: "UNAUTHORIZED",
      message: "Autenticacao necessaria.",
    });
    expect(routeMocks.createServerUseCases).not.toHaveBeenCalled();
  });

  it("returns 400 when create-version payload is invalid", async () => {
    const useCases = createUseCasesMock();
    routeMocks.createServerUseCases.mockReturnValue(useCases);

    const response = await postSnapshotVersions(
      createJsonRequest(
        "http://localhost/api/projects/x/snapshot-versions",
        "POST",
        { label: "" },
      ),
      createProjectContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      error: "VALIDATION_ERROR",
      message: "Dados invalidos.",
    });
    expect(useCases.projects.getProjectAccess.execute).not.toHaveBeenCalled();
  });

  it("lists snapshot versions with the expected success envelope", async () => {
    const useCases = createUseCasesMock();
    routeMocks.createServerUseCases.mockReturnValue(useCases);

    const response = await getSnapshotVersions(
      new Request("http://localhost/api/projects/x/snapshot-versions"),
      createProjectContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(useCases.projects.getProjectAccess.execute).toHaveBeenCalledWith({
      actorUserId,
      projectId,
      minimumRole: "viewer",
    });
    expect(
      useCases.versioning.listSnapshotVersions.execute,
    ).toHaveBeenCalledWith({
      projectId,
    });
    expect(body).toMatchObject({
      data: {
        snapshotVersions: [
          {
            id: versionId,
            label: "Checkpoint manual",
            origin: "manual",
          },
        ],
      },
    });
  });

  it("creates a snapshot version from the working snapshot", async () => {
    const useCases = createUseCasesMock();
    routeMocks.createServerUseCases.mockReturnValue(useCases);

    const response = await postSnapshotVersions(
      createJsonRequest(
        "http://localhost/api/projects/x/snapshot-versions",
        "POST",
        {
          label: "Checkpoint manual",
          origin: "manual",
        },
      ),
      createProjectContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(
      useCases.versioning.createSnapshotVersionFromWorkingSnapshot.execute,
    ).toHaveBeenCalledWith({
      projectId,
      label: "Checkpoint manual",
      origin: "manual",
    });
    expect(body).toMatchObject({
      data: {
        message: "Versao criada com sucesso.",
        snapshotVersion: {
          id: versionId,
          label: "Checkpoint manual",
          origin: "manual",
          document: {
            nodes: [],
            edges: [],
          },
          capturedViewport: { x: 0, y: 0, zoom: 1 },
        },
      },
    });
  });

  it("returns snapshot version detail through the dedicated route", async () => {
    const useCases = createUseCasesMock();
    routeMocks.createServerUseCases.mockReturnValue(useCases);

    const response = await getSnapshotVersionById(
      new Request("http://localhost/api/projects/x/snapshot-versions/y"),
      createVersionContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(
      useCases.versioning.getSnapshotVersionById.execute,
    ).toHaveBeenCalledWith({
      projectId,
      versionId,
    });
    expect(body).toMatchObject({
      data: {
        snapshotVersion: {
          id: versionId,
          projectId,
          label: "Checkpoint manual",
          document: {
            nodes: [],
            edges: [],
          },
          capturedViewport: { x: 0, y: 0, zoom: 1 },
        },
      },
    });
  });

  it("returns structural diff data through the diff route", async () => {
    const useCases = createUseCasesMock();
    routeMocks.createServerUseCases.mockReturnValue(useCases);

    const response = await getSnapshotVersionDiff(
      new Request("http://localhost/api/projects/x/snapshot-versions/y/diff"),
      createVersionContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(
      useCases.versioning.diffWorkingSnapshotAgainstVersion.execute,
    ).toHaveBeenCalledWith({
      projectId,
      versionId,
    });
    expect(body).toMatchObject({
      data: {
        version: {
          id: versionId,
          label: "Checkpoint manual",
        },
        diff: {
          hasChanges: true,
          document: {
            hasChanges: true,
            summary: { added: 1, removed: 0, changed: 1 },
          },
          editorial: {
            viewportChanged: true,
          },
          summary: { added: 1, removed: 0, changed: 2 },
        },
      },
    });
    expect(body.data.diff).not.toHaveProperty("nodesAdded");
    expect(body.data.diff).not.toHaveProperty("viewportChanged");
  });

  it("restores a version while preserving revision/semantic fields", async () => {
    const useCases = createUseCasesMock();
    routeMocks.createServerUseCases.mockReturnValue(useCases);

    const response = await postSnapshotVersionRestore(
      createJsonRequest(
        "http://localhost/api/projects/x/snapshot-versions/y/restore",
        "POST",
        {
          expectedRevision: 4,
          semanticMode: "technical",
          allowSemanticOverride: true,
          overrideReason: "Override tecnico controlado para restauracao",
        },
      ),
      createVersionContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(
      useCases.versioning.restoreWorkingSnapshotFromVersion.execute,
    ).toHaveBeenCalledWith({
      projectId,
      versionId,
      actorIdentity: "owner@mapia.local",
      expectedRevision: 4,
      semanticMode: "technical",
      allowSemanticOverride: true,
      overrideReason: "Override tecnico controlado para restauracao",
    });
    expect(body).toMatchObject({
      data: {
        message: "Snapshot de trabalho restaurado com sucesso.",
        restoredFromVersionId: versionId,
        newRevision: 5,
        workingSnapshot: {
          storageSlot: 1,
          document: {
            nodes: [],
            edges: [],
          },
          viewport: { x: 10, y: 20, zoom: 1.1 },
          revision: 5,
        },
      },
    });
    expect(body.data.workingSnapshot).not.toHaveProperty("snapshot");
  });

  it("returns 400 when restore payload is invalid instead of swallowing the body", async () => {
    const useCases = createUseCasesMock();
    routeMocks.createServerUseCases.mockReturnValue(useCases);

    const response = await postSnapshotVersionRestore(
      createJsonRequest(
        "http://localhost/api/projects/x/snapshot-versions/y/restore",
        "POST",
        {
          allowSemanticOverride: true,
          semanticMode: "operational",
        },
      ),
      createVersionContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      error: "VALIDATION_ERROR",
      message: "Dados invalidos.",
    });
    expect(
      useCases.versioning.restoreWorkingSnapshotFromVersion.execute,
    ).not.toHaveBeenCalled();
  });
});
