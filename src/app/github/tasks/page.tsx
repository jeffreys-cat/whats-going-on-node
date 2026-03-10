import { GithubTaskList } from "@/components/github/github-task-list";
import { getGithubPageData } from "@/lib/github/page-data";

export const dynamic = "force-dynamic";

export default async function GithubTasksPage() {
  const { sources, tasks } = await getGithubPageData({ taskLimit: 40, summaryLimit: 1, batchRunLimit: 1 });

  return (
    <div className="grid">
      <section className="panel span-12">
        <p className="panel-kicker">Task flow</p>
        <h3 className="panel-title">GitHub digest tasks</h3>
        <p className="panel-copy">Recent GitHub digest executions across all registered repositories.</p>
        <GithubTaskList tasks={tasks} sources={sources} emptyMessage="No GitHub tasks yet." />
      </section>
    </div>
  );
}
