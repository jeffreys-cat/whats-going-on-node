import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  DB_DRIVER: z.enum(["postgres", "pglite"]).optional(),
  PGLITE_DATA_DIR: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  APP_BASE_URL: z.string().url().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DB_DRIVER: process.env.DB_DRIVER,
  PGLITE_DATA_DIR: process.env.PGLITE_DATA_DIR,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  APP_BASE_URL: process.env.APP_BASE_URL,
});
