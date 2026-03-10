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

export type GithubActivity = {
  pulls: GithubPull[];
  issues: GithubIssue[];
  stats: {
    total_prs: number;
    merged_prs: number;
    open_prs: number;
    closed_prs: number;
    total_issues: number;
    open_issues: number;
    closed_issues: number;
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

  const [pullsRaw, issuesRaw] = await Promise.all([
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

  return {
    pulls,
    issues,
    stats: {
      total_prs: pulls.length,
      merged_prs: pulls.filter((pull) => pull.merged).length,
      open_prs: pulls.filter((pull) => pull.state === "open").length,
      closed_prs: pulls.filter((pull) => pull.state === "closed").length,
      total_issues: issues.length,
      open_issues: issues.filter((issue) => issue.state === "open").length,
      closed_issues: issues.filter((issue) => issue.state === "closed").length,
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

  for (const item of [...activity.pulls, ...activity.issues]) {
    const title = item.title.toLowerCase();
    if (title.includes("turbopack")) {
      topics.add(language === "zh" ? "Turbopack" : "Turbopack");
    }
    if (title.includes("memory") || title.includes("leak") || title.includes("oom")) {
      topics.add(language === "zh" ? "内存与稳定性" : "memory and stability");
    }
    if (title.includes("build") || title.includes("webpack")) {
      topics.add(language === "zh" ? "构建工具链" : "build tooling");
    }
    if (title.includes("css") || title.includes("tailwind")) {
      topics.add(language === "zh" ? "样式与 CSS 生态" : "styling and CSS");
    }
    if (title.includes("router") || title.includes("route")) {
      topics.add(language === "zh" ? "路由能力" : "routing");
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

  if (language === "en") {
    return `# GitHub Project Activity Analysis - "${activity.repo}"

## Trend Observation
${trend}

## Overview
In the last ${activity.days} day(s), the repository recorded ${activity.stats.total_prs} pull requests and ${activity.stats.total_issues} issue updates, with ${activity.stats.merged_prs} pull requests merged. Most of the visible activity points to continued framework iteration, tooling improvements, and stability work.

## Important PRs
${topPulls.length ? topPulls.map((pull) => formatPullLine(pull, language)).join("\n") : "- No pull requests in range."}

## Active Issues
${topIssues.length ? topIssues.map((issue) => formatIssueLine(issue, language)).join("\n") : "- No issues in range."}
`;
  }

  return `# GitHub 项目活动分析 - "${activity.repo}"

## 趋势观察
${trend}

## 总览
在过去的 ${activity.days} 天里，${activity.repo} 仓库共记录了 ${activity.stats.total_prs} 个 Pull Request 和 ${activity.stats.total_issues} 个 Issue 更新，其中 ${activity.stats.merged_prs} 个 PR 已经被合并。整体来看，这段时间的改动主要围绕框架能力增强、构建工具链优化以及稳定性修复展开。

## 重要 PR
${topPulls.length ? topPulls.map((pull) => formatPullLine(pull, language)).join("\n") : "- 选定时间范围内没有 PR。"}

## 活跃 Issue
${topIssues.length ? topIssues.map((issue) => formatIssueLine(issue, language)).join("\n") : "- 选定时间范围内没有 Issue。"}
`;
}
