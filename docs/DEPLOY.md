# Deploy guide

Live site: **luisamunoz.com**. Two halves, and they're independent.

- **Frontend** (`site/`) is already live and auto-deploys. Nothing to set up.
- **Backend** (`api/`) is written and tested but not running yet. Part B is the one-time setup.

---

## Part A — Frontend (already done, written down so it isn't re-derived)

The site is a **Cloudflare Worker** named `my-website`, not Cloudflare Pages. It serves the
static files in `./site` as an assets-only Worker.

1. `git push origin main`
2. Cloudflare Workers Build runs `npx wrangler deploy`
3. `wrangler.jsonc` at the repo root tells it what to publish (`assets.directory: ./site`)

**Don't delete or rename `wrangler.jsonc`.** Without it the build has no config and
auto-deploy silently breaks. That's exactly how it was broken before 2026-08-04, when the
Worker was drag-and-drop upload with Git disconnected and every push did nothing.

Only `site/` gets published. `api/`, `docs/`, and `wrangler.jsonc` live in the repo but are
never served.

**Verify after a push:** watch the Deployments tab for your commit, then fetch the live page
and confirm the change landed. Count-up animations read low if the browser tab was throttled,
so let them settle before judging.

---

## Part B — Backend on dockerHost, through the tunnel that already exists

**The part a generic guide gets wrong:** dockerHost already runs a
`cloudflared` container on an existing tunnel. You are **not** creating a second tunnel.
You're adding a hostname to the one that's already up.

### 1. Find the network cloudflared is on

The tunnel reaches the API by container name, which only resolves if both containers share a
Docker network.

```bash
docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' cloudflared
```

That's your `TUNNEL_NETWORK` value. You set it as an environment variable, not by editing
the compose file: `api/.env` on the CLI, or the stack's env vars in Portainer.

### 2. Configure secrets

```bash
cd api
cp .env.example .env
python3 -c "import secrets; print(secrets.token_hex(24))"   # paste into ADMIN_TOKEN
```

Fill in `ADMIN_TOKEN` and `TUNNEL_NETWORK`. Neither has a default, and the deploy fails
loudly if they're missing rather than coming up with a guessable token.

Leave `ALLOWED_ORIGINS` as it ships. If the live domain isn't in that list, the browser
blocks every call and the console shows a CORS error. That's the most common first-deploy
failure.

### 3. Bring it up — pick one

**Option A: the CLI**

```bash
docker compose up -d --build
docker compose ps          # STATUS should reach "healthy"
```

Compose reads `api/.env` on its own. No port is published to the LAN on purpose, so to curl
it from dockerHost itself, uncomment the `ports:` block first.

**Option B: Portainer**

The compose file is written to work either way. Use the **Repository** method, not the web
editor, because a pasted compose has no build context.

1. **Stacks → Add stack → Repository**
2. Repository URL: `https://github.com/DonLuisMunoz/my_website` (public, no credentials)
3. Compose path: `api/docker-compose.yml`
4. Under **Environment variables**, add the same names that are in `.env.example`. At minimum
   `ADMIN_TOKEN` and `TUNNEL_NETWORK`.
5. Deploy

Portainer is why the compose uses `environment:` instead of `env_file:`. A git clone has no
`.env` in it, correctly, so `env_file` would fail the deploy. Interpolated variables read
from `api/.env` on the CLI and from the stack's env vars in Portainer, from the same file.

The database is a **named volume** (`portfolio-data`) rather than a bind mount, for the same
reason: a git-repo deploy shouldn't depend on a host path existing. It survives rebuilds and
redeploys either way.

### 4. Add the hostname to the existing tunnel

Cloudflare dashboard → **Zero Trust → Networks → Tunnels → (your existing tunnel) →
Public Hostname → Add**:

- **Subdomain:** `api`
- **Domain:** `luisamunoz.com`
- **Service:** `HTTP` → `http://portfolio-api:8000`

Then from anywhere:

```bash
curl https://api.luisamunoz.com/api/health      # -> {"ok":true}
```

### 5. Point the frontend at it

Edit `site/js/config.js`:

```js
API_BASE: "https://api.luisamunoz.com",
```

Commit and push. The Worker redeploys, projects start coming from the live API with
`site/data/projects.json` as the fallback, the contact form stops being a mailto, and
`/admin.html` can add projects.

### 6. Verify

- `https://api.luisamunoz.com/api/health` returns `{"ok":true}`
- Home page still lists projects, and the **stack bars still have values**. That's the `tools`
  field surviving the switch from JSON to API. If they empty out, a project was saved without it.
- `/admin.html` + your token → add a test project → it appears on the home page → delete it
- Send yourself a message through the contact form, then read it back:

