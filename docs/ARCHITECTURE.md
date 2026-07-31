# Architecture & hosting

## The shape of it

```
  Visitor ──► Cloudflare Pages (FREE, always on)
              └─ site/  (plain HTML + CSS + JS)
                    │  fetch /api/projects, POST /api/contact
                    ▼
              Cloudflare Tunnel  (FREE, no open ports)
                    │
                    ▼
              Your homelab ──► Docker container
                                └─ api/  (Python FastAPI + SQLite)
```

Two pieces, cleanly separated:

- **Frontend** = `site/`. Static files. Lives on **Cloudflare Pages**. No server, nothing to
  maintain, free forever, global CDN, HTTPS and custom domain included.
- **Backend** = `api/`. A small **Python (FastAPI)** app in **Docker** on your **homelab**,
  reached through a **Cloudflare Tunnel**. It owns the project database and the contact inbox.

The frontend talks to the backend over HTTPS. If the homelab is ever down, the site still
loads — project cards fall back to the committed `site/data/projects.json`. Only the
"add a project" admin panel and live contact form need the backend awake.

## Why this split (the recommendation)

You asked me to choose. This is the pick because:

1. **The site is never down.** Pages is Cloudflare's edge — independent of your house's
   power or internet. A portfolio that 404s during an interview is the one thing to avoid.
2. **The backend is a Python project.** Your whole brand is "teaching myself Python." Building
   and running this FastAPI service *is* a portfolio entry. It's honest and on-theme.
3. **It's all free.** See the table below.
4. **No open ports.** Cloudflare Tunnel dials *out* from your homelab to Cloudflare. You never
   forward a port or expose your home IP.

## What each free tier covers

| Piece | Service | Free tier reality |
|---|---|---|
| Static site | Cloudflare Pages | Unlimited requests, 500 builds/month, custom domain, HTTPS |
| Tunnel | Cloudflare Tunnel (`cloudflared`) | Free, unlimited, part of Zero Trust free plan |
| Backend host | Your homelab Docker | Free (your hardware) |
| Database | SQLite (a file) | Free, zero setup, fine for a portfolio's volume |
| Analytics | Google Analytics 4 | Free (you chose GA — snippet already in `index.html`) |
| Contact email | Gmail SMTP App Password | Free |

## The alternative: all-Cloudflare (no homelab)

If you ever want zero homelab dependency, swap the backend for **Cloudflare Workers + D1**
(Cloudflare's serverless + SQLite database). Same frontend, same API shape. Trade-offs:

- **Pro:** nothing to keep running at home; backend is also on the edge.
- **Con:** Workers are **JavaScript/TypeScript**, not Python — so you lose the "Python backend
  as a learning project" angle. Free tier: 100k requests/day, D1 5 GB — plenty here.

You don't have to decide forever. The frontend is identical either way; only `API_BASE` in
`site/js/config.js` changes.

## The one knob that wires it together

`site/js/config.js`:

```js
window.PORTFOLIO_CONFIG = {
  API_BASE: "https://api.yourdomain.com",   // your tunnel hostname
  PROJECTS_FALLBACK: "./data/projects.json"
};
```

- `""` (empty) → fully static. Projects come from the JSON file; contact form shows a
  "email me directly" note. Good for launching before the backend exists.
- A URL → the site uses your live Python API for projects + contact, with the JSON file as a
  safety net.
