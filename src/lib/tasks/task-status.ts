import { desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { summaryTasks } from "@/lib/db/schema";
import type { SummaryTaskRecord } from "@/types/task";

function toRecord(task: typeof summaryTasks.$inferSelect): SummaryTaskRecord {
  return {
    id: task.id,
    taskType: task.taskType,
    sourceId: task.sourceId,
    status: task.status,
    progress: task.progress,
    currentStep: task.currentStep,
    message: task.message,
    resultSummaryId: task.resultSummaryId,
    errorMessage: task.errorMessage,
    createdAt: task.createdAt.toISOString(),
    startedAt: task.startedAt?.toISOString() ?? null,
    finishedAt: task.finishedAt?.toISOString() ?? null,
    params: task.params,
  };
}

export async function listTasks(limit = 20): Promise<SummaryTaskRecord[]> {
  const db = await getDb();
  const tasks = await db
    .select()
    .from(summaryTasks)
    .orderBy(desc(summaryTasks.createdAt))
    .limit(limit);

  return tasks.map(toRecord);
}

export async function getTask(taskId: string): Promise<SummaryTaskRecord | null> {
  const db = await getDb();
  const [task] = await db.select().from(summaryTasks).where(eq(summaryTasks.id, taskId)).limit(1);

  return task ? toRecord(task) : null;
}

export async function listTasksByIds(taskIds: string[]): Promise<SummaryTaskRecord[]> {
  if (!taskIds.length) {
    return [];
  }

  const db = await getDb();
  const rows = await db.select().from(summaryTasks).where(inArray(summaryTasks.id, taskIds));
  const recordMap = new Map(rows.map((row) => [row.id, toRecord(row)]));

  return taskIds.flatMap((taskId) => {
    const task = recordMap.get(taskId);
    return task ? [task] : [];
  });
}

export async function deleteTask(taskId: string): Promise<SummaryTaskRecord | null> {
  const task = await getTask(taskId);

  if (!task) {
    return null;
  }

  if (task.status === "running") {
    throw new Error("Running tasks cannot be deleted.");
  }

  const db = await getDb();
  await db.delete(summaryTasks).where(eq(summaryTasks.id, taskId));

  return task;
}
