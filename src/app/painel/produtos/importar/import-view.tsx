"use client";

import { ArrowLeft, Download, FileUp } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type DragEvent } from "react";
import type { ProductImportResult } from "@/contracts/product-import";
import { FormAlert } from "@/app/(auth)/form-alert";
import type { FormErrors } from "@/app/(auth)/auth-client";
import { Button, buttonVariants } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Table, type TableColumn } from "@ds/components/table";
import { cn } from "@ds/lib/cn";
import { apiFetch } from "../../_lib/api";

const MAX_BYTES = 2_000_000;
const TEMPLATE = [
  "nome;codigo_barras;categoria;preco_custo;preco_venda;unidade;estoque_minimo",
  "Café 500 g;7891234567890;Mercearia;12,90;18,49;UN;6",
  "Banana prata;00123;Hortifrúti;4,00;6,99;KG;2,500",
].join("\r\n");

/** UTF-8 when the file is valid UTF-8; otherwise Windows-1252, the encoding older Excel saves. */
async function readText(file: File) {
  const bytes = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

type LineError = { line: number; message: string };

const errorColumns: TableColumn<LineError>[] = [
  { key: "line", label: "Linha", render: (row) => row.line },
  {
    key: "message",
    label: "Problema",
    wrap: true,
    render: (row) => row.message,
  },
];

/** Upload of a product spreadsheet: all lines go in, or none, with every problem by line. */
export function ImportView() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [result, setResult] = useState<ProductImportResult | null>(null);
  const lineErrors: LineError[] = Object.entries(errors?.fields ?? {})
    .filter(([line]) => /^\d+$/.test(line))
    .map(([line, message]) => ({ line: Number(line), message }))
    .sort((a, b) => a.line - b.line);

  function choose(next: File | undefined) {
    setResult(null);
    setErrors(null);
    if (!next) return setFile(null);
    if (next.size > MAX_BYTES)
      return setErrors({
        error: "Arquivo grande demais: use até 2 MB.",
        fields: {},
      });
    setFile(next);
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  }

  async function upload() {
    if (!file)
      return setErrors({ error: "Escolha o arquivo CSV.", fields: {} });
    setPending(true);
    setErrors(null);
    const response = await apiFetch<ProductImportResult>(
      "/api/admin/products/import",
      { method: "POST", body: { csv: await readText(file) } },
    );
    setPending(false);
    if (!response.ok) return setErrors(response.errors);
    setResult(response.data);
    setFile(null);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="mx-auto flex max-w-200 flex-col gap-6">
      <Link
        href="/painel/produtos"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "self-start",
        )}
      >
        <ArrowLeft aria-hidden="true" />
        Produtos
      </Link>
      <Card
        title="Importar produtos"
        subtitle="Planilha CSV, separada por ponto e vírgula ou vírgula."
      >
        <div className="flex flex-col gap-4 text-body-lg text-body">
          <p>
            Colunas: <strong>nome</strong>, <strong>codigo_barras</strong>,{" "}
            <strong>categoria</strong>, <strong>preco_custo</strong>,{" "}
            <strong>preco_venda</strong>, <strong>unidade</strong> (UN, KG ou L)
            e <strong>estoque_minimo</strong>. Um código de barras que já existe
            atualiza o produto; os outros viram produtos novos, e categorias que
            faltam são criadas. Se alguma linha tiver problema, nada é gravado.
          </p>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${TEMPLATE}`)}`}
            download="modelo-produtos.csv"
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "self-start",
            )}
          >
            <Download aria-hidden="true" />
            Baixar modelo
          </a>
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed border-border-strong p-8 text-center text-sub transition-colors duration-(--dur-fast) focus-within:border-focus focus-within:ring-3 focus-within:ring-focus-halo hover:bg-surface-hover",
              dragging && "border-focus bg-selected-bg",
            )}
          >
            <FileUp aria-hidden="true" className="size-8" />
            <span className="font-medium text-strong">
              {file
                ? file.name
                : "Arraste o arquivo CSV aqui ou clique para escolher"}
            </span>
            <span className="text-body-md">Até 2 MB e 5.000 produtos.</span>
            <input
              ref={input}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => choose(event.target.files?.[0])}
            />
          </label>
          <FormAlert message={errors?.error} />
          {result && (
            <p
              role="status"
              className="rounded-lg bg-success-bg px-4 py-3 text-success-fg"
            >
              Importação concluída: {result.inserted} produtos novos,{" "}
              {result.updated} alterados e {result.categoriesCreated} categorias
              criadas.
            </p>
          )}
          <Button
            className="self-start"
            loading={pending}
            disabled={!file}
            focusableWhenDisabled
            onClick={() => void upload()}
          >
            Importar produtos
          </Button>
        </div>
      </Card>
      {lineErrors.length > 0 && (
        <Card title="Linhas com problema" flush>
          <Table
            caption="Linhas com problema"
            columns={errorColumns}
            rows={lineErrors}
            rowKey={(row) => String(row.line)}
            empty=""
          />
        </Card>
      )}
    </div>
  );
}
