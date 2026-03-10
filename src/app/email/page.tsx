import { AppShell } from "@/components/app-shell";

export default function EmailPage() {
  return (
    <AppShell eyebrow="Sources" title="Email">
      <section className="panel">
        <p className="panel-kicker">Planned modules</p>
        <h3 className="panel-title">Pony Mail and Pipermail adapters</h3>
        <ul className="list">
          <li>`src/lib/sources/email/ponymail.ts` will own Apache Pony Mail fetch logic.</li>
          <li>`src/lib/sources/email/pipermail.ts` will own Mailman 2 archive parsing.</li>
          <li>Digest generation should enqueue `email_digest` tasks instead of streaming in-request.</li>
        </ul>
      </section>
    </AppShell>
  );
}
