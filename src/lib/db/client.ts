import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/config/env";
import * as schema from "@/lib/db/schema";

type AppDb = ReturnType<typeof drizzlePostgres<typeof schema>>;

function loadPgliteAssets() {
  const distDir = join(process.cwd(), "node_modules", "@electric-sql", "pglite", "dist");
  const wasmBuffer = readFileSync(join(distDir, "postgres.wasm"));
  const dataBuffer = readFileSync(join(distDir, "postgres.data"));
  const wasmBytes = wasmBuffer.buffer.slice(
    wasmBuffer.byteOffset,
    wasmBuffer.byteOffset + wasmBuffer.byteLength,
  );

  return {
    wasmModule: new WebAssembly.Module(wasmBytes),
    fsBundle: new Blob([dataBuffer]),
  };
}

declare global {
  var postgresGlobal: ReturnType<typeof postgres> | undefined;
  var pgliteGlobal: PGlite | undefined;
  var drizzleGlobal: Promise<AppDb> | undefined;
}

async function initPostgresDb(): Promise<AppDb> {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!global.postgresGlobal) {
    global.postgresGlobal = postgres(env.DATABASE_URL, {
      max: 1,
      prepare: false,
    });
  }

  return drizzlePostgres(global.postgresGlobal, { schema });
}

async function initPgliteDb(): Promise<AppDb> {
  if (!global.pgliteGlobal) {
    const dataDir = env.PGLITE_DATA_DIR ?? ".data/pglite";
    console.log("[db] initPgliteDb:start", {
      dataDir,
      driver: env.DB_DRIVER ?? "auto",
    });
    if (!dataDir.startsWith("memory://")) {
      console.log("[db] initPgliteDb:mkdir", {
        parentDir: dirname(dataDir),
      });
      mkdirSync(dirname(dataDir), { recursive: true });
    }
    console.log("[db] initPgliteDb:assets", {
      distDir: join(process.cwd(), "node_modules", "@electric-sql", "pglite", "dist"),
    });
    const assets = loadPgliteAssets();
    console.log("[db] initPgliteDb:new PGlite", {
      dataDir,
    });
    global.pgliteGlobal = new PGlite(dataDir, assets);
    await global.pgliteGlobal.waitReady;
    console.log("[db] initPgliteDb:ready", {
      dataDir,
    });
  }

  const db = drizzlePglite(global.pgliteGlobal, { schema });
  console.log("[db] initPgliteDb:migrate", {
    migrationsFolder: "./drizzle",
  });
  await migratePglite(db, {
    migrationsFolder: "./drizzle",
  });
  console.log("[db] initPgliteDb:done");

  return db as unknown as AppDb;
}

export async function getDb() {
  if (!global.drizzleGlobal) {
    global.drizzleGlobal =
      env.DB_DRIVER === "pglite" || !env.DATABASE_URL ? initPgliteDb() : initPostgresDb();
  }

  return global.drizzleGlobal;
}
