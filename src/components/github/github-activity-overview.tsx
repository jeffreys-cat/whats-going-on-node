import Link from "next/link";

import type { SummaryRecord } from "@/types/summary";
import type { SummaryTaskRecord } from "@/types/task";

type SourceActivity = {
  id: string;
  name: string;
  externalId: string;
  updateCount: number;
  issueCount: number;
  latestRun: SummaryTaskRecord | null;
  latestUpdate: SummaryRecord | null;
  latestFailure: SummaryTaskRecord | null;
};

function formatDate(value: string) {
  return value.slice(0, 10);
}

function formatTimestamp(value: string | null | undefined) {
  return value ? value.slice(0, 19).replace("T", " ") : "Not available";
}

function getCycleLabel(summary: SummaryRecord | null) {
  if (!summary) {
    return "No cycle data yet";
  }

  return `${formatDate(summary.contentDateStart)} to ${formatDate(summary.contentDateEnd)}`;
}

export function GithubActivityOverview({
  activities,
  currentCycle,
}: {
  activities: SourceActivity[];
  currentCycle: { start: string; end: string } | null;
}) {
  const updatedThisCycle = currentCycle
    ? activities.filter(
        (activity) =>
          activity.latestUpdate?.contentDateStart === currentCycle.start &&
          activity.latestUpdate?.contentDateEnd === currentCycle.end,
      )
    : [];
  const reposAwaitingCycle = activities.filter((activity) => !activity.latestUpdate).length;
  const reposNeedingAttention = activities.filter((activity) => activity.issueCount > 0).length;

  return (
    <>
      <section className="panel span-8">
        <p className="panel-kicker">User view</p>
        <h3 className="panel-title">Repository activity in this cycle</h3>
        <p className="panel-copy">
          Focus on what each tracked repo changed in the current cycle, not the mechanics behind generating it.
        </p>
        <div className="source-metrics">
          <span className="pill">
            Current cycle:{" "}
            {currentCycle ? `${formatDate(currentCycle.start)} to ${formatDate(currentCycle.end)}` : "Not available"}
          </span>
          <span className="pill">{updatedThisCycle.length} repos updated in cycle</span>
          <span className={`pill ${reposNeedingAttention ? "pill-failed" : "pill-succeeded"}`}>
            {reposNeedingAttention ? `${reposNeedingAttention} repos need attention` : "All repos healthy"}
          </span>
        </div>
      </section>

      <section className="card span-4">
        <p className="card-label">Tracked repos</p>
        <p className="card-value">{activities.length}</p>
        <p className="card-detail">
          {reposAwaitingCycle ? `${reposAwaitingCycle} still waiting for first cycle update.` : "Every repo already has cycle history."}
        </p>
      </section>

      <section className="panel span-12">
        <div className="panel-header-inline">
          <div>
            <p className="panel-kicker">Cycle view</p>
            <h3 className="panel-title">Repository cards</h3>
          </div>
          <Link href="/github/repositories" className="button button-secondary button-link-inline">
            Manage repositories
          </Link>
        </div>
        {activities.length ? (
          <div className="repo-activity-grid">
            {activities.map((activity) => (
              <article key={activity.id} className="repo-activity-card">
                <div className="task-card-head">
                  <div>
                    <div className="api-path">{activity.externalId}</div>
                    <h4 className="repo-activity-title">{activity.name}</h4>
                  </div>
                  <span
                    className={`pill ${
                      activity.latestRun?.status === "failed"
                        ? "pill-failed"
                        : activity.latestRun
                          ? `pill-${activity.latestRun.status}`
                          : ""
                    }`}
                  >
                    {activity.latestRun?.status ?? "idle"}
                  </span>
                </div>

                <p className="repo-activity-cycle">{getCycleLabel(activity.latestUpdate)}</p>

                <div className="source-metrics">
                  <span className="pill">{activity.updateCount} cycle updates</span>
                  <span className={`pill ${activity.issueCount ? "pill-failed" : "pill-succeeded"}`}>
                    {activity.issueCount ? `${activity.issueCount} issues need review` : "No issues"}
                  </span>
                </div>

                <div className="repo-activity-meta">
                  <span>Latest update: {formatTimestamp(activity.latestUpdate?.createdAt)}</span>
                  <span>Latest refresh: {formatTimestamp(activity.latestRun?.createdAt)}</span>
                </div>

                <p className="repo-activity-copy">
                  {activity.latestUpdate?.summaryText?.slice(0, 180) ??
                    "No cycle update yet for this repository in the loaded history."}
                </p>

                {activity.latestFailure ? (
                  <p className="task-error">
                    Last failure: {(activity.latestFailure.errorMessage ?? activity.latestFailure.message ?? "Unknown error").slice(0, 160)}
                  </p>
                ) : null}

                <div className="task-actions">
                  <Link href="/github/repositories" className="button button-secondary button-link-inline">
                    Open repo settings
                  </Link>
                  {activity.latestUpdate ? (
                    <Link href={`/summaries/${activity.latestUpdate.id}`} className="button button-link-inline">
                      Open latest update
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="card-detail">No GitHub repositories registered yet.</p>
        )}
      </section>
    </>
  );
}
