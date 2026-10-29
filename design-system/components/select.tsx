"use client";

import * as React from "react";
import { cn } from "@ds/lib/cn";
import { ChevronDown } from "lucide-react";
import {
  Field,
  controlBox,
  controlSizes,
  fieldMessageId,
  type ControlSize,
} from "./field";

type SelectOption = { value: string; label: string };

type SelectProps = Omit<React.ComponentProps<"select">, "size" | "children"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  options: SelectOption[];
  /** Disabled first option shown while nothing is chosen (use with defaultValue=""). */
  placeholder?: string;
  size?: ControlSize;
};

/** Native select: keyboard, mobile pickers and form submission come from the browser. */
function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  size = "md",
  className,
  id,
  ...props
}: SelectProps) {
  const fallbackId = React.useId();
  const selectId = id ?? fallbackId;
  return (
    <Field
      id={selectId}
      label={label}
      hint={hint}
      error={error}
      className={className}
    >
      <div
        data-invalid={error ? "" : undefined}
        className={cn(controlBox, controlSizes[size], "relative px-0")}
      >
        <select
          id={selectId}
          data-slot="select"
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldMessageId(selectId, hint, error)}
          className="size-full cursor-pointer appearance-none bg-transparent pr-9 pl-3 outline-hidden disabled:cursor-not-allowed"
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-sub"
        />
      </div>
    </Field>
  );
}

export { Select, type SelectOption };
