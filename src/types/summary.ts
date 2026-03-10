import type { SourceType } from "@/types/source";

export type SummaryRecord = {
  id: string;
  sourceType: SourceType;
  sourceId: string | null;
  title: string;
  language: string;
  contentDateStart: string;
  contentDateEnd: string;
  summaryText: string | null;
  summaryBlobKey: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};
