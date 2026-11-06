"use client";

import { Minus, Percent, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { formatQuantity } from "@/app/painel/produtos/product-form";
import { Button, IconButton } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Money } from "@ds/components/money";
import { lineDiscount, linePrice, priceLabel, type CartLine } from "./cart";
import { brl } from "./receipt-text";

type LineAction = (line: CartLine) => void;

/**
 * The lines of the sale. Units change one at a time with − and +; any quantity, and every
 * weight, is typed on the keypad by pressing the quantity itself. % gives a discount on the line.
 */
export function CartList({
  cart,
  onDecrease,
  onIncrease,
  onEdit,
  onRemove,
  onDiscount,
}: {
  cart: CartLine[];
  onDecrease: LineAction;
  onIncrease: LineAction;
  onEdit: LineAction;
  onRemove: LineAction;
  onDiscount: LineAction;
}) {
  return (
    <Card
      title="Itens da venda"
      subtitle={
        cart.length > 0
          ? `${cart.length} ${cart.length === 1 ? "item" : "itens"}`
          : undefined
      }
    >
      {cart.length === 0 ? (
        <p className="flex flex-col items-center gap-2 py-6 text-center text-body-lg text-sub">
          <ShoppingCart aria-hidden="true" className="size-6" />
          Bipe o código ou busque pelo nome para adicionar.
        </p>
      ) : (
        <ul className="flex flex-col">
          {cart.map((line) => {
            const quantity = formatQuantity(line.quantity, line.unit);
            const single = line.unit === "UN" && line.quantity === 1;
            const discount = lineDiscount(line);
            return (
              <li
                key={line.id}
                className="flex flex-wrap items-center gap-3 border-b border-border-soft py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1 basis-40">
                  <p className="text-body-lg font-medium text-strong">
                    {line.name}
                  </p>
                  <p className="text-body-lg text-sub tabular-nums">
                    {priceLabel(line)}
                  </p>
                  {discount > 0 && (
                    <p className="text-body-lg text-success-fg tabular-nums">
                      Desconto de {brl(discount)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {line.unit === "UN" && (
                    <IconButton
                      size="counter"
                      icon={single ? Trash2 : Minus}
                      label={`${single ? "Remover" : "Diminuir"} ${line.name}`}
                      onClick={() =>
                        single ? onRemove(line) : onDecrease(line)
                      }
                    />
                  )}
                  <Button
                    variant="soft"
                    size="counter"
                    className="min-w-24 tabular-nums"
                    aria-label={`${quantity}: alterar a quantidade de ${line.name}`}
                    onClick={() => onEdit(line)}
                  >
                    {quantity}
                  </Button>
                  {line.unit === "UN" ? (
                    <IconButton
                      size="counter"
                      icon={Plus}
                      label={`Aumentar ${line.name}`}
                      onClick={() => onIncrease(line)}
                    />
                  ) : (
                    <IconButton
                      size="counter"
                      variant="danger"
                      icon={Trash2}
                      label={`Remover ${line.name}`}
                      onClick={() => onRemove(line)}
                    />
                  )}
                  <IconButton
                    size="counter"
                    variant={discount > 0 ? "primary" : "secondary"}
                    icon={Percent}
                    label={`Desconto em ${line.name}`}
                    onClick={() => onDiscount(line)}
                  />
                </div>
                <Money
                  cents={linePrice(line)}
                  size="md"
                  className="ml-auto min-w-28 text-right"
                />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
