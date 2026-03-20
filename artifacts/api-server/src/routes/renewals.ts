import { Router } from "express";
import { db } from "@workspace/db";
import { renewalsTable, subscribersTable, plansTable, usersTable } from "@workspace/db/schema";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { subscriber_id, payment_type, from_date, to_date, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  let conditions: any[] = [];
  if (subscriber_id) conditions.push(eq(renewalsTable.subscriberId, Number(subscriber_id)));
  if (payment_type) conditions.push(eq(renewalsTable.paymentType, payment_type));
  if (from_date) conditions.push(gte(renewalsTable.renewalDate, new Date(from_date)));
  if (to_date) conditions.push(lte(renewalsTable.renewalDate, new Date(to_date)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(renewalsTable).where(where);

  const renewals = await db
    .select()
    .from(renewalsTable)
    .leftJoin(subscribersTable, eq(renewalsTable.subscriberId, subscribersTable.id))
    .leftJoin(plansTable, eq(renewalsTable.planId, plansTable.id))
    .leftJoin(usersTable, eq(renewalsTable.userId, usersTable.id))
    .where(where)
    .orderBy(desc(renewalsTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  const data = renewals.map(({ renewals: r, subscribers: s, plans: p, users: u }) => ({
    id: r.id, subscriberId: r.subscriberId,
    subscriberNameAr: s?.nameAr, subscriberNameEn: s?.nameEn,
    planId: r.planId, planNameAr: p?.nameAr, planNameEn: p?.nameEn,
    userId: r.userId, userName: u?.name,
    amount: Number(r.amount), paymentType: r.paymentType,
    renewalDate: r.renewalDate, newExpiryDate: r.newExpiryDate,
    notes: r.notes, createdAt: r.createdAt,
  }));

  res.json({ data, total: Number(total), page: pageNum, limit: limitNum, totalPages: Math.ceil(Number(total) / limitNum) });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(renewalsTable)
    .leftJoin(subscribersTable, eq(renewalsTable.subscriberId, subscribersTable.id))
    .leftJoin(plansTable, eq(renewalsTable.planId, plansTable.id))
    .leftJoin(usersTable, eq(renewalsTable.userId, usersTable.id))
    .where(eq(renewalsTable.id, id))
    .limit(1);

  if (!row) { res.status(404).json({ error: "not_found" }); return; }
  const { renewals: r, subscribers: s, plans: p, users: u } = row;
  res.json({
    id: r.id, subscriberId: r.subscriberId,
    subscriberNameAr: s?.nameAr, subscriberNameEn: s?.nameEn,
    planId: r.planId, planNameAr: p?.nameAr, planNameEn: p?.nameEn,
    userId: r.userId, userName: u?.name,
    amount: Number(r.amount), paymentType: r.paymentType,
    renewalDate: r.renewalDate, newExpiryDate: r.newExpiryDate,
    notes: r.notes, createdAt: r.createdAt,
  });
});

export default router;
