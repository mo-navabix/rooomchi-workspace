# PostgreSQL — راه‌اندازی و استفاده (Rooomchi)

راهنمای **کامل و قابل حمل** برای اجرای Postgres پروژه روی سیستم جدید (Windows / macOS / Linux) با Docker، اتصال اپ، pgAdmin و خط فرمان.

---

## چک‌لیست سریع (سیستم جدید)

1. نصب **Docker Desktop** و اطمینان از روشن بودن آن  
2. `git clone` + `cd` به پوشه پروژه  
3. `cp .env.example .env` و تنظیم `DATABASE_URL` / `DB_*` (پایین)  
4. `npm install`  
5. `npm run dev` **یا** فقط DB: `npm run db:up`  
6. (اختیاری) UI: `npm run db:admin` → http://localhost:5050  

---

## مشخصات پیش‌فرض Docker (dev)

این مقادیر در `docker-compose.yml` **ثابت** هستند (از `.env` اپ خوانده نمی‌شوند):

| مورد | مقدار |
|------|--------|
| ایمیج | `postgres:16-alpine` |
| نام کانتینر | `rooomchi-postgres` |
| پورت روی host | `5432` (تغییر: `ROOOMCHI_PG_PORT`) |
| Database | `rooomchi_db` |
| User | `postgres` |
| Password | `postgres` |
| Volume داده | `didar_rooomchi_pg_data` (نام پروژه Compose + volume) |

**URL اتصال از همان ماشین (اپ روی host):**

```text
postgresql://postgres:postgres@localhost:5432/rooomchi_db
```

