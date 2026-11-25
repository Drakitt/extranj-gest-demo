import assert from "node:assert/strict";
import test from "node:test";
import { signToken, verifyToken } from "./jwt";

const SECRET = "demo-test-secret-not-for-production";

test("firma y verifica una sesión de la demo", () => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = SECRET;
  try {
    const token = signToken({
      id: "11111111-1111-4111-8111-111111111111",
      email: "admin@demo.local",
      role: "Administrator",
    });
    const payload = verifyToken(token);
    assert.equal(payload?.email, "admin@demo.local");
    assert.equal(payload?.role, "Administrator");
    assert.equal(verifyToken(`${token}x`), null);
  } finally {
    process.env.JWT_SECRET = previous;
  }
});

test("rechaza un secreto marcador", () => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "CHANGE_ME_USE_AT_LEAST_24_CHARS";
  try {
    assert.throws(() =>
      signToken({ id: "1", email: "admin@demo.local", role: "Administrator" })
    );
    assert.equal(verifyToken("token"), null);
  } finally {
    process.env.JWT_SECRET = previous;
  }
});
