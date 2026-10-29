import { cn } from "@ds/lib/cn";
import { formatCents } from "@ds/lib/money";

const sizes = {
  sm: "text-body-md font-medium",
  md: "text-h3 font-medium",
  lg: "text-h2 font-medium",
  xl: "text-h1 font-medium",
  display: "text-display font-medium",
  counter: "text-counter-total font-semibold",
} as const;

const tones = {
  in: "text-money-in",
  out: "text-money-out",
  margin: "text-success-fg",
} as const;

type MoneyProps = {
  /** Integer cents, as stored: 123456 renders R$ 1.234,56. */
  cents: number;
  size?: keyof typeof sizes;
  currency?: boolean;
  /** Prefix positive amounts with "+". Negative amounts always get the true minus "−". */
  signed?: boolean;
  tone?: keyof typeof tones;
  mutedCents?: boolean;
  /** Masks the amount (e.g. values a CASHIER must not see on a shared screen). */
  hidden?: boolean;
  className?: string;
};

function Money({
  cents,
  size = "md",
  currency = true,
  signed = false,
  tone,
  mutedCents = true,
  hidden = false,
  className,
}: MoneyProps) {
  const classes = cn(
    "tracking-tight whitespace-nowrap tabular-nums",
    sizes[size],
    tone ? tones[tone] : "text-strong",
    className,
  );
  if (hidden) {
    return (
      <span data-slot="money" className={classes}>
        <span aria-hidden="true">R$ ••••••</span>
        <span className="sr-only">Valor oculto</span>
      </span>
    );
  }
  const parts = formatCents(cents);
  const sign = parts.negative ? "−" : signed && cents > 0 ? "+" : "";
  return (
    <span data-slot="money" className={classes}>
      {sign}
      {currency && (
        <span className="text-currency font-medium tracking-normal text-sub">
          R$&nbsp;
        </span>
      )}
      {parts.integer}
      <span className={cn(mutedCents && (tone ? "opacity-60" : "text-soft"))}>
        ,{parts.cents}
      </span>
    </span>
  );
}

export { Money };
