import { NextResponse } from "next/server";

import { listSummaries } from "@/lib/summaries/repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const summaries = await listSummaries();
    return NextResponse.json({ items: summaries });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load summaries." },
      { status: 503 },
    );
  }
}
