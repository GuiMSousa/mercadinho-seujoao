import Link from "next/link";
import { cn } from "@ds/lib/cn";

const LINKS = [
  { href: "/painel/estoque", label: "Lotes e validade" },
  { href: "/painel/estoque/reposicao", label: "Reposição" },
] as const;

/** The two views of the stock: batches by product, and what to buy. */
export function StockNav({
  current,
}: {
  current: (typeof LINKS)[number]["href"];
}) {
  return (
    <nav aria-label="Estoque" className="flex">
      <ul className="inline-flex gap-1 rounded-lg bg-surface-sunken p-1">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={link.href === current ? "page" : undefined}
              className={cn(
                "inline-flex h-control-sm items-center rounded-md px-3.5 text-body-md font-medium text-sub",
                link.href === current &&
                  "bg-primary text-inverse shadow-(--shadow-btn-dark)",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
