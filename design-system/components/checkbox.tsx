"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "@ds/lib/cn";
import { Check, Minus } from "lucide-react";
import type { ReactNode } from "react";

type CheckboxProps = CheckboxPrimitive.Root.Props & {
  /** Visible label; without it, pass aria-label. */
  label?: ReactNode;
};

function Checkbox({ label, className, ...props }: CheckboxProps) {
  const box = (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-xs border border-sub bg-surface-card text-on-color transition-colors duration-(--dur-fast) data-checked:border-brand data-checked:bg-brand data-disabled:cursor-not-allowed data-disabled:border-border data-disabled:bg-surface-sunken data-disabled:text-disabled data-indeterminate:border-brand data-indeterminate:bg-brand data-invalid:border-danger-solid",
        !label && className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className="flex data-unchecked:hidden"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? (
              <Minus aria-hidden="true" className="size-3" strokeWidth={3} />
            ) : (
              <Check aria-hidden="true" className="size-3" strokeWidth={3} />
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
  if (!label) return box;
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 text-body has-data-disabled:cursor-not-allowed has-data-disabled:text-disabled",
        className,
      )}
    >
      {box}
      {label}
    </label>
  );
}

export { Checkbox };
