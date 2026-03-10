import { listSources } from "@/lib/sources/repository";
import { listSummaries } from "@/lib/summaries/repository";
import { listBatchRuns } from "@/lib/tasks/batch-runs";
import { listTasks } from "@/lib/tasks/task-status";

export async function getGithubPageData({
  taskLimit = 10,
  summaryLimit = 10,
  batchRunLimit = 6,
}: {
  taskLimit?: number;
  summaryLimit?: number;
  batchRunLimit?: number;
} = {}) {
  const [sources, tasks, summaries, batchRuns] = await Promise.all([
    listSources("github"),
    listTasks(taskLimit),
    listSummaries(summaryLimit),
    listBatchRuns("github_daily_summary", batchRunLimit),
  ]);

  return {
    sources,
    tasks: tasks.filter((task) => task.taskType === "github_digest"),
    summaries: summaries.filter((summary) => summary.sourceType === "github"),
    batchRuns,
  };
}
