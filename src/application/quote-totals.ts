import { calculatePricing } from "./pricing";
import { roundMoney } from "./money";
import { InputError } from "./input-error";

export type QuoteLineAmounts = {
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
};

export type QuoteTotals = {
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
};

function requireRange(value: number, label: string, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    throw new InputError(`${label} debe ser un número.`);
  }
  const rounded = roundMoney(value);
  if (rounded < min || rounded > max) {
    throw new InputError(`${label} está fuera del rango permitido.`);
  }
  return rounded;
}

/**
 * Precio de una línea de presupuesto. El precio del servicio es sin impuesto.
 * El descuento y el impuesto fuera de rango se rechazan; no se recortan en silencio.
 */
export function priceQuoteLine(input: {
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
}): QuoteLineAmounts {
  const quantity = requireRange(input.quantity, "La cantidad", 0.01, 100000);
  const unitPrice = requireRange(input.unitPrice, "El precio", 0, 1000000);
  const discountPercent = requireRange(input.discountPercent, "El descuento", 0, 100);
  const taxRate = requireRange(input.taxRate, "El impuesto", 0, 100);
  const extended = roundMoney(unitPrice * quantity);
  const priced = calculatePricing({
    basePrice: extended,
    vatRate: taxRate,
    discountPercent,
    taxIncluded: false,
  });

  return {
    quantity,
    unitPrice,
    discountPercent: priced.discountPercent,
    taxRate,
    baseAmount: roundMoney(priced.basePrice),
    taxAmount: priced.vatAmount,
    totalAmount: priced.totalPrice,
  };
}

export function sumQuote(lines: QuoteTotals[]): QuoteTotals {
  return {
    baseAmount: roundMoney(lines.reduce((sum, line) => sum + line.baseAmount, 0)),
    taxAmount: roundMoney(lines.reduce((sum, line) => sum + line.taxAmount, 0)),
    totalAmount: roundMoney(lines.reduce((sum, line) => sum + line.totalAmount, 0)),
  };
}
