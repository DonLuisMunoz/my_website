---
name: luis-portfolio

description: Luis's PORTFOLIO design system — the portfolio / link-in-bio site and case-study surfaces. Same Luis brand DNA (shared color, type, logo) rendered in a NEO-BRUTALIST skin — thick black borders, hard offset shadows, raw cream blocks, exposed structure. Use this when the job is the portfolio, project pages, or any "show the work" surface (not daily posts).
user-invocable: true
---

Read `readme.md` in this folder and `neobrutalism-spec.md` (the authoritative component
spec), then explore `site/css/tokens/` and `site/assets/`. The live template is
`site/index.html` (plain HTML, styled by `site/css/styles.css`).

This is the **portfolio half** of Luis's personal brand. Same brand, different personality:
where the Content system is warm and flat, the Portfolio system is **Neo-Brutalist** —
honest, structural, confident.

## Foundations (shared)
Color, type, spacing and logo are shared with the Content system (`./tokens/*`, `./assets/`).
Token → role mapping for the brutalist skin:
- **brand** = gold `#E0A92E` · **accent** = terracotta `#C8542B` · **success** = teal `#2E7D6F`
- **ink / border** = plum `#2B1B2E` · **surface** = cream `#F2E4C9` / paper `#FBF3E2`
- Type unchanged: Space Grotesk (headlines), JetBrains Mono (labels), Public Sans (body).

## Neo-Brutalist rules (see neobrutalism-spec.md for full module set)
- **0px radius** everywhere (sharp corners). **2–3px solid plum borders** on every block.
- **Hard offset shadows** — `box-shadow: 4px 4px 0 var(--plum)` (no blur). Sizes 3/4/6px.
- **Interactions:** hover lifts (shadow grows + translate −2px); active presses (shadow → 0,
  translate to meet it). No fades.
- Flat fills only — brand/accent blocks sit on cream with a black border + hard shadow.
- Mono UPPERCASE labels, big Space Grotesk display, exposed grid lines.

## Templates
- `site/index.html` — portfolio / link-in-bio site (brutalist, plain HTML/CSS/JS).
- `site/admin.html` — private CMS panel to add/edit projects.
- Backend in `api/` (Python FastAPI). See `docs/` for architecture, deploy, and add-a-project.
- Original design-tool export archived in `_archive/`.

If invoked without guidance, ask which surface to build (home, a case study, link-in-bio),
ask a couple of focused questions, and act as Luis's portfolio designer.
