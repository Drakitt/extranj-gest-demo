/**
 * Redondeo monetario a céntimos.
 */
export function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}
