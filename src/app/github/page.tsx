import type { Route } from "next";
import Link from "next/link";

import { GithubActivityOverview } from "@/components/github/github-activity-overview";
import { slugifyMarkdownHeading } from "@/components/summaries/markdown-content";
import { GithubSourceForm } from "@/components/github/github-source-form";
import { getGithubPageData } from "@/lib/github/page-data";
import type { SummaryRecord } from "@/types/summary";
import type { SummaryTaskRecord } from "@/types/task";

export const dynamic = "force-dynamic";

type GithubActivity = {
  id: string;
  name: string;
  externalId: string;
  updateCount: number;
  issueCount: number;
  latestRun: SummaryTaskRecord | null;
  latestUpdate: SummaryRecord | null;
  cycleUpdate: SummaryRecord | null;
  latestFailure: SummaryTaskRecord | null;
};

function formatDate(value: string) {
  return value.slice(0, 10);
}

function getCycleValue(cycle: { start: string; end: string }) {
  return `${cycle.start}..${cycle.end}`;
}

function parseCycleValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [start, end] = value.split("..");

  if (!start || !end) {
    return null;
  }

  return { start, end };
}

function isInCycle(
  summary: SummaryRecord | null,
  currentCycle: { start: string; end: string } | null,
) {
  return Boolean(
    summary &&
      currentCycle &&
      summary.contentDateStart === currentCycle.start &&
      summary.contentDateEnd === currentCycle.end,
  );
}

function buildCycleOverviewMarkdown({
  activities,
  currentCycle,
}: {
  activities: GithubActivity[];
  currentCycle: { start: string; end: string };
}) {
  const updatedActivities = activities
    .filter((activity) => activity.cycleUpdate)
    .sort((left, right) => left.externalId.localeCompare(right.externalId));
  const missingActivities = activities
    .filter((activity) => !activity.cycleUpdate)
    .sort((left, right) => left.externalId.localeCompare(right.externalId));

  if (!updatedActivities.length) {
    return null;
  }

  const lines = [
    "# Repository Overview",
    "",
    `Cycle: ${formatDate(currentCycle.start)} to ${formatDate(currentCycle.end)}`,
    "",
    `Updated repositories: ${updatedActivities.length} / ${activities.length}`,
    "",
    "## Directory",
    "",
    ...updatedActivities.map((activity) => `- [${activity.externalId}](#${slugifyMarkdownHeading(activity.externalId)})`),
  ];

  if (missingActivities.length) {
    lines.push("", "## Missing In This Cycle", "");
    lines.push(...missingActivities.map((activity) => `- ${activity.externalId}`));
  }

  updatedActivities.forEach((activity) => {
    const cycleUpdate = activity.cycleUpdate;

    if (!cycleUpdate) {
      return;
    }

    lines.push(
      "",
      `## ${activity.externalId}`,
      "",
      `- Repository name: ${activity.name}`,
      `- Summary record: [${cycleUpdate.id}](/summaries/${cycleUpdate.id})`,
      `- Generated at: ${cycleUpdate.createdAt.slice(0, 19).replace("T", " ")}`,
      "",
      cycleUpdate.summaryText ?? "No summary body saved for this repository.",
    );
  });

  return lines.join("\n");
}

function buildRepositoryCycleMarkdown(activity: GithubActivity) {
  const summary = activity.cycleUpdate;

  if (!summary) {
    return null;
  }

  return [
    `# ${activity.externalId}`,
    "",
    `Cycle: ${formatDate(summary.contentDateStart)} to ${formatDate(summary.contentDateEnd)}`,
    "",
    `- Repository name: ${activity.name}`,
    `- Summary record: ${summary.id}`,
    `- Generated at: ${summary.createdAt.slice(0, 19).replace("T", " ")}`,
    "",
    summary.summaryText ?? "No summary body saved for this repository.",
  ].join("\n");
}

