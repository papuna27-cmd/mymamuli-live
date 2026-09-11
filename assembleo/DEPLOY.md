# Deploying Assembleo to Cloudflare (free tier)

Everything this site uses is on Cloudflare's free plan. Nothing here needs a
paid upgrade at the traffic a local trades business gets.

| Service | Free allowance | What it does here |
|---|---|---|
| Pages | unlimited requests, 500 builds/month | Hosts the static site |
| Pages Functions | 100,000 requests/day | `/api/booking`, `/api/reviews` |
| D1 | 5 GB, 5M row reads/day | Stores booking requests |
| KV | 100k reads/day, 1k writes/day | Rate limiting, review cache |
| Turnstile | unlimited | Spam protection on the form |
| Web Analytics | unlimited | Cookieless traffic stats |

The API runs as **Pages Functions on the same origin** as the site, not as a
separate Worker. That means no CORS, no second deploy, no extra DNS record, and
one less network round trip for the visitor.

---

## 1. Create the Cloudflare resources

Run these from the `assembleo/` directory. `wrangler` will open a browser to log
in the first time.

```bash
npx wrangler login

# Database for booking requests
npx wrangler d1 create assembleo

# Two KV namespaces: rate limiting, and the Google reviews cache
npx wrangler kv namespace create RATE
npx wrangler kv namespace create REVIEWS
```

Each command prints an id. Paste all three into `wrangler.toml`, replacing the
`00000000-...` placeholders.

Then create the tables:

```bash
npm run db:init          # applies schema.sql to the real database
```

---

## 2. Create the Pages project

**Option A — connect the Git repo (recommended).** Every push deploys itself.

In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**,
pick this repository, then set:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| **Root directory** | `assembleo` |

The root directory matters: this project lives in a subfolder of the repo.

**Option B — deploy from this machine.**

```bash
npm run deploy           # build + wrangler pages deploy dist
```

---

## 3. Set the environment variables

In **Settings → Environment variables**, for Production *and* Preview.

### Public (safe to expose; they end up in the HTML)

| Name | Value |
|---|---|
| `PUBLIC_SITE_URL` | `https://assembleo.ca` |
| `PUBLIC_API_MOCK` | `false` |
| `PUBLIC_REVIEWS_LIVE` | `false` until step 5, then `true` |
| `PUBLIC_TURNSTILE_SITE_KEY` | from step 4 |
| `PUBLIC_CF_ANALYTICS_TOKEN` | from step 6 |

### Secrets (encrypted; never put these in `wrangler.toml` or git)

| Name | Where it comes from |
|---|---|
| `TURNSTILE_SECRET` | Turnstile widget, step 4 |
| `RESEND_API_KEY` | Resend, step 7 |
| `NOTIFY_EMAIL` | the inbox that should receive leads |
| `FROM_EMAIL` | e.g. `Assembleo <noreply@assembleo.ca>` |
| `GOOGLE_MAPS_KEY` | Google Cloud, step 5 |
| `GOOGLE_PLACE_ID` | Google Business Profile, step 5 |

From the command line instead of the dashboard:

```bash
npx wrangler pages secret put TURNSTILE_SECRET --project-name=assembleo
```

**Every one of these is optional except the database.** The form degrades
sensibly: no Turnstile key means the honeypot and rate limiter still run; no
Resend key means the lead is still stored and you read it with `npm run db:leads`;
no Google key means the site shows the reviews baked in at build time.

---

## 4. Turnstile (spam protection)

**Dashboard → Turnstile → Add widget.** Domain `assembleo.ca`, mode *Managed*.

It gives you a **site key** (public → `PUBLIC_TURNSTILE_SITE_KEY`) and a
**secret key** (→ `TURNSTILE_SECRET`). Free and unlimited.

---

## 5. Google reviews (optional)

1. Find your **Place ID** at
   <https://developers.google.com/maps/documentation/places/web-service/place-id>.
2. In Google Cloud, enable **Places API** and create an API key.
   **Restrict it to the Places API and to your server**, or it can be abused.
3. Set `GOOGLE_PLACE_ID` and `GOOGLE_MAPS_KEY`, then flip
   `PUBLIC_REVIEWS_LIVE` to `true`.

Results are cached in KV for 24 hours, so this costs about one Google API call
per day — inside their free monthly credit.

> The site deliberately does **not** emit `AggregateRating` structured data for
> Google-sourced reviews. Marking up third-party ratings as your own breaks
> Google's policy. `npm run audit` fails the build if it ever appears.

---

## 6. Web Analytics (free, no cookie banner)

**Dashboard → Analytics & Logs → Web Analytics → Add a site.** Copy the token
into `PUBLIC_CF_ANALYTICS_TOKEN`.

It sets no cookies and stores no identifiers, so it needs no consent banner and
does not slow the page down. If you also want Google Analytics, set
`PUBLIC_GTM_ID` — consent mode is already configured to deny analytics and ad
storage until the visitor agrees.

---

## 7. Email notifications (optional)

[Resend](https://resend.com) has a free tier of 3,000 emails/month, which is far
more than this form will ever send.

1. Sign up, add and verify the `assembleo.ca` domain (they give you the DNS
   records; if the domain is on Cloudflare this is a two-minute job).
2. Create an API key → `RESEND_API_KEY`.
3. Set `NOTIFY_EMAIL` to wherever leads should arrive, and `FROM_EMAIL` to a
   verified sender on the domain.

Replies go to the customer's address automatically.

If you would rather not use a third party at all, skip this: leads are in D1 and
`npm run db:leads` prints the latest 25.

---

## 8. Domain

If `assembleo.ca` is already on Cloudflare, add it under
**Pages → Custom domains** and the certificate is issued automatically.

If it is registered elsewhere, either move the nameservers to Cloudflare (free)
or add the CNAME the Pages dashboard shows you.

---

## Running the whole thing locally

```bash
npm install
cp .env.example .env

# Frontend only, no backend — the calculator and forms use a local mock
npm run dev

# Or the real backend, with a local D1 and KV
npm run db:init:local
npm run dev:api          # http://localhost:8788
```

With `dev:api` running, `npm run e2e` drives a real browser through the
estimator, fills the form, submits it, and checks the row lands in the database.

---

## Before every deploy

```bash
npm run verify
```

That builds, typechecks the site and the Functions, audits the built HTML
(titles, meta descriptions, canonicals, heading order, JSON-LD, FAQ visibility,
dead links, alt text), drives a real browser at 320/360/390/430 px plus
landscape, and asserts the one-amber-control-per-screen design rule.
