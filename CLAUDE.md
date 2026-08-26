# MyMamuli.ge — Project rules for Claude Code

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

## Note on the two folders

The site is kept in two synced folders on this computer:
- `mymamuli-live` — deploy source (this folder)
- `mymamuli-ტესტი` — dev/working copy
Keep them in sync; deploy only from `mymamuli-live`.
