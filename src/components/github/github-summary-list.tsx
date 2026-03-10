import Link from "next/link";

import type { SourceRecord } from "@/types/source";
import type { SummaryRecord } from "@/types/summary";

export function GithubSummaryList({
  summaries,
  sources,
  emptyMessage,
}: {
  summaries: SummaryRecord[];
  sources: Array<Pick<SourceRecord, "id" | "externalId">>;
  emptyMessage: string;
}) {
  const sourceMap = new Map(sources.map((source) => [source.id, source.externalId]));

  if (!summaries.length) {
    return <p className="card-detail">{emptyMessage}</p>;
  }

  return (
    <div className="api-list">
      {summaries.map((summary) => (
        <Link key={summary.id} href={`/summaries/${summary.id}`} className="api-item card-link">
          <div className="api-path">{sourceMap.get(summary.sourceId ?? "") ?? summary.title}</div>
          <p className="card-detail">
            {summary.createdAt.slice(0, 19).replace("T", " ")} · {summary.contentDateStart.slice(0, 10)} to{" "}
            {summary.contentDateEnd.slice(0, 10)} · {summary.language}
          </p>
          <p className="card-detail">{summary.summaryText?.slice(0, 180) ?? "No summary body."}</p>
        </Link>
      ))}
    </div>
  );
}
