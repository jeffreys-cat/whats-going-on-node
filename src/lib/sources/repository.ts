import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { sources } from "@/lib/db/schema";
import type { CreateSourceInput, SourceRecord, SourceType, UpdateSourceInput } from "@/types/source";

const createSourceSchema = z.object({
  sourceType: z.enum(["email", "github", "slack"]),
  provider: z.string().min(1),
  externalId: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

const updateSourceSchema = z.object({
  externalId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export async function listSources(sourceType?: SourceType): Promise<SourceRecord[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(sources)
    .where(sourceType ? eq(sources.sourceType, sourceType) : undefined)
    .orderBy(asc(sources.sourceType), asc(sources.name));

  return rows.map((source) => ({
    id: source.id,
    sourceType: source.sourceType,
    provider: source.provider,
    externalId: source.externalId,
    name: source.name,
    enabled: source.enabled,
    config: source.config,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  }));
}

export async function getSource(sourceId: string): Promise<SourceRecord | null> {
  const db = await getDb();
  const [source] = await db.select().from(sources).where(eq(sources.id, sourceId)).limit(1);

  return source
    ? {
        id: source.id,
        sourceType: source.sourceType,
        provider: source.provider,
        externalId: source.externalId,
        name: source.name,
        enabled: source.enabled,
        config: source.config,
        createdAt: source.createdAt.toISOString(),
        updatedAt: source.updatedAt.toISOString(),
      }
    : null;
}

export async function createSource(input: CreateSourceInput): Promise<SourceRecord> {
  const parsed = createSourceSchema.parse(input);
  const db = await getDb();
  const [source] = await db
    .insert(sources)
    .values({
      sourceType: parsed.sourceType,
      provider: parsed.provider,
      externalId: parsed.externalId,
      name: parsed.name,
      enabled: parsed.enabled ?? true,
      config: parsed.config ?? {},
    })
    .onConflictDoUpdate({
      target: [sources.sourceType, sources.provider, sources.externalId],
      set: {
        name: parsed.name,
        enabled: parsed.enabled ?? true,
        config: parsed.config ?? {},
        updatedAt: new Date(),
      },
    })
    .returning();

  return {
    id: source.id,
    sourceType: source.sourceType,
    provider: source.provider,
    externalId: source.externalId,
    name: source.name,
    enabled: source.enabled,
    config: source.config,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

export async function getGithubSourceByRepo(fullName: string) {
  const db = await getDb();
  const [source] = await db
    .select()
    .from(sources)
    .where(
      and(
        eq(sources.sourceType, "github"),
        eq(sources.provider, "github"),
        eq(sources.externalId, fullName),
      ),
    )
    .limit(1);

  return source
    ? {
        id: source.id,
        sourceType: source.sourceType,
        provider: source.provider,
        externalId: source.externalId,
        name: source.name,
        enabled: source.enabled,
        config: source.config,
        createdAt: source.createdAt.toISOString(),
        updatedAt: source.updatedAt.toISOString(),
      }
    : null;
}

export async function updateSource(
  sourceId: string,
  input: UpdateSourceInput,
): Promise<SourceRecord | null> {
  const parsed = updateSourceSchema.parse(input);
  const db = await getDb();
  const existing = await getSource(sourceId);

  if (!existing) {
    return null;
  }

  const [source] = await db
    .update(sources)
    .set({
      externalId: parsed.externalId ?? existing.externalId,
      name: parsed.name ?? existing.name,
      enabled: parsed.enabled ?? existing.enabled,
      config: parsed.config ?? existing.config,
      updatedAt: new Date(),
    })
    .where(eq(sources.id, sourceId))
    .returning();

  return {
    id: source.id,
    sourceType: source.sourceType,
    provider: source.provider,
    externalId: source.externalId,
    name: source.name,
    enabled: source.enabled,
    config: source.config,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

export async function deleteSource(sourceId: string): Promise<SourceRecord | null> {
  const existing = await getSource(sourceId);

  if (!existing) {
    return null;
  }

  const db = await getDb();
  await db.delete(sources).where(eq(sources.id, sourceId));

  return existing;
}
