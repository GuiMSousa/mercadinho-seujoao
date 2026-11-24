"use client";

import { ScanBarcode } from "lucide-react";
import type { Ref } from "react";
import { CameraScanButton } from "@/app/_components/camera-scanner";
import { Input } from "@ds/components/input";

/** The sale screen's code field: USB scanner or typing (Enter submits), or the camera. */
export function ScanField({
  ref,
  value,
  onChange,
  onSubmit,
  onCode,
  onScanningChange,
}: {
  ref: Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** A whole code read by the camera: the same path as a USB scan and Enter. */
  onCode: (code: string) => void;
  onScanningChange: (scanning: boolean) => void;
}) {
  return (
    <form
      role="search"
      noValidate
      onSubmit={(event) => {
        // The scanner's Enter lands here and never submits anything else.
        event.preventDefault();
        onSubmit();
      }}
      className="flex items-end gap-2"
    >
      <Input
        className="min-w-0 flex-1"
        ref={ref}
        size="counter"
        label="Código de barras ou nome do produto (F1)"
        aria-keyshortcuts="F1"
        name="search"
        autoComplete="off"
        enterKeyHint="enter"
        maxLength={120}
        placeholder="Bipe o código ou digite o nome"
        prefix={<ScanBarcode aria-hidden="true" className="size-6" />}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <CameraScanButton onOpenChange={onScanningChange} onCode={onCode} />
    </form>
  );
}
