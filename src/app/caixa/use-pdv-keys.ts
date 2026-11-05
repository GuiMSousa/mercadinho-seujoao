"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";
import type { CashDialogKind } from "./cash-dialogs";

const CASH_KEYS: Record<string, CashDialogKind> = {
  F4: "close",
  F8: "BLEED",
  F9: "SUPPLY",
};

const isTextField = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest("input, textarea, select, [contenteditable='true']") !== null;

/**
 * Counter shortcuts (F1 search, F2 payment, F4/F8/F9 cash, Esc clear) and the scanner guard.
 * `active` is false while a dialog is open (it handles its own keys) or the cash is closed.
 */
export function usePdvKeys({
  active,
  searchRef,
  onCheckout,
  onCash,
  onType,
  onClear,
}: {
  active: boolean;
  searchRef: RefObject<HTMLInputElement | null>;
  onCheckout: () => void;
  onCash: (kind: CashDialogKind) => void;
  onType: (key: string) => void;
  onClear: () => void;
}) {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const cashKey = CASH_KEYS[event.key];
    if (event.key === "F1" || event.key === "F2" || cashKey) {
      // Keeps the browser's own action for these keys (help, find and others) from running.
      event.preventDefault();
      if (!active) return;
      if (event.key === "F1") searchRef.current?.focus();
      else if (event.key === "F2") onCheckout();
      else onCash(cashKey);
      return;
    }
    if (!active) return;
    if (event.key === "Escape") {
      onClear();
      searchRef.current?.focus();
      return;
    }
    // A scanner types into whatever has focus, and a cart button would take its Enter as a click.
    const printable =
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey;
    if (printable && !isTextField(event.target)) {
      event.preventDefault();
      onType(event.key);
      searchRef.current?.focus();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
