"use client";

import { ScanBarcode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CASH_CLOSED_MESSAGE, type OpenCashSession } from "@/contracts/cash";
import type { ProductLookup } from "@/contracts/inventory";
import type { SaleReceipt } from "@/contracts/sales";
import { newId } from "@/app/painel/_lib/new-id";
import { parseScaleLabel } from "@/lib/barcode-scale";
import { Input } from "@ds/components/input";
import { useToast } from "@ds/components/toast";
import {
  cartTotal,
  discountScope,
  removeLine,
  setLineDiscount,
  setQuantity,
  type DiscountTarget,
} from "./cart";
import { CartList } from "./cart-list";
import { CashDialogs, type CashDialogKind } from "./cash-dialogs";
import { CheckoutDialog } from "./checkout-dialog";
import { discountCents } from "./checkout-payments";
import { DiscountDialog } from "./discount-dialog";
import { OpenCashPanel } from "./open-cash-panel";
import { PdvHeader } from "./pdv-header";
import { QuantityDialog } from "./quantity-dialog";
import { ReceiptDialog, ReceiptPaper } from "./receipt";
import type { ReceiptStore } from "./receipt-text";
import { lookupBarcode, lookupScaleLabel, withCurrentPrices } from "./sale-api";
import { CancelSaleDialog, SaleTotal } from "./sale-total";
import { SearchResults } from "./search-results";
import { usePdvKeys } from "./use-pdv-keys";
import { useProductSearch } from "./use-product-search";
import { useSaleCart } from "./use-sale-cart";

/** A product whose quantity is being typed: a new one goes in (add) or a line changes (set). */
type Weighing = { product: ProductLookup; mode: "add" | "set" };

