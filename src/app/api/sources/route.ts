import { NextResponse } from "next/server";
import { z } from "zod";

import { createSource, listSources } from "@/lib/sources/repository";

export const runtime = "nodejs";

const querySchema = z.object({
  sourceType: z.enum(["email", "github", "slack"]).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      sourceType: searchParams.get("sourceType") ?? undefined,
    });
    const sources = await listSources(query.sourceType);
    return NextResponse.json({ items: sources });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load sources." },
      { status: 503 },
    );
  }
}

const createSourceSchema = z.object({
  sourceType: z.enum(["email", "github", "slack"]),
  provider: z.string().min(1),
  externalId: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = createSourceSchema.parse(body);
    const source = await createSource(payload);
    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save source.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
