"use client";

import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import type { ThemeChoice } from "@/contracts/theme";
import { Button, IconButton } from "@ds/components/button";

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

/** Saves the theme in a cookie (POST /api/theme) and refreshes so the server re-renders <html>. */
export function ThemeControl({ variant }: { variant: "icon" | "tabs" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  const choice = useSyncExternalStore<ThemeChoice>(
    subscribe,
    currentChoice,
    () => "system",
  );

  async function choose(theme: ThemeChoice) {
    setPending(true);
    try {
      const response = await fetch("/api/theme", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (response.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (variant === "icon") {
    return (
      <IconButton
        variant="ghost"
        icon={dark ? Sun : Moon}
        label={dark ? "Modo claro" : "Modo escuro"}
        disabled={pending}
        onClick={() => void choose(dark ? "light" : "dark")}
      />
    );
  }
  return (
    <div
      role="group"
      aria-label="Tema"
      className="inline-flex gap-1 rounded-lg bg-surface-sunken p-1"
    >
      {options.map(({ value, label }) => (
        <Button
          key={value}
          size="sm"
          variant={choice === value ? "secondary" : "ghost"}
          aria-pressed={choice === value}
          disabled={pending}
          onClick={() => void choose(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
