# Backend Quiz — Session Log

**Date:** 2026-07-01
**Topic:** Portfolio backend (`api/main.py`) — FastAPI, REST, auth, SQLite, CORS, Docker
**Method:** Reinforcement-coach active recall (Phase 2 quiz → Phase 7 mastery → Phase 8 spaced repetition)
**Overall mastery:** ~62%

---

## Scores by concept

| Concept                               | Score | Note                                                                        |
| ------------------------------------- | ----- | --------------------------------------------------------------------------- |
| Client / server split                 | 7/10  | Right instinct; "client serves site" → client _runs_ it, host serves it     |
| HTTP verbs & REST                     | 8/10  | Strongest area — clean GET/POST/PUT/DELETE mapping                          |
| Path param vs request body            | 6/10  | Confused body with headers; URL = _which_, body = _what_                    |
| POST vs PUT / who owns the id         | 7/10  | Flipped a misconception mid-question — best recovery of the session         |
| Bearer-token auth & compare_digest    | 6/10  | Got timing attacks; missed that token travels in the Authorization header   |
| SQL injection & parameterized queries | 6/10  | Named the attack; needs the break example + data/code separation            |
| CORS & allowed origins                | 4/10  | Softest spot — got lost; browser-enforced, not server                       |
| Docker containers & volumes           | 6/10  | Volume reasoning solid; container is _disposable_, not "persistent runtime" |
| Full request round-trip               | 6/10  | Good skeleton; skipped the tunnel and the auth gate                         |

## Strengths

- REST verb → SQL mapping is genuinely solid.
- Recovers fast when corrected (the id-ownership flip was real learning, not memorization).

## Weak areas to revisit

1. **CORS** — "the browser asks the API: do you trust this website? `ALLOWED_ORIGINS` is the guest list." Enforced by the _browser_, not the server (that's why curl/address-bar works but the site doesn't).
2. **Path param vs body** — URL says _which_, body carries _what_; headers ≠ body.
3. **Docker** — the container is disposable; the **volume** is the part you keep. Data survives _restart_ but not _rebuild_ without the volume.

## Key phrases that landed

- The API is the gatekeeper.
- Parameterized queries keep data and code apart.
- The container is disposable; the volume is what you keep.
- The tunnel is how the request reaches home; the auth check is the gate before any write.

---

## Spaced repetition schedule

**Tomorrow (2026-07-02)**

1. Why can't the browser hold your `ADMIN_TOKEN` or DB credentials?
2. What's the one-line symptom that screams "CORS problem"?
3. POST the same new project twice — how many rows, and who assigned the ids?

**One week (2026-07-08)**

1. Rebuild the container after a code change with no `volumes:` line — what happens to the data and why?
2. Explain `?` placeholders to a non-coder in one sentence.
3. Which parts of the round-trip run _before_ the database is touched on a write?

**One month (2026-08-01)**

1. From memory, trace a project add end-to-end, naming the tunnel, auth check, validation, and DB.
2. Move the site to Cloudflare Workers instead of the homelab — which concepts stay identical, which change?

## Next session

- Run the **trace-and-predict** round: snippets of `main.py`, predict exact output or error.
- Re-quiz CORS and Docker specifically (the two weakest).
