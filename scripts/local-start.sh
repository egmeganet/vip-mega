#!/bin/bash
# ============================================================
# سكريبت تشغيل MEGA-TIK ERP على الجهاز المحلي
# ============================================================

set -e

# تحميل متغيرات البيئة
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "✓ تم تحميل ملف .env"
else
  echo "⚠  لم يُوجد ملف .env، يُستخدم الإعدادات الافتراضية"
  export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/megatik_erp}"
  export JWT_SECRET="${JWT_SECRET:-megatik-erp-secret-key-change-this-in-production}"
fi

export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-8080}"
export FRONTEND_PORT="${FRONTEND_PORT:-3000}"
export BASE_PATH="${BASE_PATH:-/}"

echo ""
echo "========================================"
echo "  MEGA-TIK Finance & Subscribers ERP"
echo "========================================"
echo "  API  : http://localhost:$PORT"
echo "  Web  : http://localhost:$FRONTEND_PORT"
echo "========================================"
echo ""

# تثبيت المكتبات
echo "📦 تثبيت المكتبات..."
pnpm install

# بناء المكتبات المشتركة
echo "🔨 بناء المكتبات المشتركة..."
pnpm run typecheck:libs

# رفع جداول قاعدة البيانات
echo "🗃  رفع هيكل قاعدة البيانات..."
pnpm --filter @workspace/db run push

# تعبئة البيانات الأساسية
echo "🌱 تعبئة البيانات الأساسية..."
pnpm --filter @workspace/scripts run seed

echo ""
echo "🚀 تشغيل الخوادم..."
echo "  اضغط Ctrl+C لإيقاف التشغيل"
echo ""

# تشغيل الـ API والواجهة الأمامية بالتوازي
PORT=$PORT pnpm --filter @workspace/api-server run dev &
API_PID=$!

FRONTEND_PORT=$FRONTEND_PORT BASE_PATH=$BASE_PATH PORT=$FRONTEND_PORT pnpm --filter @workspace/megatik-erp run dev &
FRONTEND_PID=$!

trap "kill $API_PID $FRONTEND_PID 2>/dev/null; echo 'تم إيقاف الخوادم'" EXIT

wait
