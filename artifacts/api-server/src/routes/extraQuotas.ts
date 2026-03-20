import { Router } from "express";
import { db } from "@workspace/db";
import { extraQuotaPackagesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const packages = await db.select().from(extraQuotaPackagesTable).orderBy(extraQuotaPackagesTable.id);
  res.json(packages.map((p) => ({
    id: p.id, nameAr: p.nameAr, nameEn: p.nameEn,
    gigabytes: Number(p.gigabytes), price: Number(p.price),
    extendsExpiry: p.extendsExpiry, isActive: p.isActive, createdAt: p.createdAt,
  })));
});

router.post("/", async (req, res) => {
  const { nameAr, nameEn, gigabytes, price, extendsExpiry, isActive } = req.body;
  const [pkg] = await db
    .insert(extraQuotaPackagesTable)
    .values({ nameAr, nameEn, gigabytes: String(gigabytes), price: String(price), extendsExpiry: extendsExpiry ?? false, isActive: isActive ?? true })
    .returning();
  res.status(201).json({
    id: pkg.id, nameAr: pkg.nameAr, nameEn: pkg.nameEn,
    gigabytes: Number(pkg.gigabytes), price: Number(pkg.price),
    extendsExpiry: pkg.extendsExpiry, isActive: pkg.isActive, createdAt: pkg.createdAt,
  });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [pkg] = await db.select().from(extraQuotaPackagesTable).where(eq(extraQuotaPackagesTable.id, id)).limit(1);
  if (!pkg) { res.status(404).json({ error: "not_found" }); return; }
  res.json({ id: pkg.id, nameAr: pkg.nameAr, nameEn: pkg.nameEn, gigabytes: Number(pkg.gigabytes), price: Number(pkg.price), extendsExpiry: pkg.extendsExpiry, isActive: pkg.isActive, createdAt: pkg.createdAt });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nameAr, nameEn, gigabytes, price, extendsExpiry, isActive } = req.body;
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (nameAr !== undefined) updates.nameAr = nameAr;
  if (nameEn !== undefined) updates.nameEn = nameEn;
  if (gigabytes !== undefined) updates.gigabytes = String(gigabytes);
  if (price !== undefined) updates.price = String(price);
  if (extendsExpiry !== undefined) updates.extendsExpiry = extendsExpiry;
  if (isActive !== undefined) updates.isActive = isActive;
  const [pkg] = await db.update(extraQuotaPackagesTable).set(updates).where(eq(extraQuotaPackagesTable.id, id)).returning();
  if (!pkg) { res.status(404).json({ error: "not_found" }); return; }
  res.json({ id: pkg.id, nameAr: pkg.nameAr, nameEn: pkg.nameEn, gigabytes: Number(pkg.gigabytes), price: Number(pkg.price), extendsExpiry: pkg.extendsExpiry, isActive: pkg.isActive, createdAt: pkg.createdAt });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(extraQuotaPackagesTable).where(eq(extraQuotaPackagesTable.id, id));
  res.json({ success: true });
});

export default router;
