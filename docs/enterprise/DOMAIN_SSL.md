# Domain, DNS, Nginx, SSL

## Patterns

| Pattern | Example | Tenant resolution |
|---------|---------|-------------------|
| Subdomain on product domain | `demis.rooomchi.ir` | First label = org `slug` |
| Custom host on customer DNS | `roomchi.demisco.ir` | Set `organizations.domain` to full hostname |

## DNS

- `A` or `CNAME` from customer hostname → server running Rooomchi nginx  
- Wildcard `*.rooomchi.ir` optional for multi-tenant SaaS-style hosting  

## Nginx

Edit `rooomchi-enterprise/nginx/nginx.conf`:

- Set `server_name roomchi.example.com;`
- Add TLS `listen 443 ssl` and certificate paths

Forward headers (already in template):

- `Host`, `X-Forwarded-Proto`, `X-Forwarded-For`

Backend uses these for tenant and OAuth redirect URLs.

## SSL

- **Let's Encrypt:** certbot on host or sidecar; mount `/etc/letsencrypt` into nginx  
- **Corporate PKI:** install org CA chain on nginx  

Set `APP_URL=https://roomchi.example.com` and matching `CORS_ORIGIN`.

## OAuth / Google

Redirect URI must match public URL:

`https://<domain>/api/auth/google/callback`

Configure the same in Google Cloud Console.
