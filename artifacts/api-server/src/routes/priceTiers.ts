import { Router } from "express";
import { db } from "@workspace/db";
import { priceTiersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const tiers = await db.select().from(priceTiersTable).orderBy(priceTiersTable.minQuantity);
  res.json(tiers.map((t) => ({
    id: t.id, minQuantity: Number(t.minQuantity), maxQuantity: Number(t.maxQuantity),
    pricePerGb: Number(t.pricePerGb), isActive: t.isActive, createdAt: t.createdAt,
  })));
});

router.post("/", async (req, res) => {
  const { minQuantity, maxQuantity, pricePerGb, isActive } = req.body;
  const [tier] = await db
    .insert(priceTiersTable)
    .values({ minQuantity: String(minQuantity), maxQuantity: String(maxQuantity), pricePerGb: String(pricePerGb), isActive: isActive ?? true })
    .returning();
  res.status(201).json({
    id: tier.id, minQuantity: Number(tier.minQuantity), maxQuantity: Number(tier.maxQuantity),
    pricePerGb: Number(tier.pricePerGb), isActive: tier.isActive, createdAt: tier.createdAt,
  });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { minQuantity, maxQuantity, pricePerGb, isActive } = req.body;
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (minQuantity !== undefined) updates.minQuantity = String(minQuantity);
  if (maxQuantity !== undefined) updates.maxQuantity = String(maxQuantity);
  if (pricePerGb !== undefined) updates.pricePerGb = String(pricePerGb);
  if (isActive !== undefined) updates.isActive = isActive;
  const [tier] = await db.update(priceTiersTable).set(updates).where(eq(priceTiersTable.id, id)).returning();
  if (!tier) { res.status(404).json({ error: "not_found" }); return; }
  res.json({
    id: tier.id, minQuantity: Number(tier.minQuantity), maxQuantity: Number(tier.maxQuantity),
    pricePerGb: Number(tier.pricePerGb), isActive: tier.isActive, createdAt: tier.createdAt,
  });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(priceTiersTable).where(eq(priceTiersTable.id, id));
  res.json({ success: true });
});

export default router;
