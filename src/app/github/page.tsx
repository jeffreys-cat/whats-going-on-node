import Link from "next/link";

import { GithubBatchRunList } from "@/components/github/github-batch-run-list";
import { GithubSourceForm } from "@/components/github/github-source-form";
import { GithubTaskList } from "@/components/github/github-task-list";
import { GithubSummaryList } from "@/components/github/github-summary-list";
import { getGithubPageData } from "@/lib/github/page-data";

export const dynamic = "force-dynamic";

export default async function GithubPage() {
  const { sources, tasks, summaries, batchRuns } = await getGithubPageData({
    taskLimit: 8,
    summaryLimit: 6,
    batchRunLimit: 4,
  });
  const failedTasks = tasks.filter((task) => task.status === "failed");
  const latestBatchRun = batchRuns[0] ?? null;

  return (
    <div className="grid">
      <section className="card span-3">
        <p className="card-label">Repositories</p>
        <p className="card-value">{sources.length}</p>
        <p className="card-detail">Tracked GitHub repositories.</p>
      </section>
      <section className="card span-3">
        <p className="card-label">Recent Tasks</p>
        <p className="card-value">{tasks.length}</p>
        <p className="card-detail">Latest digest runs loaded on this dashboard.</p>
      </section>
      <section className="card span-3">
        <p className="card-label">Failures</p>
        <p className="card-value">{failedTasks.length}</p>
        <p className="card-detail">Recent tasks that need attention.</p>
      </section>
      <section className="card span-3">
        <p className="card-label">Latest Batch</p>
        <p className="card-value">{latestBatchRun ? latestBatchRun.startedCount : 0}</p>
        <p className="card-detail">{latestBatchRun ? latestBatchRun.status : "No batch run yet."}</p>
      </section>

      <section className="panel span-6">
        <p className="panel-kicker">Quick add</p>
        <h3 className="panel-title">Register a repository</h3>
        <p className="panel-copy">The overview only keeps setup and recent signals. Full repository controls moved to the dedicated repositories page.</p>
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
        <p className="panel-kicker">Status</p>
        <h3 className="panel-title">GitHub workspace</h3>
        <div className="overview-list">
          <div className="overview-list-item">
            <span className="field-caption">Repositories page</span>
            <p className="card-detail">Edit repository settings, inspect per-repo history, and trigger individual digests.</p>
          </div>
          <div className="overview-list-item">
            <span className="field-caption">Tasks and summaries</span>
            <p className="card-detail">Execution history and generated output are now split into dedicated views.</p>
          </div>
          <div className="overview-list-item">
            <span className="field-caption">Batch runs</span>
            <p className="card-detail">Daily batch execution history has its own page, including rerun controls.</p>
          </div>
        </div>
      </section>

      <section className="panel span-6">
        <div className="panel-header-inline">
          <div>
            <p className="panel-kicker">Task flow</p>
            <h3 className="panel-title">Recent GitHub tasks</h3>
          </div>
          <Link href="/github/tasks" className="button button-secondary button-link-inline">
            View all tasks
          </Link>
        </div>
        <GithubTaskList tasks={tasks.slice(0, 5)} sources={sources} emptyMessage="No GitHub tasks yet." />
      </section>

      <section className="panel span-6">
        <div className="panel-header-inline">
          <div>
            <p className="panel-kicker">Output</p>
            <h3 className="panel-title">Recent summaries</h3>
          </div>
          <Link href="/github/summaries" className="button button-secondary button-link-inline">
            View all summaries
          </Link>
        </div>
        <GithubSummaryList
          summaries={summaries.slice(0, 4)}
          sources={sources}
          emptyMessage="No GitHub summaries yet."
        />
      </section>

      <section className="panel span-12">
        <div className="panel-header-inline">
          <div>
            <p className="panel-kicker">Batch runs</p>
            <h3 className="panel-title">Recent daily batches</h3>
          </div>
          <Link href="/github/batch-runs" className="button button-secondary button-link-inline">
            View all batch runs
          </Link>
        </div>
        <GithubBatchRunList batchRuns={batchRuns} emptyMessage="No daily batch executions yet." />
      </section>
    </div>
  );
}
