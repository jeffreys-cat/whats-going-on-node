const API_BASE = "https://api.github.com";

type GithubPull = {
  number: number;
  title: string;
  state: string;
  user: string;
  labels: string[];
  created_at: string;
  updated_at: string;
  merged_at: string;
  html_url: string;
  merged: boolean;
  draft: boolean;
};

type GithubIssue = {
  number: number;
  title: string;
  state: string;
  user: string;
  labels: string[];
  created_at: string;
  updated_at: string;
  html_url: string;
  comments: number;
};

type GithubBranchCommit = {
  sha: string;
  branch: string;
  message: string;
  author: string;
  committed_at: string;
  html_url: string;
};

type GithubBranchActivity = {
  name: string;
  commits: GithubBranchCommit[];
};

export type GithubBranchAnalysis = {
  branch: string;
  purpose: string;
  mainChanges: string[];
  status: string;
  commitCount: number;
};

export type GithubActivity = {
  pulls: GithubPull[];
  issues: GithubIssue[];
  branchActivity: GithubBranchActivity[];
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
  repo: string;
  days: number;
};

function getHeaders(token?: string) {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubRequest<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
  token?: string,
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: getHeaders(token),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function githubRequestOptional<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
  token?: string,
): Promise<T | null> {
  try {
    return await githubRequest<T>(path, params, token);
  } catch {
    return null;
  }
}

function getDateRange(days: number) {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);
  return { start, end };
}

