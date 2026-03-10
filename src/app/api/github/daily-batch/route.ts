import { NextResponse } from "next/server";

import { runGithubDailyBatch } from "@/lib/tasks/github-daily-batch";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await runGithubDailyBatch();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run daily GitHub batch." },
      { status: 500 },
    );
  }
}
