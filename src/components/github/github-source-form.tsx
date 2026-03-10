"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { GithubDigestButton } from "@/components/github/github-digest-button";
import {
  getDefaultDigestDays,
  getDefaultDigestLang,
} from "@/lib/sources/github/defaults";
import { parseGithubRepositoryInput } from "@/lib/sources/github/repository-input";

type SourceOption = {
  id: string;
  name: string;
  externalId: string;
  config: Record<string, unknown>;
};

export function GithubSourceForm({ sources }: { sources: SourceOption[] }) {
  const router = useRouter();
  const [repositoryLink, setRepositoryLink] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState(sources[0]?.id ?? "");
  const [defaultDays, setDefaultDays] = useState("3");
  const [defaultLang, setDefaultLang] = useState<"zh" | "en">("zh");
  const [days, setDays] = useState(() => String(getDefaultDigestDays(sources[0]?.config ?? {})));
  const [lang, setLang] = useState<"zh" | "en">(getDefaultDigestLang(sources[0]?.config ?? {}));
  const [status, setStatus] = useState("");
  const [isSavingSource, setIsSavingSource] = useState(false);

  useEffect(() => {
    const selectedSource = sources.find((source) => source.id === selectedSourceId);

    if (!selectedSource) {
      return;
    }

    setDays(String(getDefaultDigestDays(selectedSource.config)));
    setLang(getDefaultDigestLang(selectedSource.config));
  }, [selectedSourceId, sources]);

  async function createSource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingSource(true);
    setStatus("");

    try {
      const { owner, repo, externalId } = parseGithubRepositoryInput(repositoryLink);
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
            defaultDigestDays: Number(defaultDays),
            defaultDigestLang: defaultLang,
          },
        }),
      });

      const data = (await response.json()) as { error?: string; id?: string };
      if (!response.ok || !data.id) {
        throw new Error(data.error ?? "Failed to create GitHub source.");
      }

      setSelectedSourceId(data.id);
      setRepositoryLink("");
      setDisplayName("");
      setDefaultDays("3");
      setDefaultLang("zh");
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

  return (
    <div className="form-cluster">
      <form className="form-stack" onSubmit={createSource}>
        <p className="field-label">Add repository</p>
        <label className="field">
          <span className="field-caption">GitHub link</span>
          <input
            className="field-input"
            value={repositoryLink}
            onChange={(event) => setRepositoryLink(event.target.value)}
            placeholder="https://github.com/vercel/next.js"
            required
          />
        </label>
        <label className="field">
          <span className="field-caption">Display name</span>
          <input
            className="field-input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Next.js"
          />
        </label>
        <div className="field-grid">
          <label className="field">
            <span className="field-caption">Default days</span>
            <input
              className="field-input"
              type="number"
              min="1"
              max="30"
              value={defaultDays}
              onChange={(event) => setDefaultDays(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-caption">Default language</span>
            <select
              className="field-input"
              value={defaultLang}
              onChange={(event) => setDefaultLang(event.target.value as "zh" | "en")}
            >
              <option value="zh">Chinese</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        <button className="button" type="submit" disabled={isSavingSource}>
          {isSavingSource ? "Saving..." : "Add source"}
        </button>
      </form>

      <div className="form-stack">
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
        {selectedSourceId ? (
          <GithubDigestButton
            sourceId={selectedSourceId}
            days={Number(days)}
            lang={lang}
            buttonLabel="Generate digest"
            buttonClassName="button"
          />
        ) : null}
        {status ? <p className="form-status">{status}</p> : null}
        {!selectedSourceId ? <p className="form-status">Select or create a GitHub source first.</p> : null}
      </div>
    </div>
  );
}
