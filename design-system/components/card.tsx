import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@ds/lib/cn";

type CardProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Top-right controls, such as a secondary Button or an IconButton. */
  actions?: ReactNode;
  as?: "section" | "div" | "article" | "aside";
  /** Heading level of the title; match the page outline. */
  titleAs?: "h2" | "h3";
  /** Drops the body padding so a Table can run edge to edge. */
  flush?: boolean;
};

function Card({
  title,
  subtitle,
  actions,
  as: Tag = "section",
  titleAs: Title = "h2",
  flush = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Tag
      data-slot="card"
      className={cn(
        "flex min-w-0 flex-col rounded-card border border-border-soft bg-surface-card text-card-foreground shadow-(--shadow-sm)",
        className,
      )}
      {...props}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            {title && (
              <Title className="text-body-lg font-medium text-strong">
                {title}
              </Title>
            )}
            {subtitle && <p className="text-body-md text-sub">{subtitle}</p>}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </header>
      )}
      <div className={cn("min-w-0 flex-1", flush ? "pt-4" : "p-5")}>
        {children}
      </div>
    </Tag>
  );
}

export { Card };
