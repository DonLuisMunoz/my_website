# How to add / update a project

The learning-log cards (the grid under the FEATURED entry) are **data-driven** — you never
hand-edit `index.html` to add one. There are two ways depending on whether your backend is up.

## Way 1 — the Admin panel (recommended, needs the backend)

1. Make sure `API_BASE` is set in `site/js/config.js` and your Python API is running.
2. Open **`/admin.html`** on your site (e.g. `https://luislearns.dev/admin.html`).
3. Paste your **admin token** (the `ADMIN_TOKEN` from `api/.env`) into the token box.
4. Fill in Title, Meta line (e.g. `2026 · LOG #05`), Description, Tags, and the repo URL.
5. Hit **save project →**. It appears on the homepage immediately.

From the same page you can **edit** or **delete** any existing project. The token is sent only
as an auth header per request — it is never stored.

> Keep `/admin.html` low-profile: it has `noindex`, and every write requires the token. For a
> personal portfolio that's enough. If you want a real login later, that's a natural next
> Python lesson.

## Way 2 — edit the JSON file (no backend needed)

If you're running fully static (no backend yet), edit **`site/data/projects.json`** and commit.
Each project is one object:

```json
{
  "id": "cheat-code-scanner",
  "meta": "2026 · LOG #05",
  "title": "Cheat Code Scanner",
  "body": "What you built and the lesson that stuck.",
  "tags": ["loops", "conditionals", "accumulator"],
  "url": "https://github.com/your-handle/repo"
}
```

- `id` must be unique (lowercase-with-dashes).
- `tags` is a list; leave `[]` for none.
- `url` is the repo/demo link; leave `""` to hide the button.
- Newest goes at the **top** of the array.

Push to GitHub → Cloudflare Pages rebuilds in ~30 seconds.

> Note: the API and the JSON file are two separate stores. Use the Admin panel **or** the JSON
> file as your source of truth — pick one so they don't drift. With the backend live, the API
> wins and the JSON file is just the offline fallback.

## Updating other parts of the page

These live directly in `site/index.html` (search for the comment markers):

| You want to change | Find this section | What to edit |
|---|---|---|
| The FEATURED highlight | `<!-- featured entry` | Title, body, tags, the two code blocks |
| Skill XP bars | `id="stack"` | `style="width:72%"` on each `.skill__fill` + the level label |
| "currently / streak / shipped / reading" strip | `class="strip"` | The text in each `.strip__value` |
| Blog post cards | `id="writing"` | The two `.post` links |
| Social links / email | `class="contact__links"` | `href` on each button |
| Streak target number | `site/js/main.js` | `var target = 27;` |
| Typing-line phrases | `site/js/main.js` | the `phrases` array |

All colors, fonts and spacing come from `site/css/tokens/`. Change a token once and it updates
everywhere — don't paste raw hex codes into the HTML.
