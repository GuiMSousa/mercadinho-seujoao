import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { expect, it, vi } from "vitest";
import { logActivity } from "@/domains/activity/service";
import type { MailMessage } from "@/infrastructure/mail";
import * as schema from "@/infrastructure/db/schema";
import {
  categories,
  products,
  saleItems,
  salePayments,
  sales,
  users,
} from "@/infrastructure/db/schema";
import {
  withTestDb,
  withTestPool,
  type TestDb,
} from "@/infrastructure/db/test-db";
import { readReport, selectTotals } from "./repository";
import {
  getFinancialReport,
  listReportSales,
  sendDailySummary,
} from "./service";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/activity/service", () => ({ logActivity: vi.fn() }));
const sent: MailMessage[] = [];
const send = vi.fn(async (message: MailMessage) => {
  sent.push(message);
});
vi.mock("@/infrastructure/mail", () => ({ getMailer: () => ({ send }) }));

// The repositories reach the database through getDb(); point it at the test database.
let current: TestDb | NodePgDatabase<typeof schema>;
vi.mock("@/infrastructure/db", () => ({ getDb: () => current }));

const inTest = (fn: (db: TestDb) => Promise<void>) =>
  withTestDb(async (db) => {
    current = db;
    await fn(db);
  });

// March 2020 keeps these rows away from anything else in the test database. Brazil had no
// daylight saving then, so the store's midnight is 03:00 UTC.
const DAY = "2020-03-10";

async function seed(db: TestDb) {
  const unique = randomUUID();
  const [operator] = await db
    .insert(users)
    .values({ name: "Carla", email: `${unique}@example.com`, role: "CASHIER" })
    .returning();
  const [category] = await db
    .insert(categories)
    .values({ name: `Categoria ${unique}` })
    .returning();
  const [coffee, banana, water] = await db
    .insert(products)
    .values(
      [
        ["cafe", "Café", 1290, 1849, "UN"],
        ["banana", "Banana", 400, 699, "KG"],
        ["agua", "Água <gelada>", 100, 300, "UN"],
      ].map(([code, name, costPrice, sellPrice, unit]) => ({
        barcode: `${unique}-${code}`,
        name: name as string,
        categoryId: category.id,
        costPrice: costPrice as number,
        sellPrice: sellPrice as number,
        unit: unit as "UN" | "KG",
      })),
    )
    .returning();

  type Line = [product: typeof coffee, quantity: number];
  type Method = (typeof salePayments.$inferInsert)["method"];
  // One method pays it all, or [method, amount] pairs split it.
  const sale = async (
    createdAt: string,
    paid: Method | [Method, number][],
    lines: Line[],
  ) => {
    const rows = lines.map(([product, quantity]) => {
      const base = product.unit === "UN" ? 1 : 1000;
      return {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        quantity,
        unitPrice: product.sellPrice,
        unitCost: product.costPrice,
        total: Math.round((product.sellPrice * quantity) / base),
        cost: Math.round((product.costPrice * quantity) / base),
      };
    });
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    const [row] = await db
      .insert(sales)
      .values({
        userId: operator.id,
        total,
        amountReceived: total,
        change: 0,
        createdAt: new Date(createdAt),
      })
      .returning();
    const payments = typeof paid === "string" ? [[paid, total] as const] : paid;
    await db.insert(salePayments).values(
      payments.map(([method, amount]) => ({
        saleId: row.id,
        method,
        amount,
      })),
    );
    await db.insert(saleItems).values(
      rows.map((line, index) => ({
        ...line,
        saleId: row.id,
        line: index + 1,
      })),
    );
    return row;
  };

  // 10/03 10:00 local: 2 × R$ 18,49 + 1,250 kg × R$ 6,99 (R$ 8,74); cost R$ 25,80 + R$ 5,00.
  const morning = await sale("2020-03-10T13:00:00Z", "CASH", [
    [coffee, 2],
    [banana, 1250],
  ]);
  // 10/03 17:00 local: 5 waters, R$ 10,00 by Pix and R$ 5,00 on account (fiado).
  const afternoon = await sale(
    "2020-03-10T20:00:00Z",
    [
      ["PIX", 1000],
      ["ON_ACCOUNT", 500],
    ],
    [[water, 5]],
  );
  // 10/03 23:30 local, already 11/03 in UTC: still the store's 10/03.
  const lateNight = await sale("2020-03-11T02:30:00Z", "DEBIT", [[water, 1]]);
  // 09/03 23:30 local, already 10/03 in UTC: the store's 09/03.
  await sale("2020-03-10T02:30:00Z", "CREDIT", [[coffee, 1]]);
  return { operator, coffee, banana, water, morning, afternoon, lateNight };
}

const day = { period: "custom" as const, from: DAY, to: DAY };

