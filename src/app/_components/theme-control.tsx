"use client";

import { Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import type { ThemeChoice } from "@/contracts/theme";
import { IconButton } from "@ds/components/button";
import { Tabs } from "@ds/components/tabs";
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
  variant: "icon" | "tabs";
  initialTheme?: "light" | "dark";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
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

  async function choose(theme: ThemeChoice) {
    setPending(true);
    try {
      const response = await fetch("/api/theme", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (!response.ok) throw new Error(String(response.status));
      router.refresh();
    } catch {
      toast({ title: "Não foi possível mudar o tema.", tone: "danger" });
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
    <Tabs
      aria-label="Tema"
      items={options}
      value={choice}
      onValueChange={(value) => void choose(value as ThemeChoice)}
    />
  );
}
