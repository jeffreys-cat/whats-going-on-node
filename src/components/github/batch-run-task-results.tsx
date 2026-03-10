"use client";

import type { Route } from "next";
import Link from "next/link";
import { startTransition, useDeferredValue, useState } from "react";

type BatchTaskStatusFilter =
  | "all"
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "missing";

type BatchTaskResultItem = {
  id: string;
  exists: boolean;
  status: BatchTaskStatusFilter;
  sourceLabel: string;
  taskType: string | null;
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  finalResult: string;
  taskHref: Route | null;
  summaryHref: Route | null;
};

function formatTimestamp(value: string | null) {
  return value ? value.slice(0, 19).replace("T", " ") : "Not recorded";
}

export function BatchRunTaskResults({
  items,
}: {
  items: BatchTaskResultItem[];
}) {
  const [statusFilter, setStatusFilter] = useState<BatchTaskStatusFilter>("all");
  const deferredStatusFilter = useDeferredValue(statusFilter);
  const visibleItems =
    deferredStatusFilter === "all"
      ? items
      : items.filter((item) => item.status === deferredStatusFilter);

  const counts = {
    total: items.length,
    succeeded: items.filter((item) => item.status === "succeeded").length,
    failed: items.filter((item) => item.status === "failed").length,
    running: items.filter((item) => item.status === "running").length,
    pending: items.filter((item) => item.status === "pending").length,
    missing: items.filter((item) => item.status === "missing").length,
  };

  return (
    <>
      <div className="batch-stat-grid">
        <div className="api-item">
          <p className="panel-kicker">Total tasks</p>
          <p className="card-value batch-stat-value">{counts.total}</p>
        </div>
        <div className="api-item">
          <p className="panel-kicker">Succeeded</p>
          <p className="card-value batch-stat-value">{counts.succeeded}</p>
        </div>
        <div className="api-item">
          <p className="panel-kicker">Failed</p>
          <p className="card-value batch-stat-value">{counts.failed}</p>
        </div>
        <div className="api-item">
          <p className="panel-kicker">In flight</p>
          <p className="card-value batch-stat-value">{counts.pending + counts.running}</p>
        </div>
      </div>

      <div className="panel-header-inline batch-toolbar">
        <label className="field filter-field">
          <span className="field-caption">Task status</span>
          <select
            className="field-input"
            value={statusFilter}
            onChange={(event) => {
              const nextValue = event.target.value as BatchTaskStatusFilter;
              startTransition(() => {
                setStatusFilter(nextValue);
              });
            }}
          >
            <option value="all">All tasks</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
            <option value="missing">Missing</option>
          </select>
        </label>
        <p className="card-detail batch-toolbar-copy">
          Showing {visibleItems.length} of {items.length} tasks.
        </p>
      </div>

      <div className="api-list">
        {visibleItems.length ? (
          visibleItems.map((item) => (
            <div key={item.id} className="api-item">
              <div className="task-card-head">
                <div>
                  <div className="api-path">{item.id}</div>
                  <p className="card-detail">
                    {item.sourceLabel}
                    {item.taskType ? ` · ${item.taskType}` : ""}
                  </p>
                </div>
                <span className={`pill ${item.exists ? `pill-${item.status}` : ""}`}>{item.status}</span>
              </div>
              {item.exists ? (
                <div className="task-meta">
                  <span>Created: {formatTimestamp(item.createdAt)}</span>
                  <span>Started: {formatTimestamp(item.startedAt)}</span>
                  <span>Finished: {formatTimestamp(item.finishedAt)}</span>
                </div>
              ) : null}
              <p className="card-detail">{item.finalResult}</p>
              {item.taskHref || item.summaryHref ? (
                <div className="task-actions">
                  {item.taskHref ? (
                    <Link href={item.taskHref} className="button button-secondary button-link-inline">
                      Open task
                    </Link>
                  ) : null}
                  {item.summaryHref ? (
                    <Link href={item.summaryHref} className="button button-link-inline">
                      Open summary
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p className="card-detail">No tasks match the selected status.</p>
        )}
      </div>
    </>
  );
}
