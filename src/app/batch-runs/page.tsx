import { AppShell } from "@/components/app-shell";
import { GithubBatchDigestButton } from "@/components/github/github-batch-digest-button";
import { GithubBatchRunList } from "@/components/github/github-batch-run-list";
import { getGithubPageData } from "@/lib/github/page-data";

export const dynamic = "force-dynamic";

export default async function BatchRunsPage() {
  const { batchRuns } = await getGithubPageData({
    taskLimit: 1,
    summaryLimit: 1,
    batchRunLimit: 30,
  });

  return (
    <AppShell eyebrow="Digest" title="Batch Runs">
      <div className="grid">
        <section className="panel span-12">
          <p className="panel-kicker">Background runs</p>
          <div className="panel-header-inline">
            <div>
              <h3 className="panel-title">Daily batch executions</h3>
              <p className="panel-copy">Scheduled batch history lives here as a dedicated operational page.</p>
            </div>
            <GithubBatchDigestButton />
          </div>
          <GithubBatchRunList batchRuns={batchRuns} emptyMessage="No daily batch executions yet." />
        </section>
      </div>
    </AppShell>
  );
}
