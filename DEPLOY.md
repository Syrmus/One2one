# Deploying Weave to production

Target: `lexdocs` (62.238.1.23), the Hetzner box already running Nginx + Certbot for `docs.lexdocs.net`, `crm.lexdocs.net`, `cloud.lexdocs.net`, etc. This repo's Docker Compose stack does **not** containerize Nginx or certbot — it just publishes two ports on `127.0.0.1` for the host Nginx to `proxy_pass` into. Domain: **`weave.lexdocs.net`** (DNS already resolves to this box — a wildcard record covers `*.lexdocs.net`, so no DNS step is needed). The dev-only `docker-compose.yml` (single Postgres on port 5433, used by `pnpm dev` on your Mac) is untouched by any of this.

## 1. Get the code onto the server

```bash
ssh lexdocs
git clone https://github.com/Syrmus/One2one.git /root/weave
cd /root/weave
```

(Or `git pull` if it's already cloned there.)

## 2. Google OAuth — register a second client

The OAuth client already configured is registered for `http://localhost:5173` redirects and won't work from the real domain.

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application).
2. Authorized redirect URI: `https://weave.lexdocs.net/api/auth/callback/google`
3. Copy the new Client ID / Secret — they go into `.env.production` below (do **not** reuse the localhost one).

## 3. Configure environment

```bash
cp .env.production.example .env.production
```

Fill in every value in `.env.production` — see the comments in that file for what each one means. In particular:
- `POSTGRES_PASSWORD` / `BETTER_AUTH_SECRET`: generate real random values, e.g. `openssl rand -base64 32`.
- `WEB_ORIGIN`, `BETTER_AUTH_URL`, `VITE_API_URL`: all three should be `https://weave.lexdocs.net` (see step 5 for why — frontend and backend are served from one domain, path-routed).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: from step 2.

## 4. Build and start the stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

The `--env-file` flag is required here (not just `env_file:` inside the compose file) because `${POSTGRES_USER}` and `${VITE_API_URL}` are substituted into the compose YAML itself, not only injected into a container's runtime environment. The compose file's `name: weave-prod` keeps every container/network/volume name distinct from the other projects already running on this box (Nextcloud, Plane, Paperless-ngx, Amnezia) as well as from the dev-only stack.

The `backend` container runs `pnpm start`, which applies pending Drizzle migrations against `postgres` and then starts the API — no separate migration step needed.

Check everything came up healthy:

```bash
docker compose -f docker-compose.prod.yml ps
curl http://127.0.0.1:3001/api/languages
curl http://127.0.0.1:8080/
```

## 5. Host Nginx + Certbot

One domain, path-routed: `/api/*` goes to the backend container, everything else to the frontend container — keeps the browser's view of the app entirely same-origin (no CORS setup needed) even though two different containers serve it. This matches the plain-HTTP-then-certbot-upgrades-it pattern already used for the other sites on this box (`docs.lexdocs.net`, `cloud.lexdocs.net`, etc — see their configs under `/etc/nginx/sites-available/` for reference).

Create `/etc/nginx/sites-available/weave`:

```nginx
server {
    listen 80;
    server_name weave.lexdocs.net;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then:

```bash
ln -s /etc/nginx/sites-available/weave /etc/nginx/sites-enabled/weave
nginx -t && systemctl reload nginx
certbot --nginx -d weave.lexdocs.net --redirect --non-interactive
```

`certbot --nginx` rewrites the file in place to add the `listen 443 ssl` block, the cert paths, and an HTTP→HTTPS redirect — same as it already did for the other `sites-available/*` configs on this box. The app is live at `https://weave.lexdocs.net` once this completes.

## Updating after a new deploy

```bash
ssh lexdocs
cd /root/weave
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Rebuilds only what changed; Postgres data persists in the `weave_prod_pgdata` volume across restarts.

## Tearing down (local testing only)

```bash
docker compose -f docker-compose.prod.yml down
```

Add `-v` to also drop the Postgres volume — don't do this on the real server unless you mean to wipe user data.
