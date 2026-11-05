import { Badge } from "@ds/components/badge";
import { formatBrl } from "@ds/lib/money";

/** Quebra de caixa in words, never by color alone: sobra, falta or none. */
export function DifferenceBadge({ difference }: { difference: number | null }) {
  if (difference === null)
    return (
      <Badge tone="info" dot>
        Caixa aberto
      </Badge>
    );
  if (difference === 0)
    return (
      <Badge tone="success" dot>
        Sem quebra
      </Badge>
    );
  return difference > 0 ? (
    <Badge tone="warning" dot>
      Sobra de {formatBrl(difference)}
    </Badge>
  ) : (
    <Badge tone="danger" dot>
      Falta de {formatBrl(-difference)}
    </Badge>
  );
}
