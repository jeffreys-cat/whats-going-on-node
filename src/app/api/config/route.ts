import { NextResponse } from "next/server";
import { z } from "zod";

import { listConfigs, upsertConfig } from "@/lib/config/repository";

export const runtime = "nodejs";

const configPayloadSchema = z.object({
  id: z.enum(["llm_config", "github_config", "slack_config", "feishu_config", "asf_auth"]),
  value: z.record(z.string(), z.unknown()),
});

export async function GET() {
  try {
    const configs = await listConfigs();
    return NextResponse.json({ items: configs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load config." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = configPayloadSchema.parse(body);
    const config = await upsertConfig(payload.id, payload.value);
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save config.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
