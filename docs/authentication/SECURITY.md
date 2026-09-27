# Authentication security

## Passwords

- bcrypt with cost factor 12
- No default password in production (`JWT_SECRET` required)

## OAuth

- Random `state` stored server-side
- ID token payload used for email/sub (verify with Google token endpoint in hardened deployments)

## Sessions

- JWT Bearer tokens (`JWT_SECRET`)
- Configure `CORS_ORIGIN` and `APP_URL` in production

## Audit

Table `auth_audit_logs`:

- provider (`local`, `ldap`, `google`)
- action (`login`, `login_failed`, `register`, `oauth_callback`, …)
- IP, user agent, success flag

## Rate limiting

Express rate limit on `/api` (see `RATE_LIMIT_MAX`).

## Failed logins

Recorded in `auth_audit_logs` with `action: login_failed`.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| 403 local disabled | `local_enabled` for org |
| LDAP bind error | `ldap_configuration`, network to DC |
| Google redirect mismatch | `redirectUri` exactly matches Google Console |
| User wrong org | `organizationId` on OAuth start / LDAP body |
