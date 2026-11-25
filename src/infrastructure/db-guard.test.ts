import assert from "node:assert/strict";
import test from "node:test";
import { assertDemoDatabaseUrl, inspectDatabaseUrl } from "./db-guard";

const VALID = "postgresql://crm_servicios_demo:local-demo-password@127.0.0.1:5436/crm_servicios_demo";

test("acepta solo el destino local de la demo", () => {
  assert.equal(inspectDatabaseUrl(VALID).ok, true);
  assert.equal(assertDemoDatabaseUrl(VALID), VALID);
  assert.equal(
    inspectDatabaseUrl("postgresql://crm_servicios_demo:local-demo-password@localhost:5436/crm_servicios_demo").ok,
    true
  );
});

test("rechaza otros destinos, otros usuarios y marcadores", () => {
  const rejected = [
    "",
    "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
    "postgresql://crm_servicios_demo:CHANGE_ME@127.0.0.1:5436/crm_servicios_demo",
    "postgresql://crm_servicios_demo:local-demo-password@127.0.0.1:5434/crm_servicios_demo",
    "postgresql://otra:local-demo-password@127.0.0.1:5436/crm_servicios_demo",
    "postgresql://crm_servicios_demo:local-demo-password@127.0.0.1:5436/otra_base",
    "postgresql://crm_servicios_demo:local-demo-password@db.example.com:5436/crm_servicios_demo",
    "mysql://crm_servicios_demo:local-demo-password@127.0.0.1:5436/crm_servicios_demo",
  ];

  for (const value of rejected) {
    const verdict = inspectDatabaseUrl(value);
    assert.equal(verdict.ok, false, value);
    if (!verdict.ok) {
      assert.equal(verdict.reason.includes("local-demo-password"), false);
      assert.equal(verdict.reason.toLowerCase().includes("postgres:postgres"), false);
    }
    assert.throws(() => assertDemoDatabaseUrl(value));
  }
});
