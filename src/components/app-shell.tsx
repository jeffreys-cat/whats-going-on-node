import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

const navGroups = [
  {
    title: null,
    items: [{ href: "/", label: "Overview" }],
  },
  {
    title: "Sources",
    items: [
      { href: "/github", label: "GitHub" },
      { href: "/email", label: "Email" },
      { href: "/slack", label: "Slack" },
    ],
  },
  {
    title: "Digest",
    items: [
      { href: "/tasks", label: "Tasks" },
      { href: "/summaries", label: "Summaries" },
    ],
  },
  {
    title: "Settings",
    items: [{ href: "/settings", label: "Settings" }],
  },
] satisfies Array<{ title: string | null; items: Array<{ href: Route; label: string }> }>;

export function AppShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <p className="brand-kicker">What&apos;s Going On</p>
          <h1>Control Room</h1>
          <p className="brand-copy">
            Next.js rewrite scaffold for an external-storage, task-based architecture.
          </p>
        </div>
        <nav className="nav">
          {navGroups.map((group, index) => (
            <div key={group.title ?? `group-${index}`} className="nav-group">
              {group.title ? <p className="nav-group-title">{group.title}</p> : null}
              <div className="nav-group-items">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${group.title ? "nav-link-child" : ""}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <main className="content">
        <header className="page-header">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </header>
        {children}
      </main>
    </div>
  );
}
