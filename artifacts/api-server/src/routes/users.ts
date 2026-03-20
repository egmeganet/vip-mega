import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

function mapUser(u: typeof usersTable.$inferSelect) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, locale: u.locale, createdAt: u.createdAt };
}

router.get("/", requireRole("admin", "supervisor"), async (_req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  res.json(users.map(mapUser));
});

router.post("/", requireRole("admin"), async (req, res) => {
  const { name, email, password, role, locale } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash, role: role || "collector", locale: locale || "ar" }).returning();
  res.status(201).json(mapUser(user));
});

router.get("/:id", requireRole("admin", "supervisor"), async (req, res) => {
  const id = Number(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "not_found" }); return; }
  res.json(mapUser(user));
});

router.put("/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, password, role, locale } = req.body;
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (password !== undefined) updates.passwordHash = await bcrypt.hash(password, 10);
  if (role !== undefined) updates.role = role;
  if (locale !== undefined) updates.locale = locale;
  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "not_found" }); return; }
  res.json(mapUser(user));
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true });
});

export default router;
