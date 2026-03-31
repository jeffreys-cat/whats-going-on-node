import { eq } from "drizzle-orm";

import { getConfig } from "@/lib/config/repository";
import { getDb } from "@/lib/db/client";
import { summaryTasks } from "@/lib/db/schema";
import { generateSummary } from "@/lib/llm";
import { analyzeBranchActivity, fetchGithubActivity, buildGithubDigest } from "@/lib/sources/github/github";
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
    active_branches: number;
    total_branch_commits: number;
  };
  pulls: Array<{ number: number; title: string; state: string }>;
  issues: Array<{ number: number; title: string; state: string }>;
  branchActivity: Array<{ name: string; commits: Array<{ sha: string; message: string }> }>;
}) {
  const pullLines = params.pulls.map((pull) => `#${pull.number} ${pull.title} (${pull.state})`).join("\n");
  const issueLines = params.issues
    .map((issue) => `#${issue.number} ${issue.title} (${issue.state})`)
    .join("\n");
  const branchLines = params.branchActivity
    .map(
      (branch) =>
        `${branch.name}: ${branch.commits
          .map((commit) => `${commit.sha.slice(0, 7)} ${commit.message}`)
          .join(" | ")}`,
    )
    .join("\n");

  if (params.lang === "en") {
    return `Analyze recent GitHub activity for "${params.repo}" over the last ${params.days} days.

Output Markdown using exactly these sections:
1. # GitHub Project Activity Analysis - "${params.repo}"
2. ## Trend Observation
3. ## Overview
4. ## Important PRs
5. ## Active Issues
6. ## Branch Commit Signals
7. ## Credible Conclusion

Requirements:
- Write concise but informative English.
- The Trend Observation should describe what themes are emerging from PRs, issues, and branch commits together.
- The Overview should summarize counts and overall direction.
- Important PRs, Active Issues, and Branch Commit Signals should be bullet lists.
- In Branch Commit Signals, analyze what each active branch was doing during the selected period instead of only listing commit messages.
- For each branch, prefer describing: purpose, main changes, and current status.
- The Credible Conclusion must explicitly state what can be concluded with confidence, and should distinguish landed work, in-progress branch work, and uncertainty.
- Do not infer that the repository is inactive just because PRs or issues are quiet if branch commits show ongoing work.

Stats:
- PRs: ${params.stats.total_prs}
- Merged PRs: ${params.stats.merged_prs}
- Open PRs: ${params.stats.open_prs}
- Closed PRs: ${params.stats.closed_prs}
- Issues updated: ${params.stats.total_issues}
- Open Issues: ${params.stats.open_issues}
- Closed Issues: ${params.stats.closed_issues}
- Active branches with commits: ${params.stats.active_branches}
- Recent branch commits: ${params.stats.total_branch_commits}

Pull Requests:
${pullLines || "None"}

Issues:
${issueLines || "None"}

Branch commits:
${branchLines || "None"}
`;
  }

  return `请分析 GitHub 项目 "${params.repo}" 在过去 ${params.days} 天内的活动情况。

请严格使用以下 Markdown 结构输出：
1. # GitHub 项目活动分析 - "${params.repo}"
2. ## 趋势观察
3. ## 总览
4. ## 重要 PR
5. ## 活跃 Issue
6. ## Branch Commit 动向
7. ## 可信结论

要求：
- 使用自然、简洁、像周报一样的中文。
- “趋势观察”要综合 PR、Issue 和不同 branch 的 commit，一起总结最近的主要技术方向和变化趋势。
- “总览”要概括数量和整体状态。
- “重要 PR”、“活跃 Issue”和“Branch Commit 动向”使用项目符号列表。
- “Branch Commit 动向”不能只罗列 commit message，要按 branch 分析该分支在本周期内主要做了什么。
- 每个 branch 尽量写出：分支目的、主要改动、当前状态。
- “可信结论”必须明确说明哪些判断是有证据支撑的，并区分已经落地的主线变更、仍在 branch 中推进的工作、以及暂时不能下强结论的部分。
- 如果 PR 或 Issue 较少，但 branch commit 明显活跃，不能直接判断项目停滞。
- 不要输出多余章节。

统计信息：
- PR 总数：${params.stats.total_prs}
- 已合并 PR：${params.stats.merged_prs}
- Open PR：${params.stats.open_prs}
- Closed PR：${params.stats.closed_prs}
- Issue 更新数：${params.stats.total_issues}
- Open Issue：${params.stats.open_issues}
- Closed Issue：${params.stats.closed_issues}
- 活跃 branch 数：${params.stats.active_branches}
- branch commit 数：${params.stats.total_branch_commits}

PR 列表：
${pullLines || "无"}

Issue 列表：
${issueLines || "无"}

Branch commit 列表：
${branchLines || "无"}
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
    const branchAnalysis = analyzeBranchActivity(activity, lang);
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
        branchActivity: activity.branchActivity.slice(0, 6).map((branch) => ({
          name: branch.name,
          commits: branch.commits.slice(0, 4).map((commit) => ({
            sha: commit.sha,
            message: commit.message,
          })),
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
        branchAnalysis,
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
