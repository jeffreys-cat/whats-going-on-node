import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    { error: "Feishu push is not implemented in the Next.js rewrite yet." },
    { status: 501 },
  );
}
