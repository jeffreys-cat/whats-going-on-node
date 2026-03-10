import type { Route } from "next";

import { GithubCycleSelector } from "@/components/github/github-cycle-selector";
import { GithubCycleTabs } from "@/components/github/github-cycle-tabs";
import type { SummaryRecord } from "@/types/summary";
import type { SummaryTaskRecord } from "@/types/task";

type SourceActivity = {
  id: string;
  name: string;
  externalId: string;
  updateCount: number;
  issueCount: number;
  latestRun: SummaryTaskRecord | null;
  latestUpdate: SummaryRecord | null;
  cycleUpdate: SummaryRecord | null;
  latestFailure: SummaryTaskRecord | null;
};

function formatDate(value: string) {
  return value.slice(0, 10);
}

export function GithubActivityOverview({
  activities,
  currentCycle,
  cycleOptions,
  selectedCycleValue,
  cycleTabs,
}: {
  activities: SourceActivity[];
  currentCycle: { start: string; end: string } | null;
  cycleOptions: Array<{ value: string; label: string }>;
  selectedCycleValue: string;
  cycleTabs: Array<{ id: string; label: string; content: string; summaryHref?: Route | null; summaryId?: string | null }>;
}) {
  const updatedThisCycle = currentCycle
    ? activities.filter((activity) => activity.cycleUpdate)
    : [];
  const reposAwaitingCycle = activities.filter((activity) => !activity.latestUpdate).length;
  const reposNeedingAttention = activities.filter((activity) => activity.issueCount > 0).length;

  return (
    <>
      <section className="panel span-8">
        <p className="panel-kicker">User view</p>
        <h3 className="panel-title">Repository activity in this cycle</h3>
        <p className="panel-copy">
          Focus on what each tracked repo changed in the current cycle, not the mechanics behind generating it.
        </p>
        <div className="source-metrics">
          <span className="pill">
            Current cycle:{" "}
            {currentCycle ? `${formatDate(currentCycle.start)} to ${formatDate(currentCycle.end)}` : "Not available"}
          </span>
          <span className="pill">{updatedThisCycle.length} repos updated in cycle</span>
          <span className={`pill ${reposNeedingAttention ? "pill-failed" : "pill-succeeded"}`}>
            {reposNeedingAttention ? `${reposNeedingAttention} repos need attention` : "All repos healthy"}
          </span>
        </div>
      </section>

      <section className="card span-4">
        <p className="card-label">Tracked repos</p>
        <p className="card-value">{activities.length}</p>
        <p className="card-detail">
          {reposAwaitingCycle ? `${reposAwaitingCycle} still waiting for first cycle update.` : "Every repo already has cycle history."}
        </p>
      </section>

      <section className="panel span-12">
        <div className="panel-header-inline batch-toolbar">
          <div>
            <p className="panel-kicker">Cycle digest</p>
            <h3 className="panel-title">Repository overview</h3>
            <p className="panel-copy">
              Switch between the aggregate overview and each repository in the selected cycle.
            </p>
          </div>
          <GithubCycleSelector options={cycleOptions} selectedValue={selectedCycleValue} />
        </div>
        <GithubCycleTabs key={selectedCycleValue} tabs={cycleTabs} />
      </section>
    </>
  );
}
