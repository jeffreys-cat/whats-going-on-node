"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function TaskAutoRefresh({
  active,
  intervalMs = 2000,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();
  const [lastTick, setLastTick] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      setLastTick(new Date().toLocaleTimeString());
      startTransition(() => {
        router.refresh();
      });
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [active, intervalMs, router]);

  if (!active) {
    return null;
  }

  return (
    <p className="task-action-status">
      Auto-refreshing while the task is running.
      {lastTick ? ` Last check: ${lastTick}` : ""}
    </p>
  );
}
