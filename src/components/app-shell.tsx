import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/email", label: "Email" },
  { href: "/github", label: "GitHub" },
  { href: "/slack", label: "Slack" },
  { href: "/settings", label: "Settings" },
  { href: "/summaries", label: "Summaries" },
] satisfies Array<{ href: Route; label: string }>;

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
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
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
