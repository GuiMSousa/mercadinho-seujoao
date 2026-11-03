"use client";

import { useEffect, useState } from "react";
import { cn } from "@ds/lib/cn";

const WORDS = [
  "produto vencido.",
  "prateleira vazia.",
  "furo no caixa.",
  "margem no escuro.",
];
const STEP_MS = 1500;

/** Plays once and stops under 5 s, so it needs no pause control (WCAG 2.2.2). */
export function Rotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index === WORDS.length - 1) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setIndex(index + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <>
      <span className="sr-only">
        produto vencido, prateleira vazia, furo no caixa e margem no escuro.
      </span>
      {/* Every word shares one grid cell, so the longest one reserves the space. */}
      <span aria-hidden="true" className="grid text-brand">
        {WORDS.map((word, position) => (
          <span
            key={word}
            className={cn(
              "col-start-1 row-start-1 transition-[opacity,translate] duration-(--dur-slow)",
              position === index
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
          >
            {word}
          </span>
        ))}
      </span>
    </>
  );
}
