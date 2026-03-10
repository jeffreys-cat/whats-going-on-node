import { AppShell } from "@/components/app-shell";
import { GithubHistoryPanel } from "@/components/github/github-history-panel";
import { GithubSourceForm } from "@/components/github/github-source-form";
import { listSources } from "@/lib/sources/repository";
import { listSummaries } from "@/lib/summaries/repository";
import { listTasks } from "@/lib/tasks/task-status";

export const dynamic = "force-dynamic";

export default async function GithubPage() {
  const [sources, tasks, summaries] = await Promise.all([
    listSources("github"),
    listTasks(10),
    listSummaries(10),
  ]);
  const githubTasks = tasks.filter((task) => task.taskType === "github_digest");
  const githubSummaries = summaries.filter((summary) => summary.sourceType === "github");

  return (
    <AppShell eyebrow="Sources" title="GitHub">
      <div className="grid">
        <section className="panel span-6">
          <p className="panel-kicker">Registered repos</p>
          <h3 className="panel-title">GitHub sources</h3>
          <GithubSourceForm
            sources={sources.map((source) => ({
              id: source.id,
              name: source.name,
              externalId: source.externalId,
              config: source.config,
            }))}
          />
        </section>
        <GithubHistoryPanel sources={sources} tasks={githubTasks} summaries={githubSummaries} />
      </div>
    </AppShell>
  );
}
