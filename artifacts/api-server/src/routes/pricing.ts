import { Router } from "express";
import { db } from "@workspace/db";
import { priceTiersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/calculate", async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(Number(amount))) {
    res.status(400).json({ error: "bad_request", message: "Valid amount required" });
    return;
  }

  const tiers = await db.select().from(priceTiersTable).where(eq(priceTiersTable.isActive, true)).orderBy(priceTiersTable.minQuantity);

  if (tiers.length === 0) {
    res.status(404).json({ error: "no_tiers", message: "No active price tiers found" });
    return;
  }

  const amountNum = Number(amount);
  let bestTier = tiers[tiers.length - 1];
  let bestGb = 0;

  for (const tier of tiers) {
    const maxGbInTier = Number(tier.maxQuantity);
    const pricePerGb = Number(tier.pricePerGb);
    const affordableGb = amountNum / pricePerGb;

    if (affordableGb >= Number(tier.minQuantity)) {
      const gb = Math.min(affordableGb, maxGbInTier);
      if (gb > bestGb) {
        bestGb = gb;
        bestTier = tier;
      }
    }
  }

  res.json({
    amount: amountNum,
    gigabytes: Math.floor(bestGb),
    pricePerGb: Number(bestTier.pricePerGb),
    tier: {
      id: bestTier.id,
      minQuantity: Number(bestTier.minQuantity),
      maxQuantity: Number(bestTier.maxQuantity),
      pricePerGb: Number(bestTier.pricePerGb),
      isActive: bestTier.isActive,
      createdAt: bestTier.createdAt,
    },
  });
});

export default router;
