import { Router } from "express";
import { db } from "@workspace/db";
import { walletTransactionsTable, subscribersTable, usersTable } from "@workspace/db/schema";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const { subscriber_id, type, from_date, to_date, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  let conditions: any[] = [];
  if (subscriber_id) conditions.push(eq(walletTransactionsTable.subscriberId, Number(subscriber_id)));
  if (type) conditions.push(eq(walletTransactionsTable.type, type));
  if (from_date) conditions.push(gte(walletTransactionsTable.createdAt, new Date(from_date)));
  if (to_date) conditions.push(lte(walletTransactionsTable.createdAt, new Date(to_date)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(walletTransactionsTable).where(where);

  const txns = await db
    .select()
    .from(walletTransactionsTable)
    .leftJoin(subscribersTable, eq(walletTransactionsTable.subscriberId, subscribersTable.id))
    .leftJoin(usersTable, eq(walletTransactionsTable.userId, usersTable.id))
    .where(where)
    .orderBy(desc(walletTransactionsTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  const data = txns.map(({ wallet_transactions: t, subscribers: s, users: u }) => ({
    id: t.id, subscriberId: t.subscriberId, subscriberNameAr: s?.nameAr,
    userId: t.userId, userName: u?.name,
    type: t.type, amount: Number(t.amount), balanceAfter: Number(t.balanceAfter),
    description: t.description, createdAt: t.createdAt,
  }));

  res.json({ data, total: Number(total), page: pageNum, limit: limitNum, totalPages: Math.ceil(Number(total) / limitNum) });
});

export default router;
