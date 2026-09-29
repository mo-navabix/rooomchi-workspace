# معماری Rooomchi Enterprise — تحلیل و نقشه راه

> **توجه:** مخزن فعلی **React 19 + Vite + Express** (API اصلی) است، با ماژول **NestJS** در `apps/api` برای توسعه آینده. در پرامپت به Angular اشاره شده؛ کد عملیاتی فعلی Angular نیست — مسیر Enterprise روی همین monorepo پیاده می‌شود.

## ۱. معماری فعلی (وضعیت ۲۰۲۶)

| لایه | فناوری | مسیر |
|------|--------|------|
| Frontend | React, Vite, Tailwind | `src/`, `index.html` |
| Backend (Production) | Express, TypeScript | `server.ts`, `src/server/` |
| Backend (آینده) | NestJS, TypeORM | `apps/api/` |
| Database | PostgreSQL 16 | `schema.sql`, `schema/*.sql` |
| Auth | JWT, Local, LDAP, Google OAuth | `src/server/auth/` |
| Multi-tenant | `organization_id` روی جداول | یک DB مشترک |
| نصب اولیه | Wizard `/setup` و `/install` | `SetupWizardView`, `setup.service.ts` |
| Deploy | Docker Compose | `deployment/`, `rooomchi-enterprise/` |
| Config | `.env`, DB integrations | `.env.example`, `organization_auth_settings` |
| Audit | Auth audit + Config audit | `auth_audit_logs`, `config_audit_logs` |
| RBAC | نقش در JWT + `constants/rbac` | UI + API guards جزئی |

### جریان نصب فعلی

1. `docker compose up` → Postgres + Backend + Frontend + Nginx  
2. `ensureBaseSchema` / `npm run migrate` → اسکیما  
3. کاربر → `/install` یا `/setup`  
4. `POST /api/setup/complete` → org + admin + auth + SMTP/storage  
5. `installation_status.initialized = true` → wizard غیرفعال  

### جریان احراز هویت

- ورود محلی، LDAP، Google per-organization (`organization_auth_settings`)  
- Tenant از slug در URL، body، یا زیردامنه host (`auth-context.ts`)  
- Nest: `TenantResolverService` + match دامنه کامل روی `organizations.domain`  

---

## ۲. شکاف‌ها نسبت به نیازمندی‌های Enterprise

| # | نیازمندی | وضعیت | شکاف |
|---|----------|--------|------|
| 1 | Deploy استاندارد | **تا حد زیادی** | بسته `rooomchi-enterprise/` اضافه شد؛ SSL و HA دستی |
| 2 | Configuration | **تا حد زیادی** | `.env` + پنل admin؛ DB wizard برای Host/Port هنوز جدا نیست |
| 3 | Installation Wizard | **تا حد زیادی** | مراحل شما با wizard فعلی ادغام شده؛ preflight API اضافه شد |
| 4 | Organization Admin | **تا حد زیادی** | `EnterpriseAdminSettingsView`؛ Backup UI ناقص |
| 5 | ساختار Location→Room | **شروع شده** | `schema/07-campus-hierarchy.sql`؛ UI/API هنوز روی `building`/`floor` legacy |
| 6 | Reservation Workflow | **جزئی** | `pending_approval` وجود دارد؛ statusهای یکپارچه Enterprise ناقص |
| 7 | Auth (Azure AD) | **ندارد** | Google + LDAP + Local؛ Entra/SAML در roadmap |
| 8 | RBAC کامل | **جزئی** | نقش‌های ثابت؛ custom roles در DB ناقص |
| 9 | Audit Log یکپارچه | **جزئی** | login + config؛ CRUD رزرو/اتاق در یک دفتر رویداد واحد ناقص |
| 10 | Backup/Restore | **ندارد** | راهنما + `docs/enterprise/BACKUP.md`؛ API زمان‌بندی بعدی |
| 11 | License | **پایه** | `config/license.json` + پنل «سامانه» |
| 12 | Update Management | **پایه** | `schema_migrations` + نمایش نسخه؛ کانال update بعدی |
| 13 | Domain/SSL | **مستند** | `DOMAIN_SSL.md` |
| 14 | Documentation | **در حال تکمیل** | `docs/enterprise/*` |

---

## ۳. Roadmap مرحله‌ای

### فاز ۱ — قابل نصب (۴–۶ هفته) ✅ شروع شده

- [x] Docker enterprise layout (`rooomchi-enterprise/`)  
- [x] Preflight نصب (`GET /api/setup/preflight`)  
- [x] مسیر `/install`  
- [x] Migration chain `schema/03`–`07` در `migrate-cli`  
- [x] License + version API  
- [ ] Wizard مرحله اتصال DB جدا (اختیاری برای نصب بدون `.env`)  
- [ ] Healthcheck کامل در compose  

### فاز ۲ — مدیریت سازمان (۶–۸ هفته)

- تکمیل پنل admin (Backup، System Info)  
- Audit یکپارچه برای CRUD  
- RBAC: جداول `roles` / `permissions` per org  
- Azure AD / OIDC provider  

### فاز ۳ — فضا و رزرو Enterprise (۸–۱۰ هفته)

- API/UI برای `org_locations` → `org_floors` → `rooms`  
- Workflow: Pending → Approved/Rejected + تنظیم org  
- مدیر اتاق، قوانین availability  

### فاز ۴ — عملیات (۴ هفته)

- Backup/Restore زمان‌بندی‌شده  
- Update channel + manifest نسخه  
- سخت‌گیری license (maxUsers)  

---

## ۴. اصول معماری پیشنهادی

```
Presentation (React)
    ↓ HTTP
Application (Express modules: auth, admin, booking, enterprise)
    ↓
Domain services (tenant scope, policies)
    ↓
Persistence (PostgreSQL, file storage)
```

- **تنظیمات:** env برای زیرساخت؛ DB برای tenant (auth, SMTP, branding)  
- **بدون hard-code دامنه:** `APP_URL`, `organizations.domain`, `system_settings.app_url`  
- **یک Postgres per deployment** (نه per org) مگر قرارداد خاص  

---

## ۵. فایل‌های کلیدی برای توسعه‌دهندگان

| موضوع | فایل |
|--------|------|
| API routes | `src/server/registerApiRoutes.ts` |
| Setup | `src/server/installation/setup.service.ts` |
| Enterprise | `src/server/enterprise/*` |
| Admin | `src/server/admin/admin.routes.ts` |
| Schema | `schema.sql`, `schema/07-campus-hierarchy.sql` |
| Deploy | `rooomchi-enterprise/docker-compose.yml` |

---

## ۶. اقدام بعدی پیشنهادی

1. تست `cd rooomchi-enterprise && docker compose up -d --build`  
2. باز کردن `/install` و تکمیل wizard  
3. قرار دادن `config/license.json` از روی `license.json.example`  
4. پیاده‌سازی فاز ۲ بر اساس اولویت سازمان (معمولاً Azure AD یا Backup)  