فایل `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rooomchi_db
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=rooomchi_db
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

---

## دستورات npm

| دستور | کار |
|--------|-----|
| `npm run db:up` | فقط Postgres |
| `npm run db:admin` | Postgres + pgAdmin (پورت **5050**) |
| `npm run db:admin:reset` | پاک کردن تنظیمات pgAdmin و بارگذاری دوباره سرور از `docker/pgadmin/servers.json` |
| `npm run db:down` | توقف Postgres (و pgAdmin اگر بالا بود) |
| `npm run db:logs` | لاگ Postgres |
| `npm run db:reset` | **حذف volume دیتابیس** + ساخت دوباره + اجرای `schema.sql` |
| `npm run db:sync` | **سینک seed** با DB موجود: extensions + دادهٔ مرجع + کاربران دمو |
| `npm run db:seed` | extensions + دادهٔ مرجع + کاربران دمو (`admin@rooomchi.ir` و …) |
| `npm run db:schema` | فقط `schema/02-server-extensions.sql` |
| `npm run db:status` | تست اتصال و شمارش ردیف‌های جداول |
| `npm run dev` | Postgres (منتظر healthy) + سرور اپ |
| `npm run dev:app` | فقط اپ (DB روی ماشین دیگر) |

---

## اولین بالا آمدن دیتابیس

وقتی volume خالی است، Docker این فایل‌ها را به ترتیب اجرا می‌کند:

1. `schema.sql` — جداول + دادهٔ seed اولیه  
2. `schema/02-server-extensions.sql` — ستون‌ها و جدول OTP  

بعد از `npm run dev`، سرور Express یک‌بار `seedDevDataIfNeeded()` را اجرا می‌کند (کاربران دمو مثل `admin@rooomchi.ir`).

اگر DB از قبل وجود دارد و می‌خواهید دادهٔ نمونه را **بدون پاک کردن volume** هم‌تراز کنید:

```bash
npm run db:up
npm run db:sync
```

فلگ‌های CLI (`tsx scripts/db-cli.ts --help`):

- `--force-users` — درج دوبارهٔ کاربران دمو (در صورت نبودن conflict)
- `--no-reference` — بدون `schema/idempotent-seed.sql`
- `--no-demo` — فقط دادهٔ SQL، بدون کاربران Express

رمز پیش‌فرض کاربران دمو: `password123`

بررسی سلامت:

```bash
curl http://localhost:3000/api/db/status
```

---

## سناریو A — همه‌چیز روی یک لپ‌تاپ

```bash
npm run dev
```

- اپ: http://localhost:3000  
- DB: `localhost:5432`  

---

## سناریو B — Postgres روی PC «سرور»، اپ روی PC دیگر

**روی ماشین DB (همان repo یا فقط Docker):**

```bash
npm run db:up
# یا: docker compose up -d postgres
```

- فایروال ویندوز: اجازه **ورودی TCP 5432** (فقط IP شبکهٔ مورد اعتماد).  
- IP ماشین DB را یادداشت کنید (مثلاً `192.168.1.50`).

**روی ماشین اپ:**

```env
DB_HOST=192.168.1.50
DATABASE_URL=postgresql://postgres:postgres@192.168.1.50:5432/rooomchi_db
```

```bash
npm run dev:app
```

> روی ماشین اپ **نیازی به Docker Postgres نیست**؛ فقط به IP سرور DB وصل می‌شوید.

---

## pgAdmin (Docker)

```bash
npm run db:admin
```

| | |
|--|--|
| آدرس | http://localhost:5050 |
| ورود pgAdmin | `pgadmin@rooomchi.ir` / `pgadmin` |

**Master Password:** اگر پرسید، برای dev می‌توانید خالی بگذارید (در compose غیرفعال شده است).

**سرور از قبل تعریف شده:** `Servers → Rooomchi PostgreSQL`  
اگر نمی‌بینید:

```bash
npm run db:admin:reset
```

| فیلد اتصال (داخل Docker pgAdmin) | مقدار |
|-----------------------------------|--------|
| Host | **`postgres`** (نه localhost) |
| Port | `5432` |
| Maintenance DB | `rooomchi_db` |
| Username / Password | `postgres` / `postgres` |

مسیر جداول:

`Servers → Rooomchi PostgreSQL → Databases → rooomchi_db → Schemas → public → Tables`

**Query Tool:** راست‌کلیک روی `rooomchi_db` → Query Tool → SQL → **F5**.

---

## pgAdmin / DBeaver روی ویندوز (بدون UI در Docker)

Postgres باید با `npm run db:up` بالا باشد.

| فیلد | مقدار |
|------|--------|
| Host | `localhost` |
| Port | `5432` |
| Database | `rooomchi_db` |
| User / Password | `postgres` / `postgres` |

---

## خط فرمان (`psql`)

```bash
docker exec -it rooomchi-postgres psql -U postgres -d rooomchi_db
```

داخل `psql`:

| دستور | معنی |
|--------|------|
| `\dt` | لیست جداول |
| `\d users` | ساختار جدول `users` |
| `\l` | لیست دیتابیس‌ها |
| `\q` | خروج |

### ⚠️ کوئری را روی کدام دیتابیس بزنید؟

در pgAdmin دو دیتابیس می‌بینید: **`postgres`** (خالی، بدون جدول `rooms`) و **`rooomchi_db`** (دادهٔ اپ).

اگر `SELECT * FROM rooms` روی **`postgres`** بزنید خطا می‌گیرید یا نتیجه خالی است.  
**Query Tool** را از روی **`rooomchi_db`** باز کنید (راست‌کلیک → Query Tool).

تأیید سریع از مرورگر/ترمینال:

```bash
curl http://localhost:3000/api/db/status
```

فیلد `database` باید `rooomchi_db` باشد؛ `tableCounts.rooms` باید با لیست سایت یکی باشد.

نمونه کوئری (روی **`rooomchi_db`**):

```sql
SELECT id, name, code, organization_id, created_at FROM rooms ORDER BY created_at DESC;
SELECT id, email, role FROM users LIMIT 10;
SELECT COUNT(*) FROM bookings;
```

یک‌خطی:

```bash
docker exec rooomchi-postgres psql -U postgres -d rooomchi_db -c "SELECT current_database(), COUNT(*) FROM organizations;"
```

---

## جداول اصلی پروژه

| جدول | نقش |
|------|-----|
| `organizations` | سازمان‌ها |
| `users` | کاربران |
| `rooms` | اتاق‌ها |
| `bookings` | رزروها |
| `teams` / `team_members` | تیم‌ها |
| `audit_logs` | لاگ |
| `verification_codes` | OTP / بازنشانی رمز |
| `organization_auth_settings` | SSO (آینده) |

---

## پورت 5432 اشغال است

```bash
ROOOMCHI_PG_PORT=5433 docker compose up -d postgres
```

در `.env` اپ:

```env
DB_PORT=5433
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/rooomchi_db
```

---

## ریست کامل دیتابیس (شروع از صفر)

**همهٔ دادهٔ لوکال پاک می‌شود.**

```bash
npm run db:reset
```

سپس دوباره `npm run dev` یا `npm run db:up`.

---

## پشتیبان و بازگردانی (انتقال به سیستم دیگر)

**خروجی:**

```bash
docker exec rooomchi-postgres pg_dump -U postgres -d rooomchi_db -F c -f /tmp/rooomchi.dump
docker cp rooomchi-postgres:/tmp/rooomchi.dump ./rooomchi.dump
```

**ورود (روی سیستم جدید بعد از `db:up` و ساخت خالی DB):**

```bash
docker cp ./rooomchi.dump rooomchi-postgres:/tmp/rooomchi.dump
docker exec rooomchi-postgres pg_restore -U postgres -d rooomchi_db --clean --if-exists /tmp/rooomchi.dump
```

برای dump ساده SQL:

```bash
docker exec rooomchi-postgres pg_dump -U postgres rooomchi_db > rooomchi_backup.sql
```

---

## عیب‌یابی

| علامت | احتمال | کار |
|--------|--------|-----|
| API `503` / DatabaseUnavailable | `.env` ناقص یا Postgres خاموش | `npm run db:up`، چک `DATABASE_URL` |
| `connection refused` | Docker خاموش یا پورت اشتباه | `docker ps`، `npm run db:logs` |
| pgAdmin خالی / بدون DB | Host = `localhost` در Docker UI | Host = **`postgres`** یا `npm run db:admin:reset` |
| Conflict نام کانتینر | دو بار `compose up` همزمان | `docker compose --profile tools down` سپس `npm run db:admin` |
| pgAdmin restart loop | ایمیل نامعتبر | از `pgadmin@rooomchi.ir` استفاده کنید (در compose همین است) |
| اپ وصل است ولی دادهٔ دمو نیست | seed نشده | یک بار سرور را restart کنید یا `npm run db:reset` |

```bash
docker ps --filter name=rooomchi
docker logs rooomchi-postgres --tail 50
```

---

## تولید (production) — یادآوری کوتاه

- رمز `postgres/postgres` را **عوض کنید**.  
- Postgres را روی managed service یا سرور جدا نگه دارید؛ از `npm run dev` در prod استفاده نکنید.  
- `JWT_SECRET` قوی در `.env`.  
- پورت 5432 را به اینترنت باز نکنید مگر با VPN/firewall محدود.

---

## لینک‌های مرتبط

- [راه‌اندازی کلی پروژه](SETUP.md)  
- [README](../README.md)
