# Deploying Weave to production

Target: your existing self-hosted Hetzner box, behind the Nginx + Let's Encrypt setup you already run for other projects. This repo's Docker Compose stack does **not** containerize Nginx or certbot — it just publishes two ports on `127.0.0.1` for your host Nginx to `proxy_pass` into. The dev-only `docker-compose.yml` (single Postgres on port 5433, used by `pnpm dev`) is untouched by any of this.

Replace `weave.example.com` everywhere below with your real domain.

## 1. Get the code onto the server

```bash
git clone https://github.com/Syrmus/One2one.git
cd One2one
```

(Or `git pull` if it's already cloned there.)

## 2. Google OAuth — register a second client

The OAuth client already configured is registered for `http://localhost:5173` redirects and won't work from the real domain.

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application).
2. Authorized redirect URI: `https://weave.example.com/api/auth/callback/google`
3. Copy the new Client ID / Secret — they go into `.env.production` below (do **not** reuse the localhost one).

## 3. Configure environment

```bash
cp .env.production.example .env.production
```

Fill in every value in `.env.production` — see the comments in that file for what each one means. In particular:
- `POSTGRES_PASSWORD` / `BETTER_AUTH_SECRET`: generate real random values, e.g. `openssl rand -base64 32`.
- `WEB_ORIGIN`, `BETTER_AUTH_URL`, `VITE_API_URL`: all three should be the same `https://weave.example.com` (see step 5 for why — frontend and backend are served from one domain, path-routed).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: from step 2.

## 4. Build and start the stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

The `--env-file` flag is required here (not just `env_file:` inside the compose file) because `${POSTGRES_USER}` and `${VITE_API_URL}` are substituted into the compose YAML itself, not only injected into a container's runtime environment.

The `backend` container runs `pnpm start`, which applies pending Drizzle migrations against `postgres` and then starts the API — no separate migration step needed.

Check everything came up healthy:

```bash
docker compose -f docker-compose.prod.yml ps
curl http://127.0.0.1:3001/api/languages
curl http://127.0.0.1:8080/
```

## 5. Host Nginx — merge this into your existing config

One domain, path-routed: `/api/*` goes to the backend container, everything else to the frontend container. This keeps the browser's view of the app entirely same-origin (no CORS setup needed) even though two different containers serve it.

```nginx
server {
    listen 80;
    server_name weave.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name weave.example.com;

    # ssl_certificate / ssl_certificate_key — same as your other certbot-managed
    # server blocks; run certbot for this domain the same way you normally do.

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

Reload Nginx (`sudo nginx -t && sudo systemctl reload nginx`), run certbot for the domain if you haven't already, and the app is live.

## Updating after a new deploy

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Rebuilds only what changed; Postgres data persists in the `weave_prod_pgdata` volume across restarts.

## Tearing down (local testing only)

```bash
docker compose -f docker-compose.prod.yml down
```

Add `-v` to also drop the Postgres volume — don't do this on the real server unless you mean to wipe user data.
