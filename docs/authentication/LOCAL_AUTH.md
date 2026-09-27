# Local authentication

## Overview

Local auth stores users in Rooomchi PostgreSQL (`users.password_hash`) with bcrypt. Provider id: `local`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Email + password |
| POST | `/api/auth/register` | Self-registration (if org policy allows) |
| POST | `/api/auth/forgot-password` | Reset code (dev: `simulatedCode`) |
| POST | `/api/auth/reset-password` | Complete reset |

## Organization policy

Controlled per tenant via `organization_auth_settings`:

- `local_enabled`
- `auth_policies.self_registration_enabled`

## Password rules

- Hashed with bcrypt (cost 12) on register, reset, and change-password.
- Legacy plaintext passwords are verified once, then re-hashed on successful login (non-production demo passwords still supported in dev only).

## Email verification

Optional `auth_policies.email_verification_required` — OTP flow via `/api/auth/send-otp` and `/api/auth/verify-otp`.
