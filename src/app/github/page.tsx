import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { GithubSourceForm } from "@/components/github/github-source-form";
import { listSources } from "@/lib/sources/repository";
import { listSummaries } from "@/lib/summaries/repository";
import { listTasks } from "@/lib/tasks/task-status";

export const dynamic = "force-dynamic";

export default async function GithubPage() {
  const [sources, tasks, summaries] = await Promise.all([
    listSources("github"),
    listTasks(10),
    listSummaries(10),
  ]);
  const githubTasks = tasks.filter((task) => task.taskType === "github_digest");
  const githubSummaries = summaries.filter((summary) => summary.sourceType === "github");

  return (
    <AppShell eyebrow="Sources" title="GitHub">
      <div className="grid">
        <section className="panel span-6">
          <p className="panel-kicker">Registered repos</p>
          <h3 className="panel-title">GitHub sources</h3>
          <GithubSourceForm
            sources={sources.map((source) => ({
              id: source.id,
              name: source.name,
              externalId: source.externalId,
            }))}
          />
          <div className="api-list">
            {sources.length ? (
              sources.map((source) => (
                <div key={source.id} className="api-item">
                  <div className="api-path">{source.externalId}</div>
                  <p className="card-detail">{source.name}</p>
                </div>
              ))
            ) : (
              <p className="card-detail">
                No GitHub source yet. Add one from the form above.
              </p>
            )}
          </div>
        </section>

        <section className="panel span-6">
          <p className="panel-kicker">Task flow</p>
          <h3 className="panel-title">GitHub digest tasks</h3>
          <div className="api-list">
            {githubTasks.length ? (
              githubTasks.map((task) => (
                <div key={task.id} className="api-item">
                  <div className="api-path">{task.status}</div>
                  <p className="card-detail">
                    {task.message ?? "No message"}{task.resultSummaryId ? ` -> ${task.resultSummaryId}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="card-detail">
                Run a digest from the form above.
              </p>
            )}
          </div>
        </section>

        <section className="panel span-12">
          <p className="panel-kicker">Output</p>
          <h3 className="panel-title">Recent GitHub summaries</h3>
          <div className="api-list">
            {githubSummaries.length ? (
              githubSummaries.map((summary) => (
                <Link key={summary.id} href={`/summaries/${summary.id}`} className="api-item card-link">
                  <div className="api-path">{summary.title}</div>
                  <p className="card-detail">{summary.summaryText?.slice(0, 180) ?? "No summary body."}</p>
                </Link>
              ))
            ) : (
              <p className="card-detail">No GitHub summaries have been generated yet.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
