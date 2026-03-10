import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { TaskAutoRefresh } from "@/components/tasks/task-auto-refresh";
import { TaskDeleteButton } from "@/components/tasks/task-delete-button";
import { TaskRunButton } from "@/components/tasks/task-run-button";
import { getTask } from "@/lib/tasks/task-status";

export const dynamic = "force-dynamic";

function formatTimestamp(value: string | null) {
  return value ? value.slice(0, 19).replace("T", " ") : "Not recorded";
}

function formatJson(value: Record<string, unknown>) {
  return JSON.stringify(value, null, 2);
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const task = await getTask(taskId);

  if (!task) {
    notFound();
  }

  const runnableStatus =
    task.status === "pending" || task.status === "failed" ? task.status : null;
  const shouldAutoRefresh = task.status === "pending" || task.status === "running";

  return (
    <AppShell eyebrow="Execution" title="Task Detail">
      <div className="grid">
        <section className="panel span-8">
          <p className="panel-kicker">{task.taskType}</p>
          <div className="detail-header">
            <div>
              <h3 className="panel-title">Execution state</h3>
              <p className="card-detail">Inspect the task input, progress, and final output linkage.</p>
            </div>
            <span className={`pill pill-${task.status}`}>{task.status}</span>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Task ID</dt>
              <dd className="api-path">{task.id}</dd>
            </div>
            <div>
              <dt>Progress</dt>
              <dd>{task.progress}%</dd>
            </div>
            <div>
              <dt>Current step</dt>
              <dd>{task.currentStep ?? "Not set"}</dd>
            </div>
            <div>
              <dt>Message</dt>
              <dd>{task.message ?? "No task message."}</dd>
            </div>
            <div>
              <dt>Source ID</dt>
              <dd className="metadata-value">{task.sourceId ?? "No source linked"}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatTimestamp(task.createdAt)}</dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd>{formatTimestamp(task.startedAt)}</dd>
            </div>
            <div>
              <dt>Finished</dt>
              <dd>{formatTimestamp(task.finishedAt)}</dd>
            </div>
          </dl>

          {task.errorMessage ? (
            <div className="dev-panel">
              <p className="panel-kicker">Failure</p>
              <h4 className="section-title">Error</h4>
              <p className="task-error">{task.errorMessage}</p>
            </div>
          ) : null}

          <div className="dev-panel">
            <p className="panel-kicker">Payload</p>
            <h4 className="section-title">Task params</h4>
            <pre className="json-block">
              <code>{formatJson(task.params)}</code>
            </pre>
          </div>
        </section>

        <section className="panel span-4">
          <p className="panel-kicker">Actions</p>
          <h3 className="panel-title">Controls</h3>
          <div className="detail-action-stack">
            <TaskAutoRefresh active={shouldAutoRefresh} />
            {runnableStatus ? <TaskRunButton taskId={task.id} status={runnableStatus} /> : null}
            {task.status !== "running" ? <TaskDeleteButton taskId={task.id} redirectToTasks /> : null}
            {task.resultSummaryId ? (
              <Link href={`/summaries/${task.resultSummaryId}`} className="button">
                Open summary
              </Link>
            ) : null}
            <Link href="/tasks" className="button button-link">
              Back to tasks
            </Link>
          </div>

          <div className="dev-panel">
            <p className="panel-kicker">Result</p>
            <h4 className="section-title">Summary linkage</h4>
            <dl className="detail-list">
              <div>
                <dt>Summary ID</dt>
                <dd className="metadata-value">{task.resultSummaryId ?? "No summary generated"}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
