import { NextResponse } from "next/server";

import { getSummary } from "@/lib/summaries/repository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ summaryId: string }> },
) {
  try {
    const { summaryId } = await context.params;
    const summary = await getSummary(summaryId);

    if (!summary) {
      return NextResponse.json({ error: "Summary not found." }, { status: 404 });
    }

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load summary." },
      { status: 503 },
    );
  }
}
