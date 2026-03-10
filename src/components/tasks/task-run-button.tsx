"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

type TaskRunButtonProps = {
  taskId: string;
  status: "pending" | "failed";
};

export function TaskRunButton({ taskId, status }: TaskRunButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  const label = status === "failed" ? "Retry task" : "Run now";

  async function onRun() {
    setIsPending(true);
    setMessage("");

    try {
      const response = await fetch(`/api/tasks/${taskId}/run`, {
        method: "POST",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to start task.");
      }

      setMessage(status === "failed" ? "Retry started." : "Task started.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to start task.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="task-run-control">
      <button className="button button-link-inline" type="button" disabled={isPending} onClick={onRun}>
        {isPending ? "Starting..." : label}
      </button>
      {message ? <p className="task-action-status">{message}</p> : null}
    </div>
  );
}
