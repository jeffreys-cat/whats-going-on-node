import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { ok: false, message: "Daily summary cron stub. Wire this to task creation." },
    { status: 202 },
  );
}
