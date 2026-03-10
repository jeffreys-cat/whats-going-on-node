import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { StatusCard } from "@/components/status-card";
import { TaskAutoRefresh } from "@/components/tasks/task-auto-refresh";
import { TaskDeleteButton } from "@/components/tasks/task-delete-button";
import { TaskRunButton } from "@/components/tasks/task-run-button";
import { listTasks } from "@/lib/tasks/task-status";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = await listTasks(50);
  const pendingCount = tasks.filter((task) => task.status === "pending").length;
  const runningCount = tasks.filter((task) => task.status === "running").length;
  const succeededCount = tasks.filter((task) => task.status === "succeeded").length;
  const failedCount = tasks.filter((task) => task.status === "failed").length;
  const shouldAutoRefresh = pendingCount > 0 || runningCount > 0;

  return (
    <AppShell eyebrow="Execution" title="Tasks">
      <div className="grid">
        <div className="span-3">
          <StatusCard title="Pending" value={String(pendingCount)} detail="Queued tasks waiting to start." />
        </div>
        <div className="span-3">
          <StatusCard title="Running" value={String(runningCount)} detail="Tasks currently in progress." />
        </div>
        <div className="span-3">
          <StatusCard title="Succeeded" value={String(succeededCount)} detail="Completed tasks with saved results." />
        </div>
        <div className="span-3">
          <StatusCard title="Failed" value={String(failedCount)} detail="Tasks that ended with an error." />
        </div>

        <section className="panel span-12">
          <p className="panel-kicker">Execution history</p>
          <h3 className="panel-title">Recent tasks</h3>
          <TaskAutoRefresh active={shouldAutoRefresh} />
          {tasks.length ? (
            <div className="task-list">
              {tasks.map((task) => (
                <article key={task.id} className="task-card">
                  <div className="task-card-head">
                    <div>
                      <Link href={`/tasks/${task.id}`} className="api-path task-title-link">
                        {task.taskType}
                      </Link>
                      <p className="card-detail">{task.createdAt.slice(0, 19).replace("T", " ")}</p>
                    </div>
                    <span className={`pill pill-${task.status}`}>{task.status}</span>
                  </div>

                  <div className="task-meta">
                    <span>Progress: {task.progress}%</span>
                    {task.currentStep ? <span>Step: {task.currentStep}</span> : null}
                    {task.sourceId ? <span>Source: {task.sourceId}</span> : null}
                  </div>

                  <p className="card-detail">{task.message ?? "No task message."}</p>

                  {task.errorMessage ? <p className="task-error">{task.errorMessage}</p> : null}

                  <div className="task-meta">
                    {task.startedAt ? <span>Started: {task.startedAt.slice(0, 19).replace("T", " ")}</span> : null}
                    {task.finishedAt ? <span>Finished: {task.finishedAt.slice(0, 19).replace("T", " ")}</span> : null}
                  </div>

                  <div className="task-actions">
                    <Link href={`/tasks/${task.id}`} className="api-path task-title-link">
                      {task.id}
                    </Link>
                    <div className="task-action-group">
                      {task.status === "pending" || task.status === "failed" ? (
                        <TaskRunButton taskId={task.id} status={task.status} />
                      ) : null}
                      {task.status !== "running" ? <TaskDeleteButton taskId={task.id} /> : null}
                      {task.resultSummaryId ? (
                        <Link href={`/summaries/${task.resultSummaryId}`} className="button button-link-inline">
                          Open summary
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="card-detail">No task executions yet.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
