import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "./crypto";

test("verifica la contraseña y rechaza un hash mal formado", () => {
  const stored = hashPassword("clave-ficticia-demo");
  assert.equal(verifyPassword("clave-ficticia-demo", stored), true);
  assert.equal(verifyPassword("otra-clave", stored), false);
  assert.equal(verifyPassword("clave-ficticia-demo", "no-es-un-hash"), false);
  assert.equal(verifyPassword("clave-ficticia-demo", "abcd:00"), false);
});
