const percent = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** "05/11/2026" from a calendar date "2026-11-05", with no time zone to shift it. */
export const formatDay = (date: string) => date.split("-").reverse().join("/");

/** "42,2%", or "—" when there is nothing to divide. */
export const formatPercent = (value: number | null) =>
  value === null ? "—" : `${percent.format(value)}%`;
