import * as React from "react";
import { cn } from "@ds/lib/cn";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-body-lg font-medium text-strong select-none peer-disabled:cursor-not-allowed peer-disabled:text-disabled",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
