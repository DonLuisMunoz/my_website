# Deploy guide

Two halves: ship the **frontend** to Cloudflare Pages, then (optionally) bring up the
**backend** on your homelab behind a Cloudflare Tunnel.

---

## Part A — Frontend on Cloudflare Pages (do this first, ~10 min)

You can launch the site fully static *before* the backend exists.

1. **Push to GitHub.** Put this whole repo in a GitHub repository.
2. In the **Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git**, pick
   the repo.
3. Build settings:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `site`
4. Deploy. You get `https://<project>.pages.dev`.
5. **Custom domain (optional):** Pages → your project → Custom domains → add `luislearns.dev`.
   If the domain is on Cloudflare, DNS is automatic.
6. **Google Analytics:** open `site/index.html`, replace both `G-XXXXXXXXXX` with your GA4
   Measurement ID, commit.

At this point projects load from `site/data/projects.json` and the contact form says
"email me directly." That's a perfectly good launch.

---

## Part B — Backend on homelab Docker + Cloudflare Tunnel

### 1. Configure secrets
```bash
cd api
cp .env.example .env
python3 -c "import secrets; print(secrets.token_hex(24))"   # paste into ADMIN_TOKEN
# edit .env: set ALLOWED_ORIGINS to your Pages + custom domain, fill SMTP if you want email
```

### 2. Run it locally to test
```bash
docker compose up --build api
curl http://localhost:8000/api/health      # -> {"ok":true}
```
Or without Docker: `pip install -r requirements.txt && uvicorn main:app --reload`.

### 3. Create the Cloudflare Tunnel
1. Cloudflare dashboard → **Zero Trust → Networks → Tunnels → Create a tunnel** → *Cloudflared*.
2. Name it, copy the **tunnel token**, paste into `api/.env` as `TUNNEL_TOKEN`.
3. Add a **public hostname** for the tunnel:
   - Subdomain: `api`  → e.g. `api.luislearns.dev`
   - Service: `HTTP` → `http://api:8000`  (the compose service name + port)
4. Bring everything up:
```bash
docker compose up -d --build
```
The `cloudflared` sidecar dials out to Cloudflare — **no port forwarding, no exposed home IP.**

### 4. Point the frontend at the API
Edit `site/js/config.js`:
```js
API_BASE: "https://api.luislearns.dev",
```
Commit & push — Pages redeploys. Projects now come from the live API, the contact form works,
and `/admin.html` can add projects.

### 5. Verify
- `https://api.luislearns.dev/api/health` → `{"ok":true}`
- Home page still lists projects (now from the API).
- `/admin.html` + token → add a test project → it shows on the home page.

---

## Gotchas

- **CORS error in the browser console** → your site's domain isn't in `ALLOWED_ORIGINS`. Add it
  to `api/.env` (no trailing slash) and restart: `docker compose up -d`.
- **401 in admin** → token mismatch between the box and `ADMIN_TOKEN` in `.env`.
- **Data vanished after rebuild** → make sure the `./data:/app/data` volume is mounted (it is in
  the compose file). The SQLite file lives there.
- **Gmail SMTP fails** → use a Gmail **App Password**, not your account password, and keep
  2FA on.
