"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { StockAlerts } from "@/contracts/suppliers";
import { Badge } from "@ds/components/badge";
import { buttonVariants } from "@ds/components/button";
import { cn } from "@ds/lib/cn";
import { apiFetch } from "../_lib/api";

/**
 * Bell with the number of products needing attention (no stock, at or below the minimum, expiring
 * within 7 days), linking to the replenishment list. Counted again on each page of the panel.
 */
export function StockAlertsLink({ initial }: { initial: number }) {
  const pathname = usePathname();
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const controller = new AbortController();
    void apiFetch<StockAlerts>("/api/admin/inventory/alerts", {
      signal: controller.signal,
    }).then((result) => {
      // A failed count keeps the last one; the list itself is a click away.
      if (result.ok && !controller.signal.aborted) setCount(result.data.count);
    });
    return () => controller.abort();
  }, [pathname]);

  const label =
    count === 0
      ? "Nenhum produto precisa de atenção. Ver a reposição"
      : `${count} ${count === 1 ? "produto precisa" : "produtos precisam"} de atenção. Ver a reposição`;
  return (
    <Link
      href="/painel/estoque/reposicao"
      aria-label={label}
      title={label}
      className={cn(
        buttonVariants({ variant: "ghost", size: "md" }),
        "relative px-2.5",
      )}
    >
      <Bell aria-hidden="true" />
      {count > 0 && (
        <Badge
          tone="danger"
          size="sm"
          aria-hidden="true"
          className="absolute -top-1 -right-1 tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </Link>
  );
}
