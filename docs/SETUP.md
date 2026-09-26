# راه‌اندازی پروژه دیدار (Roomchi)

این سند برای توسعه‌دهندگان و نصب روی **سیستم جدید** (مثلاً بعد از `git clone` روی GitHub) است.

---

## ۱. پیش‌نیازها

| ابزار | نسخه پیشنهادی | یادداشت |
|--------|----------------|---------|
| Node.js | 20+ | برای `npm run dev` و Vite |
| Docker Desktop | آخرین پایدار | برای `docker compose` و Postgres |
| Git | — | کلون مخزن |

روی **Windows** ترمینال Git Bash یا PowerShell؛ روی **macOS/Linux** همان دستورات bash.

---

## ۲. نصب اولیه

```bash
git clone <repository-url>
cd didar
npm install
```

فایل محیط:

```bash
cp .env.example .env
```

در `.env` حداقل اتصال دیتابیس را تنظیم کنید (مقادیر پیش‌فرض Docker):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/didar_db
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=didar_db
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

---

## ۳. اجرای توسعه (همه‌چیز روی یک ماشین)

```bash
npm run dev
```

ترتیب کار:

1. `docker compose up -d --wait postgres` — ایمیج Postgres 16، volume `didar_pg_data`
2. در **اولین ساخت volume**: اجرای `schema.sql` و `schema/02-server-extensions.sql`
3. `tsx server.ts` — Express API + Vite (HMR) روی پورت **3000**

پیام‌های مورد انتظار در ترمینال:

- `✅ Connected to PostgreSQL database`
- `✅ API persistence: PostgreSQL`
- `Enterprise Meeting Room Server running on http://localhost:3000`

بررسی سریع:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/db/status
```

---

## ۴. فقط دیتابیس (بدون اپ)

```bash
npm run db:up
```

اتصال با `psql` یا DBeaver:

| فیلد | مقدار |
|------|--------|
| Host | `localhost` |
| Port | `5432` |
| Database | `didar_db` |
| User / Password | `postgres` / `postgres` |

لیست جدول‌ها:

```bash
docker exec -it didar-postgres psql -U postgres -d didar_db -c "\dt"
```

---

## ۵. سناریو: دیتابیس روی یک PC، اپ روی PC دیگر

**ماشین A (دیتابیس):**

```bash
git clone ...
cd didar
npm run db:up
```

فایروال: اجازه ورود به پورت **5432** از IP ماشین B.

**ماشین B (اپ):**

```bash
npm install
cp .env.example .env
```

در `.env`:

```env
DB_HOST=<IP-ماشین-A>
DATABASE_URL=postgresql://postgres:postgres@<IP-ماشین-A>:5432/didar_db
```

اجرا **بدون** Docker روی B:

```bash
npm run dev:app
```

---

## ۶. ریست کامل دیتابیس لوکال

همه داده‌های volume پاک می‌شود و اسکیما از نو ساخته می‌شود:

```bash
npm run db:reset
```

سپس دوباره `npm run dev` یا `npm run dev:app`.

---

## ۷. پورت 5432 اشغال است

اگر Postgres دیگری روی 5432 است:

```bash
DIDAR_PG_PORT=5433 docker compose up -d --wait postgres
```

در `.env` همان پورت را بگذارید:

```env
DB_PORT=5433
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/didar_db
```

---

## ۸. Production (خلاصه)

```bash
npm run build
NODE_ENV=production npm run start
```

- Postgres باید جداگانه (managed DB یا Docker روی سرور) در دسترس باشد.
- `JWT_SECRET` و رمزهای قوی در `.env` الزامی است.
- در production از `npm run dev` استفاده نکنید (Vite dev middleware).

---

## ۹. عیب‌یابی

| مشکل | احتمال | کار |
|------|--------|-----|
| API `503` / DatabaseUnavailable | `.env` ناقص یا Postgres خاموش | `npm run db:up` و بررسی `DATABASE_URL` |
| `docker compose` خطا | Docker روشن نیست | Docker Desktop را start کنید |
| لاگین ناموفق | seed نشده | یک بار سرور را restart کنید؛ یا `npm run db:reset` |
| جدول/ستون نیست | volume قدیمی قبل از migration | `npm run db:reset` یا دستی `schema/02-server-extensions.sql` |

لاگ Postgres:

```bash
npm run db:logs
```

---

## ۱۰. لینک‌های مرتبط

- [README اصلی](../README.md)
- [زمینه معماری و AI](../PROJECT_CONTEXT_AND_AI_PROMPT.md)
