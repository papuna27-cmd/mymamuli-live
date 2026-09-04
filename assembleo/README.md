# Assembleo — marketing site

Static site for a furniture assembly, delivery and moving company in Mississauga /
the GTA. Built with Astro, deployed to Cloudflare Pages. All dynamic behaviour goes
through a separate Cloudflare Worker API — **this repo contains no business logic
and no secrets**.

Design decisions and the reasoning behind them live in [`DESIGN.md`](./DESIGN.md).
Read that before changing anything visual.

---

## Quick start

```bash
npm install
cp .env.example .env      # working dev defaults, mock API on
npm run dev               # http://localhost:4321
```

The committed `.env.example` sets `PUBLIC_API_MOCK=true`, so the calculator and both forms
work end to end without the Worker running. See **Mock mode** below.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built output |
| `npm run check` | `astro check` — TypeScript + Astro diagnostics |
| `npm run audit` | Static audit of built HTML (SEO, headings, JSON-LD, dead links, alt text) |
| `npm run check:mobile` | Real-browser checks at 320/360/390/430 px + landscape |
| `npm run check:amber` | Asserts the one-amber-control-per-screen rule from DESIGN.md §3 |
| `npm run verify` | Build, then all three checks. **Run this before every deploy.** |
| `npm run shots` | Full-page screenshots at 390 px into `screenshots/` for design review |
| `npm run og` | Regenerates the Open Graph images (see **OG images**) |
| `npm run deploy` | Build + `wrangler pages deploy dist` |

---

## Environment variables

All are `PUBLIC_` because this is a static site — **never put a secret here.**
Anything sensitive belongs in the Worker.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PUBLIC_API_BASE` | yes (prod) | `https://api.assembleo.ca` | Worker origin for `/api/quote`, `/api/booking`, `/api/reviews` |
| `PUBLIC_SITE_URL` | no | `https://assembleo.ca` | Canonical origin; used for canonicals, OG URLs and the sitemap |
| `PUBLIC_API_MOCK` | no | unset | `true` runs the frontend against `src/lib/mock.ts` instead of the Worker |
| `PUBLIC_REVIEWS_LIVE` | no | unset | `true` fetches reviews from the Worker at build time instead of the local file |
| `PUBLIC_GOOGLE_MAPS_KEY` | no | unset | Enables Places Autocomplete. Without it the calculator falls back to a manual km field |
| `PUBLIC_TURNSTILE_SITE_KEY` | no | unset | Renders Turnstile on both forms. Without it the widget is skipped (the honeypot still runs) |
| `PUBLIC_GTM_ID` | no | unset | GTM container. Omitted entirely when unset — no tag, no `<noscript>` frame |

For Cloudflare Pages, set these under **Settings → Environment variables** for the
production and preview environments.

### Mock mode

`PUBLIC_API_MOCK=true` makes `src/lib/api.ts` dynamically import `src/lib/mock.ts`.
Because the flag is replaced at build time, **the mock is tree-shaken out of
production bundles** — it cannot ship by accident.

The mock derives a deterministic distance from the two address strings, so the same
pair always prices the same. Test hooks for the error states:

| Type this in an address | You get |
|---|---|
| anything outside the covered cities | `OUT_OF_SERVICE_AREA` |
| `test-error` | `SERVER` (500 state) |
| `test-limit` | `RATE_LIMITED` (429 state) |
| leave one blank | `INVALID_ADDRESS` |

`test-error` in the booking form's details field triggers the submission error state.

---

## Pricing — important

**No price is ever computed in this repo.** The client posts inputs to
`POST {API_BASE}/api/quote` and renders the breakdown the Worker returns, so rates
change server-side without a redeploy.

`src/data/mock-rates.json` exists only to make the dev mock produce plausible
numbers. It is a fixture, not the pricing model. Changing it changes nothing that a
customer sees.

The model the Worker is expected to implement:

```
Delivery:  subtotal = max(150, 90 + 5.00 × km)
Moving:    subtotal = max(130, 70 + 5.00 × km)
Both:      total    = subtotal × 1.13     // 13% HST
```

Both minimums bind up to exactly 12 km. `km` is one-way driving distance, resolved
server-side from Google place IDs (or from `distanceKmOverride` when the visitor
used the manual fallback).

---

## Where to change things

Copy lives in data files, never in markup. Editing text should not touch a component.

| I want to change… | Edit |
|---|---|
| Phone, email, address, hours, insurance facts, social links | `src/data/site.ts` |
| Homepage / about / commercial / contact / legal copy | `src/data/copy.ts` |
| Service names, scope, what's included, item lists, price notes | `src/data/services.ts` |
| FAQ questions and answers (also feeds `FAQPage` JSON-LD) | `src/data/faqs.ts` |
| Service-area cities | `src/data/cities.ts` |
| Placeholder reviews | `src/data/reviews.json` |
| Colours, type scale, spacing, buttons, shared components | `src/styles/global.css` |
| Structured data shapes | `src/lib/schema.ts` |

### Adding a service-area page

Add an entry to the `cities` array in `src/data/cities.ts`. That is the whole job —
`/service-areas/<slug>` builds itself, the footer picks it up, and the city is added
to `areaServed` in the `LocalBusiness` JSON-LD. `lat`/`lng` also place it on the
coverage map, which is generated from real coordinates.

### Going live with real reviews

1. Deploy the Worker's `GET /api/reviews` (it proxies Google Places and caches in KV
   for 24 h).
