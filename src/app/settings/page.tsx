import { AppShell } from "@/components/app-shell";
import { GithubTokenForm } from "@/components/settings/github-token-form";
import { LlmConfigForm } from "@/components/settings/llm-config-form";
import { getConfig } from "@/lib/config/repository";
import { maskSecret } from "@/lib/config/mask-secrets";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [githubConfig, llmConfig] = await Promise.all([
    getConfig("github_config"),
    getConfig("llm_config"),
  ]);
  const githubToken =
    typeof githubConfig?.value.token === "string" ? githubConfig.value.token : "";
  const providers = Array.isArray(llmConfig?.value.providers) ? llmConfig?.value.providers : [];
  const activeProvider =
    typeof llmConfig?.value.active_provider === "string" ? llmConfig.value.active_provider : "";
  const currentProvider =
    (providers.find(
      (provider) =>
        typeof provider === "object" &&
        provider !== null &&
        "id" in provider &&
        provider.id === activeProvider,
    ) as Record<string, unknown> | undefined) ??
    (providers[0] as Record<string, unknown> | undefined);
  const currentProviderToken =
    typeof currentProvider?.auth_token === "string" ? currentProvider.auth_token : "";

  return (
    <AppShell eyebrow="Configuration" title="Settings">
      <div className="grid">
        <section className="panel span-6">
          <p className="panel-kicker">LLM</p>
          <h3 className="panel-title">Summary generation provider</h3>
          <div className="api-list">
            <div className="api-item">
              <div className="api-path">
                {currentProvider ? `${String(currentProvider.type ?? "unknown")} / ${String(currentProvider.model ?? "unknown")}` : "not configured"}
              </div>
              <p className="card-detail">
                {currentProviderToken ? `Token: ${maskSecret(currentProviderToken)}` : "No LLM token configured yet."}
              </p>
              <LlmConfigForm
                initialValue={{
                  activeProvider,
                  providerId: typeof currentProvider?.id === "string" ? currentProvider.id : "openai",
                  providerName:
                    typeof currentProvider?.name === "string" ? currentProvider.name : "OpenAI",
                  providerType:
                    currentProvider?.type === "anthropic" || currentProvider?.type === "google"
                      ? currentProvider.type
                      : "openai",
                  baseUrl:
                    typeof currentProvider?.base_url === "string" ? currentProvider.base_url : "",
                  authToken: currentProviderToken,
                  model:
                    typeof currentProvider?.model === "string" ? currentProvider.model : "gpt-4o-mini",
                }}
              />
            </div>
          </div>
        </section>

        <section className="panel span-6">
          <p className="panel-kicker">GitHub</p>
          <h3 className="panel-title">Current token status</h3>
          <div className="api-list">
            <div className="api-item">
              <div className="api-path">{githubToken ? maskSecret(githubToken) : "not configured"}</div>
              <p className="card-detail">Save the GitHub token directly from the page.</p>
              <GithubTokenForm initialToken={githubToken} />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
