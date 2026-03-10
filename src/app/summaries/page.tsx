import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { listSummaries } from "@/lib/summaries/repository";
import { listTasks } from "@/lib/tasks/task-status";

export const dynamic = "force-dynamic";

const endpoints = [
  "GET /api/summaries",
  "GET /api/summaries/:summaryId",
  "POST /api/tasks",
  "GET /api/tasks/:taskId",
];

export default async function SummariesPage() {
  const [summaries, tasks] = await Promise.all([listSummaries(20), listTasks(20)]);

  return (
    <AppShell eyebrow="Output" title="Summaries">
      <div className="grid">
        <section className="panel span-6">
          <p className="panel-kicker">API surface</p>
          <h3 className="panel-title">Core routes</h3>
          <div className="api-list">
            {endpoints.map((endpoint) => (
              <div key={endpoint} className="api-item">
                <div className="api-path">{endpoint}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel span-6">
          <p className="panel-kicker">Status</p>
          <h3 className="panel-title">What is implemented now</h3>
          <ul className="list">
            <li>Drizzle schema for config, sources, tasks, summaries, delivery logs, and cache.</li>
            <li>GitHub source registration and digest task execution are wired.</li>
            <li className="warn">Email, Slack, and delivery integrations are still stubs.</li>
          </ul>
        </section>

        <section className="panel span-6">
          <p className="panel-kicker">Recent tasks</p>
          <h3 className="panel-title">Execution history</h3>
          <div className="api-list">
            {tasks.length ? (
              tasks.map((task) => (
                <div key={task.id} className="api-item">
                  <div className="api-path">{task.taskType}</div>
                  <p className="card-detail">
                    {task.status} · {task.message ?? "No message"}
                  </p>
                </div>
              ))
            ) : (
              <p className="card-detail">No task executions yet.</p>
            )}
          </div>
        </section>

        <section className="panel span-12">
          <p className="panel-kicker">Saved summaries</p>
          <h3 className="panel-title">Latest output</h3>
          <div className="api-list">
            {summaries.length ? (
              summaries.map((summary) => (
                <Link key={summary.id} href={`/summaries/${summary.id}`} className="api-item card-link">
                  <div className="api-path">{summary.title}</div>
                  <p className="card-detail">
                    {summary.sourceType} · {summary.language} · {summary.contentDateStart.slice(0, 10)} to{" "}
                    {summary.contentDateEnd.slice(0, 10)}
                  </p>
                </Link>
              ))
            ) : (
              <p className="card-detail">No summaries saved yet.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
