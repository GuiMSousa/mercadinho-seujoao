"use client";

import Link from "next/link";
import { LayoutDashboard, ScanBarcode } from "lucide-react";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { ProductLookup } from "@/contracts/inventory";
import type { SaleReceipt } from "@/contracts/sales";
import { ThemeControl } from "@/app/_components/theme-control";
import { newId } from "@/app/painel/_lib/new-id";
import { LogoutButton } from "@/app/painel/_shell/logout-button";
import { Button } from "@ds/components/button";
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
import { CheckoutDialog } from "./checkout-dialog";
import { QuantityDialog } from "./quantity-dialog";
import { ReceiptDialog, ReceiptPaper } from "./receipt";
import { brl, type ReceiptStore } from "./receipt-text";
import { lookupBarcode, withCurrentPrices } from "./sale-api";
import { CancelSaleDialog, SaleTotal } from "./sale-total";
import { SearchResults } from "./search-results";
import { useProductSearch } from "./use-product-search";

/** A product whose quantity is being typed: a new one goes in (add) or a line changes (set). */
type Weighing = { product: ProductLookup; mode: "add" | "set" };

const isTextField = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest("input, textarea, select, [contenteditable='true']") !== null;

/** The sale screen (PDV): scan or search, adjust the items, take the payment, hand the receipt. */
export function PdvView({
  store,
  userName,
  isAdmin,
  initialTheme,
}: {
  store: ReceiptStore;
  userName: string;
  isAdmin: boolean;
  initialTheme?: "light" | "dark";
}) {
  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  // Scans can answer while another is in flight; handlers read the cart here, never a stale render.
  const cartRef = useRef<CartLine[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [weighing, setWeighing] = useState<Weighing | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  // One id per sale, kept across failed attempts: a retry after a lost answer cannot sell twice.
  const [saleId, setSaleId] = useState(newId);
  const [announcement, setAnnouncement] = useState("");
  const search = useProductSearch(query);
  const dialogOpen =
    weighing !== null || checkout || cancelling || receipt !== null;
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

  function startNewSale() {
    commit([]);
    setSaleId(newId());
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "F1" || event.key === "F2") {
      // Keeps the browser's own F1 (help) and F2 from running.
      event.preventDefault();
      if (dialogOpen) return;
      if (event.key === "F1") searchRef.current?.focus();
      else openCheckout();
      return;
    }
    // Dialogs handle their own keys, Escape included.
    if (dialogOpen) return;
    if (event.key === "Escape") {
      setQuery("");
      searchRef.current?.focus();
      return;
    }
    // A scanner types into whatever has focus, and a cart button would take its Enter as a click.
    const printable =
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey;
    if (printable && !isTextField(event.target)) {
      event.preventDefault();
      setQuery((current) => current + event.key);
      searchRef.current?.focus();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    // Ready for the scanner on a counter PC; on a phone it would only pop up the keyboard.
    if (window.matchMedia("(pointer: fine)").matches)
      searchRef.current?.focus();
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-app">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-surface-card px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="truncate text-h3 font-medium tracking-tight text-strong">
            Frente de caixa
          </h1>
          <p className="truncate text-body-md text-sub">
            {store.name} · {userName}
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/painel" />}
          >
            <LayoutDashboard aria-hidden="true" />
            Painel
          </Button>
        )}
        <ThemeControl variant="icon" initialTheme={initialTheme} />
        <LogoutButton />
      </header>

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
