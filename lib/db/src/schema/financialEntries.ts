import { pgTable, serial, integer, numeric, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subscribersTable } from "./subscribers";
import { usersTable } from "./users";

export const financialEntriesTable = pgTable("financial_entries", {
  id: serial("id").primaryKey(),
  referenceType: varchar("reference_type", { length: 100 }),
  referenceId: integer("reference_id"),
  subscriberId: integer("subscriber_id").references(() => subscribersTable.id),
  userId: integer("user_id").references(() => usersTable.id),
  type: varchar("type", { length: 100 }).notNull(),
  direction: varchar("direction", { length: 10 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFinancialEntrySchema = createInsertSchema(financialEntriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFinancialEntry = z.infer<typeof insertFinancialEntrySchema>;
export type FinancialEntry = typeof financialEntriesTable.$inferSelect;