/** The sale screen (PDV): scan or search, adjust the items, take the payment, hand the receipt. */
export function PdvView({
  store,
  userName,
  isAdmin,
  initialTheme,
  cash,
}: {
  store: ReceiptStore;
  userName: string;
  isAdmin: boolean;
  initialTheme?: "light" | "dark";
  /** The open drawer; without one, the screen only opens the cash. */
  cash: OpenCashSession | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  // Counts the lookups, so only the last one may hand its text back to the field.
  const lookups = useRef(0);
  const [query, setQuery] = useState("");
  const [weighing, setWeighing] = useState<Weighing | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [discounting, setDiscounting] = useState<DiscountTarget | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  // One id per sale, kept across failed attempts: a retry after a lost answer cannot sell twice.
  const [saleId, setSaleId] = useState(newId);
  const [cashDialog, setCashDialog] = useState<CashDialogKind | null>(null);
  const search = useProductSearch(query);
  const {
    cart,
    cartRef,
    announcement,
    commit,
    add,
    pick,
    discount,
    setDiscount,
  } = useSaleCart((product) => setWeighing({ product, mode: "add" }));
  const dialogOpen =
    weighing !== null ||
    checkout ||
    discounting !== null ||
    cancelling ||
    receipt !== null ||
    cashDialog !== null;
  const cashId = cash?.id;
  const subtotal = cartTotal(cart);
  const discountOff = discountCents(subtotal, discount);
  const inCart = (id: string) =>
    cart.find((line) => line.id === id)?.quantity ?? 0;

  async function lookup(event: FormEvent) {
    // The scanner's Enter lands here and never submits anything else.
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    const listed = search.status === "done" ? search.products : [];
    // Cleared at once, so the next scan starts on an empty field while this one is looked up.
    setQuery("");
    const request = ++lookups.current;
    const result = await lookupBarcode(term);
    if (result.ok) return pick(result.data);
    // 404: no such code; 400: too long to be one (a long name). Either way, try the name.
    if (result.status !== 404 && result.status !== 400)
      return toast({
        title: "Não foi possível buscar",
        message: result.errors.error,
        tone: "danger",
      });
    // Not a registered code: a scale label names its weighed product by a 5-digit code.
    const label = parseScaleLabel(term);
    if (label) {
      // The label carries the weight, so the weighing dialog is skipped.
      const scanned = await lookupScaleLabel(label);
      return "product" in scanned
        ? add(scanned.product, scanned.grams)
        : toast({ ...scanned, tone: "danger" });
    }
    // Not a code: a typed name with a single match is that product.
    if (listed.length === 1) return pick(listed[0]);
    // A scan that started meanwhile owns the field: an old term would glue onto its code.
    if (request === lookups.current)
      setQuery((current) => (current === "" ? term : current));
    if (listed.length === 0)
      toast({
        title: "Produto não encontrado",
        message: `Nada ativo com o código ou nome "${term}".`,
        tone: "danger",
      });
  }

  function openCheckout() {
    if (cartRef.current.length === 0)
      return toast({
        title: "Venda sem itens",
        message: "Adicione um item antes de finalizar.",
        tone: "warning",
      });
    setCheckout(true);
  }

  function openCash(kind: CashDialogKind) {
    // The count must include every sale, so one in progress is finished or cancelled first.
    if (kind === "close" && cartRef.current.length > 0)
      return toast({
        title: "Venda em andamento",
        message: "Finalize ou cancele a venda antes de fechar o caixa.",
        tone: "warning",
      });
    setCashDialog(kind);
  }

  function startNewSale() {
    commit([]);
    setSaleId(newId());
  }

  usePdvKeys({
    active: !dialogOpen && cash !== null,
    searchRef,
    onCheckout: openCheckout,
    onDiscount: () => cartRef.current.length > 0 && setDiscounting("sale"),
    onCash: openCash,
    onType: (key) => setQuery((current) => current + key),
    onClear: () => setQuery(""),
  });

  useEffect(() => {
    // Ready for the scanner once the cash is open on a counter PC; on a phone it would only pop up the keyboard.
    if (cashId && window.matchMedia("(pointer: fine)").matches)
      searchRef.current?.focus();
  }, [cashId]);

  const header = (
    <PdvHeader
      storeName={store.name}
      userName={userName}
      isAdmin={isAdmin}
      initialTheme={initialTheme}
      cash={cash}
      onCash={() => setCashDialog("menu")}
    />
  );

  if (!cash)
    return (
      <div className="flex h-dvh flex-col bg-app">
        {header}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <OpenCashPanel />
        </main>
      </div>
    );

  return (
    <div className="flex h-dvh flex-col bg-app">
      {header}

      <main className="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <form
            role="search"
            noValidate
            onSubmit={(event) => void lookup(event)}
          >
            <Input
              ref={searchRef}
              size="counter"
              label="Código de barras ou nome do produto (F1)"
              aria-keyshortcuts="F1"
              name="search"
              autoComplete="off"
              enterKeyHint="enter"
              maxLength={120}
              placeholder="Bipe o código ou digite o nome"
              prefix={<ScanBarcode aria-hidden="true" className="size-6" />}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>
          {search.status !== "idle" && (
            <SearchResults
              search={search}
              onPick={(product) => {
                setQuery("");
                pick(product);
                searchRef.current?.focus();
              }}
            />
          )}
          <CartList
            cart={cart}
            onDecrease={(line) =>
              commit(setQuantity(cartRef.current, line.id, line.quantity - 1))
            }
            onIncrease={(line) => add(line, 1)}
            onEdit={(line) => setWeighing({ product: line, mode: "set" })}
            onRemove={(line) => commit(removeLine(cartRef.current, line.id))}
            onDiscount={setDiscounting}
          />
        </div>
        <SaleTotal
          subtotal={subtotal}
          discount={discountOff}
          hasItems={cart.length > 0}
          onFinish={openCheckout}
          onDiscount={() => setDiscounting("sale")}
          onCancel={() => setCancelling(true)}
        />
      </main>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      {weighing && (
        <QuantityDialog
          product={weighing.product}
          initial={weighing.mode === "set" ? inCart(weighing.product.id) : 0}
          max={
            weighing.product.stock -
            (weighing.mode === "add" ? inCart(weighing.product.id) : 0)
          }
          finalFocus={searchRef}
          onClose={() => setWeighing(null)}
          onConfirm={(quantity) => {
            if (weighing.mode === "add") add(weighing.product, quantity);
            else
              commit(
                setQuantity(cartRef.current, weighing.product.id, quantity),
              );
            setWeighing(null);
          }}
        />
      )}
      {checkout && (
        <CheckoutDialog
          cart={cart}
          discount={discountOff}
          saleId={saleId}
          finalFocus={searchRef}
          onClose={() => setCheckout(false)}
          onPricesChanged={async () =>
            commit(await withCurrentPrices(cartRef.current))
          }
          onCashClosed={() => {
            // Closed from another counter: the screen goes back to the opening.
            setCheckout(false);
            toast({
              title: "Caixa fechado",
              message: CASH_CLOSED_MESSAGE,
              tone: "danger",
            });
            router.refresh();
          }}
          onDone={(done) => {
            setCheckout(false);
            setReceipt(done);
            startNewSale();
          }}
        />
      )}
      {discounting && (
        <DiscountDialog
          {...discountScope(cart, discount, discounting, isAdmin)}
          finalFocus={searchRef}
          onClose={() => setDiscounting(null)}
          onApply={(next) => {
            if (discounting === "sale") setDiscount(next);
            else commit(setLineDiscount(cartRef.current, discounting.id, next));
            setDiscounting(null);
          }}
        />
      )}
      {cancelling && (
        <CancelSaleDialog
          finalFocus={searchRef}
          onClose={() => setCancelling(false)}
          onConfirm={() => {
            startNewSale();
            setCancelling(false);
          }}
        />
      )}
      {cashDialog && (
        <CashDialogs
          kind={cashDialog}
          cash={cash}
          finalFocus={searchRef}
          onClose={() => setCashDialog(null)}
          onPick={openCash}
        />
      )}
      {receipt && (
        <>
          <ReceiptDialog
            receipt={receipt}
            store={store}
            finalFocus={searchRef}
            onClose={() => setReceipt(null)}
          />
          <ReceiptPaper receipt={receipt} store={store} />
        </>
      )}
    </div>
  );
}
