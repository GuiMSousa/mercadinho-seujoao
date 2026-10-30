"use client";

import type { ComponentProps } from "react";
import { Input } from "@ds/components/input";

type CodeInputProps = Omit<
  ComponentProps<typeof Input>,
  "onChange" | "value" | "type"
> & {
  value: string;
  onValueChange: (value: string) => void;
};

/** Six-digit verification code field; keeps only digits and spaces the digits out. */
export function CodeInput({ value, onValueChange, ...props }: CodeInputProps) {
  return (
    <Input
      name="code"
      label="Código de verificação"
      size="lg"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="000000"
      className="[&_input]:text-counter [&_input]:tracking-code [&_input]:tabular-nums"
      value={value}
      onChange={(event) => onValueChange(event.target.value.replace(/\D/g, ""))}
      {...props}
    />
  );
}
