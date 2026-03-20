import React, { createContext, useContext, useEffect, useState } from "react";

type Locale = "ar" | "en";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  ar: {
    dashboard: "لوحة التحكم",
    subscribers: "المشتركون",
    plans: "الباقات",
    extra_quotas: "الجيجا الإضافية",
    packages: "إدارة الباقات",
    finance: "المالية",
    renewals: "التجديدات",
    wallet: "المحفظة",
    debts: "الديون",
    ledger: "دفتر الأستاذ",
    areas: "المناطق",
    price_tiers: "شرائح التسعير",
    users: "المستخدمون",
    settings: "الإعدادات",
    login: "تسجيل الدخول",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    sign_in: "دخول",
    logout: "تسجيل خروج",
    search: "بحث...",
    add_new: "إضافة جديد",
    status: "الحالة",
    active: "نشط",
    suspended: "موقوف",
    expired: "منتهي",
    cancelled: "ملغى",
    total_subscribers: "إجمالي المشتركين",
    revenue_today: "إيرادات اليوم",
    revenue_month: "إيرادات الشهر",
    total_debts: "إجمالي الديون",
    save: "حفظ",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض",
    deposit: "إيداع",
    renew: "تجديد",
    pay: "سداد",
    name_ar: "الاسم (عربي)",
    name_en: "الاسم (إنجليزي)",
    phone: "رقم الهاتف",
    type: "النوع",
    area: "المنطقة",
    address: "العنوان",
    balance: "الرصيد",
    amount: "المبلغ",
    payment_method: "طريقة الدفع",
    cash: "نقدي",
    vodafone_cash: "فودافون كاش",
    bank_transfer: "تحويل بنكي",
    wallet_deduction: "خصم من المحفظة",
    deferred: "آجل (دين)",
    price: "السعر",
    gb: "جيجابايت",
    duration: "المدة (أيام)",
    description: "الوصف / ملاحظات",
    created_at: "تاريخ الإنشاء",
    actions: "الإجراءات",
  },
  en: {
    dashboard: "Dashboard",
    subscribers: "Subscribers",
    plans: "Plans",
    extra_quotas: "Extra Quotas",
    packages: "Packages",
    finance: "Finance",
    renewals: "Renewals",
    wallet: "Wallet",
    debts: "Debts",
    ledger: "Financial Ledger",
    areas: "Areas",
    price_tiers: "Price Tiers",
    users: "Users",
    settings: "Settings",
    login: "Login",
    email: "Email",
    password: "Password",
    sign_in: "Sign In",
    logout: "Logout",
    search: "Search...",
    add_new: "Add New",
    status: "Status",
    active: "Active",
    suspended: "Suspended",
    expired: "Expired",
    cancelled: "Cancelled",
    total_subscribers: "Total Subscribers",
    revenue_today: "Revenue Today",
    revenue_month: "Revenue Month",
    total_debts: "Total Debts",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    deposit: "Deposit",
    renew: "Renew",
    pay: "Pay",
    name_ar: "Name (AR)",
    name_en: "Name (EN)",
    phone: "Phone",
    type: "Type",
    area: "Area",
    address: "Address",
    balance: "Balance",
    amount: "Amount",
    payment_method: "Payment Method",
    cash: "Cash",
    vodafone_cash: "Vodafone Cash",
    bank_transfer: "Bank Transfer",
    wallet_deduction: "Wallet",
    deferred: "Deferred (Debt)",
    price: "Price",
    gb: "Gigabytes",
    duration: "Duration (Days)",
    description: "Description / Notes",
    created_at: "Created At",
    actions: "Actions",
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale;
    if (savedLocale && (savedLocale === "ar" || savedLocale === "en")) {
      setLocaleState(savedLocale);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = (key: string): string => {
    return translations[locale][key] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
