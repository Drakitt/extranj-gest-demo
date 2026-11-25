import "dotenv/config";
import { defineConfig } from "prisma/config";
import { inspectDatabaseUrl } from "./src/infrastructure/db-guard";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  const verdict = inspectDatabaseUrl(databaseUrl);
  if (!verdict.ok) {
    throw new Error(`Destino de base rechazado: ${verdict.reason}`);
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
