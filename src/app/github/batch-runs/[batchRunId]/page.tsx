import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { BatchRunTaskResults } from "@/components/github/batch-run-task-results";
import { TaskAutoRefresh } from "@/components/tasks/task-auto-refresh";
import { listSources } from "@/lib/sources/repository";
import { getBatchRun } from "@/lib/tasks/batch-runs";
import { listTasksByIds } from "@/lib/tasks/task-status";

export const dynamic = "force-dynamic";

function formatTimestamp(value: string | null) {
  return value ? value.slice(0, 19).replace("T", " ") : "Not recorded";
}

function formatJson(value: Record<string, unknown>) {
  return JSON.stringify(value, null, 2);
}

function getTaskIds(metadata: Record<string, unknown>) {
  const taskIds = metadata.taskIds;

  if (!Array.isArray(taskIds)) {
    return [];
  }

  return taskIds.filter((taskId): taskId is string => typeof taskId === "string");
}

export default async function BatchRunDetailPage({
  params,
}: {
  params: Promise<{ batchRunId: string }>;
}) {
  const { batchRunId } = await params;
  const batchRun = await getBatchRun(batchRunId);

  if (!batchRun) {
    notFound();
  }

  const taskIds = getTaskIds(batchRun.metadata);
  const [tasks, sources] = await Promise.all([listTasksByIds(taskIds), listSources("github")]);
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const shouldAutoRefresh = tasks.some((task) => task.status === "pending" || task.status === "running");
  const taskResultItems = taskIds.map((taskId) => {
    const task = taskMap.get(taskId);

    if (!task) {
      return {
        id: taskId,
        exists: false,
        status: "missing" as const,
        sourceLabel: "Task record missing",
        taskType: null,
        createdAt: null,
        startedAt: null,
        finishedAt: null,
        finalResult: "Task record no longer exists.",
        taskHref: null,
        summaryHref: null,
      };
    }

    const source = task.sourceId ? sourceMap.get(task.sourceId) : null;
    const sourceLabel = source?.externalId ?? source?.name ?? task.sourceId ?? "No source linked";
    const finalResult =
      task.status === "succeeded"
        ? task.resultSummaryId
          ? `Summary generated: ${task.resultSummaryId}`
          : task.message ?? "Task succeeded without a linked summary."
        : task.status === "failed"
          ? task.errorMessage ?? task.message ?? "Task failed without an error message."
          : task.message ?? "Task has not completed yet.";

    return {
      id: taskId,
      exists: true,
      status: task.status,
      sourceLabel,
      taskType: task.taskType,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      finishedAt: task.finishedAt,
      finalResult,
      taskHref: `/tasks/${task.id}` as Route,
      summaryHref: task.resultSummaryId ? (`/summaries/${task.resultSummaryId}` as Route) : null,
    };
  });

  return (
    <AppShell eyebrow="Execution" title="Batch Detail">
      <div className="grid">
        <section className="panel span-8">
          <p className="panel-kicker">{batchRun.batchType}</p>
          <div className="detail-header">
            <div>
              <h3 className="panel-title">Batch execution state</h3>
              <p className="card-detail">Review this batch run, the linked task IDs, and each task&apos;s final outcome.</p>
            </div>
            <span className={`pill pill-${batchRun.status}`}>{batchRun.status}</span>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Batch run ID</dt>
              <dd className="api-path">{batchRun.id}</dd>
            </div>
            <div>
              <dt>Trigger source</dt>
              <dd>{batchRun.triggerSource}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatTimestamp(batchRun.createdAt)}</dd>
            </div>
            <div>
              <dt>Message</dt>
              <dd>{batchRun.message ?? "No batch message."}</dd>
            </div>
            <div>
              <dt>Queued</dt>
              <dd>{batchRun.queuedCount}</dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd>{batchRun.startedCount}</dd>
            </div>
            <div>
              <dt>Failed</dt>
              <dd>{batchRun.failedCount}</dd>
            </div>
            <div>
              <dt>Task IDs</dt>
              <dd>{taskIds.length}</dd>
            </div>
          </dl>

          {batchRun.errorMessage ? (
            <div className="dev-panel">
              <p className="panel-kicker">Failure</p>
              <h4 className="section-title">Error</h4>
              <p className="task-error">{batchRun.errorMessage}</p>
            </div>
          ) : null}

          <div className="dev-panel">
            <p className="panel-kicker">Metadata</p>
            <h4 className="section-title">Batch payload</h4>
            <pre className="json-block">
              <code>{formatJson(batchRun.metadata)}</code>
            </pre>
          </div>
        </section>

        <section className="panel span-4">
          <p className="panel-kicker">Actions</p>
          <h3 className="panel-title">Navigation</h3>
          <div className="detail-action-stack">
            <TaskAutoRefresh active={shouldAutoRefresh} />
            <Link href="/github" className="button button-link">
              Back to GitHub
            </Link>
            <Link href="/tasks" className="button button-secondary">
              Open all tasks
            </Link>
          </div>
        </section>

        <section className="panel span-12">
          <p className="panel-kicker">Linked tasks</p>
          <h3 className="panel-title">Task IDs and final results</h3>
          {taskIds.length ? (
            <BatchRunTaskResults items={taskResultItems} />
          ) : (
            <p className="card-detail">This batch run did not record any linked task IDs.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
