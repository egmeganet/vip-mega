import { Router } from "express";
import { db } from "@workspace/db";
import {
  subscribersTable, areasTable, subscriberServicesTable, plansTable,
  renewalsTable, walletTransactionsTable, debtsTable, debtPaymentsTable,
  financialEntriesTable, extraQuotaPackagesTable, subscriberExtraQuotasTable,
} from "@workspace/db/schema";
import { eq, and, ilike, or, sql, desc, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

function mapSubscriber(s: any, area?: any, service?: any, plan?: any) {
  return {
    id: s.id,
    nameAr: s.nameAr,
    nameEn: s.nameEn,
    phone: s.phone,
    alternatePhone: s.alternatePhone,
    type: s.type,
    status: s.status,
    areaId: s.areaId,
    areaNameAr: area?.nameAr,
    areaNameEn: area?.nameEn,
    address: s.address,
    walletBalance: Number(s.walletBalance || 0),
    notes: s.notes,
    currentPlanId: plan?.id,
    currentPlanNameAr: plan?.nameAr,
    currentPlanNameEn: plan?.nameEn,
    expiryDate: service?.expiryDate,
    createdAt: s.createdAt,
  };
}

router.get("/", async (req, res) => {
  const { search, status, area_id, type, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  let conditions: any[] = [];
  if (search) {
    conditions.push(
      or(
        ilike(subscribersTable.nameAr, `%${search}%`),
        ilike(subscribersTable.nameEn, `%${search}%`),
        ilike(subscribersTable.phone, `%${search}%`)
      )
    );
  }
  if (status) conditions.push(eq(subscribersTable.status, status));
  if (area_id) conditions.push(eq(subscribersTable.areaId, Number(area_id)));
  if (type) conditions.push(eq(subscribersTable.type, type));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(subscribersTable)
    .where(where);

  const subscribers = await db
    .select()
    .from(subscribersTable)
    .leftJoin(areasTable, eq(subscribersTable.areaId, areasTable.id))
    .where(where)
    .orderBy(desc(subscribersTable.createdAt))
    .limit(limitNum)
    .offset(offset);

  // Get active services
  const subIds = subscribers.map((s) => s.subscribers.id);
  const services = subIds.length > 0
    ? await db
        .select()
        .from(subscriberServicesTable)
        .leftJoin(plansTable, eq(subscriberServicesTable.planId, plansTable.id))
        .where(and(
          eq(subscriberServicesTable.status, "active"),
          sql`${subscriberServicesTable.subscriberId} = ANY(${sql.raw(`ARRAY[${subIds.join(",")}]`)})`
        ))
    : [];

  const serviceMap = new Map(services.map((s) => [s.subscriber_services.subscriberId, s]));

  const data = subscribers.map(({ subscribers: s, areas: area }) => {
    const svc = serviceMap.get(s.id);
    return mapSubscriber(s, area, svc?.subscriber_services, svc?.plans);
  });

  res.json({
    data,
    total: Number(total),
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(Number(total) / limitNum),
  });
});

router.post("/", async (req, res) => {
  const { nameAr, nameEn, phone, alternatePhone, type, areaId, address, notes, initialPlanId } = req.body;
  const [subscriber] = await db
    .insert(subscribersTable)
    .values({ nameAr, nameEn, phone, alternatePhone, type: type || "pppoe", status: "active", areaId, address, notes, walletBalance: "0" })
    .returning();

  if (initialPlanId) {
    const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, Number(initialPlanId))).limit(1);
    if (plan) {
      const startDate = new Date();
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + (plan.durationDays || 30));
      await db.insert(subscriberServicesTable).values({
        subscriberId: subscriber.id,
        planId: plan.id,
        startDate: startDate.toISOString().split("T")[0],
        expiryDate: expiryDate.toISOString().split("T")[0],
        remainingGigabytes: plan.gigabytes,
        status: "active",
      });
    }
  }

  res.status(201).json(mapSubscriber(subscriber));
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(subscribersTable)
    .leftJoin(areasTable, eq(subscribersTable.areaId, areasTable.id))
    .where(eq(subscribersTable.id, id))
    .limit(1);

  if (!row) { res.status(404).json({ error: "not_found" }); return; }

  const [activeService] = await db
    .select()
    .from(subscriberServicesTable)
    .leftJoin(plansTable, eq(subscriberServicesTable.planId, plansTable.id))
    .where(and(eq(subscriberServicesTable.subscriberId, id), eq(subscriberServicesTable.status, "active")))
    .limit(1);

  const services = await db
    .select()
    .from(subscriberServicesTable)
    .leftJoin(plansTable, eq(subscriberServicesTable.planId, plansTable.id))
    .where(eq(subscriberServicesTable.subscriberId, id))
    .orderBy(desc(subscriberServicesTable.createdAt))
    .limit(10);

  const recentRenewals = await db
    .select()
    .from(renewalsTable)
    .where(eq(renewalsTable.subscriberId, id))
    .orderBy(desc(renewalsTable.createdAt))
    .limit(10);

  const walletTxns = await db
    .select()
    .from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.subscriberId, id))
    .orderBy(desc(walletTransactionsTable.createdAt))
    .limit(20);

  const debts = await db
    .select()
    .from(debtsTable)
    .where(eq(debtsTable.subscriberId, id))
    .orderBy(desc(debtsTable.createdAt))
    .limit(10);

  const base = mapSubscriber(row.subscribers, row.areas, activeService?.subscriber_services, activeService?.plans);

  res.json({
    ...base,
    services: services.map((s) => ({
      id: s.subscriber_services.id,
      subscriberId: s.subscriber_services.subscriberId,
      planId: s.subscriber_services.planId,
      planNameAr: s.plans?.nameAr,
      planNameEn: s.plans?.nameEn,
      startDate: s.subscriber_services.startDate,
      expiryDate: s.subscriber_services.expiryDate,
      remainingGigabytes: Number(s.subscriber_services.remainingGigabytes || 0),
      status: s.subscriber_services.status,
      createdAt: s.subscriber_services.createdAt,
    })),
    recentRenewals: recentRenewals.map((r) => ({
      id: r.id, subscriberId: r.subscriberId, planId: r.planId, userId: r.userId,
      amount: Number(r.amount), paymentType: r.paymentType, renewalDate: r.renewalDate,
      newExpiryDate: r.newExpiryDate, notes: r.notes, createdAt: r.createdAt,
    })),
    walletTransactions: walletTxns.map((t) => ({
      id: t.id, subscriberId: t.subscriberId, userId: t.userId,
      type: t.type, amount: Number(t.amount), balanceAfter: Number(t.balanceAfter),
      description: t.description, createdAt: t.createdAt,
    })),
    debts: debts.map((d) => ({
      id: d.id, subscriberId: d.subscriberId, renewalId: d.renewalId,
      amount: Number(d.amount), paidAmount: Number(d.paidAmount || 0),
      remainingAmount: Number(d.amount) - Number(d.paidAmount || 0),
      status: d.status, dueDate: d.dueDate, notes: d.notes, createdAt: d.createdAt,
    })),
  });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nameAr, nameEn, phone, alternatePhone, type, areaId, address, notes } = req.body;
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (nameAr !== undefined) updates.nameAr = nameAr;
  if (nameEn !== undefined) updates.nameEn = nameEn;
  if (phone !== undefined) updates.phone = phone;
  if (alternatePhone !== undefined) updates.alternatePhone = alternatePhone;
  if (type !== undefined) updates.type = type;
  if (areaId !== undefined) updates.areaId = areaId;
  if (address !== undefined) updates.address = address;
  if (notes !== undefined) updates.notes = notes;
  const [s] = await db.update(subscribersTable).set(updates).where(eq(subscribersTable.id, id)).returning();
  if (!s) { res.status(404).json({ error: "not_found" }); return; }
  res.json(mapSubscriber(s));
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(subscribersTable).where(eq(subscribersTable.id, id));
  res.json({ success: true });
});

