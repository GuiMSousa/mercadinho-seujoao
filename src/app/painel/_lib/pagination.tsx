"use client";

import { Button } from "@ds/components/button";

/** Previous/next over a server-paginated list; a single page needs no controls. */
export function Pagination({
  page,
  pageSize,
  total,
  noun,
  loading,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  noun: { one: string; many: string };
  loading: boolean;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const step = (label: string, target: number) => (
    <Button
      variant="secondary"
      size="sm"
      // Stays focusable at the ends: a plain disabled button would drop the keyboard focus.
      disabled={target < 1 || target > pages}
      focusableWhenDisabled
      onClick={() => onPage(target)}
    >
      {label}
    </Button>
  );

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
    >
      <p
        aria-live="polite"
        aria-atomic="true"
        className="text-body-sm text-sub tabular-nums"
      >
        {loading
          ? "Carregando…"
          : `${total} ${total === 1 ? noun.one : noun.many} · Página ${page} de ${pages}`}
      </p>
      {pages > 1 && (
        <div className="flex gap-2">
          {step("Anterior", page - 1)}
          {step("Próxima", page + 1)}
        </div>
      )}
    </nav>
  );
}
