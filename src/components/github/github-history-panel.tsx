"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { GithubBatchDigestButton } from "@/components/github/github-batch-digest-button";
import { GithubSourceManager } from "@/components/github/github-source-manager";
import type { SourceRecord } from "@/types/source";
import type { SummaryRecord } from "@/types/summary";
import type { SummaryTaskRecord } from "@/types/task";

export function GithubHistoryPanel({
  sources,
  tasks,
  summaries,
}: {
  sources: Array<Pick<SourceRecord, "id" | "name" | "externalId" | "config">>;
  tasks: SummaryTaskRecord[];
  summaries: SummaryRecord[];
}) {
  const [selectedSourceId, setSelectedSourceId] = useState("all");

  const sourceMap = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);

  const filteredTasks = useMemo(
    () => tasks.filter((task) => selectedSourceId === "all" || task.sourceId === selectedSourceId),
    [selectedSourceId, tasks],
  );

  const filteredSummaries = useMemo(
    () =>
      summaries.filter(
        (summary) => selectedSourceId === "all" || summary.sourceId === selectedSourceId,
      ),
    [selectedSourceId, summaries],
  );

  return (
    <>
      <section className="panel span-6">
        <p className="panel-kicker">Registered repos</p>
        <div className="panel-header-inline">
          <h3 className="panel-title">GitHub sources</h3>
          <div className="header-actions">
            <label className="field filter-field">
              <span className="field-caption">History filter</span>
              <select
                className="field-input"
                value={selectedSourceId}
                onChange={(event) => setSelectedSourceId(event.target.value)}
              >
                <option value="all">All repositories</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.externalId}
                  </option>
                ))}
              </select>
            </label>
            <GithubBatchDigestButton />
          </div>
        </div>
        <div className="api-list">
          {sources.length ? (
            sources.map((source) => (
              <GithubSourceManager
                key={source.id}
                source={source}
                tasks={tasks.filter((task) => task.sourceId === source.id)}
                summaries={summaries.filter((summary) => summary.sourceId === source.id)}
              />
            ))
          ) : (
            <p className="card-detail">No GitHub source yet. Add one from the form above.</p>
          )}
        </div>
      </section>

      <section className="panel span-6">
        <p className="panel-kicker">Task flow</p>
        <h3 className="panel-title">GitHub digest tasks</h3>
        <div className="api-list">
          {filteredTasks.length ? (
            filteredTasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="api-item card-link">
                <div className="api-path">
                  {sourceMap.get(task.sourceId ?? "")?.externalId ?? "Unknown repo"} · {task.status}
                </div>
                <p className="card-detail">
                  {task.message ?? "No message"}
                  {task.resultSummaryId ? ` -> ${task.resultSummaryId}` : ""}
                </p>
              </Link>
            ))
          ) : (
            <p className="card-detail">No matching GitHub tasks yet.</p>
          )}
        </div>
      </section>

      <section className="panel span-12">
        <p className="panel-kicker">Output</p>
        <h3 className="panel-title">Recent GitHub summaries</h3>
        <div className="api-list">
          {filteredSummaries.length ? (
            filteredSummaries.map((summary) => (
              <Link key={summary.id} href={`/summaries/${summary.id}`} className="api-item card-link">
                <div className="api-path">
                  {sourceMap.get(summary.sourceId ?? "")?.externalId ?? summary.title}
                </div>
                <p className="card-detail">
                  {summary.createdAt.slice(0, 19).replace("T", " ")} · {summary.contentDateStart.slice(0, 10)} to{" "}
                  {summary.contentDateEnd.slice(0, 10)}
                </p>
                <p className="card-detail">{summary.summaryText?.slice(0, 180) ?? "No summary body."}</p>
              </Link>
            ))
          ) : (
            <p className="card-detail">No GitHub summaries match this filter.</p>
          )}
        </div>
      </section>
    </>
  );
}
