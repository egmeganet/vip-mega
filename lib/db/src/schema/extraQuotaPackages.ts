import { pgTable, serial, varchar, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const extraQuotaPackagesTable = pgTable("extra_quota_packages", {
  id: serial("id").primaryKey(),
  nameAr: varchar("name_ar", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  gigabytes: numeric("gigabytes", { precision: 10, scale: 2 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  extendsExpiry: boolean("extends_expiry").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertExtraQuotaPackageSchema = createInsertSchema(extraQuotaPackagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExtraQuotaPackage = z.infer<typeof insertExtraQuotaPackageSchema>;
export type ExtraQuotaPackage = typeof extraQuotaPackagesTable.$inferSelect;