```bash
curl https://api.luisamunoz.com/api/messages -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Updating after the first deploy

**There are two deploys, and only one of them is a push.**

Cloudflare builds `./site`. It never looks at `api/`, never builds a Docker image, and has
no connection to dockerHost. So pushing changed backend code updates GitHub and changes
nothing that's running.

| You changed | What it takes |
|---|---|
| anything in `site/` | push. Live in a minute or two. |
| `site/js/config.js` | push. It's a site file. |
| a blog post or image | push. |
| `api/main.py` | push, **then redeploy the stack** |
| `api/Dockerfile` or `pyproject.toml` | push, then redeploy. Slower, deps reinstall. |
| an env var or secret | no rebuild. Update it and restart the stack. |

### Getting changed API code onto dockerHost

Something has to build the image *there*. Three ways, worst to best:

**1. CLI** — needs a git checkout living on dockerHost, which is a second copy of the repo to
keep in sync and remember.

```bash
cd ~/my_website && git pull && cd api && docker compose up -d --build
```

**2. Portainer, manual** — Portainer holds the clone, so there's no checkout to maintain.
Stack → **Pull and redeploy**. It re-pulls from GitHub and rebuilds.

**3. Portainer, automatic** — the same repository stack with **GitOps updates** turned on.
This makes deploying the backend the same gesture as the frontend: push, walk away.

### Setting up option 3

**Use polling, not the webhook.** A webhook needs GitHub to reach Portainer from the public
internet, and this homelab was deliberately taken off the public internet. Polling dials out
from Portainer, so it needs no inbound access and no exposure. Portainer's own docs call this
out: polling works in any network environment, including behind a firewall.

**Stacks → Add stack**

| Field | Value |
|---|---|
| Name | `portfolio-api` |
| Build method | **Repository** |
| Repository URL | `https://github.com/DonLuisMunoz/my_website` |
| Authentication | off (the repo is public) |
| Repository reference | `refs/heads/main` |
| Compose path | `api/docker-compose.yml` |

**GitOps updates:** on. Mechanism **Polling**, interval `5m` (or longer, nothing here is
urgent).

**Environment variables: add two.** Only these have no default.

| Name | Value |
|---|---|
| `ADMIN_TOKEN` | output of `python3 -c "import secrets; print(secrets.token_hex(24))"` |
| `TUNNEL_NETWORK` | the network cloudflared is on, from step 1 |

**Leave every other variable out.** The compose file carries a working default for each one,
so an empty box and no box mean the same thing. Adding `SMTP_HOST` with a blank value doesn't
break anything, it just isn't doing anything either.

What you get by omitting them:

| Variable | Behaviour when omitted |
|---|---|
| `ALLOWED_ORIGINS` | `https://luisamunoz.com,https://www.luisamunoz.com` |
| `CONTACT_MAX_PER_HOUR` | `5` |
| `CONTACT_TO` | `lamunoz12@gmail.com` |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | empty, so no email is sent. Messages are stored and readable at `GET /api/messages`. |
| `SMTP_PORT` | `587` |

Add SMTP later if you want the contact form to email you. Nothing else needs touching.

A useful property of the `:?` guard on the two required ones: a **blank** value is treated
the same as a missing one, so a half-filled box fails the deploy instead of quietly bringing
the API up with an empty admin token.

Then **Deploy the stack**.

### How it decides to redeploy

Portainer fetches the latest commit hash on the tracked branch and compares it to the hash it
has stored. Different hash means it pulls and redeploys.

**That means every push redeploys the API, including a blog-post-only push.** Portainer can't
filter by path. In practice this is a few seconds of rebuild and a container restart. The
database is a named volume so nothing is lost, and the only things that notice are the
contact form and the admin panel. Worth knowing, not worth avoiding.

(Force redeployment, which redeploys even when the hash hasn't changed, is Business Edition
only. You don't need it, because a real push always changes the hash.)

### Verifying a backend deploy actually took

`docker compose ps` or the Portainer stack view should show **healthy**, not just running.
That's what the healthcheck is for. Then:

```bash
curl https://api.luisamunoz.com/api/health
```

If the container is up but the site still behaves the old way, it's almost always CORS or a
stale browser cache, not the deploy.

---

## What does NOT depend on the backend

The **blog** at `/blog` is static markdown in the repo. No API calls at all, so it keeps
working when dockerHost is off. Project cards fall back to `site/data/projects.json` the same
way. Only the admin panel and the live contact form need the API awake.

---

## Gotchas

- **CORS error in the console** → the site's domain isn't in `ALLOWED_ORIGINS`. Add it to
  `api/.env` with no trailing slash, then `docker compose up -d`.
- **502 from the tunnel** → the two containers aren't on the same Docker network, so
  `portfolio-api` doesn't resolve. Re-check step 1.
- **401 in admin** → token mismatch between the box's `.env` and what you pasted.
- **429 on the contact form** → that's the rate limit working (5/hour/IP). Change
  `CONTACT_MAX_PER_HOUR` in `.env`.
- **Data vanished after a rebuild** → the `portfolio-data` named volume was removed. `docker
  compose down` keeps it, `docker compose down -v` deletes it. The SQLite file lives there.
- **"set ADMIN_TOKEN" / "set TUNNEL_NETWORK" on deploy** → that's the guard working. Neither
  has a default, so a half-configured stack refuses to start instead of coming up insecure.
- **Gmail SMTP fails** → use a Gmail App Password, not the account password, and keep 2FA on.
