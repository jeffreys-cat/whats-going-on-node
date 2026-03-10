"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function GithubBatchDigestButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [status, setStatus] = useState("");

  async function onRun() {
    setIsPending(true);
    setStatus("");

    try {
      const response = await fetch("/api/github/daily-batch", {
        method: "POST",
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        queued?: number;
        started?: number;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to run daily batch.");
      }

      setStatus(
        data.message ??
          `Daily batch started. Queued ${data.queued ?? 0} tasks, started ${data.started ?? 0}.`,
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to run daily batch.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="task-run-control">
      <button className="button button-link-inline" type="button" disabled={isPending} onClick={onRun}>
        {isPending ? "Starting..." : "Run daily batch"}
      </button>
      {status ? <p className="task-action-status">{status}</p> : null}
    </div>
  );
}
