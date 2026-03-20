import { db } from "@workspace/db";
import {
  usersTable, areasTable, plansTable, extraQuotaPackagesTable,
  priceTiersTable, settingsTable,
} from "@workspace/db/schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Check if already seeded
  const existingUsers = await db.select().from(usersTable).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  // Create users
  const adminHash = await bcrypt.hash("password", 10);
  await db.insert(usersTable).values([
    { name: "مدير النظام", email: "admin@megatik.com", passwordHash: adminHash, role: "admin", locale: "ar" },
    { name: "مشرف", email: "supervisor@megatik.com", passwordHash: adminHash, role: "supervisor", locale: "ar" },
    { name: "محاسب", email: "accountant@megatik.com", passwordHash: adminHash, role: "accountant", locale: "ar" },
    { name: "موظف تحصيل", email: "collector@megatik.com", passwordHash: adminHash, role: "collector", locale: "ar" },
  ]);
  console.log("✅ Users created");

  // Create areas
  await db.insert(areasTable).values([
    { nameAr: "المنطقة الأولى", nameEn: "Area One" },
    { nameAr: "المنطقة الثانية", nameEn: "Area Two" },
    { nameAr: "المنطقة الثالثة", nameEn: "Area Three" },
    { nameAr: "المنطقة الرابعة", nameEn: "Area Four" },
    { nameAr: "وسط المدينة", nameEn: "City Center" },
  ]);
  console.log("✅ Areas created");

  // Create plans
  await db.insert(plansTable).values([
    { nameAr: "باقة الأساسية 10 جيجا", nameEn: "Basic 10GB", price: "100", gigabytes: "10", durationDays: 30, isActive: true },
    { nameAr: "باقة المتوسطة 25 جيجا", nameEn: "Standard 25GB", price: "200", gigabytes: "25", durationDays: 30, isActive: true },
    { nameAr: "باقة المتقدمة 50 جيجا", nameEn: "Advanced 50GB", price: "350", gigabytes: "50", durationDays: 30, isActive: true },
    { nameAr: "باقة الممتازة 100 جيجا", nameEn: "Premium 100GB", price: "600", gigabytes: "100", durationDays: 30, isActive: true },
    { nameAr: "باقة غير محدودة", nameEn: "Unlimited", price: "1000", gigabytes: "9999", durationDays: 30, isActive: true },
  ]);
  console.log("✅ Plans created");

  // Create extra quota packages
  await db.insert(extraQuotaPackagesTable).values([
    { nameAr: "5 جيجا إضافية", nameEn: "5GB Extra", gigabytes: "5", price: "50", extendsExpiry: false, isActive: true },
    { nameAr: "10 جيجا إضافية", nameEn: "10GB Extra", gigabytes: "10", price: "90", extendsExpiry: false, isActive: true },
    { nameAr: "20 جيجا إضافية", nameEn: "20GB Extra", gigabytes: "20", price: "160", extendsExpiry: true, isActive: true },
    { nameAr: "50 جيجا إضافية", nameEn: "50GB Extra", gigabytes: "50", price: "350", extendsExpiry: true, isActive: true },
  ]);
  console.log("✅ Extra quota packages created");

  // Create price tiers
  await db.insert(priceTiersTable).values([
    { minQuantity: "1", maxQuantity: "10", pricePerGb: "10", isActive: true },
    { minQuantity: "11", maxQuantity: "25", pricePerGb: "9", isActive: true },
    { minQuantity: "26", maxQuantity: "50", pricePerGb: "8", isActive: true },
    { minQuantity: "51", maxQuantity: "100", pricePerGb: "7", isActive: true },
    { minQuantity: "101", maxQuantity: "9999", pricePerGb: "6", isActive: true },
  ]);
  console.log("✅ Price tiers created");

  // Create default settings
  await db.insert(settingsTable).values([
    { key: "company_name_ar", value: "ميجا-تيك للانترنت" },
    { key: "company_name_en", value: "MEGA-TIK Internet" },
    { key: "currency", value: "EGP" },
    { key: "default_locale", value: "ar" },
    { key: "debt_due_days", value: "30" },
  ]);
  console.log("✅ Settings created");

  console.log("\n✨ Seeding complete!");
  console.log("\nDefault credentials:");
  console.log("  Admin:     admin@megatik.com / password");
  console.log("  Supervisor: supervisor@megatik.com / password");
  console.log("  Accountant: accountant@megatik.com / password");
  console.log("  Collector:  collector@megatik.com / password");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
