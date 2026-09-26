# Rooomchi (روم‌چی) — سامانه رزرو اتاق جلسات

[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

**Rooomchi** (**روم‌چی**) یک سامانه **چند‌سازمانی (multi-tenant)** برای **رزرو و مدیریت اتاق‌های جلسه** است. رابط کاربری **فارسی**، تقویم **جلالی**، و پنل مدیریت برای سازمان‌ها، اتاق‌ها، رزروها، کاربران و تیم‌ها دارد.

---

## ویژگی‌ها

- رزرو اتاق، تقویم، داشبورد و گزارش‌های تحلیلی
- پنل ادمین: اتاق‌ها، رزروها، نقش‌ها (RBAC)، تنظیمات سازمان، اعلان‌ها
- مدیریت **تیم‌ها** و انتخاب اعضا در جلسات
- احراز هویت: ورود با ایمیل/شماره پرسنلی، ثبت‌نام، OTP (شبیه‌سازی در dev)، تکمیل پروفایل، بازنشانی رمز
- راه‌اندازی سازمان جدید (provisioning) از UI
- **PostgreSQL** به‌عنوان منبع اصلی داده در API (Express)

---

## پشته فناوری

| لایه | فناوری |
|------|--------|
| فرانت‌اند | React 19, Vite 8, Tailwind CSS 4, Motion |
| API (مسیر اجرای روزمره) | Express 4, `server.ts` + `src/server/` |
| دیتابیس | PostgreSQL 16 (Docker Compose) |
| Monorepo | Nx — `apps/web`, `apps/api` (NestJS در حال تکمیل) |
| احراز هویت API | JWT (`@nestjs/jwt`) |

---

## پیش‌نیازها

- **Node.js** 20 یا جدیدتر
- **npm** (یا سازگار با `package-lock.json`)
- **Docker** و **Docker Compose** (برای Postgres لوکال با `npm run dev`)

---

## شروع سریع

```bash
git clone <repository-url>
cd rooomchi
npm install
cp .env.example .env   # Windows: copy .env.example .env
npm run dev
```

مرورگر: **[http://localhost:3000](http://localhost:3000)**

`npm run dev` ابتدا Postgres را با Docker بالا می‌آورد، سپس سرور (Vite + API) را روی پورت **3000** اجرا می‌کند.

راهنمای کامل پروژه: **[docs/SETUP.md](docs/SETUP.md)** — **Postgres و pgAdmin:** **[docs/POSTGRES.md](docs/POSTGRES.md)**

---

## متغیرهای محیطی

از `.env.example` کپی بگیرید. برای Docker لوکال معمولاً:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rooomchi_db
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=rooomchi_db
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-in-production
```

Credentialهای داخل `docker-compose.yml` ثابت هستند (`postgres` / `postgres` / `rooomchi_db`) و از `.env` خوانده نمی‌شوند تا با سرویس‌های ابری قاطی نشوند.

---

## اسکریپت‌های npm

| دستور | توضیح |
|--------|--------|
| `npm run dev` | Docker Postgres + سرور توسعه |
| `npm run dev:app` | فقط سرور (DB روی host دیگر با `DB_HOST`) |
| `npm run db:up` | فقط کانتینر Postgres |
| `npm run db:admin` | Postgres + **pgAdmin** → [localhost:5050](http://localhost:5050) |
| `npm run db:down` | توقف Postgres (و pgAdmin اگر بالا بود) |
| `npm run db:reset` | حذف volume و ساخت دوباره DB + اسکیما |
| `npm run build` | بیلد فرانت + سرور برای production |
| `npm run start` | اجرای `dist/server.cjs` |
| `npm run lint` | بررسی TypeScript |

---

## ساختار پروژه

```
rooomchi/
├── src/                    # فرانت‌اند React (اپ web)
├── server.ts               # نقطه ورود سرور
├── src/server/             # routeها و لایه persistence (PostgreSQL)
├── schema.sql              # اسکیما و seed اولیه
├── schema/                 # افزونه‌های اسکیما (مثلاً OTP)
├── docker-compose.yml      # Postgres لوکال
├── apps/api/               # NestJS (مسیر آینده / جدا از dev اصلی)
├── libs/shared-types/      # تایپ‌های مشترک
└── docs/                   # مستندات
```

---

## API

REST تحت مسیر `/api/...` (و برخی alias بدون پیشوند `/api` برای auth).

نمونه:

- `GET /api/health` — سلامت سرور
- `GET /api/db/status` — وضعیت اتصال Postgres
- `GET /api/organizations`, `/api/rooms`, `/api/bookings`, `/api/stats`
- `POST /api/auth/login`, `/api/auth/register`, …
- `GET|POST /api/teams`, …

---

## حساب‌های دمو (پس از seed)

پس از اولین بالا آمدن سرور، کاربران نمونه در DB درج می‌شوند (اگر `user-super` وجود نداشته باشد):

| ایمیل | رمز (dev) | نقش |
|--------|-----------|-----|
| `admin@rooomchi.ir` | `password123` | Super Admin |
| `admin@technova.ir` | `password123` | مدیر سازمان (نمونه) |

---

## مستندات بیشتر

- [PostgreSQL — setup و استفاده روی سیستم جدید](docs/POSTGRES.md)
- [راه‌اندازی و استقرار](docs/SETUP.md)
- [زمینه پروژه برای توسعه / AI](docs/PROJECT_CONTEXT_AND_AI_PROMPT.md)

---

## مجوز

این مخزن در حال حاضر **خصوصی / بدون فایل LICENSE عمومی** است. قبل از انتشار عمومی، مجوز مناسب اضافه کنید.
