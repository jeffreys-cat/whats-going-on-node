export type GenerateSummaryInput = {
  title: string;
  language: "zh" | "en";
  prompt: string;
};

type LlmProvider = {
  id?: string;
  name?: string;
  type?: string;
  base_url?: string;
  auth_token?: string;
  model?: string;
};

type LlmConfig = {
  active_provider?: string;
  providers?: LlmProvider[];
};

function getActiveProvider(config?: LlmConfig) {
  if (!config?.providers?.length) {
    return null;
  }

  return (
    config.providers.find((provider) => provider.id === config.active_provider) ??
    config.providers[0] ??
    null
  );
}

async function callOpenAiCompatible(provider: LlmProvider, input: GenerateSummaryInput) {
  const response = await fetch(
    `${provider.base_url?.trim() || "https://api.openai.com/v1"}/chat/completions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${provider.auth_token}`,
      },
      body: JSON.stringify({
        model: provider.model || "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              input.language === "zh"
                ? "你是一个技术项目活动分析助手，请输出结构化的中文 Markdown。"
                : "You are a technical repository activity analyst. Output structured Markdown in English.",
          },
          {
            role: "user",
            content: input.prompt,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`OpenAI-compatible API failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function callAnthropic(provider: LlmProvider, input: GenerateSummaryInput) {
  const response = await fetch(
    `${provider.base_url?.trim() || "https://api.anthropic.com"}/v1/messages`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": provider.auth_token || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: provider.model || "claude-3-5-sonnet-latest",
        max_tokens: 1600,
        messages: [
          {
            role: "user",
            content: input.prompt,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Anthropic API failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  return data.content?.find((item) => item.type === "text")?.text?.trim() || "";
}

async function callGoogle(provider: LlmProvider, input: GenerateSummaryInput) {
  const model = provider.model || "gemini-2.0-flash";
  const baseUrl =
    provider.base_url?.trim() ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const connector = baseUrl.includes("?") ? "&" : "?";
  const response = await fetch(`${baseUrl}${connector}key=${provider.auth_token || ""}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: input.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google API failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

export async function generateSummary(input: GenerateSummaryInput & { config?: LlmConfig }) {
  const provider = getActiveProvider(input.config);
  if (!provider?.type || !provider.auth_token) {
    return null;
  }

  let summaryText = "";

  if (provider.type === "anthropic") {
    summaryText = await callAnthropic(provider, input);
  } else if (provider.type === "google") {
    summaryText = await callGoogle(provider, input);
  } else {
    summaryText = await callOpenAiCompatible(provider, input);
  }

  if (!summaryText) {
    throw new Error("LLM returned an empty summary.");
  }

  return {
    title: input.title,
    language: input.language,
    summaryText,
    provider: {
      id: provider.id ?? "",
      name: provider.name ?? "",
      type: provider.type ?? "",
      model: provider.model ?? "",
      baseUrl: provider.base_url?.trim() || "",
    },
  };
}
