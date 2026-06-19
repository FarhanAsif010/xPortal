# xPortal — Currency Exchange Management Portal

Multi-tenant SaaS platform for managing currency exchange operations across multiple branches.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Auth**: Auth.js v5 (JWT strategy)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma 6
- **UI**: Tailwind CSS v3 + shadcn/ui + Radix UI
- **Language**: TypeScript

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in your Supabase database URLs and generate an `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Run database migration
```bash
npm run db:migrate
# or push without migration history:
npm run db:push
```

### 4. Seed the database
```bash
npm run db:seed
```
This creates:
- **Admin**: `admin@xportal.com` / `admin123`
- **Teller**: `teller@xportal.com` / `teller123`
- **Branch**: Main Branch
- **10 exchange rates**: EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, MXN, SGD

### 5. Start development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## User Roles

| Feature | Super Admin | Teller |
|---|---|---|
| Manage branches | ✅ | ❌ |
| Manage employees | ✅ | ❌ |
| Set exchange rates | ✅ | View only |
| Process transactions | ✅ | ✅ |
| View all branches' transactions | ✅ | Own branch only |
| View audit logs | ✅ | ❌ |

---

## Transaction Number Format
`TXN-YYYYMMDD-NNNNNN` — e.g. `TXN-20260611-000001`

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:push` | Push schema without migration history |
| `npm run db:seed` | Seed with demo data |
| `npm run db:studio` | Open Prisma Studio |
