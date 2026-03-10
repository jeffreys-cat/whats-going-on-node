import { NextResponse } from "next/server";

import { runPendingTask } from "@/lib/tasks/task-runner";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await context.params;
    const task = await runPendingTask(taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run task.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
