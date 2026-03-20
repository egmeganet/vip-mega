import { Router } from "express";
import { db } from "@workspace/db";
import {
  debtsTable, debtPaymentsTable, subscribersTable, usersTable, financialEntriesTable,
} from "@workspace/db/schema";
import { eq, and, desc, count, sum } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { subscriber_id, status, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  let conditions: any[] = [];
  if (subscriber_id) conditions.push(eq(debtsTable.subscriberId, Number(subscriber_id)));
  if (status) conditions.push(eq(debtsTable.status, status));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(debtsTable).where(where);
  const [totals] = await db.select({
    totalDebt: sum(debtsTable.amount),
    totalPaid: sum(debtsTable.paidAmount),
  }).from(debtsTable).where(where);

  const debts = await db
    .select()
    .from(debtsTable)
    .leftJoin(subscribersTable, eq(debtsTable.subscriberId, subscribersTable.id))
    .where(where)
    .orderBy(desc(debtsTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  const data = debts.map(({ debts: d, subscribers: s }) => ({
    id: d.id, subscriberId: d.subscriberId, subscriberNameAr: s?.nameAr, subscriberNameEn: s?.nameEn,
    renewalId: d.renewalId, amount: Number(d.amount), paidAmount: Number(d.paidAmount || 0),
    remainingAmount: Number(d.amount) - Number(d.paidAmount || 0),
    status: d.status, dueDate: d.dueDate, notes: d.notes, createdAt: d.createdAt,
  }));

  const totalDebt = Number(totals?.totalDebt || 0);
  const totalPaid = Number(totals?.totalPaid || 0);

  res.json({
    data, total: Number(total), page: pageNum, limit: limitNum,
    totalPages: Math.ceil(Number(total) / limitNum),
    totalDebt, totalPaid, totalRemaining: totalDebt - totalPaid,
  });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(debtsTable)
    .leftJoin(subscribersTable, eq(debtsTable.subscriberId, subscribersTable.id))
    .where(eq(debtsTable.id, id))
    .limit(1);

  if (!row) { res.status(404).json({ error: "not_found" }); return; }

  const payments = await db
    .select()
    .from(debtPaymentsTable)
    .leftJoin(usersTable, eq(debtPaymentsTable.userId, usersTable.id))
    .where(eq(debtPaymentsTable.debtId, id))
    .orderBy(desc(debtPaymentsTable.createdAt));

  const { debts: d, subscribers: s } = row;
  res.json({
    id: d.id, subscriberId: d.subscriberId, subscriberNameAr: s?.nameAr, subscriberNameEn: s?.nameEn,
    renewalId: d.renewalId, amount: Number(d.amount), paidAmount: Number(d.paidAmount || 0),
    remainingAmount: Number(d.amount) - Number(d.paidAmount || 0),
    status: d.status, dueDate: d.dueDate, notes: d.notes, createdAt: d.createdAt,
    payments: payments.map(({ debt_payments: p, users: u }) => ({
      id: p.id, debtId: p.debtId, userId: p.userId, userName: u?.name,
      amount: Number(p.amount), paymentMethod: p.paymentMethod, notes: p.notes, createdAt: p.createdAt,
    })),
  });
});

router.post("/:id/pay", async (req, res) => {
  const debtId = Number(req.params.id);
  const authUser = (req as any).user;
  const { amount, paymentMethod, notes } = req.body;

  const [debt] = await db.select().from(debtsTable).where(eq(debtsTable.id, debtId)).limit(1);
  if (!debt) { res.status(404).json({ error: "not_found" }); return; }

  const remaining = Number(debt.amount) - Number(debt.paidAmount || 0);
  const payAmount = Math.min(Number(amount), remaining);

  const newPaid = Number(debt.paidAmount || 0) + payAmount;
  const newStatus = newPaid >= Number(debt.amount) ? "paid" : "partial";

  await db.update(debtsTable).set({ paidAmount: String(newPaid), status: newStatus, updatedAt: new Date() })
    .where(eq(debtsTable.id, debtId));

  const [payment] = await db.insert(debtPaymentsTable).values({
    debtId, userId: authUser.id, amount: String(payAmount), paymentMethod, notes,
  }).returning();

  await db.insert(financialEntriesTable).values({
    referenceType: "debt_payment",
    referenceId: payment.id,
    subscriberId: debt.subscriberId,
    userId: authUser.id,
    type: "debt_payment",
    direction: "credit",
    amount: String(payAmount),
    description: `Debt payment - ${paymentMethod}`,
  });

  res.json({
    id: payment.id, debtId: payment.debtId, userId: payment.userId,
    amount: Number(payment.amount), paymentMethod: payment.paymentMethod,
    notes: payment.notes, createdAt: payment.createdAt,
  });
});

export default router;
