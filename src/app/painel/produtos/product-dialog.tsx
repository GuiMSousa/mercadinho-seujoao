"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  UNIT_LOCKED_MESSAGE,
  type CategoryRow,
  type ProductRow,
} from "@/contracts/inventory";
import type { SupplierOption } from "@/contracts/suppliers";
import { FormAlert } from "@/app/(auth)/form-alert";
import { useFocusOnError, type FormErrors } from "@/app/(auth)/auth-client";
import { Button } from "@ds/components/button";
import { Checkbox } from "@ds/components/checkbox";
import { Dialog } from "@ds/components/dialog";
import { Input } from "@ds/components/input";
import { Select } from "@ds/components/select";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";
import {
  centsToInput,
  parseCents,
  parseQuantity,
  productPatch,
  quantityToInput,
  unitSuffix,
  type Unit,
} from "./product-form";

const FORM_ID = "product-form";
const unitOptions = [
  { value: "UN", label: "Unidade" },
  { value: "KG", label: "Quilo" },
  { value: "L", label: "Litro" },
];

/** New product (product = null) or edit. */
export function ProductDialog({
  product,
  categories,
  suppliers,
  onClose,
  onSaved,
}: {
  product: ProductRow | null;
  categories: CategoryRow[];
  suppliers: SupplierOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [unit, setUnit] = useState<Unit>(product?.unit ?? "UN");
  const [cost, setCost] = useState(
    product ? centsToInput(product.costPrice) : "",
  );
  const [sell, setSell] = useState(
    product ? centsToInput(product.sellPrice) : "",
  );
  const [minStock, setMinStock] = useState(
    product ? quantityToInput(product.minStock, product.unit) : "0",
  );
  const [active, setActive] = useState(product?.active ?? true);
  const [supplierId, setSupplierId] = useState(
    product?.defaultSupplierId ?? "",
  );
  const [supplierCode, setSupplierCode] = useState(product?.supplierCode ?? "");
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  useFocusOnError(formRef, errors);

  const lockedUnit = product?.hasBatches ?? false;
  const perUnit = unit === "UN" ? undefined : `/${unitSuffix(unit)}`;
  // Inactive suppliers take no new products; the product's current one stays listed.
  const supplierOptions = [
    { value: "", label: "Sem fornecedor padrão" },
    ...suppliers
      .filter((s) => s.active || s.id === product?.defaultSupplierId)
      .map((s) => ({
        value: s.id,
        label: s.active ? s.name : `${s.name} (inativo)`,
      })),
  ];

  function changeUnit(next: Unit) {
    // "0,000" would not fit a whole unit, on a field the person did not touch.
    if (parseQuantity(minStock, unit) === 0)
      setMinStock(quantityToInput(0, next));
    setUnit(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const costPrice = parseCents(cost);
    const sellPrice = parseCents(sell);
    const minimum = parseQuantity(minStock, unit);
    const fields: Record<string, string> = {};
    if (!barcode.trim()) fields.barcode = "Informe o código de barras.";
    if (!name.trim()) fields.name = "Informe o nome.";
    if (!categoryId) fields.categoryId = "Escolha a categoria.";
    if (costPrice === null) fields.costPrice = "Informe o custo. Ex.: 12,90";
    if (sellPrice === null)
      fields.sellPrice = "Informe o preço de venda. Ex.: 18,49";
    if (minimum === null)
      fields.minStock =
        unit === "UN"
          ? "Informe um número inteiro."
          : "Informe até 3 casas decimais. Ex.: 1,250";
    if (costPrice === null || sellPrice === null || minimum === null)
      return setErrors({ fields });
    if (Object.keys(fields).length) return setErrors({ fields });

    const values = {
      barcode: barcode.trim(),
      name: name.trim(),
      categoryId,
      costPrice,
      sellPrice,
      minStock: minimum,
      unit,
      active,
      defaultSupplierId: supplierId || null,
      // A code means nothing without the supplier it belongs to.
      supplierCode: supplierId ? supplierCode.trim() : "",
    };
    const patch = product && productPatch(product, values);
    // Nothing changed: the server would refuse an empty edit, so there is nothing to send.
    if (patch && Object.keys(patch).length === 0) return onClose();
    setPending(true);
    setErrors(null);
    const result = product
      ? await apiFetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          body: patch,
        })
      : await apiFetch("/api/admin/products", {
          method: "POST",
          body: values,
        });
    setPending(false);
    if (!result.ok) return setErrors(result.errors);
    toast({
      title: product ? "Produto atualizado" : "Produto cadastrado",
      message: values.name,
      tone: "success",
    });
    onClose();
    onSaved();
  }

  return (
    <Dialog
      open
      // A save in flight cannot be taken back, so the dialog waits for its answer.
      onOpenChange={(open) => !open && !pending && onClose()}
      initialFocus={firstField}
      title={product ? "Editar produto" : "Novo produto"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} loading={pending}>
            {product ? "Salvar alterações" : "Cadastrar produto"}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        ref={formRef}
        noValidate
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-4"
      >
        <Input
          ref={firstField}
          required
          label="Código de barras"
          name="barcode"
          autoComplete="off"
          hint={
            unit === "KG"
              ? "Bipe ou digite o código. Para etiqueta de balança, use o código de 5 dígitos da balança (ex.: 00123)."
              : "Bipe ou digite o código."
          }
          maxLength={48}
          value={barcode}
          onChange={(event) => setBarcode(event.target.value)}
          // Scanners end each read with Enter, which would submit a half-filled form.
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          error={errors?.fields.barcode}
        />
        <Input
          required
          label="Nome"
          name="name"
          autoComplete="off"
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors?.fields.name}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            required
            label="Categoria"
            name="categoryId"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Escolha"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            error={errors?.fields.categoryId}
          />
          <Select
            label="Vendido por"
            name="unit"
            options={unitOptions}
            disabled={lockedUnit}
            hint={lockedUnit ? UNIT_LOCKED_MESSAGE : undefined}
            value={unit}
            onChange={(event) => changeUnit(event.target.value as Unit)}
            error={errors?.fields.unit}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            required
            label="Custo"
            name="costPrice"
            prefix="R$"
            suffix={perUnit}
            numeric
            inputMode="decimal"
            autoComplete="off"
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            error={errors?.fields.costPrice}
          />
          <Input
            required
            label="Preço de venda"
            name="sellPrice"
            prefix="R$"
            suffix={perUnit}
            numeric
            inputMode="decimal"
            autoComplete="off"
            value={sell}
            onChange={(event) => setSell(event.target.value)}
            error={errors?.fields.sellPrice}
          />
        </div>
        <Input
          label="Estoque mínimo"
          name="minStock"
          suffix={unitSuffix(unit)}
          numeric
          inputMode={unit === "UN" ? "numeric" : "decimal"}
          autoComplete="off"
          value={minStock}
          onChange={(event) => setMinStock(event.target.value)}
          error={errors?.fields.minStock}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Fornecedor padrão"
            name="defaultSupplierId"
            options={supplierOptions}
            hint="Recebe o pedido de reposição deste produto."
            value={supplierId}
            onChange={(event) => {
              const next = event.target.value;
              setSupplierId(next);
              // A code belongs to its supplier: another supplier starts without one.
              setSupplierCode(
                next === product?.defaultSupplierId ? product.supplierCode : "",
              );
            }}
            error={errors?.fields.defaultSupplierId}
          />
          <Input
            label="Código no fornecedor"
            name="supplierCode"
            autoComplete="off"
            maxLength={60}
            disabled={!supplierId}
            value={supplierCode}
            onChange={(event) => setSupplierCode(event.target.value)}
            error={errors?.fields.supplierCode}
          />
        </div>
        {product && (
          <Checkbox
            label="Produto ativo"
            checked={active}
            onCheckedChange={setActive}
          />
        )}
        <FormAlert message={errors?.error} />
      </form>
    </Dialog>
  );
}
