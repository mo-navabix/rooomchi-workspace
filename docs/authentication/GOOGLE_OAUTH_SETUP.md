# Google OAuth 2.0

## Per-organization configuration

`organization_auth_settings.google_configuration`:

```json
{
  "clientId": "<from Google Cloud Console>",
  "clientSecret": "<secret>",
  "redirectUri": "https://meetings.company.ir/api/auth/google/callback",
  "allowedDomains": ["company.ir"],
  "autoProvision": true,
  "defaultRole": "EMPLOYEE"
}
```

Set `google_enabled: true`.

Global fallbacks: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` in `.env`.

## Flow

1. Browser: `GET /api/auth/google/start?organizationId=...&redirectAfter=/`
2. Google consent screen
3. `GET /api/auth/google/callback?code=...&state=...`
4. State validated (`oauth_states` table), tokens exchanged, user provisioned/linked.

## Frontend

`ApiService.startGoogleOAuth({ organizationId, organizationSlug, redirectAfter })` redirects the browser.

## Security

- OAuth `state` is single-use and expires in 10 minutes.
- Domain allow-list via `allowedDomains` (use `["*"]` to allow any).
