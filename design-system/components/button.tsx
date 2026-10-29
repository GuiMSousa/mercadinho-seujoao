import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@ds/lib/cn";
import { LoaderCircle, type LucideIcon } from "lucide-react";

const base =
  "inline-flex shrink-0 cursor-pointer touch-manipulation items-center justify-center border border-transparent font-medium whitespace-nowrap transition-[background-color,color,scale] duration-(--dur-fast) select-none data-disabled:cursor-not-allowed data-disabled:border-transparent data-disabled:bg-surface-sunken data-disabled:text-disabled data-disabled:shadow-none data-disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0";

const buttonVariants = cva(`${base} active:scale-98`, {
  variants: {
    variant: {
      primary:
        "bg-primary text-primary-foreground shadow-(--shadow-btn-dark) hover:bg-primary-hover",
      brand:
        "bg-brand text-on-color shadow-(--shadow-btn-brand) hover:bg-brand-hover",
      secondary:
        "border-border bg-surface-card text-strong shadow-(--shadow-xs) hover:bg-surface-hover",
      soft: "bg-control-soft text-strong hover:bg-control-soft-hover",
      ghost: "text-body hover:bg-surface-sunken",
      danger: "bg-destructive text-on-color hover:bg-destructive-hover",
    },
    // Product decision: 16px text from md up; counter keeps the >=60px touch target.
    size: {
      sm: "h-control-sm gap-1.5 rounded-sm px-3 text-body-md [&_svg:not([class*='size-'])]:size-4",
      md: "h-control-md gap-2 rounded-md px-4 text-body-lg [&_svg:not([class*='size-'])]:size-4.5",
      lg: "h-control-lg gap-2 rounded-lg px-5 text-body-lg [&_svg:not([class*='size-'])]:size-5",
      counter:
        "h-control-counter gap-2.5 rounded-lg px-6 text-counter [&_svg:not([class*='size-'])]:size-6",
    },
    fullWidth: { true: "w-full" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    /** Shows a spinner, sets aria-busy and blocks clicks while keeping focus on the button. */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      disabled={disabled || loading}
      focusableWhenDisabled={loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden="true" className="animate-spin" />}
      {children}
    </ButtonPrimitive>
  );
}

const iconButtonVariants = cva(`${base} active:scale-96`, {
  variants: {
    variant: {
      secondary:
        "border-border bg-surface-card text-body shadow-(--shadow-xs) hover:bg-surface-hover",
      ghost: "text-sub hover:bg-surface-sunken",
      primary:
        "bg-primary text-primary-foreground shadow-(--shadow-btn-dark) hover:bg-primary-hover",
      brand:
        "bg-brand text-on-color shadow-(--shadow-btn-brand) hover:bg-brand-hover",
      danger: "bg-danger-bg text-danger-fg hover:bg-danger-soft-hover",
    },
    size: {
      sm: "size-control-sm rounded-sm [&_svg]:size-4",
      md: "size-control-md rounded-md [&_svg]:size-5",
      lg: "size-control-lg rounded-lg [&_svg]:size-5.5",
      counter: "size-control-counter rounded-lg [&_svg]:size-6",
    },
  },
  defaultVariants: { variant: "secondary", size: "md" },
});

type IconButtonProps = Omit<ButtonPrimitive.Props, "children"> &
  VariantProps<typeof iconButtonVariants> & {
    icon: LucideIcon;
    /** Accessible name; also shown as the native tooltip. Required: the button has no text. */
    label: string;
  };

function IconButton({
  className,
  variant,
  size,
  icon: Icon,
  label,
  ...props
}: IconButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="icon-button"
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ variant, size, className }))}
      {...props}
    >
      <Icon aria-hidden="true" />
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants, IconButton };
