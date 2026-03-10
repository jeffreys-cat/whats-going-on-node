import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { summaryTasks } from "@/lib/db/schema";
import type { SummaryTaskRecord } from "@/types/task";

const createTaskSchema = z.object({
  taskType: z.string().min(1),
  sourceId: z.string().uuid().nullable().optional(),
  params: z.record(z.string(), z.unknown()).default({}),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export async function createTask(input: CreateTaskInput): Promise<SummaryTaskRecord> {
  const parsed = createTaskSchema.parse(input);
  const db = await getDb();

  const [task] = await db
    .insert(summaryTasks)
    .values({
      taskType: parsed.taskType,
      sourceId: parsed.sourceId ?? null,
      params: parsed.params,
      status: "pending",
      progress: 0,
      currentStep: "queued",
      message: "Task accepted. Worker integration is still pending.",
    })
    .returning();

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
