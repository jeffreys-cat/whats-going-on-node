"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

type ProviderType = "openai" | "anthropic" | "google";

type LlmConfigFormProps = {
  initialValue: {
    activeProvider: string;
    providerId: string;
    providerName: string;
    providerType: ProviderType;
    baseUrl: string;
    authToken: string;
    model: string;
  };
};

export function LlmConfigForm({ initialValue }: LlmConfigFormProps) {
  const router = useRouter();
  const [activeProvider, setActiveProvider] = useState(initialValue.activeProvider);
  const [providerId, setProviderId] = useState(initialValue.providerId);
  const [providerName, setProviderName] = useState(initialValue.providerName);
  const [providerType, setProviderType] = useState<ProviderType>(initialValue.providerType);
  const [baseUrl, setBaseUrl] = useState(initialValue.baseUrl);
  const [authToken, setAuthToken] = useState(initialValue.authToken);
  const [model, setModel] = useState(initialValue.model);
  const [status, setStatus] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setStatus("");

    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id: "llm_config",
          value: {
            active_provider: activeProvider || providerId,
            providers: [
              {
                id: providerId,
                name: providerName,
                type: providerType,
                base_url: baseUrl,
                auth_token: authToken,
                model,
              },
            ],
          },
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save LLM config.");
      }

      setStatus("LLM config saved.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save LLM config.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <div className="field-grid">
        <label className="field">
          <span className="field-label">Provider ID</span>
          <input
            className="field-input"
            value={providerId}
            onChange={(event) => setProviderId(event.target.value)}
            placeholder="openai"
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Active provider</span>
          <input
            className="field-input"
            value={activeProvider}
            onChange={(event) => setActiveProvider(event.target.value)}
            placeholder="openai"
            required
          />
        </label>
      </div>

      <div className="field-grid">
        <label className="field">
          <span className="field-label">Provider name</span>
          <input
            className="field-input"
            value={providerName}
            onChange={(event) => setProviderName(event.target.value)}
            placeholder="OpenAI"
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Type</span>
          <select
            className="field-input"
            value={providerType}
            onChange={(event) => setProviderType(event.target.value as ProviderType)}
          >
            <option value="openai">OpenAI compatible</option>
            <option value="anthropic">Anthropic</option>
            <option value="google">Google Gemini</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span className="field-label">Base URL</span>
        <input
          className="field-input"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="https://api.openai.com/v1"
        />
      </label>

      <div className="field-grid">
        <label className="field">
          <span className="field-label">Model</span>
          <input
            className="field-input"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="gpt-4o-mini"
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Auth token</span>
          <input
            className="field-input"
            type="password"
            value={authToken}
            onChange={(event) => setAuthToken(event.target.value)}
            placeholder="sk-..."
            autoComplete="off"
            required
          />
        </label>
      </div>

      <div className="form-actions">
        <button className="button" type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save LLM config"}
        </button>
        {status ? <p className="form-status">{status}</p> : null}
      </div>
    </form>
  );
}
