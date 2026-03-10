import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { MarkdownContent } from "@/components/summaries/markdown-content";
import { SummaryDeleteButton } from "@/components/summaries/summary-delete-button";
import { getSummary } from "@/lib/summaries/repository";

export const dynamic = "force-dynamic";

export default async function SummaryDetailPage({
  params,
}: {
  params: Promise<{ summaryId: string }>;
}) {
  const { summaryId } = await params;
  const summary = await getSummary(summaryId);

  if (!summary) {
    notFound();
  }

  const isDev = process.env.NODE_ENV !== "production";
  const llmMetadata =
    summary.metadata.llm && typeof summary.metadata.llm === "object"
      ? (summary.metadata.llm as Record<string, unknown>)
      : null;

  return (
    <AppShell eyebrow="Output" title="Summary Detail">
      <div className="grid">
        <section className="panel span-8">
          <p className="panel-kicker">{summary.sourceType}</p>
          <h3 className="panel-title">{summary.title}</h3>
          <p className="card-detail">
            {summary.language} · {summary.contentDateStart.slice(0, 10)} to{" "}
            {summary.contentDateEnd.slice(0, 10)}
          </p>
          <article className="summary-body">
            {summary.summaryText ? (
              <MarkdownContent content={summary.summaryText} />
            ) : (
              <p>No summary body saved.</p>
            )}
          </article>
        </section>

        <section className="panel span-4">
          <p className="panel-kicker">Metadata</p>
          <h3 className="panel-title">Context</h3>
          <dl className="detail-list">
            <div>
              <dt>ID</dt>
              <dd className="api-path">{summary.id}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{summary.sourceType}</dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{summary.language}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{summary.createdAt.slice(0, 19).replace("T", " ")}</dd>
            </div>
            {Object.entries(summary.metadata).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd className="metadata-value">
                  {typeof value === "string" ? value : JSON.stringify(value)}
                </dd>
              </div>
            ))}
          </dl>
          {isDev && llmMetadata ? (
            <div className="dev-panel">
              <p className="panel-kicker">Development</p>
              <h4 className="section-title">LLM Debug</h4>
              <dl className="detail-list">
                <div>
                  <dt>Used</dt>
                  <dd>{String(llmMetadata.used)}</dd>
                </div>
                <div>
                  <dt>Fallback</dt>
                  <dd>{String(llmMetadata.fallback)}</dd>
                </div>
                <div>
                  <dt>Provider</dt>
                  <dd className="metadata-value">
                    {llmMetadata.provider ? JSON.stringify(llmMetadata.provider) : "null"}
                  </dd>
                </div>
                <div>
                  <dt>Error</dt>
                  <dd className="metadata-value">{String(llmMetadata.error ?? "null")}</dd>
                </div>
              </dl>
            </div>
          ) : null}
          <div className="detail-action-stack">
            <SummaryDeleteButton summaryId={summary.id} redirectToSummaries />
            <Link href="/summaries" className="button button-link">
              Back to summaries
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
