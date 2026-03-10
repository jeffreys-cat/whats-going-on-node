"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

type SourceOption = {
  id: string;
  name: string;
  externalId: string;
};

export function GithubSourceForm({ sources }: { sources: SourceOption[] }) {
  const router = useRouter();
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState(sources[0]?.id ?? "");
  const [days, setDays] = useState("3");
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [status, setStatus] = useState("");
  const [isSavingSource, setIsSavingSource] = useState(false);
  const [isRunningTask, setIsRunningTask] = useState(false);

  async function createSource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingSource(true);
    setStatus("");

    try {
      const externalId = `${owner}/${repo}`;
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sourceType: "github",
          provider: "github",
          externalId,
          name: displayName || repo,
          config: {
            owner,
            repo,
          },
        }),
      });

      const data = (await response.json()) as { error?: string; id?: string };
      if (!response.ok || !data.id) {
        throw new Error(data.error ?? "Failed to create GitHub source.");
      }

      setSelectedSourceId(data.id);
      setOwner("");
      setRepo("");
      setDisplayName("");
      setStatus(`Source ${externalId} saved.`);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create source.");
    } finally {
      setIsSavingSource(false);
    }
  }

  async function runDigest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSourceId) {
      setStatus("Select or create a GitHub source first.");
      return;
    }

    setIsRunningTask(true);
    setStatus("");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          taskType: "github_digest",
          sourceId: selectedSourceId,
          params: {
            days: Number(days),
            lang,
          },
          runImmediately: true,
        }),
      });

      const data = (await response.json()) as { error?: string; status?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to run digest.");
      }

      setStatus(`Digest finished with status: ${data.status ?? "unknown"}.`);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to run digest.");
    } finally {
      setIsRunningTask(false);
    }
  }

  return (
    <div className="form-cluster">
      <form className="form-stack" onSubmit={createSource}>
        <p className="field-label">Add repository</p>
        <div className="field-grid">
          <label className="field">
            <span className="field-caption">Owner</span>
            <input
              className="field-input"
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="vercel"
              required
            />
          </label>
          <label className="field">
            <span className="field-caption">Repo</span>
            <input
              className="field-input"
              value={repo}
              onChange={(event) => setRepo(event.target.value)}
              placeholder="next.js"
              required
            />
          </label>
        </div>
        <label className="field">
          <span className="field-caption">Display name</span>
          <input
            className="field-input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Next.js"
          />
        </label>
        <button className="button" type="submit" disabled={isSavingSource}>
          {isSavingSource ? "Saving..." : "Add source"}
        </button>
      </form>

      <form className="form-stack" onSubmit={runDigest}>
        <p className="field-label">Run digest</p>
        <label className="field">
          <span className="field-caption">Repository</span>
          <select
            className="field-input"
            value={selectedSourceId}
            onChange={(event) => setSelectedSourceId(event.target.value)}
          >
            <option value="">Select a source</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.externalId}
              </option>
            ))}
          </select>
        </label>
        <div className="field-grid">
          <label className="field">
            <span className="field-caption">Days</span>
            <input
              className="field-input"
              type="number"
              min="1"
              max="30"
              value={days}
              onChange={(event) => setDays(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-caption">Language</span>
            <select
              className="field-input"
              value={lang}
              onChange={(event) => setLang(event.target.value as "zh" | "en")}
            >
              <option value="zh">Chinese</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        <button className="button" type="submit" disabled={isRunningTask}>
          {isRunningTask ? "Running..." : "Generate digest"}
        </button>
        {status ? <p className="form-status">{status}</p> : null}
      </form>
    </div>
  );
}
