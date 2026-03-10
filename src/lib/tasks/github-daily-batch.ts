import { getDefaultDigestDays, getDefaultDigestLang } from "@/lib/sources/github/defaults";
import { listSources } from "@/lib/sources/repository";
import { createBatchRun } from "@/lib/tasks/batch-runs";
import { createTask } from "@/lib/tasks/create-task";
import { runPendingTask } from "@/lib/tasks/task-runner";

export async function runGithubDailyBatch(triggerSource: string) {
  try {
    const sources = await listSources("github");

    if (!sources.length) {
      const result = {
        queued: 0,
        started: 0,
        failed: 0,
        message: "No GitHub sources registered.",
      };
      await createBatchRun({
        batchType: "github_daily_summary",
        triggerSource,
        status: "succeeded",
        message: result.message,
      });
      return result;
    }

    const tasks = await Promise.all(
      sources.map((source) =>
        createTask({
          taskType: "github_digest",
          sourceId: source.id,
          params: {
            days: getDefaultDigestDays(source.config),
            lang: getDefaultDigestLang(source.config),
            trigger: "daily_summary",
          },
        }),
      ),
    );

    const results = await Promise.allSettled(tasks.map((task) => runPendingTask(task.id)));
    const started = results.filter((result) => result.status === "fulfilled").length;
    const result = {
      queued: tasks.length,
      started,
      failed: results.length - started,
      message: `Daily batch processed ${tasks.length} GitHub sources.`,
    };

    await createBatchRun({
      batchType: "github_daily_summary",
      triggerSource,
      status: result.failed > 0 ? "failed" : "succeeded",
      queuedCount: result.queued,
      startedCount: result.started,
      failedCount: result.failed,
      message: result.message,
      metadata: {
        taskIds: tasks.map((task) => task.id),
      },
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run GitHub daily batch.";

    await createBatchRun({
      batchType: "github_daily_summary",
      triggerSource,
      status: "failed",
      errorMessage: message,
      message: "Daily batch execution failed.",
    });

    throw error;
  }
}
