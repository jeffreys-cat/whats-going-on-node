import { NextResponse } from "next/server";

import { runGithubDailyBatch } from "@/lib/tasks/github-daily-batch";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const expectedSecret = process.env.DAILY_SUMMARY_SECRET;

  if (!expectedSecret) {
    return true;
  }

  return request.headers.get("x-cron-secret") === expectedSecret;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
    }

    const result = await runGithubDailyBatch("cron");

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run daily summary batch." },
      { status: 500 },
    );
  }
}
