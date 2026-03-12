import "dotenv/config";
import { defineConfig } from "prisma/config";

function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const name = process.env.DB_NAME || "maintpro";
  const user = process.env.DB_USER || "postgres";
  const password = process.env.DB_PASSWORD || "";
  const ssl = process.env.DB_SSL === "true" ? "?sslmode=require" : "";

  const url = `postgresql://${user}:${password}@${host}:${port}/${name}${ssl}`;
  // Set DATABASE_URL so Prisma schema can resolve env("DATABASE_URL")
  process.env.DATABASE_URL = url;
  return url;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: buildDatabaseUrl(),
  },
});
