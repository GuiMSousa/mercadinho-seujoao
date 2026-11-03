"use client";

import { useState, type ReactNode } from "react";
import { Badge } from "@ds/components/badge";
import { Money } from "@ds/components/money";
import { Tabs } from "@ds/components/tabs";
import { cn } from "@ds/lib/cn";

const card =
  "flex flex-col rounded-card border border-border-soft bg-surface-card p-5 shadow-(--shadow-lg)";

function Stat({
  label,
  highlight,
  children,
}: {
  label: string;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg p-3",
        highlight ? "bg-success-bg" : "bg-surface-sunken",
      )}
    >
      <span
        className={cn(
          "text-body-sm",
          highlight ? "text-success-fg" : "text-sub",
        )}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t border-border-soft py-2.5">
      <span className="text-body-md">{label}</span>
      {children}
    </div>
  );
}

/** The "Perfis" section: switching profile shows what each one can see. */
export function ProfilePreview() {
  const [profile, setProfile] = useState("admin");
  const admin = profile === "admin";

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <div className="flex min-w-0 flex-col items-start gap-5">
        <p className="text-body-sm font-medium text-sub">
          Dois perfis, uma loja
        </p>
        <h2 className="text-section font-medium tracking-display text-balance text-strong">
          Cada um vê o que precisa ver.
        </h2>
        <p className="max-w-lg text-pretty">
          O administrador vê custos, margens, relatórios e o histórico do caixa.
          O operador de caixa vende, abre e fecha o caixa, e nunca vê custo,
          margem ou valor esperado.
        </p>
        <Tabs
          aria-label="Perfil"
          value={profile}
          onValueChange={setProfile}
          items={[
            { value: "admin", label: "Administrador" },
            { value: "operator", label: "Operador de caixa" },
          ]}
        />
      </div>

      <div
        role="tabpanel"
        aria-label={admin ? "Administrador" : "Operador de caixa"}
        className="flex w-full max-w-lg min-w-0 flex-col gap-4 justify-self-center"
      >
        <div className={cn(card, "gap-4")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-strong">
                Café torrado 500 g
              </span>
              <span className="text-body-sm text-sub tabular-nums">
                Código 7890000123457
              </span>
            </div>
            <Badge size="sm">Consulta de produto</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Preço de venda">
              <Money cents={1849} size="lg" />
            </Stat>
            <Stat label="Estoque">
              <span className="text-h2 font-medium text-strong tabular-nums">
                14 un
              </span>
            </Stat>
            {admin && (
              <>
                <Stat label="Custo médio">
                  <Money cents={1290} size="lg" />
                </Stat>
                <Stat label="Margem" highlight>
                  <span className="text-h2 font-medium text-success-fg tabular-nums">
                    30,2%
                  </span>
                </Stat>
              </>
            )}
          </div>
        </div>

        <div className={cn(card, "gap-1")}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-strong">Caixa 01</span>
              <span className="text-body-sm text-sub">Aberto às 07:58</span>
            </div>
            <Badge tone="success" size="sm" dot>
              Aberto
            </Badge>
          </div>
          <Line label="Troco inicial">
            <Money cents={15000} size="sm" />
          </Line>
          <Line label="Sangrias">
            <Money cents={-50000} size="sm" tone="out" />
          </Line>
          {admin && (
            <Line label="Esperado em caixa">
              <Money cents={149000} size="sm" />
            </Line>
          )}
        </div>
        <p aria-live="polite" className="text-center text-body-md text-sub">
          {admin
            ? "Visão do administrador: tudo, incluindo custo e margem."
            : "Visão do operador: custo, margem e valor esperado não aparecem."}
        </p>
      </div>
    </div>
  );
}
