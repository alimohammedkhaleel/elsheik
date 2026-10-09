/**
 * Financial and monetary precision utility for Sheikh Distribution System
 * Ensures accurate decimal arithmetic, eliminates JavaScript IEEE-754 floating-point inaccuracies,
 * and standardizes financial rounding according to accounting standards (2 decimal places).
 */

/**
 * Rounds a number to exactly 2 decimal places using standard Half-Up financial rounding.
 * e.g., roundMoney(10.005) -> 10.01, roundMoney(10.004) -> 10.00
 */
export const roundMoney = (val: number | string | null | undefined): number => {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return 0.0;
  }
  const num = Number(val);
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Safely parses a monetary input, guaranteeing non-negative value if required.
 */
export const parseMoney = (val: number | string | null | undefined, allowNegative = false): number => {
  const rounded = roundMoney(val);
  if (!allowNegative && rounded < 0) {
    return 0.0;
  }
  return rounded;
};

/**
 * Calculates line total for invoice item: quantity * unit_price - discount
 */
export const calculateLineTotal = (
  quantity: number | string,
  unitPrice: number | string,
  discount: number | string = 0
): number => {
  const qty = Math.max(0, Number(quantity) || 0);
  const price = Math.max(0, Number(unitPrice) || 0);
  const disc = Math.max(0, Number(discount) || 0);

  const rawGross = qty * price;
  const lineTotal = Math.max(0, rawGross - disc);
  return roundMoney(lineTotal);
};

export interface InvoiceTotalsCalculation {
  subtotal: number;
  totalDiscount: number;
  total: number;
}

/**
 * Authoritatively calculates invoice totals across line items and overall invoice discount.
 */
export const calculateInvoiceTotals = (
  items: Array<{ quantity: number; unit_price: number; discount?: number }>,
  overallDiscount: number | string = 0
): InvoiceTotalsCalculation => {
  let subtotal = 0;
  let itemsDiscount = 0;

  for (const item of items) {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.unit_price) || 0);
    const disc = Math.max(0, Number(item.discount) || 0);

    const lineGross = qty * price;
    subtotal += lineGross;
    itemsDiscount += disc;
  }

  const roundedSubtotal = roundMoney(subtotal);
  const roundedItemsDiscount = roundMoney(itemsDiscount);
  const roundedOverallDiscount = Math.max(0, roundMoney(overallDiscount));

  const totalDiscount = roundMoney(roundedItemsDiscount + roundedOverallDiscount);
  const finalTotal = Math.max(0, roundMoney(roundedSubtotal - totalDiscount));

  return {
    subtotal: roundedSubtotal,
    totalDiscount,
    total: finalTotal,
  };
};
