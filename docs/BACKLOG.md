# Portfolio Backlog

Ideas parked for later. Newest at top.

## Blog at luisamunoz.com/blog (Phase 4)
Confirmed path: `/blog` (homelab is on subdomains, so the subpath is free).
Not built yet. Likely markdown files rendered client-side so Luis can post
without touching code. When live, un-hide the Writing section in index.html
(nav link + the commented `#writing` section) and point it at `/blog`.

## Real GitHub-tied streak (upgrade)
Current streak = days since 2026-07-01, computed in JS (always accurate, never
resets). A true commit streak tied to the GitHub contribution graph is possible
but needs plumbing: GitHub has no CORS-friendly public streak API, and a token
can't be exposed client-side. Options: (a) a scheduled/build-time fetch of the
contributions GraphQL that writes a number into the site, or (b) embed a
third-party streak-stats image (styling won't match the brutalist skin, and it
resets to 0 on a missed day). Revisit when the homelab backend is in play.

## Backend phase — make it a full-stack project
Stand up the FastAPI backend (api/) so the site stops being purely static and
becomes a real full-stack build. This unlocks the dynamic features:
- **Resume link/download** served + managed by the backend (versions, maybe
  click tracking) instead of a static PDF. Deferred here on purpose 2026-08-04.
- **Contact form** posts to the API instead of the mailto fallback.
- **Project CMS** via the existing admin.html (add/edit projects without editing
  JSON), which also feeds the tag-driven stack.
- **Real GitHub-tied streak** (needs a server-side fetch — see below).
Backend runs on the homelab behind a Cloudflare Tunnel (e.g. api.luisamunoz.com,
a subdomain alongside the other homelab services). See api/ + docs/DEPLOY.md.

## v2.0 — Visitor-intent landing (self-select)
A warm landing page ("Hi, I'm Luis. What brings you here?") with brutalist
"doors" that route to tailored views. Visitor self-selects — no auto-detection
or fingerprinting (unreliable + privacy issues).

- Paths (start with 2, grow later): **Work** (portfolio, resume, real projects —
  the job-search lead) and **Explore** (learning-in-public log + blog). Possible
  third: **Hub** (personal links: GitHub, LinkedIn, Instagram).
- Homelab is on subdomains, so subpaths (`/work`, `/learn`, `/hub`) are free to use.
- Remember choice in localStorage; offer a "switch view" toggle.
- Watch-outs: don't gate recruiters behind a slow/unclear splash; keep each path
  crawlable for SEO; each view is more content to maintain (reason to start with 2).
- Reuse existing neobrutalist components — not a from-scratch redesign.

Raised 2026-08-04. Deferred in favor of Phase 1-4 fixes on the current single-page site.
