import assert from "node:assert/strict";
import test from "node:test";
import { calculatePricing } from "./pricing";

test("precio sin impuesto, sin descuento", () => {
  const priced = calculatePricing({ basePrice: 200, vatRate: 21, discountPercent: 0, taxIncluded: false });
  assert.equal(priced.basePrice, 200);
  assert.equal(priced.vatAmount, 42);
  assert.equal(priced.totalPrice, 242);
});

test("aplica un descuento del 10 por ciento", () => {
  const priced = calculatePricing({ basePrice: 100, vatRate: 21, discountPercent: 10 });
  assert.equal(priced.basePrice, 90);
  assert.equal(priced.vatAmount, 18.9);
  assert.equal(priced.totalPrice, 108.9);
});

test("un descuento del 100 por ciento deja el total a cero", () => {
  const priced = calculatePricing({ basePrice: 80, vatRate: 21, discountPercent: 100 });
  assert.equal(priced.vatAmount, 0);
  assert.equal(priced.totalPrice, 0);
});

test("separa el precio con impuesto incluido", () => {
  const priced = calculatePricing({ basePrice: 121, vatRate: 21, taxIncluded: true });
  assert.equal(priced.basePrice, 100);
  assert.equal(priced.vatAmount, 21);
  assert.equal(priced.totalPrice, 121);
});

