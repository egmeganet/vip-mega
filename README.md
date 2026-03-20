# نظام MEGA-TIK لإدارة مشتركي الإنترنت والمالية

<div dir="rtl">

> نظام ERP متكامل لشركات الإنترنت (ISP) يشمل إدارة المشتركين (PPPoE/Hotspot)، الباقات، المحافظ الإلكترونية، التجديدات، تتبع الديون، والتقارير المالية — مع واجهة عربية بالكامل.

---

## فهرس المحتويات

1. [متطلبات النظام](#1-متطلبات-النظام)
2. [التثبيت على الجهاز المحلي](#2-التثبيت-على-الجهاز-المحلي)
3. [بيانات الدخول الافتراضية](#3-بيانات-الدخول-الافتراضية)
4. [هيكل المشروع](#4-هيكل-المشروع)
5. [جداول قاعدة البيانات](#5-جداول-قاعدة-البيانات)
6. [متغيرات البيئة](#6-متغيرات-البيئة)
7. [النشر على الإنترنت](#7-النشر-على-الإنترنت)
   - [Railway](#71-النشر-على-railway)
   - [Render](#72-النشر-على-render)
   - [VPS / سيرفر خاص](#73-النشر-على-vps--سيرفر-خاص)
   - [Docker](#74-التشغيل-بـ-docker)
8. [ربط قاعدة بيانات خارجية](#8-ربط-قاعدة-بيانات-خارجية)
9. [واجهة برمجة التطبيقات (API)](#9-واجهة-برمجة-التطبيقات-api)
10. [صلاحيات الأدوار](#10-صلاحيات-الأدوار)

---

## 1. متطلبات النظام

| البرنامج | الإصدار الأدنى | الملاحظة |
|----------|---------------|----------|
| **Node.js** | 20 أو أحدث | يُنصح بـ Node.js 22 LTS |
| **pnpm** | 9 أو أحدث | مدير الحزم المستخدم في المشروع |
| **PostgreSQL** | 14 أو أحدث | قاعدة البيانات |
| **Git** | أي إصدار | لتنزيل الكود |

### تثبيت المتطلبات (Ubuntu/Debian)

```bash
# تثبيت Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت pnpm
npm install -g pnpm

# تثبيت PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### تثبيت المتطلبات (macOS)

```bash
# تثبيت Homebrew إذا لم يكن مثبتاً
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# تثبيت Node.js وpnpm وPostgreSQL
brew install node pnpm postgresql@16
brew services start postgresql@16
```

### تثبيت المتطلبات (Windows)

1. نزّل وثبّت **Node.js** من: https://nodejs.org
2. افتح PowerShell كمسؤول وشغّل:
   ```powershell
   npm install -g pnpm
   ```
3. نزّل وثبّت **PostgreSQL** من: https://www.postgresql.org/download/windows/

---

## 2. التثبيت على الجهاز المحلي

### الخطوة 1: تنزيل الكود

```bash
git clone https://github.com/YOUR_USERNAME/megatik-erp.git
cd megatik-erp
```

### الخطوة 2: إعداد قاعدة البيانات

```bash
# الدخول إلى PostgreSQL
sudo -u postgres psql

# داخل psql — إنشاء مستخدم وقاعدة بيانات جديدة
CREATE USER megatik WITH PASSWORD 'megatik_password_2024';
CREATE DATABASE megatik_erp OWNER megatik;
GRANT ALL PRIVILEGES ON DATABASE megatik_erp TO megatik;
\q
```

### الخطوة 3: إعداد ملف البيئة

```bash
# انسخ ملف البيئة المثال
cp .env.example .env

# افتح الملف وعدّل القيم
nano .env
```

محتوى ملف `.env` الذي يجب تعديله:

```env
DATABASE_URL=postgresql://megatik:megatik_password_2024@localhost:5432/megatik_erp
JWT_SECRET=ضع_هنا_مفتاح_سري_طويل_وعشوائي_لا_تشاركه
PORT=8080
NODE_ENV=development
FRONTEND_PORT=3000
BASE_PATH=/
```

### الخطوة 4: تثبيت المكتبات

```bash
pnpm install
```

### الخطوة 5: رفع جداول قاعدة البيانات

```bash
# ينشئ جميع الجداول تلقائياً في قاعدة البيانات
pnpm --filter @workspace/db run push
```

### الخطوة 6: تعبئة البيانات الأساسية

```bash
# يضيف المستخدمين والبيانات الأولية
pnpm --filter @workspace/scripts run seed
```

### الخطوة 7: تشغيل المشروع

**الطريقة الأولى (بسكريبت واحد):**

```bash
chmod +x scripts/local-start.sh
./scripts/local-start.sh
```

**الطريقة الثانية (يدوياً في تيرمينالين منفصلين):**

```bash
# التيرمينال الأول — تشغيل الـ API
PORT=8080 pnpm --filter @workspace/api-server run dev

# التيرمينال الثاني — تشغيل الواجهة الأمامية
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/megatik-erp run dev
```

### الخطوة 8: فتح التطبيق

افتح المتصفح على: **http://localhost:3000**

---

## 3. بيانات الدخول الافتراضية

| الدور | البريد الإلكتروني | كلمة المرور | الصلاحيات |
|-------|-------------------|-------------|-----------|
| **مدير النظام** | admin@megatik.com | `password` | كامل الصلاحيات |
| **المشرف** | supervisor@megatik.com | `password` | عرض وإدارة المشتركين والتقارير |
| **المحاسب** | accountant@megatik.com | `password` | السجل المالي والتقارير المالية |
| **المحصّل** | collector@megatik.com | `password` | تحصيل الاشتراكات والمدفوعات |

> ⚠️ **مهم:** غيّر كلمات المرور فوراً بعد أول تسجيل دخول في بيئة الإنتاج!

---

## 4. هيكل المشروع

```
megatik-erp/
├── artifacts/
│   ├── api-server/          # الخادم الخلفي (Express 5 + TypeScript)
│   │   └── src/
│   │       ├── routes/      # مسارات API
│   │       ├── lib/         # المصادقة والمساعدات
│   │       └── index.ts     # نقطة الدخول
│   └── megatik-erp/         # الواجهة الأمامية (React + Vite)
│       └── src/
│           ├── pages/       # صفحات التطبيق
│           ├── components/  # المكونات المشتركة
│           └── lib/         # الترجمة والمساعدات
├── lib/
│   ├── db/                  # Drizzle ORM + هيكل قاعدة البيانات
│   ├── api-spec/            # مواصفات OpenAPI
│   ├── api-client-react/    # Hooks التلقائية لاستدعاء API
│   └── api-zod/             # مخططات التحقق من البيانات
├── scripts/
│   └── src/seed.ts          # سكريبت تعبئة البيانات الأولية
├── .env.example             # نموذج ملف البيئة
└── README.md                # هذا الملف
```

---

## 5. جداول قاعدة البيانات

### جدول `users` — المستخدمون

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد تلقائي |
| name | VARCHAR(255) | الاسم الكامل |
| email | VARCHAR(255) | البريد الإلكتروني (فريد) |
| password_hash | TEXT | كلمة المرور المشفرة (bcrypt) |
| role | VARCHAR(50) | الدور: admin / supervisor / accountant / collector |
| locale | VARCHAR(10) | اللغة المفضلة: ar / en |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `areas` — المناطق الجغرافية

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| name_ar | VARCHAR(255) | اسم المنطقة بالعربية |
| name_en | VARCHAR(255) | اسم المنطقة بالإنجليزية |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `plans` — باقات الاشتراك

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| name_ar | VARCHAR(255) | اسم الباقة بالعربية |
| name_en | VARCHAR(255) | اسم الباقة بالإنجليزية |
| price | NUMERIC(10,2) | السعر الشهري |
| speed_mbps | NUMERIC(10,2) | السرعة بالميغابت |
| quota_gb | NUMERIC(10,2) | الحصة بالجيجابايت (فارغ = لا محدود) |
| validity_days | INTEGER | مدة الصلاحية بالأيام (افتراضي 30) |
| type | VARCHAR(50) | النوع: pppoe / hotspot |
| is_active | BOOLEAN | هل الباقة نشطة |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `extra_quota_packages` — حزم الكوتا الإضافية

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| name_ar | VARCHAR(255) | الاسم بالعربية |
| name_en | VARCHAR(255) | الاسم بالإنجليزية |
| gigabytes | NUMERIC(10,2) | حجم الكوتا بالجيجابايت |
| price | NUMERIC(10,2) | السعر |
| extends_expiry | BOOLEAN | هل تمدد تاريخ انتهاء الاشتراك |
| is_active | BOOLEAN | هل الحزمة نشطة |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `subscribers` — المشتركون

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| name | VARCHAR(255) | اسم المشترك |
| phone | VARCHAR(50) | رقم الهاتف |
| address | TEXT | العنوان |
| area_id | INTEGER | المنطقة (مرجع جدول areas) |
| username | VARCHAR(255) | اسم المستخدم (PPPoE/Hotspot) |
| status | VARCHAR(20) | الحالة: active / suspended / cancelled |
| type | VARCHAR(20) | النوع: pppoe / hotspot |
| wallet_balance | NUMERIC(10,2) | رصيد المحفظة |
| notes | TEXT | ملاحظات |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `subscriber_services` — خدمات المشترك الحالية

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| subscriber_id | INTEGER | المشترك (مرجع جدول subscribers) |
| plan_id | INTEGER | الباقة (مرجع جدول plans) |
| start_date | DATE | تاريخ بداية الخدمة |
| end_date | DATE | تاريخ انتهاء الخدمة |
| status | VARCHAR(20) | الحالة: active / expired / cancelled |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `renewals` — سجل التجديدات

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| subscriber_id | INTEGER | المشترك |
| plan_id | INTEGER | الباقة المجددة |
| user_id | INTEGER | الموظف الذي أجرى التجديد |
| amount | NUMERIC(10,2) | المبلغ المدفوع |
| payment_method | VARCHAR(50) | طريقة الدفع: cash / vodafone_cash / bank_transfer / wallet / deferred |
| payment_reference | VARCHAR(255) | رقم مرجع العملية |
| screenshot_path | TEXT | مسار صورة إثبات الدفع |
| start_date | DATE | بداية فترة الاشتراك |
| end_date | DATE | نهاية فترة الاشتراك |
| notes | TEXT | ملاحظات |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `subscriber_extra_quotas` — الكوتا الإضافية للمشتركين

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| subscriber_id | INTEGER | المشترك |
| package_id | INTEGER | حزمة الكوتا الإضافية |
| user_id | INTEGER | الموظف المنفذ |
| gigabytes | NUMERIC(10,2) | الجيجابايتات المضافة |
| amount | NUMERIC(10,2) | المبلغ المدفوع |
| payment_method | VARCHAR(50) | طريقة الدفع |
| created_at | TIMESTAMP | تاريخ الإضافة |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `wallet_transactions` — معاملات المحفظة

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| subscriber_id | INTEGER | المشترك |
| user_id | INTEGER | الموظف المنفذ |
| type | VARCHAR(50) | النوع: deposit / withdrawal / renewal / extra_quota |
| amount | NUMERIC(10,2) | المبلغ |
| balance_after | NUMERIC(10,2) | الرصيد بعد العملية |
| description | TEXT | وصف المعاملة |
| created_at | TIMESTAMP | تاريخ المعاملة |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `financial_entries` — السجل المالي

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| user_id | INTEGER | الموظف المنفذ |
| subscriber_id | INTEGER | المشترك (اختياري) |
| type | VARCHAR(20) | النوع: credit (دائن) / debit (مدين) |
| amount | NUMERIC(10,2) | المبلغ |
| category | VARCHAR(100) | التصنيف: renewal / deposit / extra_quota / debt_payment |
| description | TEXT | الوصف |
| reference_id | INTEGER | معرف مرجعي (رقم التجديد مثلاً) |
| reference_type | VARCHAR(50) | نوع المرجع |
| created_at | TIMESTAMP | تاريخ القيد |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `debts` — الديون

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| subscriber_id | INTEGER | المشترك المدين |
| renewal_id | INTEGER | التجديد المرتبط بالدين |
| amount | NUMERIC(10,2) | إجمالي الدين |
| paid_amount | NUMERIC(10,2) | المبلغ المسدد حتى الآن |
| status | VARCHAR(20) | الحالة: unpaid / partial / paid |
| due_date | DATE | تاريخ استحقاق السداد |
| notes | TEXT | ملاحظات |
| created_at | TIMESTAMP | تاريخ التسجيل |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `debt_payments` — مدفوعات الديون

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| debt_id | INTEGER | الدين (مرجع جدول debts) |
| user_id | INTEGER | الموظف المحصّل |
| amount | NUMERIC(10,2) | المبلغ المسدد |
| payment_method | VARCHAR(50) | طريقة السداد |
| screenshot_path | TEXT | صورة إثبات الدفع |
| notes | TEXT | ملاحظات |
| created_at | TIMESTAMP | تاريخ الدفعة |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `price_tiers` — شرائح الأسعار

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| min_gb | NUMERIC(10,2) | الحد الأدنى للجيجابايتات |
| max_gb | NUMERIC(10,2) | الحد الأقصى للجيجابايتات |
| price_per_gb | NUMERIC(10,2) | السعر لكل جيجابايت |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

### جدول `settings` — إعدادات النظام

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL | معرف فريد |
| key | VARCHAR(255) | مفتاح الإعداد (فريد) |
| value | TEXT | قيمة الإعداد |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ آخر تعديل |

---

## 6. متغيرات البيئة

| المتغير | القيمة الافتراضية | الوصف |
|---------|------------------|-------|
| `DATABASE_URL` | — | **مطلوب** — رابط اتصال PostgreSQL |
| `JWT_SECRET` | — | **مطلوب** — مفتاح تشفير JWT السري |
| `PORT` | `8080` | منفذ خادم API |
| `NODE_ENV` | `development` | بيئة التشغيل: development / production |
| `FRONTEND_PORT` | `3000` | منفذ خادم الواجهة الأمامية (للتطوير فقط) |
| `BASE_PATH` | `/` | المسار الأساسي للواجهة الأمامية |
| `API_PORT` | `8080` | منفذ API للاستخدام في proxy الـ Vite |

---

## 7. النشر على الإنترنت

### 7.1 النشر على Railway

[Railway](https://railway.app) هو أسهل منصة للنشر ويدعم PostgreSQL مجاناً.

**الخطوات:**

1. أنشئ حساباً على https://railway.app
2. اضغط **New Project** ← **Deploy from GitHub repo**
3. اختر المستودع
4. أضف قاعدة بيانات: **+ New** ← **Database** ← **PostgreSQL**
5. انسخ `DATABASE_URL` من إعدادات PostgreSQL
6. في إعدادات المشروع أضف متغيرات البيئة:
   ```
   DATABASE_URL=<الرابط المنسوخ>
   JWT_SECRET=<مفتاح سري قوي>
   NODE_ENV=production
   PORT=8080
   ```
7. اضبط **Start Command** لـ API:
   ```bash
   pnpm --filter @workspace/api-server run build && node artifacts/api-server/dist/index.js
   ```
8. للواجهة الأمامية أنشئ service منفصل بـ:
   ```bash
   BASE_PATH=/ pnpm --filter @workspace/megatik-erp run build
   ```
   ثم اضبط **Publish Directory** على `artifacts/megatik-erp/dist/public`

---

### 7.2 النشر على Render

[Render](https://render.com) يوفر طبقة مجانية مناسبة.

**إعداد قاعدة البيانات:**
1. أنشئ حساباً على https://render.com
2. اضغط **New** ← **PostgreSQL**
3. انسخ **External Database URL**

**إعداد الخادم الخلفي (API):**
1. **New** ← **Web Service**
2. اربطه بمستودع GitHub
3. الإعدادات:
   - **Environment:** Node
   - **Build Command:**
     ```bash
     npm install -g pnpm && pnpm install && pnpm run typecheck:libs && pnpm --filter @workspace/api-server run build
     ```
   - **Start Command:**
     ```bash
     node artifacts/api-server/dist/index.js
     ```
   - **Environment Variables:**
     ```
     DATABASE_URL=<رابط قاعدة البيانات>
     JWT_SECRET=<مفتاح سري>
     NODE_ENV=production
     PORT=10000
     ```

**إعداد الواجهة الأمامية:**
1. **New** ← **Static Site**
2. الإعدادات:
   - **Build Command:**
     ```bash
     npm install -g pnpm && pnpm install && BASE_PATH=/ pnpm --filter @workspace/megatik-erp run build
     ```
   - **Publish Directory:** `artifacts/megatik-erp/dist/public`
3. أضف **Rewrite Rule**: From `/*` To `/index.html` (Status 200)

---

### 7.3 النشر على VPS / سيرفر خاص

مناسب لأصحاب سيرفرات VPS (DigitalOcean, Hetzner, Linode, AWS EC2...).

#### الخطوة 1: تحضير السيرفر

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت pnpm
npm install -g pnpm

# تثبيت PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# تثبيت Nginx (كـ Reverse Proxy)
sudo apt-get install -y nginx

# تثبيت PM2 (لإدارة العمليات)
npm install -g pm2
```

#### الخطوة 2: إعداد قاعدة البيانات

```bash
sudo -u postgres psql
CREATE USER megatik WITH PASSWORD 'STRONG_PASSWORD_HERE';
CREATE DATABASE megatik_erp OWNER megatik;
GRANT ALL PRIVILEGES ON DATABASE megatik_erp TO megatik;
\q
```

#### الخطوة 3: استنساخ المشروع وبناؤه

```bash
# الانتقال إلى مجلد السيرفر
cd /var/www

# استنساخ المشروع
sudo git clone https://github.com/YOUR_USERNAME/megatik-erp.git
sudo chown -R $USER:$USER megatik-erp
cd megatik-erp

# إنشاء ملف .env
cp .env.example .env
nano .env
# عدّل القيم ثم احفظ (Ctrl+X, Y, Enter)

# تثبيت المكتبات وبناء المشروع
pnpm install
pnpm run typecheck:libs

# رفع قاعدة البيانات
pnpm --filter @workspace/db run push

# تعبئة البيانات الأولية
pnpm --filter @workspace/scripts run seed

# بناء الـ API
pnpm --filter @workspace/api-server run build

# بناء الواجهة الأمامية
BASE_PATH=/ pnpm --filter @workspace/megatik-erp run build
```

#### الخطوة 4: تشغيل الـ API بـ PM2

```bash
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'megatik-api',
    script: 'artifacts/api-server/dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 8080,
    },
    env_file: '.env',
  }]
};
EOF

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

#### الخطوة 5: إعداد Nginx

```bash
sudo nano /etc/nginx/sites-available/megatik-erp
```

ضع المحتوى التالي (غيّر `your-domain.com` باسم نطاقك):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # الواجهة الأمامية (الملفات الثابتة)
    root /var/www/megatik-erp/artifacts/megatik-erp/dist/public;
    index index.html;

    # API — يُحوّل لـ Express
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # React Router — أعد كل المسارات لـ index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# تفعيل الإعداد
sudo ln -s /etc/nginx/sites-available/megatik-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### الخطوة 6: إعداد SSL مجاني (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

### 7.4 التشغيل بـ Docker

إذا كان Docker مثبتاً على جهازك أو السيرفر.

أنشئ ملف `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: megatik
      POSTGRES_PASSWORD: megatik_password_2024
      POSTGRES_DB: megatik_erp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    restart: always
    environment:
      DATABASE_URL: postgresql://megatik:megatik_password_2024@postgres:5432/megatik_erp
      JWT_SECRET: your-secret-key-here
      NODE_ENV: production
      PORT: 8080
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  postgres_data:
```

أنشئ `Dockerfile.api`:

```dockerfile
FROM node:22-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install
RUN pnpm run typecheck:libs
RUN pnpm --filter @workspace/api-server run build
EXPOSE 8080
CMD ["node", "artifacts/api-server/dist/index.js"]
```

أنشئ `Dockerfile.frontend`:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install
RUN BASE_PATH=/ pnpm --filter @workspace/megatik-erp run build

FROM nginx:alpine
COPY --from=builder /app/artifacts/megatik-erp/dist/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

أنشئ `nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location /api/ {
        proxy_pass http://api:8080;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**تشغيل Docker:**

```bash
docker-compose up -d

# تعبئة قاعدة البيانات
docker-compose exec api pnpm --filter @workspace/db run push
docker-compose exec api pnpm --filter @workspace/scripts run seed
```

---

## 8. ربط قاعدة بيانات خارجية

يمكن ربط النظام بأي قاعدة بيانات PostgreSQL خارجية (Supabase, Neon, Aiven, ElephantSQL...).

### Supabase (مجاني)

1. أنشئ مشروعاً على https://supabase.com
2. اذهب إلى **Settings** ← **Database**
3. انسخ **Connection string** (URI format)
4. ضعه في `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```

### Neon (مجاني)

1. أنشئ مشروعاً على https://neon.tech
2. من لوحة التحكم انسخ **Connection string**
3. ضعه في `.env`:
   ```env
   DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### ملاحظة SSL

بعض قواعد البيانات الخارجية تتطلب SSL. في هذه الحالة أضف `?sslmode=require` لآخر رابط الاتصال.

---

## 9. واجهة برمجة التطبيقات (API)

Base URL: `http://localhost:8080/api`

### المصادقة

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@megatik.com",
  "password": "password"
}
```

الرد:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": { "id": 1, "name": "مدير النظام", "role": "admin" }
}
```

ضع التوكن في كل الطلبات التالية:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### نقاط النهاية الرئيسية

| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/api/auth/me` | بيانات المستخدم الحالي |
| GET | `/api/dashboard/stats` | إحصائيات لوحة التحكم |
| GET | `/api/dashboard/charts` | بيانات الرسوم البيانية |
| GET/POST | `/api/subscribers` | قائمة/إضافة مشتركين |
| GET/PUT/DELETE | `/api/subscribers/:id` | عرض/تعديل/حذف مشترك |
| POST | `/api/subscribers/:id/deposit` | إيداع في المحفظة |
| POST | `/api/subscribers/:id/renew` | تجديد الاشتراك |
| POST | `/api/subscribers/:id/add-extra-quota` | إضافة كوتا إضافية |
| GET/POST | `/api/plans` | الباقات |
| GET/POST | `/api/areas` | المناطق |
| GET/POST | `/api/extra-quota-packages` | حزم الكوتا الإضافية |
| GET | `/api/renewals` | سجل التجديدات |
| GET | `/api/wallet-transactions` | معاملات المحافظ |
| GET | `/api/debts` | قائمة الديون |
| POST | `/api/debts/:id/pay` | سداد دين |
| GET | `/api/financial-entries` | السجل المالي |
| GET/PUT | `/api/settings` | إعدادات النظام |
| GET/POST | `/api/users` | إدارة المستخدمين |
| POST | `/api/pricing/calculate` | حساب الجيجابايتات |

---

## 10. صلاحيات الأدوار

| الصلاحية | مدير (admin) | مشرف (supervisor) | محاسب (accountant) | محصّل (collector) |
|----------|:-----------:|:------------------:|:-----------------:|:-----------------:|
| إدارة المستخدمين | ✅ | ❌ | ❌ | ❌ |
| إدارة المناطق والباقات | ✅ | ✅ | ❌ | ❌ |
| إضافة/تعديل المشتركين | ✅ | ✅ | ❌ | ❌ |
| تجديد الاشتراكات | ✅ | ✅ | ❌ | ✅ |
| إيداع في المحفظة | ✅ | ✅ | ❌ | ✅ |
| إضافة كوتا إضافية | ✅ | ✅ | ❌ | ✅ |
| تحصيل الديون | ✅ | ✅ | ❌ | ✅ |
| عرض السجل المالي | ✅ | ✅ | ✅ | ❌ |
| الإعدادات | ✅ | ❌ | ❌ | ❌ |

---

## الدعم والمساهمة

- للإبلاغ عن مشكلة: افتح Issue على GitHub
- للمساهمة: افتح Pull Request

---

*نظام MEGA-TIK — مبني بـ Node.js + TypeScript + React + PostgreSQL*

</div>
