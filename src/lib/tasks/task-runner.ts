import { eq } from "drizzle-orm";

import { getConfig } from "@/lib/config/repository";
import { getDb } from "@/lib/db/client";
import { summaryTasks } from "@/lib/db/schema";
import { generateSummary } from "@/lib/llm";
import { fetchGithubActivity, buildGithubDigest } from "@/lib/sources/github/github";
import { getSource } from "@/lib/sources/repository";
import { createSummary } from "@/lib/summaries/repository";
import { getTask } from "@/lib/tasks/task-status";

function coerceLang(value: unknown): "zh" | "en" {
  return value === "en" ? "en" : "zh";
}

function coerceDays(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.min(Math.floor(value), 30);
  }

  return 3;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildGithubDigestPrompt(params: {
  repo: string;
  days: number;
  lang: "zh" | "en";
  stats: {
    total_prs: number;
    merged_prs: number;
    open_prs: number;
    closed_prs: number;
    total_issues: number;
    open_issues: number;
    closed_issues: number;
  };
  pulls: Array<{ number: number; title: string; state: string }>;
  issues: Array<{ number: number; title: string; state: string }>;
}) {
  const pullLines = params.pulls.map((pull) => `#${pull.number} ${pull.title} (${pull.state})`).join("\n");
  const issueLines = params.issues
    .map((issue) => `#${issue.number} ${issue.title} (${issue.state})`)
    .join("\n");

  if (params.lang === "en") {
    return `Analyze recent GitHub activity for "${params.repo}" over the last ${params.days} days.

Output Markdown using exactly these sections:
1. # GitHub Project Activity Analysis - "${params.repo}"
2. ## Trend Observation
3. ## Overview
4. ## Important PRs
5. ## Active Issues

Requirements:
- Write concise but informative English.
- The Trend Observation should describe what themes are emerging.
- The Overview should summarize counts and overall direction.
- Important PRs and Active Issues should be bullet lists.

Stats:
- PRs: ${params.stats.total_prs}
- Merged PRs: ${params.stats.merged_prs}
- Open PRs: ${params.stats.open_prs}
- Closed PRs: ${params.stats.closed_prs}
- Issues updated: ${params.stats.total_issues}
- Open Issues: ${params.stats.open_issues}
- Closed Issues: ${params.stats.closed_issues}

Pull Requests:
${pullLines || "None"}

Issues:
${issueLines || "None"}
`;
  }

  return `请分析 GitHub 项目 "${params.repo}" 在过去 ${params.days} 天内的活动情况。

请严格使用以下 Markdown 结构输出：
1. # GitHub 项目活动分析 - "${params.repo}"
2. ## 趋势观察
3. ## 总览
4. ## 重要 PR
5. ## 活跃 Issue

要求：
- 使用自然、简洁、像周报一样的中文。
- “趋势观察”要总结最近的主要技术方向和变化趋势。
- “总览”要概括数量和整体状态。
- “重要 PR”和“活跃 Issue”使用项目符号列表。
- 不要输出多余章节。

统计信息：
- PR 总数：${params.stats.total_prs}
- 已合并 PR：${params.stats.merged_prs}
- Open PR：${params.stats.open_prs}
- Closed PR：${params.stats.closed_prs}
- Issue 更新数：${params.stats.total_issues}
- Open Issue：${params.stats.open_issues}
- Closed Issue：${params.stats.closed_issues}

PR 列表：
${pullLines || "无"}

Issue 列表：
${issueLines || "无"}
`;
}