// Deposit to wallet
router.post("/:id/deposit", async (req, res) => {
  const subscriberId = Number(req.params.id);
  const authUser = (req as any).user;
  const { amount, paymentMethod, description } = req.body;
  if (!amount || !paymentMethod) {
    res.status(400).json({ error: "bad_request", message: "amount and paymentMethod required" });
    return;
  }

  const [subscriber] = await db.select().from(subscribersTable).where(eq(subscribersTable.id, subscriberId)).limit(1);
  if (!subscriber) { res.status(404).json({ error: "not_found" }); return; }

  const currentBalance = Number(subscriber.walletBalance || 0);
  const newBalance = currentBalance + Number(amount);

  await db.update(subscribersTable).set({ walletBalance: String(newBalance), updatedAt: new Date() }).where(eq(subscribersTable.id, subscriberId));

  const [txn] = await db.insert(walletTransactionsTable).values({
    subscriberId,
    userId: authUser.id,
    type: "deposit",
    amount: String(amount),
    balanceAfter: String(newBalance),
    description: description || `Deposit via ${paymentMethod}`,
  }).returning();

  await db.insert(financialEntriesTable).values({
    referenceType: "wallet_transaction",
    referenceId: txn.id,
    subscriberId,
    userId: authUser.id,
    type: "deposit",
    direction: "credit",
    amount: String(amount),
    description: `Wallet deposit via ${paymentMethod}`,
  });

  res.json({
    id: txn.id, subscriberId: txn.subscriberId, userId: txn.userId,
    type: txn.type, amount: Number(txn.amount), balanceAfter: Number(txn.balanceAfter),
    description: txn.description, createdAt: txn.createdAt,
  });
});

