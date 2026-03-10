import { AppShell } from "@/components/app-shell";
import { StatusCard } from "@/components/status-card";

const architectureRows = [
  ["Config", "Postgres", "Replaces config.json and masked token writes."],
  ["Source cache", "Blob + optional Redis", "No local filesystem dependency."],
  ["Task status", "Postgres", "Replaces queue/thread state."],
  ["Summary body", "Postgres or Blob", "Markdown and long-form content."],
];

export default function DashboardPage() {
  return (
    <AppShell eyebrow="Rewrite Plan" title="Overview">
      <div className="grid">
        <div className="span-4">
          <StatusCard
            title="Execution Model"
            value="Task-Based"
            detail="Route Handlers accept work, workers execute, UI polls."
          />
        </div>
        <div className="span-4">
          <StatusCard
            title="Storage"
            value="External"
            detail="Postgres for metadata, Blob for large payloads."
          />
        </div>
        <div className="span-4">
          <StatusCard
            title="Runtime"
            value="Next.js"
            detail="App Router pages, Route Handlers, Prisma-backed APIs."
          />
        </div>

        <section className="panel span-8">
          <p className="panel-kicker">System Map</p>
          <h3 className="panel-title">Rewrite direction</h3>
          <ul className="list">
            <li>Pages become server-first App Router routes.</li>
            <li>Heavy jobs move behind task records instead of request-bound threads.</li>
            <li>Python integrations can be ported module by module into `src/lib/sources`.</li>
            <li>Every persisted artifact is designed for external storage from day one.</li>
          </ul>
        </section>

        <div className="table-wrap span-12">
          <table className="table">
            <thead>
              <tr>
                <th>Concern</th>
                <th>Target Store</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {architectureRows.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
