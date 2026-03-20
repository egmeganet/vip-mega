import { pgTable, serial, integer, numeric, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { debtsTable } from "./debts";
import { usersTable } from "./users";

export const debtPaymentsTable = pgTable("debt_payments", {
  id: serial("id").primaryKey(),
  debtId: integer("debt_id").notNull().references(() => debtsTable.id),
  userId: integer("user_id").references(() => usersTable.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  screenshotPath: text("screenshot_path"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDebtPaymentSchema = createInsertSchema(debtPaymentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDebtPayment = z.infer<typeof insertDebtPaymentSchema>;
export type DebtPayment = typeof debtPaymentsTable.$inferSelect;
