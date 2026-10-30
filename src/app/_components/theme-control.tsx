"use client";

import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import type { ThemeChoice } from "@/contracts/theme";
import { IconButton } from "@ds/components/button";
import { useToast } from "@ds/components/toast";

const DARK_QUERY = "(prefers-color-scheme: dark)";

// The server writes data-theme on <html> from the cookie; no attribute means "follow the system".
function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", notify);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", notify);
  };
}

function currentChoice(): ThemeChoice {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : "system";
}

function isDark() {
  const choice = currentChoice();
  return (
    choice === "dark" || (choice === "system" && matchMedia(DARK_QUERY).matches)
  );
}

const options: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
];

/**
 * Saves the theme in a cookie (POST /api/theme) and refreshes so the server re-renders <html>.
 * `initialTheme` (from getTheme() on the server) keeps the first client render equal to the server one.
 */
export function ThemeControl({
  variant,
  initialTheme,
}: {
  variant: "icon" | "radios";
  initialTheme?: "light" | "dark";
}) {
  const labelId = useId();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  // Requests run one at a time and a superseded choice is skipped, so the last click always wins.
  const queue = useRef<Promise<void>>(Promise.resolve());
  const latest = useRef<ThemeChoice | null>(null);
  const dark = useSyncExternalStore(
    subscribe,
    isDark,
    () => initialTheme === "dark",
  );
  const choice = useSyncExternalStore<ThemeChoice>(
    subscribe,
    currentChoice,
    () => initialTheme ?? "system",
  );

  async function send(theme: ThemeChoice) {
    if (latest.current !== theme) return;
    setPending(true);
    try {
      const response = await fetch("/api/theme", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (!response.ok) throw new Error(String(response.status));
      if (latest.current === theme) router.refresh();
    } catch {
      toast({
        title: "Não foi possível mudar o tema",
        message: "Tente novamente.",
        tone: "danger",
      });
    } finally {
      if (latest.current === theme) setPending(false);
    }
  }

  function choose(theme: ThemeChoice) {
    latest.current = theme;
    queue.current = queue.current.then(() => send(theme));
  }

  if (variant === "icon") {
    return (
      <IconButton
        variant="ghost"
        icon={dark ? Sun : Moon}
        label={dark ? "Modo claro" : "Modo escuro"}
        disabled={pending}
        focusableWhenDisabled
        onClick={() => choose(dark ? "light" : "dark")}
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} className="text-body-sm font-medium text-strong">
        Aparência
      </span>
      <RadioGroup
        aria-labelledby={labelId}
        value={choice}
        onValueChange={(value) => choose(value as ThemeChoice)}
        className="inline-flex gap-1 self-start rounded-lg bg-surface-sunken p-1"
      >
        {options.map((option) => (
          <Radio.Root
            key={option.value}
            value={option.value}
            className="inline-flex h-control-sm cursor-pointer touch-manipulation items-center justify-center rounded-md px-3.5 text-body-md font-medium whitespace-nowrap text-sub transition-colors duration-(--dur-base) data-checked:bg-primary data-checked:text-inverse data-checked:shadow-(--shadow-btn-dark)"
          >
            {option.label}
          </Radio.Root>
        ))}
      </RadioGroup>
    </div>
  );
}
