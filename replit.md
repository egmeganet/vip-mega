# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT via `jsonwebtoken` + `bcryptjs`

## Applications

### MEGA-TIK Finance & Subscribers ERP (`artifacts/megatik-erp`)

Full-featured ERP system for managing internet service provider (ISP) subscribers (PPPoE/Hotspot).

**Features:**
- Subscriber management (create/edit/delete, filter by status/area/type)
- Plans management (internet packages)
- Extra quota packages
- Wallet deposits and withdrawals
- Subscription renewal (cash, Vodafone Cash, bank transfer, wallet, deferred/debt)
- Extra GB quota addition
- Debt tracking (partial/full payments)
- Financial ledger (credit/debit entries)
- Dashboard with KPI cards and charts
- Arabic (RTL) / English (LTR) language toggle
- Role-based access: admin, supervisor, accountant, collector

**Default credentials:**
- Admin: admin@megatik.com / password
- Supervisor: supervisor@megatik.com / password
- Accountant: accountant@megatik.com / password
- Collector: collector@megatik.com / password

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── megatik-erp/        # MEGA-TIK ERP React frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
│   └── src/seed.ts         # Database seeder
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package
```

## Database Schema

Tables:
- `users` - System users with roles
- `areas` - Geographic areas
- `plans` - Internet subscription plans
- `extra_quota_packages` - Additional GB packages
- `subscribers` - Internet subscribers
- `subscriber_services` - Active subscriber services/plans
- `renewals` - Subscription renewal records
- `subscriber_extra_quotas` - Extra GB additions
- `wallet_transactions` - Wallet credit/debit history
- `financial_entries` - Financial ledger (double-entry)
- `debts` - Outstanding debts from deferred renewals
- `debt_payments` - Debt payment records
- `price_tiers` - Tiered GB pricing
- `settings` - System configuration

## API Routes

Base path: `/api`

- `POST /auth/login` - Login with email/password → JWT
- `GET /auth/me` - Get current user
- `GET /dashboard/stats` - KPI statistics
- `GET /dashboard/charts` - Chart data
- `GET/POST /areas` - Areas CRUD
- `GET/POST /plans` - Plans CRUD
- `GET/POST /extra-quota-packages` - Extra quota packages CRUD
- `GET/POST /subscribers` - Subscribers list/create
- `POST /subscribers/:id/deposit` - Wallet deposit
- `POST /subscribers/:id/renew` - Renew subscription
- `POST /subscribers/:id/add-extra-quota` - Add extra quota
- `GET /renewals` - Renewals list
- `GET /wallet-transactions` - Wallet transactions
- `GET /debts` - Debts list
- `POST /debts/:id/pay` - Pay debt
- `GET /financial-entries` - Financial ledger
- `GET/POST /price-tiers` - Price tiers CRUD
- `POST /pricing/calculate` - Calculate GB for given amount
- `GET/POST /users` - User management
- `GET/PUT /settings` - System settings

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json`. Run `pnpm run typecheck` for full typecheck.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`
- `pnpm --filter @workspace/scripts run seed` — seed the database

## Seed & Development

Run database seed: `pnpm --filter @workspace/scripts run seed`

Re-run codegen after OpenAPI changes: `pnpm --filter @workspace/api-spec run codegen`

Push schema changes to DB: `pnpm --filter @workspace/db run push`
