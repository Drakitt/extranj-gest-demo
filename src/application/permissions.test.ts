import assert from "node:assert/strict";
import test from "node:test";
import { can } from "./permissions";

test("el administrador puede borrar y mantener el catálogo", () => {
  assert.equal(can("Administrator", "clients.delete"), true);
  assert.equal(can("Administrator", "services.write"), true);
  assert.equal(can("Administrator", "services.delete"), true);
  assert.equal(can("Administrator", "quotes.delete"), true);
  assert.equal(can("Administrator", "followUps.write"), true);
});

test("el comercial prepara clientes, presupuestos y seguimiento, y no administra el catálogo", () => {
  assert.equal(can("Comercial", "clients.read"), true);
  assert.equal(can("Comercial", "clients.write"), true);
  assert.equal(can("Comercial", "clients.delete"), false);
  assert.equal(can("Comercial", "services.read"), true);
  assert.equal(can("Comercial", "services.write"), false);
  assert.equal(can("Comercial", "services.delete"), false);
  assert.equal(can("Comercial", "quotes.write"), true);
  assert.equal(can("Comercial", "quotes.delete"), false);
  assert.equal(can("Comercial", "followUps.write"), true);
});

test("un rol desconocido no tiene acceso", () => {
  for (const role of ["Agent", "Viewer", "Guest", ""]) {
    assert.equal(can(role, "clients.read"), false);
    assert.equal(can(role, "quotes.write"), false);
  }
});
