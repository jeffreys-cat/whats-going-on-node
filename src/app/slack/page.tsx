import { AppShell } from "@/components/app-shell";

export default function SlackPage() {
  return (
    <AppShell eyebrow="Sources" title="Slack">
      <section className="panel">
        <p className="panel-kicker">Planned modules</p>
        <h3 className="panel-title">Workspace and channel ingestion</h3>
        <ul className="list">
          <li>Workspace tokens stay in external config records, masked in the UI.</li>
          <li>Channel fetches should create `fetch_runs` and optional `source_cache` entries.</li>
          <li>Thread expansion belongs in the source adapter, not in the route handler.</li>
        </ul>
      </section>
    </AppShell>
  );
}
