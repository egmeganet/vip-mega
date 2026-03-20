import { Router } from "express";
import { db } from "@workspace/db";
import { financialEntriesTable, subscribersTable, usersTable } from "@workspace/db/schema";
import { eq, and, gte, lte, desc, count, sum } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { subscriber_id, type, direction, from_date, to_date, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  let conditions: any[] = [];
  if (subscriber_id) conditions.push(eq(financialEntriesTable.subscriberId, Number(subscriber_id)));
  if (type) conditions.push(eq(financialEntriesTable.type, type));
  if (direction) conditions.push(eq(financialEntriesTable.direction, direction));
  if (from_date) conditions.push(gte(financialEntriesTable.createdAt, new Date(from_date)));
  if (to_date) conditions.push(lte(financialEntriesTable.createdAt, new Date(to_date)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(financialEntriesTable).where(where);
  const [totals] = await db.select({
    totalCredit: sum(financialEntriesTable.amount),
  }).from(financialEntriesTable).where(and(where, eq(financialEntriesTable.direction, "credit")));

  const entries = await db
    .select()
    .from(financialEntriesTable)
    .leftJoin(subscribersTable, eq(financialEntriesTable.subscriberId, subscribersTable.id))
    .leftJoin(usersTable, eq(financialEntriesTable.userId, usersTable.id))
    .where(where)
    .orderBy(desc(financialEntriesTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  const data = entries.map(({ financial_entries: e, subscribers: s, users: u }) => ({
    id: e.id, referenceType: e.referenceType, referenceId: e.referenceId,
    subscriberId: e.subscriberId, subscriberNameAr: s?.nameAr,
    userId: e.userId, userName: u?.name,
    type: e.type, direction: e.direction, amount: Number(e.amount),
    description: e.description, createdAt: e.createdAt,
  }));

  const totalCredit = Number(totals?.totalCredit || 0);

  res.json({
    data, total: Number(total), page: pageNum, limit: limitNum,
    totalPages: Math.ceil(Number(total) / limitNum),
    totalDebit: 0, totalCredit,
  });
});

export default router;