// Renew subscription
router.post("/:id/renew", async (req, res) => {
  const subscriberId = Number(req.params.id);
  const authUser = (req as any).user;
  const { planId, paymentType, amount, notes } = req.body;

  const [subscriber] = await db.select().from(subscribersTable).where(eq(subscribersTable.id, subscriberId)).limit(1);
  if (!subscriber) { res.status(404).json({ error: "not_found" }); return; }

  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, Number(planId))).limit(1);
  if (!plan) { res.status(404).json({ error: "plan_not_found" }); return; }

  const renewalAmount = amount || Number(plan.price);
  const isDeferred = paymentType === "deferred";

  // Handle wallet payment
  if (paymentType === "wallet") {
    const walletBal = Number(subscriber.walletBalance || 0);
    if (walletBal < Number(plan.price)) {
      res.status(400).json({ error: "insufficient_wallet", message: "Insufficient wallet balance" });
      return;
    }
    await db.update(subscribersTable).set({ walletBalance: String(walletBal - Number(plan.price)), updatedAt: new Date() }).where(eq(subscribersTable.id, subscriberId));
    await db.insert(walletTransactionsTable).values({
      subscriberId, userId: authUser.id, type: "deduction",
      amount: String(plan.price), balanceAfter: String(walletBal - Number(plan.price)),
      description: `Renewal - ${plan.nameEn}`,
    });
  }

  const today = new Date();
  const newExpiry = new Date(today);
  newExpiry.setDate(newExpiry.getDate() + plan.durationDays);
  const newExpiryDate = newExpiry.toISOString().split("T")[0];

  const [renewal] = await db.insert(renewalsTable).values({
    subscriberId, planId: plan.id, userId: authUser.id,
    amount: String(renewalAmount), paymentType,
    renewalDate: today, newExpiryDate, notes,
  }).returning();

  // Expire old active services
  await db.update(subscriberServicesTable)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(eq(subscriberServicesTable.subscriberId, subscriberId), eq(subscriberServicesTable.status, "active")));

  // Create new service
  await db.insert(subscriberServicesTable).values({
    subscriberId, planId: plan.id,
    startDate: today.toISOString().split("T")[0],
    expiryDate: newExpiryDate,
    remainingGigabytes: plan.gigabytes,
    status: "active",
  });

  await db.update(subscribersTable).set({ status: "active", updatedAt: new Date() }).where(eq(subscribersTable.id, subscriberId));

  // Create financial entry
  await db.insert(financialEntriesTable).values({
    referenceType: "renewal",
    referenceId: renewal.id,
    subscriberId, userId: authUser.id,
    type: isDeferred ? "deferred_renewal" : "renewal",
    direction: "credit",
    amount: String(renewalAmount),
    description: `Renewal - ${plan.nameEn} - ${paymentType}`,
  });

  // Create debt if deferred
  if (isDeferred) {
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);
    await db.insert(debtsTable).values({
      subscriberId, renewalId: renewal.id,
      amount: String(plan.price), paidAmount: "0",
      status: "unpaid",
      dueDate: dueDate.toISOString().split("T")[0],
      notes: `Deferred renewal - ${plan.nameEn}`,
    });
  }

  res.json({
    id: renewal.id, subscriberId: renewal.subscriberId, planId: renewal.planId,
    planNameAr: plan.nameAr, planNameEn: plan.nameEn,
    userId: renewal.userId, amount: Number(renewal.amount),
    paymentType: renewal.paymentType, renewalDate: renewal.renewalDate,
    newExpiryDate: renewal.newExpiryDate, notes: renewal.notes, createdAt: renewal.createdAt,
  });
});

