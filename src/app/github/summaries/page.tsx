import { GithubSummaryList } from "@/components/github/github-summary-list";
import { getGithubPageData } from "@/lib/github/page-data";

export const dynamic = "force-dynamic";

export default async function GithubSummariesPage() {
  const { sources, summaries } = await getGithubPageData({
    taskLimit: 1,
    summaryLimit: 40,
    batchRunLimit: 1,
  });

  return (
    <div className="grid">
      <section className="panel span-12">
        <p className="panel-kicker">Output</p>
        <h3 className="panel-title">GitHub summaries</h3>
        <p className="panel-copy">Recent generated summaries for tracked GitHub repositories.</p>
        <GithubSummaryList
          summaries={summaries}
          sources={sources}
          emptyMessage="No GitHub summaries yet."
        />
      </section>
    </div>
  );
}
