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

---

## Revision two — the desktop pass

The first build was reviewed on a phone and in a 1024px browser, and it showed.
Opened on a laptop it read as unfinished, and the client was right to say so.
Four things were wrong, and only one of them was taste.

**The type scale had no top end.** Every step was a fixed rem value topping out
at 42px, so a 1512px screen got phone-sized headings. The scale is now fluid:
each step interpolates between a phone value and a desktop one, and the hero
title runs 40px to 72px. Nothing else about the eight-step discipline changed.

**Three blocks shipped with no CSS at all.** `.areaChips`, `.areaAll`, `.seg`
and `.seg__link` were written in the markup and never styled, so the service
area list rendered as a bare column of underlined links with two thirds of the
window empty beside it. `npm run audit` now has no opinion about this; a
grep for undefined class names during review does.

**The reviews rail collapsed.** `grid-auto-columns: minmax(0, 360px)` let six
cards divide one row into six 170px slivers — two words a line, with a word
hyphen-breaking across cards. An intrinsic width was the whole fix.

**Every ground was nearly white.** #FFFFFF alternating with #F4F6F8 is not
alternation, it is one long pale scroll. The navy ground is now used three
times on the homepage as punctuation, and each section leads with an eyebrow
so the page reads as a document with chapters rather than a stack of blocks.

The hero changed shape as a consequence of the second principle rather than
for style. Text over a photograph needs a scrim heavy enough to hold AA, which
left the photo murky and the type grey. Splitting it — solid navy for the
words, the photograph at full contrast beside them — gives both halves their
own job and removes the compromise.

### What the redesign added to the checks

`npm run check:contrast` walks every visible text node on seven routes at two
widths, resolves the ground it actually sits on, and fails under WCAG AA.
It was written after a whole section shipped with slate body copy on the navy
ground at 1.9:1 — a bug that survived screenshot review because the text
looked quiet rather than broken. Verified by reintroducing the bug: the check
reports 2.34:1 and exits non-zero.

Text over photography is listed, not graded. A ratio against a flat colour
says nothing there, and pretending otherwise would be worse than silence.

---

## Revision three — symmetry, and a palette that is not everyone else's

Two revisions in, the client's verdict on the desktop layout was that it had
no symmetry. That was the correct diagnosis and I had been treating it as a
matter of taste. It is not: every section put the heading on the left and the
supporting copy on the right, every text block sat in a narrow column with the
right half of the window empty, and no two cards in a row were the same
height. The eye reads that as unfinished, whatever the type is doing.

### The rule now

A section is a **centred head over a grid of equal columns**, and every card in
that grid is the **same height** whatever the copy length. Asymmetry has to
earn its place, and on this site it never does. The three places that used to
break this — the service page intro, the commercial quote block and the
closing call to action — are all centred single columns now.

Equal height is `.card { display: flex; flex-direction: column; height: 100% }`
with `.card__foot { margin-top: auto }`. That is what puts "See what we build"
on the same baseline in all six sector cards, which is the difference between
a grid and six boxes that happen to be side by side.

### Palette

Navy and amber is what every trades company in Ontario already looks like, and
it was inherited from the first brief rather than chosen. The site is now
forest green, warm cream and terracotta: green and cream belong to wood and
furniture, they read warm rather than corporate, and they leave terracotta
free to mean one thing only — the button you are meant to press.

Three findings from making the swap, all caught by `check:contrast` rather
than by looking:

- Terracotta is dark enough that the old rule (dark text on the accent) gives
  3.3:1. Buttons and the skip link take white text now, at 4.9:1.
- Terracotta *as text* misses AA on cream by a hair, at 4.33:1. Section
  eyebrows use `--signal-ink` (5.6:1) on light and `--signal-lift` (6.2:1) on
  the dark ground. A CSS `filter` was the first attempt and is invisible to
  the checker as well as unreliable — a computed colour is neither.
- `.section--ink h3 { color: var(--paper) }` painted the booking form's
  heading paper-on-white, 1.13:1, inside the white panel that sits on the dark
  section. `color: inherit` resolves against whichever ground actually
  applies. This one would have shipped as a heading nobody could see.

### The sectors lead

"Who do you do this for" is the first question a commercial buyer asks, and it
used to be answered three screens down. Six sectors — homes, offices, gyms,
clinics and dental, hotels, and retail/schools/warehouses — now appear as a
photo band directly under the hero and again as the first full section.

---

## Revision four — researched, and positioned against the competitor

The client asked for two things this round: stop inventing, look at what the
best sites actually do; and beat assemblyman.ca without anyone mistaking us
for them.

### What the research could and could not be

Chromium cannot reach the internet from this environment, so screenshots of
reference sites were not possible. What was possible was reading their code.
The homepages of Floyd, Article, Taskrabbit and Thumbtack were fetched and
their fonts, colour frequencies, radii and section order extracted. That is
less than looking, and it is not nothing:

| | ground | accent | radii |
|---|---|---|---|
| Floyd | `#F8F6ED` bone | `#FF5436` | 2–5px |
| Article | `#F2F2F2` | `#FF6458` | 4–8px, pills |
| Taskrabbit | white | `#0D7A5F` green | 4–16px, pills |
| Thumbtack | white | `#009FD9` blue | — |

Three things they share: a warm or neutral off-white rather than pure white,
exactly one accent, and small radii. Softness is not what premium looks like
in this category; precision is.

What none of them do — and what belongs to this business rather than to any of
them — is set every number in a monospace face. Assembleo's promise is a price
that does not move. Prices, counts, drive times, step numbers and section
labels are now IBM Plex Mono, tabular, on a ruled line, so the page reads like
a job sheet wrapped in warm photography. Prose stays in the sans. One weight,
15 KB.

### The competitor

`assemblyman.ca`: WordPress with Elementor and Divi, navy `#00274D` with
orange `#F4511E`, 14 years, 685 reviews, thirty-three `<h3>`s of feature
boxes, and a very good piece of positioning — the page is built on "IKEA
assembly", which is the highest-volume term in the category.

What they do well and we must match: fixed pricing stated plainly, a named
guarantee, review counts on the page, and a simple numbered process.

Where the opening is: a page-builder site is slow and template-shaped, navy
and orange is the default palette of every contractor in the GTA, and thirty
three feature boxes is a wall rather than an argument. They are also a
residential IKEA business. Gyms, clinics, hotels, offices and warehouses are
ours to take, which is why the six sectors lead the page.

**This is why the accent changed from terracotta to deep green.** Terracotta
`#D2461E` sits within twenty points of their `#F4511E`. On a bone ground with
a dark ink, at a glance, we would have read as the same company. Green on bone
is nobody's default in this category, and it clears white at 10:1 where the
terracotta managed 6:1.

On the dark ground the primary button inverts to bone-on-ink rather than
green-on-near-black, which was a dark box pretending to be a call to action.