export async function runPendingTask(taskId: string) {
  const db = await getDb();
  const task = await getTask(taskId);

  if (!task) {
    throw new Error("Task not found.");
  }

  await db
    .update(summaryTasks)
    .set({
      status: "running",
      progress: 10,
      currentStep: "preparing",
      message: "Loading source and credentials.",
      startedAt: new Date(),
      errorMessage: null,
    })
    .where(eq(summaryTasks.id, taskId));

  try {
    if (task.taskType !== "github_digest") {
      throw new Error(`Unsupported task type: ${task.taskType}`);
    }

    if (!task.sourceId) {
      throw new Error("GitHub digest task requires a sourceId.");
    }

    const source = await getSource(task.sourceId);
    if (!source || source.sourceType !== "github") {
      throw new Error("GitHub source not found.");
    }

    const owner = typeof source.config.owner === "string" ? source.config.owner : "";
    const repo = typeof source.config.repo === "string" ? source.config.repo : "";
    if (!owner || !repo) {
      throw new Error("GitHub source config must include owner and repo.");
    }

    const lang = coerceLang(task.params.lang);
    const days = coerceDays(task.params.days);
    const githubConfig = await getConfig("github_config");
    const token =
      typeof githubConfig?.value.token === "string" ? githubConfig.value.token : undefined;
    const llmConfig = await getConfig("llm_config");
    let llmDebug: Record<string, unknown> = {
      used: false,
      fallback: true,
      provider: null,
      error: null,
    };

    await db
      .update(summaryTasks)
      .set({
        progress: 45,
        currentStep: "fetching",
        message: `Fetching GitHub activity for ${owner}/${repo}.`,
      })
      .where(eq(summaryTasks.id, taskId));

    const activity = await fetchGithubActivity(owner, repo, days, token);
    const llmSummary = await generateSummary({
      title: `${owner}/${repo} ${lang === "zh" ? "活动摘要" : "activity digest"}`,
      language: lang,
      prompt: buildGithubDigestPrompt({
        repo: activity.repo,
        days: activity.days,
        lang,
        stats: activity.stats,
        pulls: activity.pulls.slice(0, 12).map((pull) => ({
          number: pull.number,
          title: pull.title,
          state: pull.state,
        })),
        issues: activity.issues.slice(0, 12).map((issue) => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
        })),
      }),
      config: llmConfig?.value as {
        active_provider?: string;
        providers?: Array<{
          id?: string;
          type?: string;
          base_url?: string;
          auth_token?: string;
          model?: string;
        }>;
      },
    }).catch((error) => {
      llmDebug = {
        used: false,
        fallback: true,
        provider: null,
        error: error instanceof Error ? error.message : "Unknown LLM error.",
      };
      return null;
    });
    if (llmSummary?.provider) {
      llmDebug = {
        used: true,
        fallback: false,
        provider: llmSummary.provider,
        error: null,
      };
    } else if (!llmDebug.error) {
      llmDebug = {
        used: false,
        fallback: true,
        provider: null,
        error: "LLM not configured.",
      };
    }
    const summaryText = llmSummary?.summaryText || buildGithubDigest(activity, lang);
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

    await db
      .update(summaryTasks)
      .set({
        progress: 80,
        currentStep: "persisting",
        message: "Writing digest to summaries.",
      })
      .where(eq(summaryTasks.id, taskId));

    const summary = await createSummary({
      sourceType: "github",
      sourceId: source.id,
      title: `${owner}/${repo} ${lang === "zh" ? "活动摘要" : "activity digest"}`,
      language: lang,
      contentDateStart: toIsoDate(startDate),
      contentDateEnd: toIsoDate(endDate),
      summaryText,
      metadata: {
        repo: activity.repo,
        days: activity.days,
        stats: activity.stats,
        llm: llmDebug,
      },
    });

    await db
      .update(summaryTasks)
      .set({
        status: "succeeded",
        progress: 100,
        currentStep: "done",
        message: "Digest generated.",
        resultSummaryId: summary.id,
        finishedAt: new Date(),
      })
      .where(eq(summaryTasks.id, taskId));

    return await getTask(taskId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown task execution error.";
    await db
      .update(summaryTasks)
      .set({
        status: "failed",
        progress: 100,
        currentStep: "failed",
        message,
        errorMessage: message,
        finishedAt: new Date(),
      })
      .where(eq(summaryTasks.id, taskId));

    return await getTask(taskId);
  }
}
