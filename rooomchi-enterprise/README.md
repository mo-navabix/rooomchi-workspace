# Rooomchi Enterprise — Self-Hosted Distribution

این پوشه **نقطه ورود استقرار On-Premise** برای تیم IT سازمان است. کد اصلی در ریشه مخزن (`..`) نگهداری می‌شود؛ این ساختار مسیرهای استاندارد Enterprise را مشخص می‌کند.

## ساختار

```
rooomchi-enterprise/
├── frontend/          → Dockerfile استقرار (ارجاع به deployment/frontend)
├── backend/           → Dockerfile استقرار (ارجاع به deployment/backend)
├── database/          → اسکریپت‌ها و seed (ارجاع به schema/ و database/)
├── storage/           → آپلودهای محلی (volume)
├── nginx/             → پیکربندی پروکسی
├── config/            → .env و license.json (نمونه)
├── documentation/     → لینک به docs/enterprise/
└── docker-compose.yml
```

## نصب سریع

```bash
cd rooomchi-enterprise
cp config/.env.example config/.env
# مقادیر JWT_SECRET، POSTGRES_PASSWORD و APP_URL را تنظیم کنید
docker compose up -d --build
```

سپس در مرورگر: `https://<دامنه-شما>/install` یا `/setup`

## مستندات

- [معماری و نقشه راه](../docs/enterprise/ARCHITECTURE.fa.md)
- [راهنمای نصب](../docs/enterprise/INSTALLATION.md)
- [دامنه و SSL](../docs/enterprise/DOMAIN_SSL.md)
