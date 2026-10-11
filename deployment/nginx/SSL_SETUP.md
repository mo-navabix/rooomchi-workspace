# TLS for production nginx

Certificate files live in `deployment/nginx/ssl/` (gitignored). Required names:

- `fullchain.pem`
- `privkey.pem`

```bash
mkdir -p deployment/nginx/ssl
# copy from Let's Encrypt or your CA, then:
chmod 600 deployment/nginx/ssl/privkey.pem
```

Start stack with HTTPS override — see [docs/CUSTOMER_GO_LIVE.md](../../docs/CUSTOMER_GO_LIVE.md).
