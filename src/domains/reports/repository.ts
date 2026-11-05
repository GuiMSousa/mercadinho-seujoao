import "server-only";
import { and, desc, eq, gte, lt, sql, type SQLWrapper } from "drizzle-orm";
import type { ReportPeriod } from "@/contracts/reports";
import { getDb } from "@/infrastructure/db";
import { products, saleItems, sales, users } from "@/infrastructure/db/schema";
import { STORE_TIME_ZONE } from "@/lib/store-time";

/**
 * Sales made on the store's calendar days `from` to `to`, inclusive: from local midnight of `from`
 * to local midnight after `to`. PostgreSQL does the conversion, daylight saving included.
 */
const inPeriod = ({ from, to }: ReportPeriod) =>
  and(
    gte(
      sales.createdAt,
      sql`(${from}::date)::timestamp AT TIME ZONE ${STORE_TIME_ZONE}`,
    ),
    lt(
      sales.createdAt,
      sql`(${to}::date + 1)::timestamp AT TIME ZONE ${STORE_TIME_ZONE}`,
    ),
  );

// Sums are bigint in PostgreSQL; the amounts of one store fit a JS number exactly.
const total = (column: SQLWrapper) =>
  sql`coalesce(sum(${column}), 0)`.mapWith(Number);

export async function selectTotals(period: ReportPeriod) {
  const [salesTotals] = await getDb()
    .select({
      revenue: total(sales.total),
      salesCount: sql`count(*)`.mapWith(Number),
    })
    .from(sales)
    .where(inPeriod(period));
  const [itemTotals] = await getDb()
    .select({
      cogs: total(saleItems.cost),
      // Units of UN products; a weighed line (grams or milliliters) is one item.
      itemsSold: total(
        sql`CASE WHEN ${saleItems.unit} = 'UN' THEN ${saleItems.quantity} ELSE 1 END`,
      ),
    })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .where(inPeriod(period));
  return { ...salesTotals, ...itemTotals };
}

export function selectPaymentTotals(period: ReportPeriod) {
  return getDb()
    .select({
      method: sales.paymentMethod,
      count: sql`count(*)`.mapWith(Number),
      total: total(sales.total),
    })
    .from(sales)
    .where(inPeriod(period))
    .groupBy(sales.paymentMethod);
}

const productRevenue = total(saleItems.total);
const productProfit = total(sql`${saleItems.total} - ${saleItems.cost}`);
const productQuantity = total(saleItems.quantity);
const RANKINGS = {
  revenue: productRevenue,
  profit: productProfit,
  // Kilograms and liters weigh against units: 3 kg ranks with 3 units, not with 3,000.
  quantity: sql`sum(${saleItems.quantity})::numeric / CASE WHEN ${products.unit} = 'UN' THEN 1 ELSE 1000 END`,
};

/** The five products that sold most in the period by `ranking`, with what each brought in. */
export function selectTopProducts(
  period: ReportPeriod,
  ranking: keyof typeof RANKINGS,
) {
  return getDb()
    .select({
      productId: saleItems.productId,
      name: products.name,
      unit: products.unit,
      quantity: productQuantity,
      revenue: productRevenue,
      profit: productProfit,
    })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .innerJoin(products, eq(products.id, saleItems.productId))
    .where(inPeriod(period))
    .groupBy(saleItems.productId, products.name, products.unit)
    .orderBy(desc(RANKINGS[ranking]), products.name)
    .limit(5);
}

export const countSales = (period: ReportPeriod) =>
  getDb().$count(sales, inPeriod(period));

/** One page of the period's sales, newest first, with the CMV recorded on each. */
export function selectSalesPage(
  period: ReportPeriod,
  page: { limit: number; offset: number },
) {
  return getDb()
    .select({
      id: sales.id,
      number: sales.number,
      createdAt: sales.createdAt,
      operator: users.name,
      paymentMethod: sales.paymentMethod,
      total: sales.total,
      // Explicit names: the subquery must read the outer sale, not its own row.
      cogs: sql`(SELECT coalesce(sum(si.cost), 0) FROM sale_items si WHERE si.sale_id = "sales"."id")`.mapWith(
        Number,
      ),
    })
    .from(sales)
    .innerJoin(users, eq(users.id, sales.userId))
    .where(inPeriod(period))
    .orderBy(desc(sales.createdAt), desc(sales.number))
    .limit(page.limit)
    .offset(page.offset);
}
