import { pgTable, serial, integer, numeric, varchar, date, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subscribersTable } from "./subscribers";
import { plansTable } from "./plans";
import { usersTable } from "./users";

export const renewalsTable = pgTable("renewals", {
  id: serial("id").primaryKey(),
  subscriberId: integer("subscriber_id").notNull().references(() => subscribersTable.id),
  planId: integer("plan_id").notNull().references(() => plansTable.id),
  userId: integer("user_id").references(() => usersTable.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: varchar("payment_type", { length: 50 }).notNull(),
  screenshotPath: text("screenshot_path"),
  detectedAmount: numeric("detected_amount", { precision: 10, scale: 2 }),
  renewalDate: timestamp("renewal_date").defaultNow(),
  newExpiryDate: date("new_expiry_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRenewalSchema = createInsertSchema(renewalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRenewal = z.infer<typeof insertRenewalSchema>;
export type Renewal = typeof renewalsTable.$inferSelect;
