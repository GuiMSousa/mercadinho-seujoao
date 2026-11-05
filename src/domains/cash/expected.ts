export type CashTotals = {
  initialAmount: number;
  cashSales: number;
  supplies: number;
  bleeds: number;
};

/**
 * What the drawer should hold: initial change + cash sales + suprimentos − sangrias.
 * Pix and card sales never touch the drawer, so they are not in `cashSales`.
 */
export const expectedCash = (totals: CashTotals) =>
  totals.initialAmount + totals.cashSales + totals.supplies - totals.bleeds;
