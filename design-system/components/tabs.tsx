"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@ds/lib/cn";

type TabItem = { value: string; label: string; count?: number };

type TabsProps = {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  /** Names the tab list for screen readers (e.g. "Tema"). */
  "aria-label": string;
  className?: string;
};

/** Segmented control. Arrow keys, Home/End and roving focus come from Base UI. */
function Tabs({
  items,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  className,
}: TabsProps) {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
    >
      <TabsPrimitive.List
        aria-label={ariaLabel}
        data-slot="tabs"
        className={cn(
          "inline-flex gap-1 rounded-lg bg-surface-sunken p-1",
          className,
        )}
      >
        {items.map((item) => (
          <TabsPrimitive.Tab
            key={item.value}
            value={item.value}
            className="inline-flex h-control-sm cursor-pointer touch-manipulation items-center justify-center gap-2 rounded-md px-3.5 text-body-md font-medium whitespace-nowrap text-sub transition-colors duration-(--dur-base) data-active:bg-primary data-active:text-inverse data-active:shadow-(--shadow-btn-dark)"
          >
            {item.label}
            {item.count !== undefined && (
              <span className="rounded-full bg-control-soft px-1.5 text-caption text-sub in-data-active:bg-surface-hover in-data-active:text-strong">
                {item.count}
              </span>
            )}
          </TabsPrimitive.Tab>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}

export { Tabs };
