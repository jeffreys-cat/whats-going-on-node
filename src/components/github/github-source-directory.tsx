import { GithubBatchDigestButton } from "@/components/github/github-batch-digest-button";
import { GithubSourceManager } from "@/components/github/github-source-manager";
import type { SourceRecord } from "@/types/source";
import type { SummaryRecord } from "@/types/summary";
import type { SummaryTaskRecord } from "@/types/task";

export function GithubSourceDirectory({
  sources,
  tasks,
  summaries,
}: {
  sources: Array<Pick<SourceRecord, "id" | "name" | "externalId" | "config">>;
  tasks: SummaryTaskRecord[];
  summaries: SummaryRecord[];
}) {
  return (
    <section className="panel span-12">
      <p className="panel-kicker">Registered repos</p>
      <div className="panel-header-inline">
        <div>
          <h3 className="panel-title">GitHub sources</h3>
          <p className="panel-copy">Repository settings and per-repo history live here now.</p>
        </div>
        <GithubBatchDigestButton />
      </div>
      <div className="api-list">
        {sources.length ? (
          sources.map((source) => (
            <GithubSourceManager
              key={source.id}
              source={source}
              tasks={tasks.filter((task) => task.sourceId === source.id)}
              summaries={summaries.filter((summary) => summary.sourceId === source.id)}
            />
          ))
        ) : (
          <p className="card-detail">No GitHub source yet. Add one from the overview page.</p>
        )}
      </div>
    </section>
  );
}
