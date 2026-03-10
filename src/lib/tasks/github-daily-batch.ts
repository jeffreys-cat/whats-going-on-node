import { getDefaultDigestDays, getDefaultDigestLang } from "@/lib/sources/github/defaults";
import { listSources } from "@/lib/sources/repository";
import { createTask } from "@/lib/tasks/create-task";
import { runPendingTask } from "@/lib/tasks/task-runner";

export async function runGithubDailyBatch() {
  const sources = await listSources("github");

  if (!sources.length) {
    return {
      queued: 0,
      started: 0,
      failed: 0,
      message: "No GitHub sources registered.",
    };
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

  return {
    queued: tasks.length,
    started,
    failed: results.length - started,
    message: `Daily batch processed ${tasks.length} GitHub sources.`,
  };
}
