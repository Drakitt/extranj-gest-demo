/**
 * Cálculo de base, descuento, impuesto y total de cada línea.
 */

export interface PricingInput {
  basePrice: number;
  vatRate: number;
  discountPercent?: number;
  taxIncluded?: boolean;
}

export interface PricingResult {
  basePrice: number;
  vatRate: number;
  discountPercent: number;
  vatAmount: number;
  totalPrice: number;
}

export function calculatePricing(input: PricingInput): PricingResult {
  const basePriceInput = Number(input.basePrice) || 0;
  const vatRate = Number(input.vatRate) || 0;
  const discountPercent = Math.min(100, Math.max(0, Number(input.discountPercent) || 0));

  const basePrice = input.taxIncluded ? basePriceInput / (1 + vatRate / 100) : basePriceInput;
  const discountedBase = basePrice * (1 - discountPercent / 100);
  const vatAmount = discountedBase * (vatRate / 100);
  const totalPrice = discountedBase + vatAmount;

  return {
    basePrice: discountedBase,
    vatRate,
    discountPercent,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalPrice: Math.round(totalPrice * 100) / 100,
  };
}
