# MyMamuli.ge — Project rules for Claude Code

**Before doing anything else, read `HANDOFF.md` in this same folder.** It has the full technical picture: hosting/Cloudflare resource IDs, D1 schema, every API endpoint, required secrets/bindings, known open issues (including an urgent pending D1 cleanup), and architecture notes — everything needed to keep working on this site without re-discovering it from scratch.

## Deployment autonomy

Deployment is YOUR responsibility — do NOT hand it back to the human after every change.

The deploy source is this folder (`mymamuli-live`). Deploy with:

```
npx wrangler pages deploy .
```

When you finish a change:
1. Run the build / smoke check (open the affected pages, confirm no errors).
2. If everything passes, **deploy it yourself** with the command above.
3. **After** deploying, send ONE short report: new build ID + commit hash + what changed.
4. Do NOT ask for permission on every deploy.

Ask the human ONLY when:
- the change breaks something or a check fails,
- the change involves database deletion or migration (D1 / `schema.sql`),
- the change touches secrets / API keys / payment logic.

## Definition of Done (applies to every change)

A change is not "done" until:
- Works on **mobile first** (≤480px), then tablet, then desktop — no horizontal scroll, touch targets ≥44px.
- Does not weaken security (`_headers`, auth, rate-limit); no CSP errors in the console.
- Any new/edited text exists in **both Georgian and English** (`i18n.js`) — no Georgian left in EN mode.
- Existing pages/features still work (home, map, sell/seek forms, login/cabinet).
- Deployed and the **build ID changed**; commit hash provided.

## Versioning

- `git commit` before every deploy. Each deploy must produce a new build ID.
- Keep a private remote (GitHub/GitLab) as an off-machine backup.

### Where the build stamp lives — bump ALL of these together

Format `YYYY.MM.DD-HHMM`. `i18n.js` is served with a 1-year `immutable`
cache (`_headers`), so the `?v=` query string is the ONLY thing that busts
it. Miss one file and that page keeps a frozen dictionary forever — this has
already caused three separate "the new translation doesn't show up" bugs
(index.html 2026-08-26, form.html 2026-09-01, cabinet.html 2026-09-10).

| File | Places |
|---|---|
| `index.html` | 4 — `i18n.js?v=`, `window.MM_BUILD`, `<footer data-build>`, `.bstamp` text |
| `form.html`  | 1 — `i18n.js?v=` |
| `cabinet.html` | 1 — `i18n.js?v=` |

One-liner that does all six:

```
sed -i '' "s/2026\.09\.10-0613/<NEW-STAMP>/g" index.html form.html cabinet.html
```

Verify after deploy: `curl -s https://mymamuli.ge/ | grep -o "i18n.js?v=[0-9.-]*"`
must show the new stamp (same for `/form.html` and `/cabinet.html`).

## Note on the two folders

The site is kept in two synced folders on this computer:
- `mymamuli-live` — deploy source (this folder)
- `mymamuli-ტესტი` — dev/working copy
Keep them in sync; deploy only from `mymamuli-live`.
