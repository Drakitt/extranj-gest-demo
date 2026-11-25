import assert from "node:assert/strict";
import test from "node:test";
import { priceQuoteLine, sumQuote } from "./quote-totals";

test("dos unidades a 100 con impuesto del 21 por ciento", () => {
  const line = priceQuoteLine({ quantity: 2, unitPrice: 100, discountPercent: 0, taxRate: 21 });
  assert.deepEqual(
    { base: line.baseAmount, tax: line.taxAmount, total: line.totalAmount },
    { base: 200, tax: 42, total: 242 }
  );
});

test("un descuento del 10 por ciento sobre 100", () => {
  const line = priceQuoteLine({ quantity: 1, unitPrice: 100, discountPercent: 10, taxRate: 21 });
  assert.equal(line.baseAmount, 90);
  assert.equal(line.taxAmount, 18.9);
  assert.equal(line.totalAmount, 108.9);
});

test("suma líneas con impuestos distintos", () => {
  const first = priceQuoteLine({ quantity: 2, unitPrice: 100, discountPercent: 0, taxRate: 21 });
  const second = priceQuoteLine({ quantity: 1, unitPrice: 50, discountPercent: 0, taxRate: 10 });
  assert.deepEqual(sumQuote([first, second]), { baseAmount: 250, taxAmount: 47, totalAmount: 297 });
});

test("rechaza cantidad nula, precio negativo y descuento superior al 100 por ciento", () => {
  assert.throws(() => priceQuoteLine({ quantity: 0, unitPrice: 10, discountPercent: 0, taxRate: 21 }));
  assert.throws(() => priceQuoteLine({ quantity: 1, unitPrice: -1, discountPercent: 0, taxRate: 21 }));
  assert.throws(() => priceQuoteLine({ quantity: 1, unitPrice: 10, discountPercent: 101, taxRate: 21 }));
  assert.throws(() => priceQuoteLine({ quantity: 1, unitPrice: 10, discountPercent: 0, taxRate: 101 }));
});

test("conserva el redondeo heredado cuando la base y el impuesto no cierran al céntimo", () => {
  const line = priceQuoteLine({ quantity: 3, unitPrice: 10.01, discountPercent: 10, taxRate: 21 });
  assert.equal(line.baseAmount, 27.03);
  assert.equal(line.taxAmount, 5.68);
  assert.equal(line.totalAmount, 32.7);
  assert.notEqual(line.baseAmount + line.taxAmount, line.totalAmount);
});
