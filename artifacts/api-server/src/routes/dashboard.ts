import { Router } from "express";
import { db } from "@workspace/db";
import {
  subscribersTable, renewalsTable, debtsTable, financialEntriesTable,
} from "@workspace/db/schema";
import { eq, and, gte, lte, count, sum, sql, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/stats", async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [{ totalSubscribers }] = await db.select({ totalSubscribers: count() }).from(subscribersTable);
  const [{ activeSubscribers }] = await db.select({ activeSubscribers: count() }).from(subscribersTable).where(eq(subscribersTable.status, "active"));
  const [{ expiredSubscribers }] = await db.select({ expiredSubscribers: count() }).from(subscribersTable).where(eq(subscribersTable.status, "expired"));

  const [todayRevenue] = await db.select({ total: sum(renewalsTable.amount) }).from(renewalsTable).where(gte(renewalsTable.renewalDate, today));
  const [monthRevenue] = await db.select({ total: sum(renewalsTable.amount) }).from(renewalsTable).where(gte(renewalsTable.renewalDate, monthStart));

  const [debtStats] = await db.select({
    totalDebts: sum(debtsTable.amount),
    pendingDebts: count(),
  }).from(debtsTable).where(eq(debtsTable.status, "unpaid"));

  const [{ renewalsToday }] = await db.select({ renewalsToday: count() }).from(renewalsTable).where(gte(renewalsTable.renewalDate, today));
  const [{ renewalsMonth }] = await db.select({ renewalsMonth: count() }).from(renewalsTable).where(gte(renewalsTable.renewalDate, monthStart));

  const [{ newSubscribersMonth }] = await db.select({ newSubscribersMonth: count() }).from(subscribersTable).where(gte(subscribersTable.createdAt, monthStart));

  res.json({
    totalSubscribers: Number(totalSubscribers),
    activeSubscribers: Number(activeSubscribers),
    expiredSubscribers: Number(expiredSubscribers),
    totalRevenueToday: Number(todayRevenue?.total || 0),
    totalRevenueMonth: Number(monthRevenue?.total || 0),
    totalDebts: Number(debtStats?.totalDebts || 0),
    pendingDebts: Number(debtStats?.pendingDebts || 0),
    renewalsToday: Number(renewalsToday),
    renewalsMonth: Number(renewalsMonth),
    newSubscribersMonth: Number(newSubscribersMonth),
  });
});

router.get("/charts", async (req, res) => {
  const period = (req.query.period as string) || "30d";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Revenue by day
  const dailyRevenue = await db
    .select({
      date: sql<string>`DATE(${renewalsTable.renewalDate})`.as("date"),
      amount: sum(renewalsTable.amount).as("amount"),
    })
    .from(renewalsTable)
    .where(gte(renewalsTable.renewalDate, startDate))
    .groupBy(sql`DATE(${renewalsTable.renewalDate})`)
    .orderBy(sql`DATE(${renewalsTable.renewalDate})`);

  // Subscribers by status
  const byStatus = await db
    .select({ status: subscribersTable.status, count: count() })
    .from(subscribersTable)
    .groupBy(subscribersTable.status);

  // Renewals by plan (top 5)
  const byPlan = await db
    .select({
      planId: renewalsTable.planId,
      count: count(),
    })
    .from(renewalsTable)
    .where(gte(renewalsTable.renewalDate, startDate))
    .groupBy(renewalsTable.planId)
    .orderBy(desc(count()))
    .limit(5);

  // Debts by month
  const debtsByMonth = await db
    .select({
      month: sql<string>`TO_CHAR(${debtsTable.createdAt}, 'YYYY-MM')`.as("month"),
      amount: sum(debtsTable.amount),
    })
    .from(debtsTable)
    .where(gte(debtsTable.createdAt, startDate))
    .groupBy(sql`TO_CHAR(${debtsTable.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${debtsTable.createdAt}, 'YYYY-MM')`);

  res.json({
    revenueByDay: dailyRevenue.map((r) => ({ date: r.date, amount: Number(r.amount || 0) })),
    subscribersByStatus: byStatus.map((s) => ({ status: s.status || "unknown", count: Number(s.count) })),
    renewalsByPlan: byPlan.map((p) => ({ planName: `Plan #${p.planId}`, count: Number(p.count) })),
    debtsByMonth: debtsByMonth.map((d) => ({ month: d.month, amount: Number(d.amount || 0) })),
  });
});

export default router;
