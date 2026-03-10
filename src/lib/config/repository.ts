import { asc } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { appConfig } from "@/lib/db/schema";
import type { AppConfigRecord, ConfigKey } from "@/types/config";

export async function listConfigs(): Promise<AppConfigRecord[]> {
  const db = await getDb();
  const configs = await db.select().from(appConfig).orderBy(asc(appConfig.id));

  return configs.map((config) => ({
    id: config.id as ConfigKey,
    value: config.value,
    updatedAt: config.updatedAt.toISOString(),
  }));
}

export async function upsertConfig(
  id: ConfigKey,
  value: Record<string, unknown>,
): Promise<AppConfigRecord> {
  const db = await getDb();
  const [config] = await db
    .insert(appConfig)
    .values({ id, value })
    .onConflictDoUpdate({
      target: appConfig.id,
      set: {
        value,
        updatedAt: new Date(),
      },
    })
    .returning();

  return {
    id: config.id as ConfigKey,
    value: config.value,
    updatedAt: config.updatedAt.toISOString(),
  };
}

export async function getConfig(id: ConfigKey): Promise<AppConfigRecord | null> {
  const configs = await listConfigs();
  return configs.find((config) => config.id === id) ?? null;
}
