import { pgTable, serial, varchar, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { areasTable } from "./areas";

export const subscribersTable = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  nameAr: varchar("name_ar", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  alternatePhone: varchar("alternate_phone", { length: 50 }),
  type: varchar("type", { length: 20 }).notNull().default("pppoe"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  areaId: integer("area_id").references(() => areasTable.id),
  address: text("address"),
  walletBalance: numeric("wallet_balance", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriberSchema = createInsertSchema(subscribersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribersTable.$inferSelect;
