"use client";

import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@ds/lib/cn";
import {
  Field,
  controlBox,
  controlSizes,
  fieldMessageId,
  type ControlSize,
} from "./field";

type InputProps = Omit<React.ComponentProps<"input">, "size" | "prefix"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Inline text before the value, such as "R$". */
  prefix?: React.ReactNode;
  /** Inline text after the value, such as "un" or "kg". */
  suffix?: React.ReactNode;
  size?: ControlSize;
  /** Right-aligned tabular figures for amounts and quantities. */
  numeric?: boolean;
};

function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  size = "md",
  numeric = false,
  className,
  id,
  ...props
}: InputProps) {
  const fallbackId = React.useId();
  const inputId = id ?? fallbackId;
  return (
    <Field
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <div
        data-invalid={error ? "" : undefined}
        className={cn(
          controlBox,
          controlSizes[size],
          "flex items-center gap-2",
        )}
      >
        {prefix && <span className="text-sub tabular-nums">{prefix}</span>}
        <InputPrimitive
          id={inputId}
          data-slot="input"
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldMessageId(inputId, hint, error)}
          className={cn(
            "h-full w-full min-w-0 bg-transparent outline-hidden placeholder:text-soft disabled:cursor-not-allowed",
            numeric && "text-right tabular-nums",
          )}
          {...props}
        />
        {suffix && <span className="text-body-md text-sub">{suffix}</span>}
      </div>
    </Field>
  );
}

export { Input };
