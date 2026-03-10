import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteSource, getSource, updateSource } from "@/lib/sources/repository";

export const runtime = "nodejs";

const updateSourceSchema = z.object({
  externalId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ sourceId: string }> },
) {
  try {
    const { sourceId } = await context.params;
    const source = await getSource(sourceId);

    if (!source) {
      return NextResponse.json({ error: "Source not found." }, { status: 404 });
    }

    return NextResponse.json(source);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load source." },
      { status: 503 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ sourceId: string }> },
) {
  try {
    const { sourceId } = await context.params;
    const payload = updateSourceSchema.parse(await request.json());
    const source = await updateSource(sourceId, payload);

    if (!source) {
      return NextResponse.json({ error: "Source not found." }, { status: 404 });
    }

    return NextResponse.json(source);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update source." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ sourceId: string }> },
) {
  try {
    const { sourceId } = await context.params;
    const source = await deleteSource(sourceId);

    if (!source) {
      return NextResponse.json({ error: "Source not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: source });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete source." },
      { status: 400 },
    );
  }
}
