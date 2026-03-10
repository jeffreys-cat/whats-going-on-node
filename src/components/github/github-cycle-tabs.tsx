"use client";

import type { Route } from "next";
import { startTransition, useDeferredValue, useState } from "react";
import Link from "next/link";

import { MarkdownContent } from "@/components/summaries/markdown-content";

type CycleTab = {
  id: string;
  label: string;
  content: string;
  summaryHref?: Route | null;
  summaryId?: string | null;
};

export function GithubCycleTabs({
  tabs,
}: {
  tabs: CycleTab[];
}) {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "");
  const deferredActiveTabId = useDeferredValue(activeTabId);
  const activeTab = tabs.find((tab) => tab.id === deferredActiveTabId) ?? tabs[0] ?? null;

  if (!activeTab) {
    return <p className="card-detail">No repository summaries are available for this cycle yet.</p>;
  }

  return (
    <div className="cycle-tabs">
      <div className="cycle-tab-list" role="tablist" aria-label="Cycle repository views">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`cycle-tab ${isActive ? "cycle-tab-active" : ""}`}
              onClick={() => {
                startTransition(() => {
                  setActiveTabId(tab.id);
                });
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="cycle-tab-panel" role="tabpanel">
        {activeTab.summaryHref ? (
          <div className="task-actions cycle-tab-actions">
            <Link href={activeTab.summaryHref} className="button button-link-inline">
              Open summary
            </Link>
            {activeTab.summaryId ? <span className="card-detail">Summary ID: {activeTab.summaryId}</span> : null}
          </div>
        ) : null}

        <article className="summary-body">
          <MarkdownContent content={activeTab.content} />
        </article>
      </div>
    </div>
  );
}
