// Class names are listed literally so Tailwind can find them.
const colorGroups: { title: string; swatches: [string, string][] }[] = [
  {
    title: "Superfícies",
    swatches: [
      ["app", "bg-app"],
      ["surface-card", "bg-surface-card"],
      ["surface-sunken", "bg-surface-sunken"],
      ["surface-hover", "bg-surface-hover"],
      ["overlay", "bg-overlay"],
    ],
  },
  {
    title: "Texto",
    swatches: [
      ["strong", "bg-strong"],
      ["body", "bg-body"],
      ["sub", "bg-sub"],
      ["soft", "bg-soft"],
      ["disabled", "bg-disabled"],
      ["link", "bg-link"],
    ],
  },
  {
    title: "Ações",
    swatches: [
      ["primary", "bg-primary"],
      ["brand", "bg-brand"],
      ["destructive", "bg-destructive"],
      ["control-soft", "bg-control-soft"],
      ["selected-bg", "bg-selected-bg"],
      ["focus", "bg-focus"],
    ],
  },
  {
    title: "Status",
    swatches: [
      ["success-solid", "bg-success-solid"],
      ["warning-solid", "bg-warning-solid"],
      ["danger-solid", "bg-danger-solid"],
      ["info-solid", "bg-info-solid"],
      ["neutral-solid", "bg-neutral-solid"],
    ],
  },
  {
    title: "Domínio",
    swatches: [
      ["money-in", "bg-money-in"],
      ["money-out", "bg-money-out"],
      ["money-margin", "bg-money-margin"],
      ["expiry-ok", "bg-expiry-ok"],
      ["expiry-soon", "bg-expiry-soon"],
      ["expiry-expired", "bg-expiry-expired"],
    ],
  },
];

const typeScale: [string, string][] = [
  ["display · 40/48", "text-display tracking-display"],
  ["h1 · 32/40", "text-h1 tracking-tight"],
  ["h2 · 24/32", "text-h2 tracking-tight"],
  ["h3 · 18/24", "text-h3"],
  ["body-lg · 16/24 (base)", "text-body-lg"],
  ["body-md · 14/20", "text-body-md"],
  ["body-sm · 13/18", "text-body-sm"],
  ["caption · 12/16", "text-caption"],
  ["counter · 22/28", "text-counter"],
];

const radii: [string, string][] = [
  ["xs · 6", "rounded-xs"],
  ["sm · 8", "rounded-sm"],
  ["control · 10", "rounded-control"],
  ["lg · 12", "rounded-lg"],
  ["card · 16", "rounded-card"],
  ["dialog · 20", "rounded-dialog"],
  ["full", "rounded-full"],
];

const shadows: [string, string][] = [
  ["xs", "shadow-(--shadow-xs)"],
  ["sm", "shadow-(--shadow-sm)"],
  ["md", "shadow-(--shadow-md)"],
  ["lg", "shadow-(--shadow-lg)"],
  ["xl", "shadow-(--shadow-xl)"],
];

export function TokensSection() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {colorGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-3">
            <h3 className="text-body-lg font-medium text-strong">
              {group.title}
            </h3>
            <ul className="flex flex-col gap-2">
              {group.swatches.map(([name, className]) => (
                <li key={name} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`size-8 shrink-0 rounded-sm border border-border ${className}`}
                  />
                  <code className="text-body-md">{name}</code>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-body-lg font-medium text-strong">Tipografia</h3>
        <ul className="flex flex-col gap-2">
          {typeScale.map(([name, className]) => (
            <li
              key={name}
              className="flex flex-wrap items-baseline gap-x-4 text-strong"
            >
              <span className={className}>Caixa aberto</span>
              <code className="text-body-sm text-sub">{name}</code>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-body-lg font-medium text-strong">Raios</h3>
          <ul className="flex flex-wrap gap-4">
            {radii.map(([name, className]) => (
              <li key={name} className="flex flex-col items-center gap-1">
                <span
                  aria-hidden="true"
                  className={`size-14 border border-border-strong bg-surface-sunken ${className}`}
                />
                <code className="text-caption text-sub">{name}</code>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-body-lg font-medium text-strong">Sombras</h3>
          <ul className="flex flex-wrap gap-4">
            {shadows.map(([name, className]) => (
              <li key={name} className="flex flex-col items-center gap-1">
                <span
                  aria-hidden="true"
                  className={`size-14 rounded-lg bg-surface-card ${className}`}
                />
                <code className="text-caption text-sub">{name}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
