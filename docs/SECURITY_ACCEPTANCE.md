# Security acceptance tests (pre–customer handoff)

Perform on a staging environment that mirrors production (GHCR images, HTTPS, real LDAP/SMTP optional).

## Authentication

| # | Action | Expected |
|---|--------|----------|
| 1 | `POST /api/auth/login` with wrong password | 401 |
| 2 | Call `GET /api/admin/organization` without `Authorization` | 401 |
| 3 | Use expired or tampered JWT | 401 |

## Role-based access

| # | Action | Expected |
|---|--------|----------|
| 4 | Log in as **employee** → open admin API e.g. `GET /api/admin/users` | 403 |
| 5 | Log in as **org_admin** → `GET /api/admin/organization` | 200, only own org |
| 6 | **super_admin** (if used) → cross-org operations per product policy | Document result |

## Multi-tenant isolation

Requires two organizations (two setups or wizard + second org):

| # | Action | Expected |
|---|--------|----------|
| 7 | Org A admin token → `GET /api/rooms` or bookings | Only org A rows |
| 8 | Org B admin token → same endpoints | Only org B rows; no A IDs |
| 9 | Org A token with org B resource ID in URL (if applicable) | 404 or 403 |

## Setup lockdown

| # | Action | Expected |
|---|--------|----------|
| 10 | After install, `POST /api/setup/complete` | 403 |
| 11 | `GET /api/setup/status` | `initialized: true` |

## Transport

| # | Action | Expected |
|---|--------|----------|
| 12 | Production URL uses HTTPS | Valid cert; no mixed content for API |
| 13 | `APP_URL` matches public URL | OAuth/LDAP redirects work |

Record tester name, date, and environment in your customer runbook.
