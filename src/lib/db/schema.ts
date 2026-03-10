import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const sourceTypeEnum = pgEnum("source_type", ["email", "github", "slack"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "running", "succeeded", "failed"]);
export const deliveryStatusEnum = pgEnum("delivery_status", ["pending", "succeeded", "failed"]);
export const batchRunStatusEnum = pgEnum("batch_run_status", ["succeeded", "failed"]);

export const appConfig = pgTable("app_config", {
  id: text("id").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceType: sourceTypeEnum("source_type").notNull(),
    provider: text("provider").notNull(),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    config: jsonb("config").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    sourceUniqueIdx: uniqueIndex("sources_unique_idx").on(
      table.sourceType,
      table.provider,
      table.externalId,
    ),
  }),
);

export const fetchRuns = pgTable("fetch_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  rangeStart: date("range_start", { mode: "date" }).notNull(),
  rangeEnd: date("range_end", { mode: "date" }).notNull(),
  status: text("status").notNull(),
  itemCount: integer("item_count").default(0).notNull(),
  rawBlobKey: text("raw_blob_key"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
});

export const summaries = pgTable("summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceType: sourceTypeEnum("source_type").notNull(),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  language: text("language").default("zh").notNull(),
  contentDateStart: date("content_date_start", { mode: "date" }).notNull(),
  contentDateEnd: date("content_date_end", { mode: "date" }).notNull(),
  summaryText: text("summary_text"),
  summaryBlobKey: text("summary_blob_key"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export const summaryTasks = pgTable("summary_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskType: text("task_type").notNull(),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
  status: taskStatusEnum("status").notNull(),
  params: jsonb("params").$type<Record<string, unknown>>().default({}).notNull(),
  progress: integer("progress").default(0).notNull(),
  currentStep: text("current_step"),
  message: text("message"),
  resultSummaryId: uuid("result_summary_id").references(() => summaries.id, { onDelete: "set null" }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
  finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
});

export const deliveryLogs = pgTable("delivery_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  summaryId: uuid("summary_id")
    .notNull()
    .references(() => summaries.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  target: text("target"),
  status: deliveryStatusEnum("status").notNull(),
  response: jsonb("response").$type<Record<string, unknown> | null>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export const sourceCache = pgTable(
  "source_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    cacheDate: date("cache_date", { mode: "date" }).notNull(),
    cacheKey: text("cache_key").notNull(),
    blobKey: text("blob_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
  },
  (table) => ({
    sourceCacheUniqueIdx: uniqueIndex("source_cache_unique_idx").on(
      table.sourceId,
      table.cacheKey,
      table.cacheDate,
    ),
  }),
);

export const batchRuns = pgTable("batch_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  batchType: text("batch_type").notNull(),
  triggerSource: text("trigger_source").notNull(),
  status: batchRunStatusEnum("status").notNull(),
  queuedCount: integer("queued_count").default(0).notNull(),
  startedCount: integer("started_count").default(0).notNull(),
  failedCount: integer("failed_count").default(0).notNull(),
  message: text("message"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
});

export const sourcesRelations = relations(sources, ({ many }) => ({
  fetchRuns: many(fetchRuns),
  summaries: many(summaries),
  tasks: many(summaryTasks),
  caches: many(sourceCache),
}));

export type AppConfigRow = typeof appConfig.$inferSelect;
export type SourceRow = typeof sources.$inferSelect;
export type SummaryRow = typeof summaries.$inferSelect;
export type SummaryTaskRow = typeof summaryTasks.$inferSelect;
export type BatchRunRow = typeof batchRuns.$inferSelect;
