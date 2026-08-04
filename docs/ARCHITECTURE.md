# Architecture & hosting

## The shape of it

```
  Visitor ──► luisamunoz.com
              Cloudflare Worker "my-website" (assets-only, always on)
              └─ site/   plain HTML + CSS + JS
                 ├─ /blog        static markdown, no backend involved
                 └─ /            fetch /api/projects, POST /api/contact
                                       │
                                       ▼
                    api.luisamunoz.com
                    the EXISTING Cloudflare Tunnel on dockerHost
                    (cloudflared container already running, no new tunnel)
                                       │
                                       ▼
                    dockerHost ──► portfolio-api container
                                                 └─ api/  FastAPI + SQLite
```

Two pieces, cleanly separated:

- **Frontend** = `site/`. Static files served by a **Cloudflare Worker** named `my-website`
  (assets-only, config in `wrangler.jsonc`). Not Cloudflare Pages — that's worth being precise
  about, because the build settings and the failure modes are different. Every push to `main`
  auto-deploys.
- **Backend** = `api/`. A small **Python (FastAPI)** app in **Docker** on dockerHost, reached
  through the **Cloudflare Tunnel that's already running there**. It owns the project database
  and the contact inbox. It does not own the blog.

The frontend talks to the backend over HTTPS. If the homelab is ever down, the site still
loads — project cards fall back to the committed `site/data/projects.json`. Only the
"add a project" admin panel and live contact form need the backend awake.

## Where the blog sits (decided 2026-08-04)

The blog at `/blog` is **static on purpose**. Posts are markdown files in
`site/content/posts/`, indexed by `index.json`, rendered in the browser by
`site/js/blog.js`. The backend is not involved.

That was a real fork in the road. Posts could have lived in the API database with a browser
editor, which is nicer to write in. The problem is availability: a blog served from the
homelab goes blank every time the house loses power, and a crawler that hits it during a
downtime sees an empty page. Writing happens a few times a month, downtime is unpredictable,
so the trade favors static.

The cost is that adding a post means a file and a git push instead of a text box. See
`docs/ADD-A-POST.md`. If that friction ever becomes the reason posts don't get written,
the upgrade path is in `docs/BACKLOG.md`: compose in the admin panel, publish to a markdown
file, keep the static delivery.

## Why this split (the recommendation)

You asked me to choose. This is the pick because:

1. **The site is never down.** The Worker runs on Cloudflare's edge, independent of the
   house's power or internet. A portfolio that 404s during an interview is the one thing to avoid.
2. **The backend is a Python project.** Your whole brand is "teaching myself Python." Building
   and running this FastAPI service *is* a portfolio entry. It's honest and on-theme.
3. **It's all free.** See the table below.
4. **No open ports.** Cloudflare Tunnel dials *out* from your homelab to Cloudflare. You never
   forward a port or expose your home IP.

## What each free tier covers

| Piece | Service | Free tier reality |
|---|---|---|
| Static site | Cloudflare Worker (assets) | 100k requests/day free, custom domain, HTTPS, auto-deploy on push |
| Tunnel | Cloudflare Tunnel (`cloudflared`) | Free, unlimited. **Already running on dockerHost** |
| Backend host | dockerHost (Docker) | Free (own hardware) |
| Database | SQLite (a file) | Free, zero setup, fine for a portfolio's volume |
| Analytics | Google Analytics 4 | Free, `G-M9YCFY8VNQ`, snippet already in the pages |
| Contact email | Gmail SMTP App Password | Free |

## The alternative: all-Cloudflare (no homelab)

If you ever want zero homelab dependency, swap the backend for **Cloudflare Workers + D1**
(Cloudflare's serverless + SQLite database). Same frontend, same API shape. Trade-offs:

- **Pro:** nothing to keep running at home; backend is also on the edge.
- **Con:** Workers are **JavaScript/TypeScript**, not Python, so the "Python backend as a
  learning project" angle goes away. Free tier: 100k requests/day, D1 5 GB, plenty here.

You don't have to decide forever. The frontend is identical either way; only `API_BASE` in
`site/js/config.js` changes.

## The one knob that wires it together

`site/js/config.js`:

```js
window.PORTFOLIO_CONFIG = {
  API_BASE: "https://api.luisamunoz.com",   // the tunnel hostname
  PROJECTS_FALLBACK: "./data/projects.json"
};
```

- `""` (empty) → fully static. Projects come from the JSON file; contact form shows a
  "email me directly" note. Good for launching before the backend exists.
- A URL → the site uses your live Python API for projects + contact, with the JSON file as a
  safety net.
