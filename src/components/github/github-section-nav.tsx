"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/github", label: "Overview" },
  { href: "/github/repositories", label: "Repositories" },
  { href: "/github/tasks", label: "Tasks" },
  { href: "/github/summaries", label: "Summaries" },
  { href: "/github/batch-runs", label: "Batch runs" },
] as const;

export function GithubSectionNav() {
  const pathname = usePathname();

  return (
    <nav className="section-nav" aria-label="GitHub sections">
      {items.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== "/github" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`section-nav-link ${isActive ? "section-nav-link-active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
