export type SourceType = "email" | "github" | "slack";

export type SourceRecord = {
  id: string;
  sourceType: SourceType;
  provider: string;
  externalId: string;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CreateSourceInput = {
  sourceType: SourceType;
  provider: string;
  externalId: string;
  name: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
};

export type UpdateSourceInput = {
  externalId?: string;
  name?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
};
