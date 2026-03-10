import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { summaries } from "@/lib/db/schema";
import type { SummaryRecord } from "@/types/summary";

const createSummarySchema = z.object({
  sourceType: z.enum(["email", "github", "slack"]),
  sourceId: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  language: z.string().default("zh"),
  contentDateStart: z.string().min(1),
  contentDateEnd: z.string().min(1),
  summaryText: z.string().nullable().optional(),
  summaryBlobKey: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export async function listSummaries(limit = 20): Promise<SummaryRecord[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(summaries)
    .orderBy(desc(summaries.createdAt))
    .limit(limit);

  return rows.map((summary) => ({
    id: summary.id,
    sourceType: summary.sourceType,
    sourceId: summary.sourceId,
    title: summary.title,
    language: summary.language,
    contentDateStart: summary.contentDateStart.toISOString(),
    contentDateEnd: summary.contentDateEnd.toISOString(),
    summaryText: summary.summaryText,
    summaryBlobKey: summary.summaryBlobKey,
    metadata: summary.metadata,
    createdAt: summary.createdAt.toISOString(),
  }));
}

export async function getSummary(summaryId: string): Promise<SummaryRecord | null> {
  const db = await getDb();
  const [summary] = await db.select().from(summaries).where(eq(summaries.id, summaryId)).limit(1);

  return summary
    ? {
        id: summary.id,
        sourceType: summary.sourceType,
        sourceId: summary.sourceId,
        title: summary.title,
        language: summary.language,
        contentDateStart: summary.contentDateStart.toISOString(),
        contentDateEnd: summary.contentDateEnd.toISOString(),
        summaryText: summary.summaryText,
        summaryBlobKey: summary.summaryBlobKey,
        metadata: summary.metadata,
        createdAt: summary.createdAt.toISOString(),
      }
    : null;
}

export async function createSummary(input: {
  sourceType: "email" | "github" | "slack";
  sourceId?: string | null;
  title: string;
  language?: string;
  contentDateStart: string;
  contentDateEnd: string;
  summaryText?: string | null;
  summaryBlobKey?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<SummaryRecord> {
  const parsed = createSummarySchema.parse(input);
  const db = await getDb();
  const [summary] = await db
    .insert(summaries)
    .values({
      sourceType: parsed.sourceType,
      sourceId: parsed.sourceId ?? null,
      title: parsed.title,
      language: parsed.language,
      contentDateStart: new Date(parsed.contentDateStart),
      contentDateEnd: new Date(parsed.contentDateEnd),
      summaryText: parsed.summaryText ?? null,
      summaryBlobKey: parsed.summaryBlobKey ?? null,
      metadata: parsed.metadata,
    })
    .returning();

  return {
    id: summary.id,
    sourceType: summary.sourceType,
    sourceId: summary.sourceId,
    title: summary.title,
    language: summary.language,
    contentDateStart: summary.contentDateStart.toISOString(),
    contentDateEnd: summary.contentDateEnd.toISOString(),
    summaryText: summary.summaryText,
    summaryBlobKey: summary.summaryBlobKey,
    metadata: summary.metadata,
    createdAt: summary.createdAt.toISOString(),
  };
}
