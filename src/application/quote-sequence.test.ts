import assert from "node:assert/strict";
import test from "node:test";
import { formatQuoteNumber, formatQuotationNumber, incrementQuotationNumberString } from "./quote-sequence";

test("formatea el primer presupuesto y avanza la serie", () => {
  assert.equal(formatQuoteNumber(1), "PRE-00001");
  assert.equal(formatQuotationNumber("PRE-", "00001"), "PRE-00001");
  assert.equal(incrementQuotationNumberString("00001"), "00002");
  assert.equal(formatQuoteNumber(2), "PRE-00002");
});