// Add extra quota
router.post("/:id/add-extra-quota", async (req, res) => {
  const subscriberId = Number(req.params.id);
  const authUser = (req as any).user;
  const { extraPackageId, paymentType, notes } = req.body;

  const [subscriber] = await db.select().from(subscribersTable).where(eq(subscribersTable.id, subscriberId)).limit(1);
  if (!subscriber) { res.status(404).json({ error: "not_found" }); return; }

  const [pkg] = await db.select().from(extraQuotaPackagesTable).where(eq(extraQuotaPackagesTable.id, Number(extraPackageId))).limit(1);
  if (!pkg) { res.status(404).json({ error: "package_not_found" }); return; }

  const [quota] = await db.insert(subscriberExtraQuotasTable).values({
    subscriberId, extraPackageId: pkg.id, userId: authUser.id,
    gigabytes: pkg.gigabytes, price: pkg.price,
    paymentType, extendsExpiry: pkg.extendsExpiry ?? false, notes,
  }).returning();

  // Update remaining GB on active service
  const [activeService] = await db.select().from(subscriberServicesTable)
    .where(and(eq(subscriberServicesTable.subscriberId, subscriberId), eq(subscriberServicesTable.status, "active")))
    .limit(1);

  if (activeService) {
    const newGb = Number(activeService.remainingGigabytes || 0) + Number(pkg.gigabytes);
    await db.update(subscriberServicesTable).set({ remainingGigabytes: String(newGb), updatedAt: new Date() })
      .where(eq(subscriberServicesTable.id, activeService.id));
  }

  await db.insert(financialEntriesTable).values({
    referenceType: "extra_quota",
    referenceId: quota.id,
    subscriberId, userId: authUser.id,
    type: "extra_quota",
    direction: "credit",
    amount: quota.price,
    description: `Extra quota - ${pkg.nameEn} - ${Number(pkg.gigabytes)}GB`,
  });

  res.json({
    id: quota.id, subscriberId: quota.subscriberId, extraPackageId: quota.extraPackageId,
    packageNameAr: pkg.nameAr, packageNameEn: pkg.nameEn,
    gigabytes: Number(quota.gigabytes), price: Number(quota.price),
    paymentType: quota.paymentType, createdAt: quota.createdAt,
  });
});

export default router;
