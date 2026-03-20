import { Router } from "express";
import { db } from "@workspace/db";
import { plansTable, subscriberServicesTable } from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const plans = await db.select().from(plansTable).orderBy(plansTable.id);
  const counts = await db
    .select({ planId: subscriberServicesTable.planId, count: count() })
    .from(subscriberServicesTable)
    .where(eq(subscriberServicesTable.status, "active"))
    .groupBy(subscriberServicesTable.planId);
  const countMap = new Map(counts.map((c) => [c.planId, Number(c.count)]));
  const result = plans.map((p) => ({
    id: p.id,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    price: Number(p.price),
    gigabytes: Number(p.gigabytes),
    durationDays: p.durationDays,
    isActive: p.isActive,
    subscriberCount: countMap.get(p.id) || 0,
    createdAt: p.createdAt,
  }));
  if (req.query.active === "true") {
    res.json(result.filter((p) => p.isActive));
    return;
  }
  res.json(result);
});

router.post("/", async (req, res) => {
  const { nameAr, nameEn, price, gigabytes, durationDays, isActive } = req.body;
  const [plan] = await db
    .insert(plansTable)
    .values({ nameAr, nameEn, price: String(price), gigabytes: String(gigabytes), durationDays, isActive: isActive ?? true })
    .returning();
  res.status(201).json({
    id: plan.id,
    nameAr: plan.nameAr,
    nameEn: plan.nameEn,
    price: Number(plan.price),
    gigabytes: Number(plan.gigabytes),
    durationDays: plan.durationDays,
    isActive: plan.isActive,
    createdAt: plan.createdAt,
  });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, id)).limit(1);
  if (!plan) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ id: plan.id, nameAr: plan.nameAr, nameEn: plan.nameEn, price: Number(plan.price), gigabytes: Number(plan.gigabytes), durationDays: plan.durationDays, isActive: plan.isActive, createdAt: plan.createdAt });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nameAr, nameEn, price, gigabytes, durationDays, isActive } = req.body;
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (nameAr !== undefined) updates.nameAr = nameAr;
  if (nameEn !== undefined) updates.nameEn = nameEn;
  if (price !== undefined) updates.price = String(price);
  if (gigabytes !== undefined) updates.gigabytes = String(gigabytes);
  if (durationDays !== undefined) updates.durationDays = durationDays;
  if (isActive !== undefined) updates.isActive = isActive;
  const [plan] = await db.update(plansTable).set(updates).where(eq(plansTable.id, id)).returning();
  if (!plan) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ id: plan.id, nameAr: plan.nameAr, nameEn: plan.nameEn, price: Number(plan.price), gigabytes: Number(plan.gigabytes), durationDays: plan.durationDays, isActive: plan.isActive, createdAt: plan.createdAt });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(plansTable).where(eq(plansTable.id, id));
  res.json({ success: true });
});

export default router;
