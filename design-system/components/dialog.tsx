"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@ds/lib/cn";
import { IconButton } from "./button";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Actions row, primary action last (e.g. Cancelar, Registrar sangria). */
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/** Modal dialog: focus trap, Escape, backdrop click and focus return come from Base UI. */
function Dialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  className,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-overlay backdrop-blur-xs transition-opacity duration-(--dur-base) data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup
          data-slot="dialog"
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-120 -translate-x-1/2 -translate-y-1/2 flex-col overflow-auto rounded-dialog bg-surface-card text-body shadow-(--shadow-xl) transition-[opacity,scale] duration-(--dur-base) data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0",
            className,
          )}
        >
          <div className="flex items-start gap-3 px-5 pt-5">
            <div className="flex flex-1 flex-col gap-1">
              <DialogPrimitive.Title className="text-h3 font-medium text-strong">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-body-md text-sub">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              render={
                <IconButton icon={X} label="Fechar" variant="ghost" size="sm" />
              }
            />
          </div>
          <div className="p-5">{children}</div>
          {footer && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border-soft px-5 py-4">
              {footer}
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { Dialog };
