import { GithubSourceDirectory } from "@/components/github/github-source-directory";
import { getGithubPageData } from "@/lib/github/page-data";

export const dynamic = "force-dynamic";

export default async function GithubRepositoriesPage() {
  const { sources, tasks, summaries } = await getGithubPageData({
    taskLimit: 40,
    summaryLimit: 40,
  });

  return (
    <div className="grid">
      <GithubSourceDirectory sources={sources} tasks={tasks} summaries={summaries} />
    </div>
  );
}
