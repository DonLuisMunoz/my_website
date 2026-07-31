# Luis — Portfolio (Learning in Public)

A Neo-Brutalist portfolio / link-in-bio site. **Plain HTML/CSS/JS** frontend on Cloudflare
Pages, with an optional **Python (FastAPI)** backend on a homelab for the project CMS and
contact form. Same brand DNA as the Content system, rendered in the brutalist skin.

## Folder structure

```
portfolio-system/
├── site/                     # FRONTEND → deploy to Cloudflare Pages (output dir: site)
│   ├── index.html            # the portfolio page (semantic, classed, no inline styles)
│   ├── admin.html            # private panel to add/edit/delete projects (noindex)
│   ├── css/
│   │   ├── styles.css         # the ONE entry point — imports everything below
│   │   ├── components.css     # all neobrutalist component classes
│   │   └── tokens/            # shared design tokens (colors, type, spacing, fonts)
│   ├── js/
│   │   ├── config.js          # ← set API_BASE here (the only knob)
│   │   ├── main.js            # typing, streak, reveal, project render, contact form
│   │   └── admin.js           # CRUD client for the admin panel
│   ├── data/
│   │   └── projects.json      # project data (static fallback / no-backend source)
│   └── assets/                # logos (svg)
│
├── api/                      # BACKEND → Docker on homelab behind Cloudflare Tunnel
│   ├── main.py               # FastAPI: projects CRUD + contact + health
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml     # api + optional cloudflared tunnel sidecar
│   └── .env.example          # copy to .env, fill secrets (never commit .env)
│
├── docs/
│   ├── ARCHITECTURE.md        # hosting recommendation + free tiers + alternative
│   ├── DEPLOY.md              # step-by-step: Pages, then homelab + tunnel
│   ├── ADD-A-PROJECT.md       # how to add/update a project (admin or JSON)
│   └── BACKEND-LESSON.md      # learn the backend (reinforcement-coach Phase 1)
│
├── neobrutalism-spec.md       # authoritative component + interaction spec
└── readme.md
```

## Quick start

- **Just see it:** open `site/index.html` in a browser. Works static, no build.
- **Add a project:** see `docs/ADD-A-PROJECT.md`.
- **Go live:** follow `docs/DEPLOY.md` (frontend first, backend optional).
- **Understand the backend:** `docs/BACKEND-LESSON.md`.

## Design rules (Neo-Brutalist)

0px radius · 2–3px solid plum borders · hard offset shadows (no blur) · hover lifts, active
presses, no fades. All color/type/spacing come from `site/css/tokens/` — edit tokens, never
raw hex in the HTML. Full module set in `neobrutalism-spec.md`.

## Brand tokens

brand = gold `#E0A92E` · accent = terracotta `#C8542B` · success = teal `#2E7D6F` ·
ink/border = plum `#2B1B2E` · surface = cream `#F2E4C9` / paper `#FBF3E2`.
Type: Space Grotesk (display), JetBrains Mono (UPPERCASE labels), Public Sans (body).
