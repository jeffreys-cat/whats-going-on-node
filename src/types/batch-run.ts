export type BatchRunRecord = {
  id: string;
  batchType: string;
  triggerSource: string;
  status: "succeeded" | "failed";
  queuedCount: number;
  startedCount: number;
  failedCount: number;
  message: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};
