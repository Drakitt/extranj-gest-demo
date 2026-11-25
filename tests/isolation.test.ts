import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function filesUnder(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) files.push(...filesUnder(fullPath));
    else files.push(fullPath);
  }
  return files;
}

test("dev y build no preparan la base", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  };
  for (const name of ["dev", "build", "start"]) {
    assert.equal(/migrate|prisma|docker|seed/i.test(pkg.scripts[name]), false, name);
  }
  assert.match(pkg.scripts["db:prepare"], /db-prepare/);
});

test("el contenedor es exclusivo de la demo", () => {
  const compose = readFileSync(path.join(root, "docker-compose.yml"), "utf8");
  assert.match(compose, /5436:5432/);
  assert.match(compose, /crm-servicios-demo-db/);
  assert.match(compose, /crm_servicios_demo_data/);
  assert.match(compose, /crm_servicios_demo/);
  assert.equal(compose.includes("5434"), false);
  assert.equal(compose.includes("postgres:postgres"), false);
});

test("la plantilla no contiene secretos utilizables", () => {
  const example = readFileSync(path.join(root, ".env.example"), "utf8");
  assert.match(example, /CHANGE_ME/);
  assert.match(example, /5436/);
  assert.match(example, /crm_servicios_demo/);
  assert.equal(example.includes("5434"), false);
});


test("la migración inicial crea el esquema de la demo", () => {
  const migrations = filesUnder(path.join(root, "prisma", "migrations")).filter((file) =>
    file.endsWith(".sql")
  );
  assert.equal(migrations.length, 1);
  const sql = readFileSync(migrations[0], "utf8").toLowerCase();
  assert.equal(sql.includes("procedure"), false);
  assert.match(sql, /quote_sequences/);
  assert.match(sql, /follow_ups/);
});
