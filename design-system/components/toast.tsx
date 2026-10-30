"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@ds/lib/cn";

type ToastTone = "success" | "danger" | "warning" | "info";

type ToastInput = { title: string; message?: string; tone: ToastTone };

const tones = {
  success: { icon: CheckCircle2, color: "text-success-solid" },
  danger: { icon: AlertCircle, color: "text-danger-solid" },
  warning: { icon: AlertTriangle, color: "text-warning-solid" },
  info: { icon: Info, color: "text-info-solid" },
} as const;

const TIMEOUT_MS = 3600;

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();
  return toasts.map((item) => {
    const { icon: Icon, color } = tones[item.type as ToastTone] ?? tones.info;
    return (
      <ToastPrimitive.Root
        key={item.id}
        toast={item}
        className="pointer-events-auto flex w-full items-start gap-3 rounded-lg bg-primary px-3.5 py-3 text-inverse shadow-(--shadow-xl) transition-[opacity,translate] duration-(--dur-base) data-ending-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0"
      >
        <Icon
          aria-hidden="true"
          className={cn("mt-px size-5 shrink-0", color)}
        />
        <ToastPrimitive.Content className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ToastPrimitive.Title className="text-body-md font-medium" />
          <ToastPrimitive.Description className="text-body-sm text-inverse-sub" />
        </ToastPrimitive.Content>
        <ToastPrimitive.Close
          aria-label="Fechar"
          className="flex shrink-0 cursor-pointer rounded-xs text-inverse-sub"
        >
          <X aria-hidden="true" className="size-4" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    );
  });
}

/** Wraps the app once; renders the viewport (bottom on mobile, bottom-right on desktop). */
function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <ToastPrimitive.Provider timeout={TIMEOUT_MS}>
      {children}
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:left-auto sm:w-96">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}

function useToast() {
  const manager = ToastPrimitive.useToastManager();
  return {
    toast: ({ title, message, tone }: ToastInput) =>
      manager.add({
        title,
        description: message,
        type: tone,
        timeout: TIMEOUT_MS,
      }),
  };
}

export { ToastProvider, useToast };
