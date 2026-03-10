export type TaskStatus = "pending" | "running" | "succeeded" | "failed";

export type SummaryTaskRecord = {
  id: string;
  taskType: string;
  sourceId: string | null;
  status: TaskStatus;
  progress: number;
  currentStep: string | null;
  message: string | null;
  resultSummaryId: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  params: Record<string, unknown>;
};

export type CreateTaskPayload = {
  taskType: string;
  sourceId?: string | null;
  params?: Record<string, unknown>;
  runImmediately?: boolean;
};
