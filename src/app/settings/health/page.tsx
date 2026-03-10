import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { getGithubPageData } from "@/lib/github/page-data";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return value.slice(0, 10);
}

export default async function SettingsHealthPage() {
  const { sources, tasks, summaries, batchRuns } = await getGithubPageData({
    taskLimit: 40,
    summaryLimit: 200,
    batchRunLimit: 10,
  });
  const failedTasks = tasks.filter((task) => task.status === "failed");
  const currentCycle = summaries[0]
    ? {
        start: summaries[0].contentDateStart,
        end: summaries[0].contentDateEnd,
      }
    : null;
  const reposCoveredInCurrentCycle = currentCycle
    ? sources.filter((source) =>
        summaries.some(
          (summary) =>
            summary.sourceId === source.id &&
            summary.contentDateStart === currentCycle.start &&
            summary.contentDateEnd === currentCycle.end,
        ),
      ).length
    : 0;

  return (
    <AppShell eyebrow="Configuration" title="Health Snapshot">
      <div className="grid">
        <section className="panel span-8">
          <p className="panel-kicker">GitHub</p>
          <h3 className="panel-title">System health snapshot</h3>
          <div className="overview-list">
            <div className="overview-list-item">
              <span className="field-caption">Current cycle</span>
              <p className="card-detail">
                {currentCycle
                  ? `${formatDate(currentCycle.start)} to ${formatDate(currentCycle.end)}`
                  : "No cycle has been generated yet."}
              </p>
            </div>
            <div className="overview-list-item">
              <span className="field-caption">Current cycle coverage</span>
              <p className="card-detail">
                {currentCycle
                  ? `${reposCoveredInCurrentCycle} of ${sources.length} repositories already have this cycle's update.`
                  : "Coverage is not available until the first cycle is generated."}
              </p>
            </div>
            <div className="overview-list-item">
              <span className="field-caption">Background issues</span>
              <p className="card-detail">
                {failedTasks.length ? `${failedTasks.length} recent refresh failures need review.` : "No recent background failures."}
              </p>
            </div>
            <div className="overview-list-item">
              <span className="field-caption">Recent batch runs</span>
              <p className="card-detail">
                {batchRuns.length ? `${batchRuns.length} recent GitHub batch runs are available in the digest history.` : "No GitHub batch runs recorded yet."}
              </p>
            </div>
          </div>
        </section>

        <section className="panel span-4">
          <p className="panel-kicker">Navigation</p>
          <h3 className="panel-title">Settings pages</h3>
          <div className="detail-action-stack">
            <Link href="/settings" className="button button-secondary">
              Back to settings
            </Link>
            <Link href="/github" className="button button-link">
              Open GitHub activity
            </Link>
            <Link href="/batch-runs" className="button button-link">
              Open batch runs
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