it("sums revenue, CMV, gross profit, margin, ticket and items by the store's calendar day", async () => {
  await inTest(async (db) => {
    await seed(db);
    const report = await getFinancialReport(day);

    // Revenue 45,72 + 15,00 + 3,00; CMV 30,80 + 5,00 + 1,00.
    expect(report.period).toEqual({ from: DAY, to: DAY });
    expect(report.summary).toEqual({
      revenue: 6372,
      cogs: 3680,
      grossProfit: 2692,
      marginPercent: 42.2,
      averageTicket: 2124,
      salesCount: 3,
      // 2 coffees + 1 weighed line + 5 + 1 waters.
      itemsSold: 9,
    });
    // A split sale counts in each of its methods, with its share.
    expect(report.payments).toEqual([
      { method: "CASH", count: 1, total: 4572, percent: 71.8 },
      { method: "PIX", count: 1, total: 1000, percent: 15.7 },
      { method: "DEBIT", count: 1, total: 300, percent: 4.7 },
      { method: "CREDIT", count: 0, total: 0, percent: 0 },
      { method: "ON_ACCOUNT", count: 1, total: 500, percent: 7.8 },
    ]);
    const names = (list: { name: string }[]) => list.map((p) => p.name);
    // 6 waters, 2 coffees, then 1,25 kg of banana.
    expect(names(report.top.byQuantity)).toEqual([
      "Água <gelada>",
      "Café",
      "Banana",
    ]);
    expect(names(report.top.byRevenue)).toEqual([
      "Café",
      "Água <gelada>",
      "Banana",
    ]);
    expect(report.top.byProfit).toEqual([
      expect.objectContaining({
        name: "Água <gelada>",
        quantity: 6,
        revenue: 1800,
        profit: 1200,
      }),
      expect.objectContaining({
        name: "Café",
        quantity: 2,
        revenue: 3698,
        profit: 1118,
      }),
      expect.objectContaining({
        name: "Banana",
        unit: "KG",
        quantity: 1250,
        revenue: 874,
        profit: 374,
      }),
    ]);

    // The day before holds only the 23:30 credit sale; the last 7 days hold all four.
    const before = await getFinancialReport({
      period: "custom",
      from: "2020-03-09",
      to: "2020-03-09",
    });
    expect(before.summary).toMatchObject({ revenue: 1849, salesCount: 1 });
    const week = await getFinancialReport({ period: "7d" }, DAY);
    expect(week.period).toEqual({ from: "2020-03-04", to: DAY });
    expect(week.summary).toMatchObject({ revenue: 8221, salesCount: 4 });
  });
});

it("lists the period's sales newest first, each with its CMV and margin", async () => {
  await inTest(async (db) => {
    const { morning, afternoon, lateNight } = await seed(db);
    const page = await listReportSales({ ...day, page: 1 });

    expect(page).toMatchObject({ total: 3, page: 1, pageSize: 20 });
    expect(
      page.sales.map((sale) => [
        sale.id,
        sale.operator,
        sale.paymentMethods,
        sale.cogs,
        sale.marginPercent,
      ]),
    ).toEqual([
      [lateNight.id, "Carla", ["DEBIT"], 100, 66.7],
      [afternoon.id, "Carla", ["PIX", "ON_ACCOUNT"], 500, 66.7],
      [morning.id, "Carla", ["CASH"], 3080, 32.6],
    ]);
    // A page past the end answers the last one.
    expect((await listReportSales({ ...day, page: 9 })).page).toBe(1);
    const empty = await listReportSales({
      period: "custom",
      from: "2020-01-01",
      to: "2020-01-01",
      page: 1,
    });
    expect(empty).toMatchObject({ total: 0, page: 1, sales: [] });
    expect(
      (
        await getFinancialReport({
          period: "custom",
          from: "2020-01-01",
          to: "2020-01-01",
        })
      ).summary,
    ).toEqual({
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      marginPercent: null,
      averageTicket: null,
      salesCount: 0,
      itemsSold: 0,
    });
  });
});

it("e-mails today's summary to the ADMIN's own address, escaping names, and limits the sends", async () => {
  await inTest(async (db) => {
    await seed(db);
    const admin = { id: randomUUID(), name: "Ana", email: "ana@loja.com" };

    await expect(sendDailySummary(admin, DAY)).resolves.toEqual({
      sentTo: "ana@loja.com",
    });
    const [mail] = sent;
    expect(mail.to).toBe("ana@loja.com");
    expect(mail.subject).toMatch(/^Resumo financeiro de 10\/03\/2020 — /);
    expect(mail.text).toContain("Faturamento bruto: R$ 63,72");
    expect(mail.text).toContain("Margem bruta: 42,2%");
    expect(mail.html).toContain("<td>Água &lt;gelada&gt;</td>");
    expect(mail.html).not.toContain("<gelada>");
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "Resumo diário enviado", detail: DAY }),
    );

    send.mockRejectedValueOnce(new Error("mail delivery failed: 403"));
    await expect(sendDailySummary(admin, DAY)).rejects.toMatchObject({
      status: 502,
    });
    // Five per hour: three more go out, the sixth is refused.
    for (let attempt = 0; attempt < 3; attempt += 1)
      await sendDailySummary(admin, DAY);
    await expect(sendDailySummary(admin, DAY)).rejects.toMatchObject({
      status: 429,
    });
  });
});

it("reads a whole report from one snapshot, blind to sales committed halfway", async () => {
  await withTestPool(async (db) => {
    current = db;
    const [operator] = await db
      .insert(users)
      .values({
        name: "Carla",
        email: `${randomUUID()}@example.com`,
        role: "CASHIER",
      })
      .returning();
    // 1999 keeps this sale out of the periods the other tests read.
    const period = { from: "1999-01-04", to: "1999-01-04" };
    const sale = (total: number) =>
      db.insert(sales).values({
        userId: operator.id,
        total,
        amountReceived: total,
        change: 0,
        createdAt: new Date("1999-01-04T15:00:00Z"),
      });
    try {
      await sale(1000);
      const [before, after] = await readReport(async (tx) => {
        const first = await selectTotals(tx, period);
        // Committed on another connection while the report is halfway through.
        await sale(500);
        return [first, await selectTotals(tx, period)];
      });

      expect(after).toEqual(before);
      expect(before).toMatchObject({ revenue: 1000, salesCount: 1 });
      // The next report sees it.
      await expect(
        readReport((tx) => selectTotals(tx, period)),
      ).resolves.toMatchObject({ revenue: 1500, salesCount: 2 });
    } finally {
      await db.delete(sales).where(eq(sales.userId, operator.id));
      await db.delete(users).where(eq(users.id, operator.id));
    }
  });
});
