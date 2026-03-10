import { NextResponse } from "next/server";
import { z } from "zod";

import { createTask } from "@/lib/tasks/create-task";
import { runPendingTask } from "@/lib/tasks/task-runner";
import { listTasks } from "@/lib/tasks/task-status";

export const runtime = "nodejs";

export async function GET() {
  try {
    const tasks = await listTasks();
    return NextResponse.json({ items: tasks });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load tasks." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = z
      .object({
        taskType: z.string().min(1),
        sourceId: z.string().uuid().nullable().optional(),
        params: z.record(z.string(), z.unknown()).default({}),
        runImmediately: z.boolean().optional(),
      })
      .parse(body);
    const task = await createTask(payload);

    if (payload.runImmediately) {
      const finishedTask = await runPendingTask(task.id);
      return NextResponse.json(finishedTask, { status: 201 });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create task.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
