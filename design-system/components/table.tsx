import type { ReactNode } from "react";
import { cn } from "@ds/lib/cn";

const align = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

type TableColumn<Row> = {
  key: string;
  label: ReactNode;
  /** Right-align amounts and quantities. */
  align?: keyof typeof align;
  wrap?: boolean;
  render: (row: Row) => ReactNode;
};

type TableProps<Row> = {
  /** Accessible name of the table (visually hidden) and of its scroll region. */
  caption: string;
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  /** Next action for the empty state, e.g. "Importe produtos para começar." */
  empty?: ReactNode;
  dense?: boolean;
  /** Highlights selected rows; the row itself must expose the state (e.g. a Checkbox). */
  isSelected?: (row: Row) => boolean;
  className?: string;
};

function Table<Row>({
  caption,
  columns,
  rows,
  rowKey,
  empty = "Nada por aqui ainda.",
  dense = false,
  isSelected,
  className,
}: TableProps<Row>) {
  return (
    // Focusable scroll region so keyboard users can scroll wide tables.
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      data-slot="table"
      className={cn("min-w-0 overflow-x-auto", className)}
    >
      <table className="w-full border-separate border-spacing-0 text-body-md tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "bg-surface-sunken px-3 py-2 text-caption font-medium whitespace-nowrap text-sub first:rounded-l-sm last:rounded-r-sm",
                  align[column.align ?? "left"],
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-sub"
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                data-selected={isSelected?.(row) ? "" : undefined}
                className="transition-colors hover:bg-surface-hover data-selected:bg-selected-bg"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "border-b border-border-soft px-3 text-strong",
                      dense ? "py-2" : "py-3",
                      column.wrap ? "whitespace-normal" : "whitespace-nowrap",
                      align[column.align ?? "left"],
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { Table, type TableColumn };
