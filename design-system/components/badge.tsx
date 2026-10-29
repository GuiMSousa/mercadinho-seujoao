import type { ComponentProps } from "react";
import { cn } from "@ds/lib/cn";

const tones = {
  success: ["bg-success-bg text-success-fg", "bg-success-solid"],
  danger: ["bg-danger-bg text-danger-fg", "bg-danger-solid"],
  warning: ["bg-warning-bg text-warning-fg", "bg-warning-solid"],
  info: ["bg-info-bg text-info-fg", "bg-info-solid"],
  neutral: ["bg-neutral-bg text-neutral-fg", "bg-neutral-solid"],
} as const;

type BadgeProps = ComponentProps<"span"> & {
  tone?: keyof typeof tones;
  /** Status dot; decorative, so the text must carry the meaning on its own. */
  dot?: boolean;
  size?: "sm" | "md";
};

function Badge({
  tone = "neutral",
  dot = false,
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  const [colors, dotColor] = tones[tone];
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "h-5 px-2 text-caption" : "h-6 px-2.5 text-body-sm",
        colors,
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", dotColor)}
        />
      )}
      {children}
    </span>
  );
}

export { Badge };
