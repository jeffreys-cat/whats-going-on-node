"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { GithubDigestButton } from "@/components/github/github-digest-button";
import {
  getDefaultDigestDays,
  getDefaultDigestLang,
} from "@/lib/sources/github/defaults";
import { parseGithubRepositoryInput } from "@/lib/sources/github/repository-input";
import type { SummaryRecord } from "@/types/summary";
import type { SummaryTaskRecord } from "@/types/task";

type GithubSourceManagerProps = {
  source: {
    id: string;
    name: string;
    externalId: string;
    config: Record<string, unknown>;
  };
  tasks: SummaryTaskRecord[];
  summaries: SummaryRecord[];
};

function splitExternalId(externalId: string) {
  const [owner = "", repo = ""] = externalId.split("/", 2);
  return { owner, repo };
}

function formatTimestamp(value: string | null | undefined) {
  return value ? value.slice(0, 19).replace("T", " ") : "Not available";
}

export function GithubSourceManager({ source, tasks, summaries }: GithubSourceManagerProps) {
  const router = useRouter();
  const { owner: initialOwner, repo: initialRepo } = splitExternalId(source.externalId);
  const [isEditing, setIsEditing] = useState(false);
  const [repositoryLink, setRepositoryLink] = useState(source.externalId);
  const [name, setName] = useState(source.name);
  const [defaultDays, setDefaultDays] = useState(String(getDefaultDigestDays(source.config)));
  const [defaultLang, setDefaultLang] = useState<"zh" | "en">(getDefaultDigestLang(source.config));
  const [status, setStatus] = useState("");
  const [isPending, setIsPending] = useState(false);
  const succeededTasks = tasks.filter((task) => task.status === "succeeded");
  const failedTasks = tasks.filter((task) => task.status === "failed");
  const latestTask = tasks[0] ?? null;
  const latestSuccess = succeededTasks[0] ?? null;
  const latestFailure = failedTasks[0] ?? null;
  const latestSummary = summaries[0] ?? null;

  async function onSave() {
    setIsPending(true);
    setStatus("");

    try {
      const { owner, repo, externalId } = parseGithubRepositoryInput(repositoryLink);
      const response = await fetch(`/api/sources/${source.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          externalId,
          name: name || repo,
          config: {
            ...source.config,
            owner,
            repo,
            defaultDigestDays: Number(defaultDays),
            defaultDigestLang: defaultLang,
          },
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update source.");
      }

      setIsEditing(false);
      setStatus("Source updated.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update source.");
    } finally {
      setIsPending(false);
    }
  }

  async function onDelete() {
    setIsPending(true);
    setStatus("");

    try {
      const response = await fetch(`/api/sources/${source.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete source.");
      }

      setStatus("Source deleted.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to delete source.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="api-item">
      {isEditing ? (
        <div className="form-stack">
          <label className="field">
            <span className="field-caption">GitHub link</span>
            <input
              className="field-input"
              value={repositoryLink}
              onChange={(event) => setRepositoryLink(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-caption">Display name</span>
            <input className="field-input" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <div className="field-grid">
            <label className="field">
              <span className="field-caption">Default days</span>
              <input
                className="field-input"
                type="number"
                min="1"
                max="30"
                value={defaultDays}
                onChange={(event) => setDefaultDays(event.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-caption">Default language</span>
              <select
                className="field-input"
                value={defaultLang}
                onChange={(event) => setDefaultLang(event.target.value as "zh" | "en")}
              >
                <option value="zh">Chinese</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
        </div>
      ) : (
        <>
          <div className="api-path">{source.externalId}</div>
          <p className="card-detail">{source.name}</p>
          <div className="source-metrics">
            <span className="pill">{tasks.length} tasks</span>
            <span className="pill">{summaries.length} summaries</span>
            <span className={`pill ${failedTasks.length ? "pill-failed" : "pill-succeeded"}`}>
              {failedTasks.length ? `${failedTasks.length} failed` : "No failures"}
            </span>
          </div>
          <div className="task-meta">
            <span>Defaults: {getDefaultDigestDays(source.config)} days · {getDefaultDigestLang(source.config)}</span>
            <span>Latest task: {latestTask ? `${latestTask.status} at ${formatTimestamp(latestTask.createdAt)}` : "None"}</span>
            <span>Latest success: {latestSuccess ? formatTimestamp(latestSuccess.finishedAt ?? latestSuccess.createdAt) : "None"}</span>
            <span>Latest summary: {latestSummary ? formatTimestamp(latestSummary.createdAt) : "None"}</span>
          </div>
          {latestFailure ? (
            <p className="task-error">
              Latest failure: {formatTimestamp(latestFailure.finishedAt ?? latestFailure.createdAt)} ·{" "}
              {(latestFailure.errorMessage ?? latestFailure.message ?? "Unknown error").slice(0, 180)}
            </p>
          ) : null}
        </>
      )}

      <div className="task-actions">
        <span className="api-path">{source.id}</span>
        <div className="task-action-group">
          <GithubDigestButton
            sourceId={source.id}
            days={getDefaultDigestDays(source.config)}
            lang={getDefaultDigestLang(source.config)}
            buttonLabel="Regenerate"
          />
          {isEditing ? (
            <>
              <button className="button button-link-inline" type="button" disabled={isPending} onClick={onSave}>
                {isPending ? "Saving..." : "Save"}
              </button>
              <button
                className="button button-secondary button-link-inline"
                type="button"
                disabled={isPending}
                onClick={() => {
                  setIsEditing(false);
                  setRepositoryLink(`${initialOwner}/${initialRepo}`);
                  setName(source.name);
                  setDefaultDays(String(getDefaultDigestDays(source.config)));
                  setDefaultLang(getDefaultDigestLang(source.config));
                  setStatus("");
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="button button-secondary button-link-inline"
                type="button"
                disabled={isPending}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <button
                className="button button-danger button-link-inline"
                type="button"
                disabled={isPending}
                onClick={onDelete}
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </>
      )}
        </div>
      </div>
      {status ? <p className="task-action-status">{status}</p> : null}

      <details className="source-details">
        <summary className="source-details-toggle">
          Repository activity
          <span className="card-detail">
            {tasks.length} tasks · {summaries.length} summaries
          </span>
        </summary>

        <div className="source-details-body">
          <div className="source-section">
            <p className="panel-kicker">Recent tasks</p>
            {tasks.length ? (
              <div className="api-list">
                {tasks.slice(0, 5).map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`} className="api-item card-link">
                    <div className="api-path">
                      {task.status} · {task.createdAt.slice(0, 19).replace("T", " ")}
                    </div>
                    <p className="card-detail">{task.message ?? "No message"}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="card-detail">No tasks for this repository yet.</p>
            )}
          </div>

          <div className="source-section">
            <p className="panel-kicker">Recent summaries</p>
            {summaries.length ? (
              <div className="api-list">
                {summaries.slice(0, 5).map((summary) => (
                  <Link key={summary.id} href={`/summaries/${summary.id}`} className="api-item card-link">
                    <div className="api-path">
                      {summary.createdAt.slice(0, 19).replace("T", " ")} · {summary.language}
                    </div>
                    <p className="card-detail">
                      {summary.contentDateStart.slice(0, 10)} to {summary.contentDateEnd.slice(0, 10)}
                    </p>
                    <p className="card-detail">{summary.summaryText?.slice(0, 140) ?? "No summary body."}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="card-detail">No summaries for this repository yet.</p>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
