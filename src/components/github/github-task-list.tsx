import Link from "next/link";

import type { SourceRecord } from "@/types/source";
import type { SummaryTaskRecord } from "@/types/task";

export function GithubTaskList({
  tasks,
  sources,
  emptyMessage,
}: {
  tasks: SummaryTaskRecord[];
  sources: Array<Pick<SourceRecord, "id" | "externalId">>;
  emptyMessage: string;
}) {
  const sourceMap = new Map(sources.map((source) => [source.id, source.externalId]));

  if (!tasks.length) {
    return <p className="card-detail">{emptyMessage}</p>;
  }

  return (
    <div className="api-list">
      {tasks.map((task) => (
        <Link key={task.id} href={`/tasks/${task.id}`} className="api-item card-link">
          <div className="task-card-head">
            <div>
              <div className="api-path">
                {sourceMap.get(task.sourceId ?? "") ?? "Unknown repo"} · {task.status}
              </div>
              <p className="card-detail">{task.message ?? "No message"}</p>
            </div>
            <span className={`pill pill-${task.status}`}>{task.status}</span>
          </div>
          <div className="task-meta">
            <span>Created: {task.createdAt.slice(0, 19).replace("T", " ")}</span>
            <span>Progress: {task.progress}%</span>
            <span>{task.currentStep ?? "No current step"}</span>
          </div>
          {task.errorMessage ? <p className="task-error">{task.errorMessage}</p> : null}
        </Link>
      ))}
    </div>
  );
}
