import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { GithubSectionNav } from "@/components/github/github-section-nav";

export default function GithubLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell eyebrow="Sources" title="GitHub">
      <GithubSectionNav />
      {children}
    </AppShell>
  );
}