2. Set `PUBLIC_REVIEWS_LIVE=true`.

That's the whole swap. Reviews are fetched **at build time**, so the cards are in the
HTML and nothing shifts on hydration; any failure silently falls back to
`src/data/reviews.json` so a flaky upstream can never break a build.

> We deliberately do **not** emit `AggregateRating` structured data. The ratings come
> from Google Business Profile, and marking up third-party reviews as first-party
> breaks Google's structured-data policy. `npm run audit` fails the build if
> `AggregateRating` ever appears. Only add it for reviews collected first-party.

---

## Architecture

```
src/
  data/        content and configuration — all copy lives here
  islands/     the only client-side JS: Calculator, BookingForm, Reviews, MobileNav
  components/  zero-JS Astro components
  layouts/     BaseLayout — head, SEO, JSON-LD, consent mode, GTM, chrome
  lib/         api.ts (typed client), mock.ts, places.ts, schema.ts, types.ts
  pages/       routes
scripts/       build and verification tooling
```

Pages ship **zero JavaScript** by default. Four islands, each loaded only when it is
actually needed:

| Island | Hydration | Why |
|---|---|---|
| `MobileNav` | `client:media="(max-width: 1023px)"` | Desktop nav is plain markup, so the JS never downloads there |
| `Calculator` | `client:visible` (`client:load` on `/calculator`) | Below the fold on the homepage |
| `BookingForm` | `client:visible` | |
| `Reviews` | `client:visible` | Content is server-rendered; the island only adds paging |

Measured on the current build (gzipped): **homepage ≈ 16 KB** of JS with all islands
hydrated (budget: 40 KB), **calculator ≈ 13 KB** including the Preact runtime
(budget: 15 KB).

---

## Mobile

This is a mobile site first — see `DESIGN.md` and §9 of the brief. The rules that are
enforced automatically by `npm run verify`:

- No horizontal scroll at 320, 360, 390 or 430 px, or in a 740×360 landscape viewport.
- Every tap target ≥ 44 px tall. (Checkboxes are measured by their wrapping label;
  links inline within a sentence are exempt per WCAG 2.5.8.)
- Every input ≥ 16 px, so iOS never zooms on focus.
- The hero CTA is above the fold at 390×844.
- The sticky bar never covers the last element of a page.
- At most one filled `--signal` control is on screen at any scroll position.

Things a script cannot check, verified by hand from `npm run shots`: the calculator is
completable one-handed, the nav traps focus and locks scroll, and the curbside notice
is unmissable on `/services/moving`.

---

## Deploying

```bash
npm run verify        # build + all checks; do not skip
npx wrangler pages deploy dist --project-name=assembleo
```

`public/_headers` ships a CSP, HSTS and immutable caching for `/_astro/*` and
`/fonts/*`. If you add a third-party script you **must** add its origin to the CSP or
it will be silently blocked.

`public/_redirects` maps `/sitemap.xml` to the `sitemap-index.xml` that
`@astrojs/sitemap` emits, plus a few convenience redirects.

### OG images

`public/og/*.png` are generated by `npm run og` and **committed**, because the script
needs Archivo and IBM Plex Sans installed as system fonts (via fontconfig) to
rasterise text — which a clean CI box will not have. Regenerate locally when the copy
in `scripts/og.mjs` changes, and commit the result.

---

## Before launch — required

These are placeholders and will send real customers nowhere:

- [ ] **Phone number.** `site.phone` / `site.phoneDisplay` in `src/data/site.ts` is
      `(905) 555-0142`, in the reserved fictional range.
- [ ] **Street address and postal code** in `src/data/site.ts`.
- [ ] **Google Business Profile URL** — `site.social.google` has a placeholder CID.
- [ ] **Facebook URL** — `site.social.facebook`.
- [ ] **Rating and review count** in `site.facts` — currently illustrative. Either
      make them true or remove them; they appear as trust claims on every page.
- [ ] **`jobsCompleted` and `founded`** — same.
- [ ] **`src/data/reviews.json`** is placeholder content. Replace it, or turn on
      `PUBLIC_REVIEWS_LIVE`.
- [ ] **Have a lawyer review `/privacy` and `/terms`.** They are written to be
      accurate and plain-language for an Ontario operator, but they are not legal
      advice and the insurance figures in them must match the real policy.
- [ ] Set `PUBLIC_GTM_ID`, `PUBLIC_TURNSTILE_SITE_KEY` and `PUBLIC_GOOGLE_MAPS_KEY`
      in Cloudflare Pages.

---

## Worker contract

The frontend expects exactly this. Types are in `src/lib/types.ts`.

`POST /api/quote` → `200` with `{ quoteId, service, distanceKm, currency, breakdown,
disclaimer, expiresAt }`; `400` with `{ error: "INVALID_ADDRESS" | "OUT_OF_SERVICE_AREA"
| "VALIDATION_FAILED", message }`; `429` with `{ error: "RATE_LIMITED", retryAfter }`.

`POST /api/booking` → `200` with `{ bookingId, status: "received" }`. The Worker must
verify `turnstileToken` and reject any submission where the `website` honeypot field
is non-empty.

`GET /api/reviews` → `{ rating, count, profileUrl, reviews: [{ author, rating, text,
relativeTime, profilePhotoUrl }] }`.

Every error state has its own copy in `errorMessage()` in `src/lib/api.ts` — there is
no generic "something went wrong" anywhere in the UI.
