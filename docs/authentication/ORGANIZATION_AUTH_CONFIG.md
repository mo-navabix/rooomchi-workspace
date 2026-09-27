# Organization authentication configuration

Each tenant has its own row in `organization_auth_settings` (no global auth policy).

## Flags

| Column | Description |
|--------|-------------|
| `local_enabled` | Email/password login |
| `ldap_enabled` | LDAP / AD login |
| `google_enabled` | Google OAuth |

## API

**Public (login page):**

- `GET /api/organizations/:orgId/auth-settings`
- `GET /api/auth/organizations/:slug/settings`

**Admin:**

- `PUT /api/organizations/:orgId/auth-settings` (JWT, org admin or super admin)

Example body:

```json
{
  "localEnabled": true,
  "ldapEnabled": true,
  "googleEnabled": false,
  "authPolicies": {
    "selfRegistrationEnabled": true,
    "emailVerificationRequired": false
  },
  "ldapConfiguration": { "url": "ldap://..." },
  "googleConfiguration": { "clientId": "..." },
  "ldapGroupRoleMappings": [
    { "ldapGroup": "Roomchi Admins", "role": "ORGANIZATION_ADMIN" }
  ]
}
```

## UI

`OrgLoginPage` loads settings for `currentOrg` and shows only enabled providers.

Admin toggles in **Access Control** should be synced to this API (local state + server).
