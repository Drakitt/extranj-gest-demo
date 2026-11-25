import assert from "node:assert/strict";
import test from "node:test";
import { parseClientInput, parseFollowUpCreate, parseQuoteCreate, parseScheduledDate } from "./records";

const CLIENT_ID = "11111111-1111-4111-8111-111111111111";
const SERVICE_ID = "33333333-3333-4333-8333-333333333333";

test("acepta un cliente ficticio y rechaza un correo externo", () => {
  const client = parseClientInput({
    name: "Taller Norte Demo",
    contactName: "Ana Ruiz Demo",
    email: "ana.ruiz@demo.local",
    phone: "600000001",
    notes: "Nota ficticia",
  });
  assert.equal(client.name, "Taller Norte Demo");
  assert.throws(() => parseClientInput({ name: "Empresa", email: "persona@empresa.com" }));
});

test("un presupuesto exige cliente y al menos un servicio", () => {
  assert.throws(() => parseQuoteCreate({ clientId: "", lines: [] }));
  const quote = parseQuoteCreate({
    clientId: CLIENT_ID,
    lines: [{ serviceId: SERVICE_ID, quantity: 2, discountPercent: 10 }],
  });
  assert.equal(quote.clientId, CLIENT_ID);
  assert.equal(quote.lines.length, 1);
});

test("la fecha prevista tiene que ser un día real", () => {
  assert.equal(parseScheduledDate("2026-10-23"), "2026-10-23");
  assert.throws(() => parseScheduledDate("2026-02-31"));
  assert.throws(() => parseFollowUpCreate({ scheduledOn: "23/10/2026", note: "Llamar" }));
});
