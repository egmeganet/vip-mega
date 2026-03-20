import { pgTable, serial, integer, numeric, varchar, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subscribersTable } from "./subscribers";
import { extraQuotaPackagesTable } from "./extraQuotaPackages";
import { usersTable } from "./users";

export const subscriberExtraQuotasTable = pgTable("subscriber_extra_quotas", {
  id: serial("id").primaryKey(),
  subscriberId: integer("subscriber_id").notNull().references(() => subscribersTable.id),
  extraPackageId: integer("extra_package_id").references(() => extraQuotaPackagesTable.id),
  userId: integer("user_id").references(() => usersTable.id),
  gigabytes: numeric("gigabytes", { precision: 10, scale: 2 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  paymentType: varchar("payment_type", { length: 50 }).notNull(),
  screenshotPath: text("screenshot_path"),
  detectedAmount: numeric("detected_amount", { precision: 10, scale: 2 }),
  extendsExpiry: boolean("extends_expiry").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriberExtraQuotaSchema = createInsertSchema(subscriberExtraQuotasTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscriberExtraQuota = z.infer<typeof insertSubscriberExtraQuotaSchema>;
export type SubscriberExtraQuota = typeof subscriberExtraQuotasTable.$inferSelect;
