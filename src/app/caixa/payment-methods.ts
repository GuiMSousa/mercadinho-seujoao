import {
  Banknote,
  CreditCard,
  NotebookPen,
  QrCode,
  ShoppingBasket,
  Utensils,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type { PaymentMethod } from "@/contracts/sales";

/**
 * The payment dialog's methods, in button order. Each has a letter key: in that dialog letters
 * reach no field (the amount takes digits only), except the fiado customer search.
 */
export const METHODS: {
  value: PaymentMethod;
  label: string;
  icon: LucideIcon;
  /** The amount field's label with this method chosen. */
  field: string;
  key: string;
}[] = [
  {
    value: "CASH",
    label: "Dinheiro",
    icon: Banknote,
    field: "Valor recebido em dinheiro",
    key: "D",
  },
  { value: "PIX", label: "Pix", icon: QrCode, field: "Valor no Pix", key: "P" },
  {
    value: "DEBIT",
    label: "Débito",
    icon: WalletCards,
    field: "Valor no débito",
    key: "B",
  },
  {
    value: "CREDIT",
    label: "Crédito",
    icon: CreditCard,
    field: "Valor no crédito",
    key: "C",
  },
  {
    value: "ON_ACCOUNT",
    label: "Fiado",
    icon: NotebookPen,
    field: "Valor no fiado",
    key: "F",
  },
  {
    value: "MEAL_VOUCHER",
    label: "VR",
    icon: Utensils,
    field: "Valor no vale-refeição",
    key: "R",
  },
  {
    value: "FOOD_VOUCHER",
    label: "VA",
    icon: ShoppingBasket,
    field: "Valor no vale-alimentação",
    key: "A",
  },
];

/** The method a key picks, if any (either case). */
export const methodForKey = (key: string) =>
  METHODS.find((method) => method.key === key.toUpperCase())?.value;
