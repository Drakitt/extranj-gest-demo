/**
 * Formato e incremento de la numeración de presupuesto.
 */

export const QUOTE_PREFIX = "PRE-";

export function formatQuotationNumber(prefix: string, nextNumberStr: string): string {
  const cleanNumberStr = nextNumberStr.replace(/\D/g, "");
  const numValue = parseInt(cleanNumberStr, 10) || 1;
  const paddingLength = nextNumberStr.length || 5;
  const formattedNumber = String(numValue).padStart(paddingLength, "0");
  return `${prefix}${formattedNumber}`;
}

export function incrementQuotationNumberString(nextNumberStr: string): string {
  const cleanNumberStr = nextNumberStr.replace(/\D/g, "");
  const numValue = parseInt(cleanNumberStr, 10) || 1;
  const nextVal = numValue + 1;
  const paddingLength = nextNumberStr.length || 5;
  return String(nextVal).padStart(paddingLength, "0");
}

export function formatQuoteNumber(next: number): string {
  return formatQuotationNumber(QUOTE_PREFIX, String(next).padStart(5, "0"));
}
