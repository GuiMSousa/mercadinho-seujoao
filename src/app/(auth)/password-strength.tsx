import { cn } from "@ds/lib/cn";

export const STRENGTH_LABELS = ["", "Fraca", "Média", "Forte"] as const;

/** +1 for 8+ characters, +1 for letters and digits, +1 for a symbol or 12+ characters. */
export function passwordScore(password: string): 0 | 1 | 2 | 3 {
  let score = 0;
  if (password.length >= 8) score++;
  if (/\p{L}/u.test(password) && /\d/.test(password)) score++;
  if (/[^\p{L}\d]/u.test(password) || password.length >= 12) score++;
  return score as 0 | 1 | 2 | 3;
}

const barColor = [
  "",
  "bg-danger-solid",
  "bg-warning-solid",
  "bg-success-solid",
];

/** Three-segment meter; the label is text so the strength is not conveyed by color alone. */
export function PasswordStrength({ password }: { password: string }) {
  const score = passwordScore(password);
  return (
    <div className="flex items-center gap-2" aria-live="polite">
      {[1, 2, 3].map((segment) => (
        <span
          key={segment}
          aria-hidden="true"
          className={cn(
            "h-1 flex-1 rounded-xs",
            score >= segment ? barColor[score] : "bg-border",
          )}
        />
      ))}
      <span className="w-14 text-right text-caption text-sub">
        {password && <span className="sr-only">Força da senha: </span>}
        {STRENGTH_LABELS[score]}
      </span>
    </div>
  );
}
