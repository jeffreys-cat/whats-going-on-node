import { desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { batchRuns } from "@/lib/db/schema";
import type { BatchRunRecord } from "@/types/batch-run";

function toRecord(row: typeof batchRuns.$inferSelect): BatchRunRecord {
  return {
    id: row.id,
    batchType: row.batchType,
    triggerSource: row.triggerSource,
    status: row.status,
    queuedCount: row.queuedCount,
    startedCount: row.startedCount,
    failedCount: row.failedCount,
    message: row.message,
    errorMessage: row.errorMessage,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createBatchRun(input: {
  batchType: string;
  triggerSource: string;
  status: "succeeded" | "failed";
  queuedCount?: number;
  startedCount?: number;
  failedCount?: number;
  message?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  const [row] = await db
    .insert(batchRuns)
    .values({
      batchType: input.batchType,
      triggerSource: input.triggerSource,
      status: input.status,
      queuedCount: input.queuedCount ?? 0,
      startedCount: input.startedCount ?? 0,
      failedCount: input.failedCount ?? 0,
      message: input.message ?? null,
      errorMessage: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
    })
    .returning();

  return toRecord(row);
}

export async function listBatchRuns(batchType?: string, limit = 10) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(batchRuns)
    .where(batchType ? eq(batchRuns.batchType, batchType) : undefined)
    .orderBy(desc(batchRuns.createdAt))
    .limit(limit);

  return rows.map(toRecord);
}

export async function getBatchRun(batchRunId: string): Promise<BatchRunRecord | null> {
  const db = await getDb();
  const [row] = await db.select().from(batchRuns).where(eq(batchRuns.id, batchRunId)).limit(1);

  return row ? toRecord(row) : null;
}
