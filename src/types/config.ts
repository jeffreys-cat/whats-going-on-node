export type ConfigKey =
  | "llm_config"
  | "github_config"
  | "slack_config"
  | "feishu_config"
  | "asf_auth";

export type AppConfigRecord = {
  id: ConfigKey;
  value: Record<string, unknown>;
  updatedAt: string;
};
