import { pgTable, serial, integer, numeric, varchar, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subscribersTable } from "./subscribers";
import { plansTable } from "./plans";

export const subscriberServicesTable = pgTable("subscriber_services", {
  id: serial("id").primaryKey(),
  subscriberId: integer("subscriber_id").notNull().references(() => subscribersTable.id),
  planId: integer("plan_id").notNull().references(() => plansTable.id),
  startDate: date("start_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  remainingGigabytes: numeric("remaining_gigabytes", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriberServiceSchema = createInsertSchema(subscriberServicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscriberService = z.infer<typeof insertSubscriberServiceSchema>;
export type SubscriberService = typeof subscriberServicesTable.$inferSelect;