function inRange(value: string | null | undefined, start: Date, end: Date) {
  if (!value) {
    return false;
  }

  const time = new Date(value).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export async function fetchGithubActivity(
  owner: string,
  repo: string,
  days = 3,
  token?: string,
): Promise<GithubActivity> {
  const { start, end } = getDateRange(days);
  const sinceIso = start.toISOString();

  const [pullsRaw, issuesRaw, repoInfo, eventsRaw] = await Promise.all([
    githubRequest<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/pulls`,
      {
        state: "all",
        sort: "updated",
        direction: "desc",
        per_page: 50,
      },
      token,
    ),
    githubRequest<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/issues`,
      {
        state: "all",
        sort: "updated",
        direction: "desc",
        since: sinceIso,
        per_page: 50,
      },
      token,
    ),
    githubRequestOptional<Record<string, unknown>>(`/repos/${owner}/${repo}`, {}, token),
    githubRequestOptional<Array<Record<string, unknown>>>(
      `/repos/${owner}/${repo}/events`,
      {
        per_page: 100,
      },
      token,
    ),
  ]);

  const pulls = pullsRaw
    .map((pull) => ({
      number: Number(pull.number),
      title: String(pull.title ?? ""),
      state: pull.merged_at ? "merged" : String(pull.state ?? "open"),
      user: String((pull.user as { login?: string } | undefined)?.login ?? ""),
      labels: Array.isArray(pull.labels)
        ? pull.labels.map((label) => String((label as { name?: string }).name ?? ""))
        : [],
      created_at: String(pull.created_at ?? ""),
      updated_at: String(pull.updated_at ?? ""),
      merged_at: String(pull.merged_at ?? ""),
      html_url: String(pull.html_url ?? ""),
      merged: Boolean(pull.merged_at),
      draft: Boolean(pull.draft),
    }))
    .filter((pull) => inRange(pull.created_at, start, end) || inRange(pull.merged_at, start, end));

  const issues = issuesRaw
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      number: Number(issue.number),
      title: String(issue.title ?? ""),
      state: String(issue.state ?? "open"),
      user: String((issue.user as { login?: string } | undefined)?.login ?? ""),
      labels: Array.isArray(issue.labels)
        ? issue.labels.map((label) => String((label as { name?: string }).name ?? ""))
        : [],
      created_at: String(issue.created_at ?? ""),
      updated_at: String(issue.updated_at ?? ""),
      html_url: String(issue.html_url ?? ""),
      comments: Number(issue.comments ?? 0),
    }))
    .filter((issue) => inRange(issue.updated_at, start, end));

  const pushEvents = (eventsRaw ?? []).filter((event) => {
    const type = String(event.type ?? "");
    const createdAt = String(event.created_at ?? "");
    return type === "PushEvent" && inRange(createdAt, start, end);
  });
  const activeBranchNames = Array.from(
    new Set(
      pushEvents
        .map((event) => String((event.payload as { ref?: string } | undefined)?.ref ?? ""))
        .map((ref) => ref.replace(/^refs\/heads\//, ""))
        .filter(Boolean),
    ),
  );
  const defaultBranch =
    typeof repoInfo?.default_branch === "string" ? repoInfo.default_branch : null;
  const candidateBranches = activeBranchNames.length
    ? activeBranchNames.slice(0, 8)
    : defaultBranch
      ? [defaultBranch]
      : [];

  const branchActivityRaw = await Promise.all(
    candidateBranches.map(async (branch) => {
      const commitsRaw = await githubRequestOptional<Array<Record<string, unknown>>>(
        `/repos/${owner}/${repo}/commits`,
        {
          sha: branch,
          since: sinceIso,
          per_page: 8,
        },
        token,
      );

      const commits = (commitsRaw ?? [])
        .map((commit) => ({
          sha: String(commit.sha ?? ""),
          branch,
          message: String(
            ((commit.commit as { message?: string } | undefined)?.message ?? "")
              .split("\n")[0]
              .trim(),
          ),
          author: String(
            (commit.author as { login?: string } | undefined)?.login ??
              ((commit.commit as { author?: { name?: string } } | undefined)?.author?.name ?? ""),
          ),
          committed_at: String(
            (commit.commit as { author?: { date?: string } } | undefined)?.author?.date ?? "",
          ),
          html_url: String(commit.html_url ?? ""),
        }))
        .filter((commit) => inRange(commit.committed_at, start, end));

      if (!commits.length) {
        return null;
      }

      return {
        name: branch,
        commits,
      } satisfies GithubBranchActivity;
    }),
  );
  const branchActivity = branchActivityRaw
    .filter((branch): branch is GithubBranchActivity => Boolean(branch))
    .sort((a, b) => b.commits.length - a.commits.length);
  const uniqueCommitShas = new Set(
    branchActivity.flatMap((branch) => branch.commits.map((commit) => commit.sha)),
  );

  return {
    pulls,
    issues,
    branchActivity,
    stats: {
      total_prs: pulls.length,
      merged_prs: pulls.filter((pull) => pull.merged).length,
      open_prs: pulls.filter((pull) => pull.state === "open").length,
      closed_prs: pulls.filter((pull) => pull.state === "closed").length,
      total_issues: issues.length,
      open_issues: issues.filter((issue) => issue.state === "open").length,
      closed_issues: issues.filter((issue) => issue.state === "closed").length,
      active_branches: branchActivity.length,
      total_branch_commits: uniqueCommitShas.size,
    },
    repo: `${owner}/${repo}`,
    days,
  };
}

function summarizeTrend(activity: GithubActivity, language: "zh" | "en") {
  const mergedRatio = activity.stats.total_prs
    ? Math.round((activity.stats.merged_prs / activity.stats.total_prs) * 100)
    : 0;
  const topics = new Set<string>();

  const evidenceTexts = [
    ...activity.pulls.map((item) => item.title),
    ...activity.issues.map((item) => item.title),
    ...activity.branchActivity.flatMap((branch) => branch.commits.map((commit) => commit.message)),
  ];

  for (const text of evidenceTexts) {
    const normalized = text.toLowerCase();
    if (normalized.includes("turbopack")) {
      topics.add(language === "zh" ? "Turbopack" : "Turbopack");
    }
    if (
      normalized.includes("memory") ||
      normalized.includes("leak") ||
      normalized.includes("oom")
    ) {
      topics.add(language === "zh" ? "内存与稳定性" : "memory and stability");
    }
    if (
      normalized.includes("build") ||
      normalized.includes("webpack") ||
      normalized.includes("ci") ||
      normalized.includes("release")
    ) {
      topics.add(language === "zh" ? "构建工具链" : "build tooling");
    }
    if (
      normalized.includes("css") ||
      normalized.includes("tailwind") ||
      normalized.includes("style")
    ) {
      topics.add(language === "zh" ? "样式与 CSS 生态" : "styling and CSS");
    }
    if (normalized.includes("router") || normalized.includes("route")) {
      topics.add(language === "zh" ? "路由能力" : "routing");
    }
    if (
      normalized.includes("auth") ||
      normalized.includes("login") ||
      normalized.includes("permission")
    ) {
      topics.add(language === "zh" ? "认证与权限" : "auth and permissions");
    }
    if (
      normalized.includes("db") ||
      normalized.includes("sql") ||
      normalized.includes("migration")
    ) {
      topics.add(language === "zh" ? "数据层变更" : "data layer changes");
    }
  }

  const focus = topics.size
    ? Array.from(topics).slice(0, 3).join(language === "zh" ? "、" : ", ")
    : language === "zh"
      ? "框架核心改进"
      : "core framework improvements";

  if (language === "en") {
    return `Over the last ${activity.days} days, activity remained steady with work primarily clustered around ${focus}. The repository merged roughly ${mergedRatio}% of the pull requests included in this window, which suggests the team is still actively landing and consolidating changes.`;
  }

  return `在过去的 ${activity.days} 天内，仓库整体活跃度保持稳定，开发重点主要集中在 ${focus}。纳入统计的 PR 中约有 ${mergedRatio}% 已完成合并，说明当前迭代节奏仍然较快，且很多变更正在持续收敛和落地。`;
}

function inferTopicsFromTexts(texts: string[], language: "zh" | "en") {
  const topics = new Set<string>();

  for (const text of texts) {
    const normalized = text.toLowerCase();

    if (
      normalized.includes("auth") ||
      normalized.includes("login") ||
      normalized.includes("permission")
    ) {
      topics.add(language === "zh" ? "认证与权限" : "auth and permissions");
    }
    if (
      normalized.includes("db") ||
      normalized.includes("sql") ||
      normalized.includes("migration") ||
      normalized.includes("schema")
    ) {
      topics.add(language === "zh" ? "数据层变更" : "data layer changes");
    }
    if (
      normalized.includes("api") ||
      normalized.includes("endpoint") ||
      normalized.includes("handler")
    ) {
      topics.add(language === "zh" ? "接口与服务端逻辑" : "API and server logic");
    }
    if (
      normalized.includes("ui") ||
      normalized.includes("page") ||
      normalized.includes("component") ||
      normalized.includes("css") ||
      normalized.includes("tailwind") ||
      normalized.includes("style")
    ) {
      topics.add(language === "zh" ? "界面与交互" : "UI and interaction");
    }
    if (
      normalized.includes("build") ||
      normalized.includes("webpack") ||
      normalized.includes("ci") ||
      normalized.includes("release")
    ) {
      topics.add(language === "zh" ? "构建与发布链路" : "build and release flow");
    }
    if (
      normalized.includes("fix") ||
      normalized.includes("bug") ||
      normalized.includes("error") ||
      normalized.includes("crash") ||
      normalized.includes("memory") ||
      normalized.includes("leak") ||
      normalized.includes("oom")
    ) {
      topics.add(language === "zh" ? "问题修复与稳定性" : "bug fixes and stability");
    }
    if (
      normalized.includes("route") ||
      normalized.includes("router") ||
      normalized.includes("navigation")
    ) {
      topics.add(language === "zh" ? "路由与导航" : "routing and navigation");
    }
    if (
      normalized.includes("test") ||
      normalized.includes("spec") ||
      normalized.includes("assert")
    ) {
      topics.add(language === "zh" ? "测试补强" : "test coverage");
    }
    if (
      normalized.includes("refactor") ||
      normalized.includes("cleanup") ||
      normalized.includes("rename")
    ) {
      topics.add(language === "zh" ? "重构整理" : "refactoring");
    }
  }

  return Array.from(topics).slice(0, 3);
}

function inferBranchStatus(
  branchName: string,
  commitCount: number,
  topics: string[],
  language: "zh" | "en",
) {
  const normalizedBranch = branchName.toLowerCase();
  const hasFixTopic = topics.some((topic) =>
    ["问题修复与稳定性", "bug fixes and stability"].includes(topic),
  );

  if (language === "en") {
    if (normalizedBranch.includes("release") || normalizedBranch.includes("hotfix")) {
      return "stabilizing or preparing delivery";
    }
    if (hasFixTopic) {
      return "focused on fixes and hardening";
    }
    if (commitCount >= 5) {
      return "in active implementation";
    }
    return "in iterative refinement";
  }

  if (normalizedBranch.includes("release") || normalizedBranch.includes("hotfix")) {
    return "偏向发布准备或稳定性收尾";
  }
  if (hasFixTopic) {
    return "偏向缺陷修复和稳定性加固";
  }
  if (commitCount >= 5) {
    return "处于活跃实现阶段";
  }
  return "处于持续细化阶段";
}

export function analyzeBranchActivity(
  activity: GithubActivity,
  language: "zh" | "en" = "zh",
): GithubBranchAnalysis[] {
  return activity.branchActivity.slice(0, 8).map((branch) => {
    const messages = branch.commits.map((commit) => commit.message).filter(Boolean);
    const topics = inferTopicsFromTexts(messages, language);
    const purpose = topics.length
      ? language === "en"
        ? `Work on ${topics.join(", ")}`
        : `围绕${topics.join("、")}推进`
      : language === "en"
        ? "Continue implementation and refinement"
        : "持续推进实现与细化";
    const mainChanges = branch.commits
      .slice(0, 3)
      .map((commit) => commit.message || commit.sha.slice(0, 7));
    const status = inferBranchStatus(branch.name, branch.commits.length, topics, language);

    return {
      branch: branch.name,
      purpose,
      mainChanges,
      status,
      commitCount: branch.commits.length,
    };
  });
}

function summarizeBranchActivity(activity: GithubActivity, language: "zh" | "en") {
  const branchAnalysis = analyzeBranchActivity(activity, language).slice(0, 5);

  if (language === "en") {
    if (!branchAnalysis.length) {
      return "- No branch commits were captured in the selected time window.";
    }

    return branchAnalysis
      .map((branch) => {
        return `- \`${branch.branch}\`: ${branch.commitCount} recent commit(s). Purpose: ${branch.purpose}. Main changes: ${branch.mainChanges.join("; ")}. Status: ${branch.status}.`;
      })
      .join("\n");
  }

  if (!branchAnalysis.length) {
    return "- 选定时间范围内没有捕获到 branch commit。";
  }

  return branchAnalysis
    .map((branch) => {
      return `- \`${branch.branch}\`：最近有 ${branch.commitCount} 个 commit。分支目的：${branch.purpose}。主要改动：${branch.mainChanges.join("；")}。当前状态：${branch.status}。`;
    })
    .join("\n");
}

function buildEvidenceConclusion(activity: GithubActivity, language: "zh" | "en") {
  const hasMergedPrs = activity.stats.merged_prs > 0;
  const hasOpenPrs = activity.stats.open_prs > 0;
  const hasBranchCommits = activity.stats.total_branch_commits > 0;
  const hasIssuePressure = activity.stats.total_issues > 0;

  if (language === "en") {
    if (hasMergedPrs && hasBranchCommits) {
      return `The most credible conclusion is that development is actively moving on two layers at once: merged PRs show changes are already landing, while ${activity.stats.active_branches} active branch(es) with ${activity.stats.total_branch_commits} recent commit(s) show parallel work is still underway outside the PR surface.`;
    }
    if (!hasMergedPrs && hasBranchCommits) {
      return `The strongest evidence points to work being concentrated in branch-level implementation rather than reviewed PR flow. There are ${activity.stats.total_branch_commits} recent commit(s) across ${activity.stats.active_branches} active branch(es), so repository activity is real, but part of it has not yet been fully reflected in merged PRs.`;
    }
    if (hasMergedPrs && !hasBranchCommits) {
      return `The clearest signal is that recent activity is mostly visible through the PR workflow. Changes are being reviewed and merged, but branch-level commit evidence in this window is limited, so conclusions should lean more on the PR and issue record.`;
    }
    if (hasOpenPrs || hasIssuePressure) {
      return `Recent evidence is lighter and more discussion-oriented than delivery-oriented. The repository still shows motion through PRs or issues, but there is not enough branch commit evidence to claim broad parallel implementation with high confidence.`;
    }
    return "Evidence is limited in this window. There is not enough recent PR, issue, or branch commit activity to support a strong conclusion beyond low visible repository movement.";
  }

  if (hasMergedPrs && hasBranchCommits) {
    return `当前最可信的结论是：仓库处在“已落地变更”和“并行分支开发”同时推进的状态。已合并 PR 说明部分工作已经进入主线，而 ${activity.stats.active_branches} 个活跃 branch 上的 ${activity.stats.total_branch_commits} 个近期 commit 说明仍有不少工作在分支中继续推进。`;
  }
  if (!hasMergedPrs && hasBranchCommits) {
    return `当前最可信的结论是：最近的真实开发活动更多发生在 branch 层，而不是已经完成评审并合并到主线的 PR 流程里。虽然合并信号偏弱，但 ${activity.stats.active_branches} 个活跃 branch 上仍能看到 ${activity.stats.total_branch_commits} 个近期 commit，因此不能仅凭 PR/Issue 偏少就判断项目停滞。`;
  }
  if (hasMergedPrs && !hasBranchCommits) {
    return "当前最可信的结论是：近期活动主要体现在 PR 流程，说明变更已经较集中地进入评审和合并阶段；但 branch commit 证据较少，因此对“并行开发面”不宜做过强推断。";
  }
  if (hasOpenPrs || hasIssuePressure) {
    return "当前最可信的结论是：仓库仍有讨论和推进，但更偏向问题跟踪或评审前后阶段。由于 branch commit 证据不足，对大规模并行编码活动只能做保守判断。";
  }

  return "当前时间窗口内可见证据较少，暂时无法对项目节奏做强结论，只能判断公开可见活动偏低。";
}

function formatPullLine(pull: GithubPull, language: "zh" | "en") {
  return language === "en"
    ? `- #${pull.number}: ${pull.title}`
    : `- #${pull.number}：${pull.title}`;
}

function formatIssueLine(issue: GithubIssue, language: "zh" | "en") {
  return language === "en"
    ? `- #${issue.number}: ${issue.title}`
    : `- #${issue.number}：${issue.title}`;
}

export function buildGithubDigest(activity: GithubActivity, language: "zh" | "en" = "zh") {
  const topPulls = activity.pulls.slice(0, 8);
  const topIssues = activity.issues.slice(0, 10);
  const trend = summarizeTrend(activity, language);
  const branchSummary = summarizeBranchActivity(activity, language);
  const conclusion = buildEvidenceConclusion(activity, language);

  if (language === "en") {
    return `# GitHub Project Activity Analysis - "${activity.repo}"

## Trend Observation
${trend}

## Overview
In the last ${activity.days} day(s), the repository recorded ${activity.stats.total_prs} pull requests, ${activity.stats.total_issues} issue updates, and ${activity.stats.total_branch_commits} recent commit(s) across ${activity.stats.active_branches} active branch(es). ${activity.stats.merged_prs} pull requests were merged in this window, so the visible activity includes both landed work and branch-level implementation in progress.

## Important PRs
${topPulls.length ? topPulls.map((pull) => formatPullLine(pull, language)).join("\n") : "- No pull requests in range."}

## Active Issues
${topIssues.length ? topIssues.map((issue) => formatIssueLine(issue, language)).join("\n") : "- No issues in range."}

## Branch Commit Signals
${branchSummary}

## Credible Conclusion
${conclusion}
`;
  }

  return `# GitHub 项目活动分析 - "${activity.repo}"

## 趋势观察
${trend}

## 总览
在过去的 ${activity.days} 天里，${activity.repo} 仓库共记录了 ${activity.stats.total_prs} 个 Pull Request、${activity.stats.total_issues} 个 Issue 更新，以及来自 ${activity.stats.active_branches} 个活跃 branch 的 ${activity.stats.total_branch_commits} 个近期 commit，其中 ${activity.stats.merged_prs} 个 PR 已经被合并。整体来看，这段时间既有已经进入主线的改动，也有尚在分支中推进的实现工作。

## 重要 PR
${topPulls.length ? topPulls.map((pull) => formatPullLine(pull, language)).join("\n") : "- 选定时间范围内没有 PR。"}

## 活跃 Issue
${topIssues.length ? topIssues.map((issue) => formatIssueLine(issue, language)).join("\n") : "- 选定时间范围内没有 Issue。"}

## Branch Commit 动向
${branchSummary}

## 可信结论
${conclusion}
`;
}
