"use client";

import { Delete } from "lucide-react";
import { cn } from "@ds/lib/cn";
import { KEYPAD_KEYS, pressKey } from "@ds/lib/keypad";

type KeypadProps = {
  /** Cents digit string ("1234" = R$ 12,34); convert with keypadCents(). */
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  /** Names the group for screen readers, e.g. "Valor recebido". */
  label?: string;
  className?: string;
};

/** Touch keypad for counter screens (troco, sangria, fechamento); keys are 72px tall. */
function Keypad({
  value,
  onChange,
  maxLength = 9,
  label = "Teclado numérico",
  className,
}: KeypadProps) {
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="keypad"
      className={cn("grid grid-cols-3 gap-2", className)}
    >
      {KEYPAD_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-label={key === "del" ? "Apagar" : undefined}
          onClick={() => onChange(pressKey(value, key, maxLength))}
          className={cn(
            "flex h-control-counter-lg cursor-pointer touch-manipulation items-center justify-center rounded-lg border border-border text-h2 font-medium text-strong tabular-nums shadow-(--shadow-xs) transition-[background-color,scale] duration-(--dur-fast) active:scale-97 active:bg-control-pressed",
            key === "del" || key === "00"
              ? "bg-surface-sunken"
              : "bg-surface-card",
          )}
        >
          {key === "del" ? (
            <Delete aria-hidden="true" className="size-6.5" />
          ) : (
            key
          )}
        </button>
      ))}
    </div>
  );
}

export { Keypad };
