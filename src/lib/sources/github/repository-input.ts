export function parseGithubRepositoryInput(value: string) {
  const trimmed = value.trim();
  const normalized = trimmed
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/\/+$/, "")
    .replace(/\.git$/i, "");
  const [owner = "", repo = ""] = normalized.split("/", 2);

  if (!owner || !repo) {
    throw new Error("Enter a GitHub repository link like https://github.com/vercel/next.js.");
  }

  return { owner, repo, externalId: `${owner}/${repo}` };
}
