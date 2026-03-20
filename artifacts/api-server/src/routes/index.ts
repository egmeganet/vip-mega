import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import areasRouter from "./areas.js";
import plansRouter from "./plans.js";
import extraQuotasRouter from "./extraQuotas.js";
import subscribersRouter from "./subscribers.js";
import renewalsRouter from "./renewals.js";
import walletRouter from "./wallet.js";
import debtsRouter from "./debts.js";
import financialEntriesRouter from "./financialEntries.js";
import priceTiersRouter from "./priceTiers.js";
import usersRouter from "./users.js";
import settingsRouter from "./settings.js";
import dashboardRouter from "./dashboard.js";
import pricingRouter from "./pricing.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/areas", areasRouter);
router.use("/plans", plansRouter);
router.use("/extra-quota-packages", extraQuotasRouter);
router.use("/subscribers", subscribersRouter);
router.use("/renewals", renewalsRouter);
router.use("/wallet-transactions", walletRouter);
router.use("/debts", debtsRouter);
router.use("/financial-entries", financialEntriesRouter);
router.use("/price-tiers", priceTiersRouter);
router.use("/users", usersRouter);
router.use("/settings", settingsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/pricing", pricingRouter);

export default router;
