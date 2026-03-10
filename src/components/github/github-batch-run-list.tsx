import Link from "next/link";

import type { BatchRunRecord } from "@/types/batch-run";

export function GithubBatchRunList({
  batchRuns,
  emptyMessage,
}: {
  batchRuns: BatchRunRecord[];
  emptyMessage: string;
}) {
  if (!batchRuns.length) {
    return <p className="card-detail">{emptyMessage}</p>;
  }

  return (
    <div className="api-list">
      {batchRuns.map((run) => (
        <Link key={run.id} href={`/batch-runs/${run.id}`} className="api-item card-link">
          <div className="task-card-head">
            <div>
              <div className="api-path">
                {run.triggerSource} · {run.createdAt.slice(0, 19).replace("T", " ")}
              </div>
              <p className="card-detail">{run.message ?? "No batch message."}</p>
            </div>
            <span className={`pill pill-${run.status}`}>{run.status}</span>
          </div>
          <div className="task-meta">
            <span>Queued: {run.queuedCount}</span>
            <span>Started: {run.startedCount}</span>
            <span>Failed: {run.failedCount}</span>
          </div>
          {run.errorMessage ? <p className="task-error">{run.errorMessage}</p> : null}
        </Link>
      ))}
    </div>
  );
}
