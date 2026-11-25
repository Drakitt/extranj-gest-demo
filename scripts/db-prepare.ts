import "dotenv/config";
import { spawnSync } from "node:child_process";
import { assertDemoDatabaseUrl } from "../src/infrastructure/db-guard";

/**
 * Única entrada prevista para crear la base de la demo.
 * No forma parte de dev ni de build. No ejecutar hasta autorización.
 */
function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

assertDemoDatabaseUrl(process.env.DATABASE_URL);

const seedPassword = process.env.SEED_PASSWORD ?? "";
if (seedPassword.length < 8 || seedPassword.toUpperCase().includes("CHANGE_ME")) {
  throw new Error("SEED_PASSWORD falta o sigue siendo un marcador.");
}

const jwtSecret = process.env.JWT_SECRET ?? "";
if (jwtSecret.length < 24 || jwtSecret.toUpperCase().includes("CHANGE_ME")) {
  throw new Error("JWT_SECRET falta o sigue siendo un marcador.");
}

run("npx", ["prisma", "migrate", "deploy"]);
run("npx", ["prisma", "db", "seed"]);
