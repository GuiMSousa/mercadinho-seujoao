"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { IconButton } from "@ds/components/button";
import { SidebarContent, type ShellProps } from "./sidebar";

/** Below 900 px the sidebar lives in a modal side drawer (focus trap, Escape and focus return from Base UI). */
export function MobileDrawer(props: ShellProps) {
  const [open, setOpen] = useState(false);
  // The desktop sidebar takes over at 900 px, so a drawer left open would be a stray modal.
  useEffect(() => {
    // Same value as the `shell:` variant: --breakpoint-shell in design-system/tokens.css.
    const width =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--breakpoint-shell")
        .trim() || "56.25rem";
    const media = window.matchMedia(`(min-width: ${width})`);
    const close = () => media.matches && setOpen(false);
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <IconButton
        variant="ghost"
        icon={Menu}
        label="Abrir menu"
        className="shell:hidden"
        onClick={() => setOpen(true)}
      />
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-overlay backdrop-blur-xs transition-opacity duration-(--dur-base) data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex w-62 flex-col max-w-[calc(100%-2rem)] bg-surface-card shadow-(--shadow-xl) transition-transform duration-(--dur-base) data-ending-style:-translate-x-full data-starting-style:-translate-x-full">
          <DialogPrimitive.Title className="sr-only">
            Menu
          </DialogPrimitive.Title>
          <div className="flex justify-end px-3 pt-3">
            <DialogPrimitive.Close
              render={
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={X}
                  label="Fechar menu"
                />
              }
            />
          </div>
          <div className="min-h-0 flex-1">
            <SidebarContent {...props} onNavigate={() => setOpen(false)} />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
