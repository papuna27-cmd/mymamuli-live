# Assembleo — design plan

Written before the build. The palette in the brief is fixed and is applied here, not
redesigned. Everything else below is a decision this document is making.

---

## 1. Typefaces

Two faces, one of them with a personality. Both self-hosted as woff2 subsets
(`latin`), `font-display: swap`. Only the display face is preloaded.

| Face | Weights | Role |
|---|---|---|
| **Archivo** | 700, 800 | `h1`, `h2`, step numerals, the estimated total, the wordmark, button labels |
| **IBM Plex Sans** | 400, 500, 600 | Body, `h3`, nav, labels, inputs, tables, captions, legal |

**Why these.** Archivo is a grotesque drawn for signage and newsprint — squared
terminals, tight apertures, high x-height. At 800 it reads as painted on the side of a
van rather than as a startup wordmark. IBM Plex Sans is the workhorse: it was drawn for
technical documentation, so it holds up at 15–16 px on a phone in daylight and its
figures are unambiguous, which matters when the page's job is to show a price.

**No third face.** The calculator breakdown wants monospaced-looking figures; it gets
them from `font-variant-numeric: tabular-nums` on IBM Plex Sans instead of a mono
family. Same alignment, no extra download.

### Type scale

One scale, eight steps, ratio ≈ 1.26. Mobile values are the base; only `--t-3xl` and
`--t-2xl` grow on wider viewports. Nothing on the site uses a size outside this list.

```
--t-xs    13px   legal, captions, the disclaimer
--t-sm    15px   secondary text, row subtitles, form help
--t-base  16px   body, all inputs (16px floor — smaller makes iOS zoom on focus)
--t-md    18px   lead paragraph, FAQ questions
--t-lg    21px   h3, service row titles
--t-xl    26px   h2                        (30px ≥768px)
--t-2xl   33px   the estimated total, page h1  (40px ≥768px)
--t-3xl   42px   homepage hero h1 only      (60px ≥768px)
```

Line length is capped at `68ch` for prose, comfortably under the 80-character limit.
Body line-height 1.55; display line-height 1.05.

---

## 2. Layout concept — "the job sheet"

The site is organised like a work order: a heavy header block, ruled line items, a
numbered sequence, and exactly one boxed total. That metaphor is doing real work — it
gives each section a *structurally* different shape without inventing four card styles.

- **Ruled rows, not cards.** Services and FAQs are full-bleed hairline-divided rows.
  No card, no shadow, no border radius. The list reads like line items.
- **One heavy block.** The hero is a solid `--ink` field. It is the only inverted
  surface on the site and the only place boldness is spent.
- **One elevated surface per page**, as the brief requires: the calculator result
  panel. It is the total box on the invoice. Everything else sits flat on the ground.
- **Grounds alternate, cards don't stack.** Sections alternate `--paper` and
  `--surface` full-bleed. Nothing is ever a card on a card.

Radius is a single token, `4px`, on inputs, buttons and the two real panels. Not pills,
not 16px blobs. Shadow is a single token used on a single element per page.

### Homepage at 390 px

```
┌────────────────────────────────────────┐ 390
│ ASSEMBLEO                    [≡ Menu]  │ 56px, ink on paper, hairline underneath
├════════════════════════════════════════┤
│▓▓ INK FIELD ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓                                      ▓│
│▓  Flat-pack built.                    ▓│ Archivo 800 / 42px / paper on ink
│▓  Delivered. Moved.                   ▓│
│▓                                      ▓│
│▓  Mississauga and the GTA. Insured    ▓│ 16px, two lines
│▓  crews, next-day slots.              ▓│
│▓                                      ▓│
│▓  ┌──────────────────────────────────┐▓│
│▓  │           Get a quote            │▓│ AMBER fill / ink text / 52px
│▓  └──────────────────────────────────┘▓│
│▓  ┌──────────────────────────────────┐▓│
│▓  │        Call (905) 555-0142       │▓│ ghost, paper hairline / 52px
│▓  └──────────────────────────────────┘▓│
│▓                                      ▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ ≈ 470px — fold at 844 is far below
├────────────────────────────────────────┤
│ ✓ Insured   ✓ WSIB   4.9 ★ · 127       │ trust strip, 13px, ✓ in --verified
├────────────────────────────────────────┤
│ What we do                             │ h2, sentence case
│ ────────────────────────────────────── │
│ Assembly                            ›  │ ruled row, 21px ink + 15px slate
│ IKEA, Wayfair, Costco, Structube       │ ≥64px tall
│ ────────────────────────────────────── │
│ Commercial assembly                 ›  │
│ Gyms, clinics, hotels, offices         │
│ ────────────────────────────────────── │
│ Delivery                            ›  │
│ Store pickup through to unloading      │
│ ────────────────────────────────────── │
│ Moving              [ CURBSIDE ONLY ]  │ the limit is stated in the list itself
│ Medium furniture, van and two hands    │
│ ────────────────────────────────────── │
├────────────────────────────────────────┤
│ How it works                           │
│                                        │
│  1   Send the job. Photos help.        │ numeral: Archivo 800 / 33px / --signal
│  2   Get a window and a price.         │
│  3   Crew arrives, builds, clears up.  │
├────────────────────────────────────────┤
│ Estimate a job                         │
│ ┌────────────────────────────────────┐ │
│ │ [ Delivery ][ Moving ]             │ │ tabs, active tab underlined in --signal
│ │ ·································· │ │ THE elevated surface
│ │ Pickup address                     │ │
│ │ [________________________________] │ │ 48px, 16px text
│ │ Drop-off address                   │ │
│ │ [________________________________] │ │
│ │ ┌────────────────────────────────┐ │ │
│ │ │       Estimate this job        │ │ │ amber — hero CTA is off-screen by now
│ │ └────────────────────────────────┘ │ │
│ │ Open the full calculator           │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│ What customers say      4.9 ★ · 127    │
│ ┌───────────────────┐ ┌──────────────  │ scroll-snap swipe, CSS not JS
│ │ ★★★★★             │ │ ★★★★★          │
│ │ "…"               │ │ "…"            │
│ │ Name · 2 weeks    │ │ Name · 1 month │
│ └───────────────────┘ └──────────────  │
│ ● ○ ○ ○      Read them on Google       │
├────────────────────────────────────────┤
│ Book a job                             │
│ [ one field per row, labels above ]    │
├────────────────────────────────────────┤
│ FOOTER — ink ground                    │
│ services · areas · legal · social      │
│ padding-bottom = bar height + safe-area│
├════════════════════════════════════════┤
│ [    Get a quote    ] [ 📞  Call ]     │ STICKY, phone only, hidden ≥768px
└────────────────────────────────────────┘
```

