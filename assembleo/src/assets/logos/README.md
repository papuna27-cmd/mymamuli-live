# Retailer logos

Drop official logo files here, named after the `slug` in `src/data/assembly.ts`:

```
costco.svg  walmart.svg  canadian-tire.svg  home-depot.svg
staples.svg ikea.svg     wayfair.svg        amazon.svg
```

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
