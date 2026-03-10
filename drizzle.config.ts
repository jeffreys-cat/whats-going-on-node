import { defineConfig } from "drizzle-kit";

const isPglite = process.env.DB_DRIVER === "pglite" || !process.env.DATABASE_URL;
const databaseUrl = process.env.DATABASE_URL ?? "";
const pgliteDataDir = process.env.PGLITE_DATA_DIR ?? ".data/pglite";

export default defineConfig(
  isPglite
    ? {
        schema: "./src/lib/db/schema.ts",
        out: "./drizzle",
        dialect: "postgresql",
        driver: "pglite",
        dbCredentials: {
          url: pgliteDataDir,
        },
      }
    : {
        schema: "./src/lib/db/schema.ts",
        out: "./drizzle",
        dialect: "postgresql",
        dbCredentials: {
          url: databaseUrl,
        },
      },
);
