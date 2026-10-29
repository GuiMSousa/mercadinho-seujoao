import { cn } from "@ds/lib/cn";
import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Label } from "./label";

type FieldProps = {
  /** id of the control; the label points at it and the message gets `${id}-message`. */
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  /** Replaces the hint and marks the control invalid (pass `aria-invalid` on the control). */
  error?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Message id for aria-describedby, or undefined when there is no hint or error. */
function fieldMessageId(id: string, hint?: ReactNode, error?: ReactNode) {
  return error || hint ? `${id}-message` : undefined;
}

/** Label, control and hint/error stacked; shared by Input and Select. */
function Field({ id, label, hint, error, className, children }: FieldProps) {
  const messageId = fieldMessageId(id, hint, error);
  return (
    <div
      data-slot="field"
      className={cn("flex min-w-0 flex-col gap-1.5", className)}
    >
      {label && <Label htmlFor={id}>{label}</Label>}
      {children}
      {messageId && (
        <p
          id={messageId}
          className={cn(
            "flex items-center gap-1 text-body-md",
            error ? "text-danger-fg" : "text-sub",
          )}
        >
          {error && (
            <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          )}
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/** Box styles shared by text inputs and selects: border, halo on focus, error and disabled. */
const controlBox =
  "border border-border bg-surface-card text-strong shadow-(--shadow-xs) transition-[border-color,box-shadow] duration-(--dur-fast) focus-within:border-focus focus-within:ring-3 focus-within:ring-focus-halo data-invalid:border-danger-solid data-invalid:focus-within:ring-focus-halo-danger has-disabled:cursor-not-allowed has-disabled:bg-surface-sunken has-disabled:text-disabled has-disabled:shadow-none";

const controlSizes = {
  sm: "h-control-sm rounded-control px-3 text-body-md",
  md: "h-control-md rounded-control px-3 text-body-lg",
  lg: "h-control-lg rounded-lg px-3 text-body-lg",
  counter: "h-control-counter rounded-lg px-4 text-counter font-medium",
} as const;

type ControlSize = keyof typeof controlSizes;

export { Field, fieldMessageId, controlBox, controlSizes, type ControlSize };
