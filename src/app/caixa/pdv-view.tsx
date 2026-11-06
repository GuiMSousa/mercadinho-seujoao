"use client";

import { ScanBarcode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CASH_CLOSED_MESSAGE, type OpenCashSession } from "@/contracts/cash";
import type { ProductLookup } from "@/contracts/inventory";
import type { SaleReceipt } from "@/contracts/sales";
import { newId } from "@/app/painel/_lib/new-id";
import { Input } from "@ds/components/input";
import { useToast } from "@ds/components/toast";
import {
  addToCart,
  cartTotal,
  refusal,
  removeLine,
  setQuantity,
  type CartLine,
} from "./cart";
import { CartList } from "./cart-list";
import { CashDialogs, type CashDialogKind } from "./cash-dialogs";
import { CheckoutDialog } from "./checkout-dialog";
import { OpenCashPanel } from "./open-cash-panel";
import { PdvHeader } from "./pdv-header";
import { QuantityDialog } from "./quantity-dialog";
import { ReceiptDialog, ReceiptPaper } from "./receipt";
import { brl, type ReceiptStore } from "./receipt-text";
import { lookupBarcode, withCurrentPrices } from "./sale-api";
import { CancelSaleDialog, SaleTotal } from "./sale-total";
import { SearchResults } from "./search-results";
import { usePdvKeys } from "./use-pdv-keys";
import { useProductSearch } from "./use-product-search";

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
  // Scans can answer while another is in flight; handlers read the cart here, never a stale render.
  const cartRef = useRef<CartLine[]>([]);
  // Counts the lookups, so only the last one may hand its text back to the field.
  const lookups = useRef(0);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [weighing, setWeighing] = useState<Weighing | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  // One id per sale, kept across failed attempts: a retry after a lost answer cannot sell twice.
  const [saleId, setSaleId] = useState(newId);
  const [announcement, setAnnouncement] = useState("");
  const [cashDialog, setCashDialog] = useState<CashDialogKind | null>(null);
  const search = useProductSearch(query);
  const dialogOpen =
    weighing !== null ||
    checkout ||
    cancelling ||
    receipt !== null ||
    cashDialog !== null;
  const cashId = cash?.id;
  const inCart = (id: string) =>
    cart.find((line) => line.id === id)?.quantity ?? 0;

  function commit(next: CartLine[]) {
    cartRef.current = next;
    setCart(next);
  }

  function refuse(product: ProductLookup, quantity: number) {
    const refused = refusal(cartRef.current, product, quantity);
    if (refused) toast({ ...refused, tone: "danger" });
    return refused !== null;
  }

  function add(product: ProductLookup, quantity: number) {
    if (refuse(product, quantity)) return;
    commit(addToCart(cartRef.current, product, quantity));
    setAnnouncement(
      `${product.name} adicionado. Total ${brl(cartTotal(cartRef.current))}.`,
    );
  }

  /** A unit product goes in one at a time; a weighed one asks for the weight first. */
  function pick(product: ProductLookup) {
    if (product.unit === "UN") return add(product, 1);
    // Refused before the weight is typed, so an expired or empty product stops right away.
    if (!refuse(product, 1)) setWeighing({ product, mode: "add" });
  }

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
          />
        </div>
        <SaleTotal
          total={cartTotal(cart)}
          hasItems={cart.length > 0}
          onFinish={openCheckout}
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
