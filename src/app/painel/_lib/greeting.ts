const TIME_ZONE = "America/Sao_Paulo";

function hourInSaoPaulo(date: Date) {
  const hour = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: TIME_ZONE,
  }).format(date);
  return Number(hour);
}

/** "Bom dia, Ana": the period follows the São Paulo clock and the name is the first word. */
export function greeting(date: Date, name: string) {
  const hour = hourInSaoPaulo(date);
  const period = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const first = name.trim().split(/\s+/)[0];
  return first ? `${period}, ${first}` : period;
}

export function longDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  });
}
