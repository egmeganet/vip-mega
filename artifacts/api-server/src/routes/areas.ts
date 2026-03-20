import { Router } from "express";
import { db } from "@workspace/db";
import { areasTable, subscribersTable } from "@workspace/db/schema";
import { eq, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const areas = await db.select().from(areasTable).orderBy(areasTable.id);
  const counts = await db
    .select({ areaId: subscribersTable.areaId, count: count() })
    .from(subscribersTable)
    .groupBy(subscribersTable.areaId);
  const countMap = new Map(counts.map((c) => [c.areaId, Number(c.count)]));
  res.json(
    areas.map((a) => ({
      id: a.id,
      nameAr: a.nameAr,
      nameEn: a.nameEn,
      subscriberCount: countMap.get(a.id) || 0,
      createdAt: a.createdAt,
    }))
  );
});

router.post("/", async (req, res) => {
  const { nameAr, nameEn } = req.body;
  if (!nameAr || !nameEn) {
    res.status(400).json({ error: "bad_request", message: "nameAr and nameEn required" });
    return;
  }
  const [area] = await db.insert(areasTable).values({ nameAr, nameEn }).returning();
  res.status(201).json({ id: area.id, nameAr: area.nameAr, nameEn: area.nameEn, createdAt: area.createdAt });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [area] = await db.select().from(areasTable).where(eq(areasTable.id, id)).limit(1);
  if (!area) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ id: area.id, nameAr: area.nameAr, nameEn: area.nameEn, createdAt: area.createdAt });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nameAr, nameEn } = req.body;
  const [area] = await db
    .update(areasTable)
    .set({ nameAr, nameEn, updatedAt: new Date() })
    .where(eq(areasTable.id, id))
    .returning();
  if (!area) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ id: area.id, nameAr: area.nameAr, nameEn: area.nameEn, createdAt: area.createdAt });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(areasTable).where(eq(areasTable.id, id));
  res.json({ success: true });
});

export default router;
