# Retailer logos

Drop official logo files here, named after the `slug` in `src/data/assembly.ts`:

```
ikea.svg     costco.svg  walmart.svg  canadian-tire.png
home-depot.svg staples.svg the-brick.svg leons.png
jysk.svg     wayfair.svg amazon.svg   rona.svg
```

Twelve, because every column count in the wall (2, 4, 6) divides twelve and no
row ends with a single logo stranded on its own.

SVG is best (sharp at any size, tiny). PNG or WebP with a transparent
background also works. The wall picks them up automatically — no code change.
Until a file exists, that tile shows a styled wordmark instead.

## Where to get them

Use each retailer's own brand or press page, listed as `brandAssets` in
`src/data/assembly.ts`. A logo pulled off a search engine is usually an
outdated version, the wrong colourway, or a fan recreation — and none of those
are licensed.

## Before you publish these

Displaying a retailer's logo implies a relationship with them. Two different
claims, with very different requirements:

- **"We assemble furniture bought from these stores."** A statement about our
  own service. No permission needed. This is what the page currently says.
- **"We are a partner / approved vendor."** Needs a written agreement, and the
  retailer's brand team then supplies both the files and the rules for using
  them. Costco, Home Depot and Walmart all enforce this.

The logos are rendered greyscale at a uniform height so the wall reads as one
row of equals rather than as a set of endorsements.


## Where these came from

| File | Source |
|---|---|
| `jysk.svg`, `rona.svg` | Wikimedia Commons, marked public domain |
| `the-brick.svg` | thebrick.com, the retailer's own asset |
| `leons.png` | leons.ca, the retailer's own asset; the white background was keyed out so the ellipse sits on the page ground |

Structube was tried and dropped: their only public logo is white type meant for
a dark ground, and it disappears on bone. Best Buy is available on Commons if a
thirteenth is ever wanted, but twelve keeps the grid even.