export default async function GithubPage({
  searchParams,
}: {
  searchParams?: Promise<{ cycle?: string }>;
}) {
  const { sources, tasks, summaries } = await getGithubPageData({
    taskLimit: 8,
    summaryLimit: 200,
    batchRunLimit: 4,
  });
  const cycleMap = new Map<string, { start: string; end: string }>();
  summaries.forEach((summary) => {
    const cycle = {
      start: summary.contentDateStart,
      end: summary.contentDateEnd,
    };
    cycleMap.set(getCycleValue(cycle), cycle);
  });
  const cycles = Array.from(cycleMap.values()).sort((left, right) =>
    getCycleValue(right).localeCompare(getCycleValue(left)),
  );
  const resolvedSearchParams = await searchParams;
  const requestedCycle = parseCycleValue(resolvedSearchParams?.cycle);
  const currentCycle =
    (requestedCycle ? cycles.find((cycle) => getCycleValue(cycle) === getCycleValue(requestedCycle)) : null) ??
    cycles[0] ??
    null;
  const activities: GithubActivity[] = sources
    .map((source) => {
      const sourceTasks = tasks.filter((task) => task.sourceId === source.id);
      const sourceSummaries = summaries.filter((summary) => summary.sourceId === source.id);
      const latestTask = sourceTasks[0] ?? null;
      const latestSummary = sourceSummaries[0] ?? null;
      const cycleSummary = currentCycle
        ? sourceSummaries.find(
            (summary) =>
              summary.contentDateStart === currentCycle.start && summary.contentDateEnd === currentCycle.end,
          ) ?? null
        : null;

      return {
        id: source.id,
        name: source.name,
        externalId: source.externalId,
        updateCount: sourceSummaries.length,
        issueCount: sourceTasks.filter((task) => task.status === "failed").length,
        latestRun: latestTask,
        latestUpdate: latestSummary,
        cycleUpdate: cycleSummary,
        latestFailure: sourceTasks.find((task) => task.status === "failed") ?? null,
      };
    })
    .sort((left, right) => {
      const leftHasCycle = left.cycleUpdate ? 1 : 0;
      const rightHasCycle = right.cycleUpdate ? 1 : 0;

      if (leftHasCycle !== rightHasCycle) {
        return rightHasCycle - leftHasCycle;
      }

      const leftTimestamp = left.cycleUpdate?.createdAt ?? left.latestUpdate?.createdAt ?? left.latestRun?.createdAt ?? "";
      const rightTimestamp =
        right.cycleUpdate?.createdAt ?? right.latestUpdate?.createdAt ?? right.latestRun?.createdAt ?? "";

      if (leftTimestamp !== rightTimestamp) {
        return rightTimestamp.localeCompare(leftTimestamp);
      }

      return left.externalId.localeCompare(right.externalId);
    });
  const cycleOverviewMarkdown = currentCycle
    ? buildCycleOverviewMarkdown({
        activities,
        currentCycle,
      })
    : null;
  const cycleOptions = cycles.map((cycle) => ({
    value: getCycleValue(cycle),
    label: `${formatDate(cycle.start)} to ${formatDate(cycle.end)}`,
  }));
  const selectedCycleValue = currentCycle ? getCycleValue(currentCycle) : "";
  const cycleTabs = [
    ...(cycleOverviewMarkdown
      ? [
          {
            id: "repository-overview",
            label: "Repository Overview",
            content: cycleOverviewMarkdown,
            summaryHref: null,
            summaryId: null,
          },
        ]
      : []),
    ...activities.flatMap((activity) => {
      const content = buildRepositoryCycleMarkdown(activity);

      return content
        ? [
            {
              id: activity.id,
              label: activity.externalId,
              content,
              summaryHref: `/summaries/${activity.cycleUpdate?.id}` as Route,
              summaryId: activity.cycleUpdate?.id ?? null,
            },
          ]
        : [];
    }),
  ];

  return (
    <div className="grid">
      <GithubActivityOverview
        activities={activities}
        currentCycle={currentCycle}
        cycleOptions={cycleOptions}
        selectedCycleValue={selectedCycleValue}
        cycleTabs={cycleTabs}
      />

      <section className="panel span-6">
        <p className="panel-kicker">Quick add</p>
        <h3 className="panel-title">Register a repository</h3>
        <p className="panel-copy">Keep onboarding here, but the core view now prioritizes what repositories did in the cycle.</p>
        <GithubSourceForm
          sources={sources.map((source) => ({
            id: source.id,
            name: source.name,
            externalId: source.externalId,
            config: source.config,
          }))}
        />
        <Link href="/github/repositories" className="button button-secondary button-link">
          Open repository management
        </Link>
      </section>
    </div>
  );
}
