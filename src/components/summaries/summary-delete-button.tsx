"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function SummaryDeleteButton({
  summaryId,
  redirectToSummaries = false,
}: {
  summaryId: string;
  redirectToSummaries?: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  async function onDelete() {
    setIsPending(true);
    setMessage("");

    try {
      const response = await fetch(`/api/summaries/${summaryId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete summary.");
      }

      if (redirectToSummaries) {
        router.push("/summaries");
        return;
      }

      setMessage("Summary deleted.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete summary.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="task-run-control">
      <button className="button button-danger button-link-inline" type="button" disabled={isPending} onClick={onDelete}>
        {isPending ? "Deleting..." : "Delete"}
      </button>
      {message ? <p className="task-action-status">{message}</p> : null}
    </div>
  );
}
