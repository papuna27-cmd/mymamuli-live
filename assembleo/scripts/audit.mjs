/** Static audit of the built HTML. Run after `npm run build`. */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const problems = [];
const note = (page, msg) => problems.push(`${page}: ${msg}`);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = walk(DIST);
const routes = new Set(
  files.map((f) => {
    const r = '/' + relative(DIST, f).replace(/index\.html$/, '').replace(/\.html$/, '');
    return r.replace(/\/$/, '') || '/';
  }),
);

let checked = 0;

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const route = ('/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\.html$/, '')).replace(/\/$/, '') || '/';
  checked++;

  // --- title / description budgets
  // Measure the decoded text, not the escaped markup — "&amp;" is one character.
  const decode = (s) =>
    s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
     .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#8217;/g, '\u2019');
  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] ?? '');
  const desc = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] ?? '');
  if (!title) note(route, 'missing <title>');
  else if (title.length > 60) note(route, `title ${title.length} chars > 60`);
  if (!desc) note(route, 'missing meta description');
  else if (desc.length > 155) note(route, `description ${desc.length} chars > 155`);

  // --- canonical, self-referencing
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  if (!canon) note(route, 'missing canonical');
  else {
    const expect = `https://assembleo.ca${route === '/' ? '/' : route}`;
    if (canon.replace(/\/$/, '') !== expect.replace(/\/$/, '')) note(route, `canonical ${canon} != ${expect}`);
  }

  // --- headings: exactly one h1, no level skips
  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length !== 1) note(route, `${h1s.length} h1 elements (expected 1)`);
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  let prev = 0;
  for (const l of levels) {
    if (prev && l > prev + 1) { note(route, `heading skip h${prev} -> h${l}`); break; }
    prev = l;
  }

  // --- Open Graph
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image', 'twitter:card']) {
    if (!html.includes(`"${p}"`)) note(route, `missing ${p}`);
  }
  const ogImg = (html.match(/property="og:image" content="https:\/\/assembleo\.ca([^"]*)"/) || [])[1];
  if (ogImg && !existsSync(join('public', ogImg))) note(route, `og:image missing on disk: ${ogImg}`);

  // --- structured data
  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  if (ldBlocks.length === 0) note(route, 'no JSON-LD');
  for (const [, raw] of ldBlocks) {
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) { note(route, `invalid JSON-LD: ${e.message}`); continue; }
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const types = arr.map((o) => o['@type']);
    if (!types.includes('MovingCompany')) note(route, 'no LocalBusiness/MovingCompany schema');
    // Reviews come from Google — AggregateRating must never be emitted.
    if (raw.includes('AggregateRating') || raw.includes('aggregateRating')) {
      note(route, 'AggregateRating emitted for third-party reviews');
    }
    const isHome = route === '/';
    if (!isHome && !types.includes('BreadcrumbList') && !/\/(404|thank-you)$/.test(route)) {
      note(route, 'missing BreadcrumbList');
    }
  }

  // --- internal links resolve
  for (const m of html.matchAll(/href="(\/[^"#?]*)(?:[#?][^"]*)?"/g)) {
    const href = m[1].replace(/\/$/, '') || '/';
    if (/\.(png|svg|xml|txt|webmanifest|woff2|ico|json|css|js|jpg|webp|avif)$/.test(href)) continue;
    if (href.startsWith('/_astro/')) continue;
    if (!routes.has(href)) note(route, `dead internal link: ${m[1]}`);
  }

  // --- images have alt and explicit dimensions
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\balt=/.test(tag)) note(route, `img without alt: ${tag.slice(0, 90)}`);
    if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) note(route, `img without width/height: ${tag.slice(0, 90)}`);
  }

  // --- phone numbers must be tel: links
  if (/\(905\)\s?555-0142/.test(html) && !html.includes('href="tel:+19055550142"')) {
    note(route, 'phone number shown but no tel: link');
  }

  // --- viewport / lang / skip link
  if (!html.includes('viewport-fit=cover')) note(route, 'viewport missing viewport-fit=cover');
  if (!html.includes('lang="en-CA"')) note(route, 'missing lang');
  if (!html.includes('class="skip-link"')) note(route, 'missing skip link');
  if (!/<main id="main"/.test(html)) note(route, 'missing <main id="main">');
}

console.log(`Audited ${checked} pages, ${routes.size} routes.`);
if (problems.length === 0) {
  console.log('PASS — no issues.');
} else {
  console.log(`\nFAIL — ${problems.length} issue(s):`);
  for (const p of problems) console.log('  • ' + p);
  process.exitCode = 1;
}
