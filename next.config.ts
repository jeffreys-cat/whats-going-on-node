import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ['@electric-sql/pglite', 'pino', 'better-sqlite3', 'electron'],
};

export default nextConfig;
