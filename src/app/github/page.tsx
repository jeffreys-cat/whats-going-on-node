import Link from "next/link";

import { GithubActivityOverview } from "@/components/github/github-activity-overview";
import { GithubSourceForm } from "@/components/github/github-source-form";
import { getGithubPageData } from "@/lib/github/page-data";

export const dynamic = "force-dynamic";

export default async function GithubPage() {
  const { sources, tasks, summaries } = await getGithubPageData({
    taskLimit: 8,
    summaryLimit: 6,
    batchRunLimit: 4,
  });
  const failedTasks = tasks.filter((task) => task.status === "failed");
  const currentCycle = summaries[0]
    ? {
        start: summaries[0].contentDateStart,
        end: summaries[0].contentDateEnd,
      }
    : null;
  const activities = sources
    .map((source) => {
      const sourceTasks = tasks.filter((task) => task.sourceId === source.id);
      const sourceSummaries = summaries.filter((summary) => summary.sourceId === source.id);
      const latestTask = sourceTasks[0] ?? null;
      const latestSummary = sourceSummaries[0] ?? null;

      return {
        id: source.id,
        name: source.name,
        externalId: source.externalId,
        updateCount: sourceSummaries.length,
        issueCount: sourceTasks.filter((task) => task.status === "failed").length,
        latestRun: latestTask,
        latestUpdate: latestSummary,
        latestFailure: sourceTasks.find((task) => task.status === "failed") ?? null,
      };
    })
    .sort((left, right) => {
      const leftTimestamp = left.latestUpdate?.createdAt ?? left.latestRun?.createdAt ?? "";
      const rightTimestamp = right.latestUpdate?.createdAt ?? right.latestRun?.createdAt ?? "";

      return rightTimestamp.localeCompare(leftTimestamp);
    });

  return (
    <div className="grid">
      <GithubActivityOverview
        activities={activities}
        summaries={summaries}
        tasks={tasks}
        currentCycle={currentCycle}
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

      <section className="panel span-6">
        <p className="panel-kicker">Background status</p>
        <h3 className="panel-title">Health snapshot</h3>
        <div className="overview-list">
          <div className="overview-list-item">
            <span className="field-caption">Current cycle coverage</span>
            <p className="card-detail">
              {currentCycle
                ? `${activities.filter((activity) => activity.latestUpdate?.contentDateStart === currentCycle.start && activity.latestUpdate?.contentDateEnd === currentCycle.end).length} repos already have this cycle's update.`
                : "No cycle has been generated yet."}
            </p>
          </div>
          <div className="overview-list-item">
            <span className="field-caption">Background issues</span>
            <p className="card-detail">
              {failedTasks.length ? `${failedTasks.length} recent refresh failures need review.` : "No recent background failures."}
            </p>
          </div>
          <div className="overview-list-item">
            <span className="field-caption">Backend views</span>
            <p className="card-detail">Detailed runs and generated records stay in the dedicated operational pages, not on this homepage.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
