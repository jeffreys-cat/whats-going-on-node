"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function GithubTokenForm({ initialToken }: { initialToken: string }) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState<string>("");
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setStatus("");

    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id: "github_config",
          value: {
            token,
          },
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save token.");
      }

      setStatus("GitHub token saved.");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save token.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={onSubmit}>
      <label className="field">
        <span className="field-label">GitHub token</span>
        <input
          className="field-input"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="ghp_xxx"
          autoComplete="off"
        />
      </label>
      <div className="form-actions">
        <button className="button" type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save token"}
        </button>
        {status ? <p className="form-status">{status}</p> : null}
      </div>
    </form>
  );
}
