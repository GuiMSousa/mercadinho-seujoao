"use client";

import type { KeyboardEvent, ReactNode, Ref } from "react";
import { Input } from "@ds/components/input";
import { Keypad } from "@ds/components/keypad";
import { pressKey, type KeypadKey } from "@ds/lib/keypad";

type KeypadFieldProps = {
  label: string;
  /** Digits typed so far, in the field's smallest unit (cents, grams, units). */
  value: string;
  onChange: (value: string) => void;
  /** Digits to what the field shows, e.g. "1250" → "12,50". */
  format: (value: string) => string;
  maxLength: number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  error?: ReactNode;
  /** Shown while nothing is typed, e.g. the amount an empty field stands for. */
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
};

/**
 * A counter amount typed on the touch keypad or on a physical keyboard. The field shows the
 * formatted value and never opens the phone keyboard; Enter submits the surrounding form.
 */
export function KeypadField({
  label,
  value,
  onChange,
  format,
  maxLength,
  prefix,
  suffix,
  error,
  placeholder,
  inputRef,
}: KeypadFieldProps) {
  // Listens on the wrapper so digits still count after a keypad tap moved the focus to a key.
  function onKeyDown(event: KeyboardEvent) {
    const key: KeypadKey | null =
      event.key === "Backspace"
        ? "del"
        : /^\d$/.test(event.key)
          ? (event.key as KeypadKey)
          : null;
    if (!key) return;
    event.preventDefault();
    onChange(pressKey(value, key, maxLength));
  }

  return (
    <div className="flex flex-col gap-3" onKeyDown={onKeyDown}>
      <Input
        ref={inputRef}
        label={label}
        size="counter"
        numeric
        inputMode="none"
        autoComplete="off"
        value={value === "" && placeholder ? "" : format(value)}
        placeholder={placeholder}
        // Typing goes through onKeyDown; anything else (letters, paste) is ignored.
        onChange={() => undefined}
        prefix={prefix}
        suffix={suffix}
        error={error}
      />
      <Keypad
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        label={`Teclado numérico: ${label}`}
      />
    </div>
  );
}
