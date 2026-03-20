import { pgTable, serial, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const priceTiersTable = pgTable("price_tiers", {
  id: serial("id").primaryKey(),
  minQuantity: numeric("min_quantity", { precision: 10, scale: 2 }).notNull(),
  maxQuantity: numeric("max_quantity", { precision: 10, scale: 2 }).notNull(),
  pricePerGb: numeric("price_per_gb", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPriceTierSchema = createInsertSchema(priceTiersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPriceTier = z.infer<typeof insertPriceTierSchema>;
export type PriceTier = typeof priceTiersTable.$inferSelect;
