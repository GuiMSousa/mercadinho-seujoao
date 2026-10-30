/** "29/10/2026 09:05" in the store's time zone, for activity and last-access columns. */
export function formatDateTime(iso: string) {
  return new Date(iso)
    .toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
      hourCycle: "h23",
    })
    .replace(",", "");
}
