"use client";

import { MessageCircle, Printer } from "lucide-react";
import { useRef, type RefObject } from "react";
import type { SaleReceipt } from "@/contracts/sales";
import { formatDateTime } from "@/app/painel/_lib/format";
import { formatDocument } from "@/lib/document";
import { Button, buttonVariants } from "@ds/components/button";
import { Dialog } from "@ds/components/dialog";
import { Money } from "@ds/components/money";
import { cn } from "@ds/lib/cn";
import {
  PAYMENT_LABELS,
  brl,
  itemDetail,
  receiptText,
  whatsappLink,
  type ReceiptStore,
} from "./receipt-text";

function ReceiptLines({ receipt }: { receipt: SaleReceipt }) {
  return (
    <div className="flex flex-col gap-2 text-body-lg">
      <ul className="flex flex-col divide-y divide-border-soft">
        {receipt.items.map((item) => (
          <li
            key={item.productId}
            className="flex items-start justify-between gap-3 py-2"
          >
            <div className="min-w-0">
              <p className="font-medium text-strong">{item.name}</p>
              <p className="text-sub tabular-nums">{itemDetail(item)}</p>
            </div>
            <span className="text-strong tabular-nums">{brl(item.total)}</span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-t border-border pt-2 tabular-nums [&_dd]:text-right">
        <dt className="font-semibold text-strong">Total</dt>
        <dd className="font-semibold text-strong">{brl(receipt.total)}</dd>
        <dt className="text-sub">Pagamento</dt>
        <dd>{PAYMENT_LABELS[receipt.paymentMethod]}</dd>
        {receipt.paymentMethod === "CASH" && (
          <>
            <dt className="text-sub">Recebido</dt>
            <dd>{brl(receipt.amountReceived)}</dd>
            <dt className="text-sub">Troco</dt>
            <dd>{brl(receipt.change)}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

/**
 * The receipt as printed: hidden on screen, the only thing on paper (globals.css). It takes the
 * width the printer driver gives, so the same page fits 58 mm and 80 mm rolls.
 */
export function ReceiptPaper({
  receipt,
  store,
}: {
  receipt: SaleReceipt;
  store: ReceiptStore;
}) {
  return (
    <div data-receipt className="hidden flex-col gap-2 print:flex">
      <p className="text-center text-body-lg font-semibold">{store.name}</p>
      {store.document && (
        <p className="text-center text-body-lg">
          CNPJ/CPF {formatDocument(store.document)}
        </p>
      )}
      <p className="text-center text-body-lg">
        Venda nº {receipt.number} · {formatDateTime(receipt.createdAt)}
      </p>
      <ReceiptLines receipt={receipt} />
      <p className="text-center text-body-lg">Comprovante sem valor fiscal</p>
    </div>
  );
}

/** Shown once the sale is recorded: the change to hand back, print, WhatsApp and the next sale. */
export function ReceiptDialog({
  receipt,
  store,
  onClose,
  finalFocus,
}: {
  receipt: SaleReceipt;
  store: ReceiptStore;
  onClose: () => void;
  finalFocus: RefObject<HTMLElement | null>;
}) {
  const nextSale = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      initialFocus={nextSale}
      finalFocus={finalFocus}
      title={`Venda nº ${receipt.number} concluída`}
      description={formatDateTime(receipt.createdAt)}
      footer={
        <div className="grid w-full grid-cols-2 gap-2">
          <Button variant="secondary" size="lg" onClick={() => window.print()}>
            <Printer aria-hidden="true" />
            Imprimir<span className="sr-only"> comprovante</span>
          </Button>
          {/* A real link: it leaves for WhatsApp in a new tab, where the person picks the contact. */}
          <a
            href={whatsappLink(receiptText(store, receipt))}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}
          >
            <MessageCircle aria-hidden="true" />
            <span className="sr-only">Enviar por </span>WhatsApp
            <span className="sr-only"> (abre em outra aba)</span>
          </a>
          <Button
            ref={nextSale}
            variant="brand"
            size="counter"
            className="col-span-2"
            onClick={onClose}
          >
            Nova venda
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {receipt.paymentMethod === "CASH" && (
          <p className="flex items-baseline justify-between gap-3 rounded-lg bg-success-bg px-4 py-3 text-body-lg text-success-fg">
            Troco
            <Money
              cents={receipt.change}
              size="counter"
              tone="margin"
              mutedCents={false}
            />
          </p>
        )}
        <ReceiptLines receipt={receipt} />
      </div>
    </Dialog>
  );
}
