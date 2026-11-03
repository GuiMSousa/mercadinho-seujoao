"use client";

import { Button } from "@ds/components/button";
import { Card } from "@ds/components/card";

/** A screen of the panel failed to load (usually the database); the shell stays usable. */
export default function PanelError({ retry }: { retry: () => void }) {
  return (
    <div className="mx-auto max-w-lg">
      <Card title="Não foi possível carregar esta tela">
        <div className="flex flex-col items-start gap-4">
          <p className="text-sub">
            Nenhum dado foi alterado. Confira a conexão e tente novamente.
          </p>
          <Button onClick={() => retry()}>Tentar novamente</Button>
        </div>
      </Card>
    </div>
  );
}
