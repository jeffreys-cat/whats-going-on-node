"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function GithubDigestButton({
  sourceId,
  days = 3,
  lang = "zh",
  buttonLabel = "Generate digest",
  buttonClassName = "button button-link-inline",
}: {
  sourceId: string;
  days?: number;
  lang?: "zh" | "en";
  buttonLabel?: string;
  buttonClassName?: string;
}) {
  const router = useRouter();
  const [isRunningTask, setIsRunningTask] = useState(false);
  const [status, setStatus] = useState("");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [resultSummaryId, setResultSummaryId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTaskId) {
      return;
    }

    let cancelled = false;
    const intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/tasks/${activeTaskId}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as {
          error?: string;
          status?: string;
          message?: string | null;
          resultSummaryId?: string | null;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to poll task.");
        }

        if (cancelled) {
          return;
        }

        setStatus(data.message ?? `Task status: ${data.status ?? "unknown"}.`);

        if (data.status === "succeeded" || data.status === "failed") {
          window.clearInterval(intervalId);
          setIsRunningTask(false);
          setActiveTaskId(null);
          setResultSummaryId(data.resultSummaryId ?? null);
          startTransition(() => {
            router.refresh();
          });
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Failed to poll task.");
          setIsRunningTask(false);
          setActiveTaskId(null);
        }
        window.clearInterval(intervalId);
      }
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeTaskId, router]);

  async function runDigest() {
    setIsRunningTask(true);
    setStatus("");
    setResultSummaryId(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          taskType: "github_digest",
          sourceId,
          params: {
            days,
            lang,
          },
        }),
      });

      const data = (await response.json()) as { error?: string; id?: string };
      if (!response.ok || !data.id) {
        throw new Error(data.error ?? "Failed to create digest task.");
      }

      setActiveTaskId(data.id);
      setStatus("Task created. Running in background...");
      void fetch(`/api/tasks/${data.id}/run`, {
        method: "POST",
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create digest task.");
      setIsRunningTask(false);
    }
  }

  return (
    <div className="task-run-control">
      <button className={buttonClassName} type="button" disabled={isRunningTask} onClick={runDigest}>
        {isRunningTask ? "Queued..." : buttonLabel}
      </button>
      {status ? <p className="task-action-status">{status}</p> : null}
      {activeTaskId ? (
        <p className="task-action-status">
          Task ID: <span className="api-path">{activeTaskId}</span>
        </p>
      ) : null}
      {resultSummaryId ? (
        <Link href={`/summaries/${resultSummaryId}`} className="button button-link-inline">
          Open generated summary
        </Link>
      ) : null}
    </div>
  );
}