Desktop is the adaptation: at ≥768 px the sticky bar disappears (the header gains a
persistent CTA), service rows become a 2×2 grid of the *same rows*, and the calculator
puts its form and result side by side. No new components appear on desktop.

---

## 3. Three principles

**1. A number beats a paragraph.**
The visitor is next to a box or a van, on cellular, deciding whether to pay someone
today. Every page puts a number — a price, a window, a distance, a count — inside the
first screen. The estimated total is the largest non-hero type on any page it appears
on: price typography outranks marketing typography. Prose that doesn't lead to a number
or a limit gets cut.

**2. State the limit as loudly as the offer.**
Curbside-only on moving, floors not included, what costs extra, what "delivery" does
not cover. These are set in a bordered scope block at body size in `--ink` — never as
grey fine print, never below the fold, and repeated verbatim in the calculator result.
A dispute on site costs more than a lead that self-selected out. This is why the
moving row on the homepage carries its limit as a badge before the user ever taps it.

**3. One amber target per screen.**
`--signal` is wayfinding, not decoration. The rule is enforced literally: at most one
filled amber control is in the viewport at any scroll position. The hero CTA scrolls
away before the calculator's button arrives; the sticky bar's call button is a ghost
button, not a second amber. Everything secondary is an `--ink` outline. This keeps
amber under 5% of any screen without having to measure it.

---

## 4. Colour application

Palette is as briefed. How it lands:

- `--ink` — hero ground, footer ground, body text, all secondary buttons' outline and label.
- `--slate` — row subtitles, captions, form help, icon strokes. Never for anything a user must read to decide.
- `--line` — every divider and input border. This is the structure of the site.
- `--paper` — page ground.
- `--surface` — the calculator panel, form fields, review cards, alternating sections.
- `--signal` — one filled control per screen; the active calculator tab's underline; the step numerals; the total's figure. Nothing else.
- `--verified` — the insured / WSIB ticks, the "booking received" state, the calculator's success check. Not an accent.
- `--alert` — inline validation messages and their field borders. Nothing else.

CTA is `--ink` on `--signal`. White on amber is never used anywhere.

---

## 5. Motion

One deliberate moment: **the result panel settling in.** When a quote returns, the
panel rises 8 px and fades over 220 ms with the breakdown rows revealing in a single
150 ms step (not staggered), and the total's tabular figures cross-fade. That is the
moment the page earns its keep, so it is the only thing that performs.

Everything else is action feedback only: button in-flight labels, validation messages
appearing, the nav sheet sliding, the calculator step transition. No section-by-section
fade-ups, no scroll-triggered anything, no parallax.

Under `prefers-reduced-motion: reduce`, every transform and transition is removed;
states still change, they just change instantly.

---

## 6. Copy voice

Canadian English, active voice, sentence case, plain verbs. Say the thing:
"We build it and take the cardboard away," not "seamless assembly solutions."
No superlative without a fact behind it — "insured" is a fact, "premium" is not.
Numbers are written as numbers. The word "solutions" does not appear on the site.

---

## 7. Self-review of this plan

Checked against the constraints, with the changes made:

- **Identical rounded cards everywhere** — avoided. The site has three card-shaped
  things total (calculator panel, review card, commercial quote panel) and the main
  content lists are ruled rows with no container at all.
- **Same soft grey shadow everywhere** — one shadow token, one element per page.
  Structure comes from `--line`.
- **All-caps tracked eyebrow labels** — the first wireframe draft had `WHAT WE DO` /
  `HOW IT WORKS` as headings. Revised to sentence case throughout. The only uppercase
  on the site is the wordmark and the `CURBSIDE ONLY` badge, where it is a warning
  label doing warning-label work.
- **`→` appended to button text** — no button on the site contains an arrow. The
  service rows use a chevron as a row affordance (an icon, not label text), and text
  links read "Open the full calculator", not "Learn more →".
- **Type scale discipline** — eight steps, listed above, no ad-hoc sizes.
- **Boldness in one place** — the hero ink field. Everything after it is quiet.
- **Line length** — 68ch cap on prose.
- **Not a SaaS landing page** — no gradient, no glass, no floating screenshot, no
  logo cloud styled as social proof (the brand list is set as plain text in the trust
  strip, because it is a factual list of what we assemble, not a customer roster).
