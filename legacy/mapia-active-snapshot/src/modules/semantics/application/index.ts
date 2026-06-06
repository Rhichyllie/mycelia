export type SemanticPolicyRecord = {
  id: string;
  projectId: string;
  diagramType?: string;
  strictEnabled: boolean;
  enforceOnServer: boolean;
  allowTechOverride: boolean;
  requireOverrideReason: boolean;
  customRulesJson?: Record<string, unknown>;
  version: number;
  updatedByIdentity?: string;
  updatedAt: Date;
  createdAt: Date;
};

export type CreateSemanticPolicyInput = {
  projectId: string;
  diagramType?: string;
  strictEnabled: boolean;
  enforceOnServer: boolean;
  allowTechOverride: boolean;
  requireOverrideReason: boolean;
  customRulesJson?: Record<string, unknown>;
  updatedByIdentity?: string;
};

export interface SemanticPolicyRepository {
  loadByProjectId(projectId: string): Promise<SemanticPolicyRecord | null>;
  create(input: CreateSemanticPolicyInput): Promise<SemanticPolicyRecord>;
}

export interface SemanticEventLogRepository {
  append(input: {
    projectId: string;
    actorIdentity?: string;
    eventType: string;
    severity: "error" | "warning" | "info";
    payloadJson: Record<string, unknown>;
  }): Promise<void>;
}
