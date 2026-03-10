import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GithubBatchRunDetailRedirectPage({
  params,
}: {
  params: Promise<{ batchRunId: string }>;
}) {
  const { batchRunId } = await params;
  redirect(`/batch-runs/${batchRunId}`);
}
