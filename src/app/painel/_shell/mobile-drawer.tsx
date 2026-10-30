"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { IconButton } from "@ds/components/button";
import { SidebarContent, type ShellProps } from "./sidebar";

/** Below 900 px the sidebar lives in a modal side drawer (focus trap, Escape and focus return from Base UI). */
export function MobileDrawer(props: ShellProps) {
  const [open, setOpen] = useState(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <IconButton
        variant="ghost"
        icon={Menu}
        label="Abrir menu"
        className="min-[56.25rem]:hidden"
        onClick={() => setOpen(true)}
      />
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-overlay backdrop-blur-xs transition-opacity duration-(--dur-base) data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 w-62 max-w-[calc(100%-2rem)] bg-surface-card shadow-(--shadow-xl) transition-transform duration-(--dur-base) data-ending-style:-translate-x-full data-starting-style:-translate-x-full">
          <DialogPrimitive.Title className="sr-only">
            Menu
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            render={
              <IconButton
                variant="ghost"
                size="sm"
                icon={X}
                label="Fechar menu"
                className="absolute top-3 right-3"
              />
            }
          />
          <SidebarContent {...props} onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
