import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { assertDemoDatabaseUrl } from "./db-guard";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * El cliente solo se construye al usarlo, y solo si el destino es la demo.
 * Importar este módulo no abre una conexión.
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const connectionString = assertDemoDatabaseUrl(process.env.DATABASE_URL);
    const pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}
