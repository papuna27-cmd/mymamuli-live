/**
 * Builds a shareable preview of the whole site as ONE self-contained HTML file.
 *
 * Every built page is inlined side by side and a small router swaps between
 * them, because a single file has no server to route with. Everything else is
 * inlined too: CSS, fonts, images, and the interactive islands bundled with
 * esbuild — Astro's island runtime needs real URLs, which a single file cannot
 * provide.
 *
 * Images are deduped into one table and assigned by script. Thirty-odd pages
 * share the same hero and section photos; inlining each occurrence separately
 * turned a 3 MB file into a 30 MB one.
 *
 * Outputs:
 *   preview/index.html     complete document, opens straight from disk
 *   preview/artifact.html  same content without <html>/<head>/<body>, for the
 *                          Artifact host which supplies its own skeleton
 *
 * This is a review artifact, not the deploy. The real site is `npm run build`
 * served by Cloudflare Pages.
 */
import { build } from 'esbuild';
import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { primaryNav, site } from '../src/data/site.ts';

const DIST = 'dist';

/** Routes in switcher order, with the cities folded into one dropdown. */
const ORDER = [
  ['/', 'Home', 'main'],
  ['/services/home-furniture', 'Home furniture', 'main'],
  ['/services/offices', 'Offices', 'main'],
  ['/services/gyms', 'Gyms', 'main'],
  ['/services/clinics', 'Clinics', 'main'],
  ['/services/hotels', 'Hotels', 'main'],
  ['/commercial', 'Commercial', 'main'],
  ['/service-areas', 'Service areas', 'main'],
  ['/privacy', 'Privacy', 'more'],
  ['/terms', 'Terms', 'more'],
  ['/thank-you', 'Thank you', 'more'],
  ['/404', 'Not found', 'more'],
];

/* Every built page, ordered: the listed ones first, cities after. */
async function routes() {
  const found = [];
  const walk = async (dir, prefix) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (e.name === '_astro' || e.name === 'fonts' || e.name === 'og') continue;
        await walk(join(dir, e.name), `${prefix}/${e.name}`);
      } else if (e.name.endsWith('.html')) {
        const path = e.name === 'index.html' ? prefix || '/' : `${prefix}/${e.name.replace(/\.html$/, '')}`;
        found.push({ path, file: join(dir, e.name).slice(DIST.length + 1) });
      }
    }
  };
  await walk(DIST, '');

  const pages = [];
  for (const [path, label, group] of ORDER) {
    const hit = found.find((f) => f.path === path);
    if (hit) pages.push({ ...hit, label, group });
    else console.warn(`skip ${path} (not built)`);
  }
  for (const f of found.filter((f) => f.path.startsWith('/service-areas/'))) {
    const slug = f.path.split('/').pop();
    const label = slug.replace(/(^|-)(\w)/g, (_, d, c) => (d ? ' ' : '') + c.toUpperCase());
    pages.push({ ...f, label, group: 'city' });
  }
  return pages;
}

const MIME = {
  '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const dataUri = async (p) => {
  const buf = await readFile(p);
  return `data:${MIME[extname(p)] ?? 'application/octet-stream'};base64,${buf.toString('base64')}`;
};

/* ---------- 1. bundle the islands ---------------------------------------- */

await writeFile('.preview-entry.jsx', `
import { render, h } from 'preact';
import Estimator from './src/islands/Estimator';
import BookingForm from './src/islands/BookingForm';
import Reviews from './src/islands/Reviews';
import MobileNav from './src/islands/MobileNav';

const REG = { Estimator, BookingForm, Reviews, MobileNav };

function boot() {
  const props = JSON.parse(document.getElementById('preview-props').textContent);
  for (const el of document.querySelectorAll('astro-island')) {
    const url = el.getAttribute('component-url') || '';
    const name = Object.keys(REG).find((k) => url.includes('/' + k + '.'));
    if (!name) continue;
    const own = Object.assign({}, props[name] || {});
    // Each page carries its own path, so the nav marks the right link current.
    const page = el.closest('[data-page]');
    if (name === 'MobileNav' && page) own.path = page.getAttribute('data-page');
    if (name === 'BookingForm') {
      // Commercial pages mount the commercial variant; keep that.
      const h3 = el.querySelector('h3');
      if (h3 && /site/i.test(h3.textContent || '')) {
        own.variant = 'commercial';
        own.heading = 'Tell us about the site';
      }
    }
    // render(), not hydrate(): the SSR markup is replaced outright, which is
    // fine for a preview and avoids mismatch warnings.
    try { render(h(REG[name], own), el); } catch (e) { console.error(name, e); }
  }
}
if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
else boot();
`);

const bundled = await build({
  entryPoints: ['.preview-entry.jsx'],
  bundle: true, format: 'iife', minify: true, target: 'es2020',
  jsx: 'automatic', jsxImportSource: 'preact',
  loader: { '.jsx': 'jsx', '.tsx': 'tsx', '.ts': 'ts', '.json': 'json' },
  resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  define: {
    'import.meta.env.PUBLIC_API_MOCK': '"true"',
    'import.meta.env.PUBLIC_API_BASE': '""',
    'import.meta.env.PUBLIC_REVIEWS_LIVE': '"false"',
    'import.meta.env.PUBLIC_TURNSTILE_SITE_KEY': 'undefined',
    'import.meta.env.PUBLIC_GOOGLE_MAPS_KEY': 'undefined',
    'import.meta.env.DEV': 'false',
    'import.meta.env.PROD': 'true',
  },
  write: false,
});
const islandJs = bundled.outputFiles[0].text;

/* ---------- 2. island props ---------------------------------------------- */

const reviewsJson = JSON.parse(await readFile('src/data/reviews.json', 'utf8'));
const props = {
  Estimator: {},
  BookingForm: { variant: 'residential', heading: 'Tell us about the job', headingLevel: 'h3' },
  Reviews: {
    reviews: reviewsJson,
    rating: site.facts.rating,
    count: site.facts.reviewCount,
    profileUrl: site.social.facebook,
  },
  MobileNav: {
    items: primaryNav,
    phone: site.phone,
    phoneDisplay: site.phoneDisplay,
    path: '/',
  },
};

/* ---------- 3. inline each page ------------------------------------------ */

const assets = existsSync(join(DIST, '_astro')) ? await readdir(join(DIST, '_astro')) : [];

/**
 * Pick one rendition per image. The smallest is a 400px thumbnail and the
 * largest a 2400px hero; a preview wants neither, so take the webp closest to
 * ~90 KB — big enough to judge the crop, small enough to ship 30 pages of them.
 */
const TARGET = 90 * 1024;
const renditionCache = new Map();
async function rendition(stem, fallback) {
  if (renditionCache.has(stem)) return renditionCache.get(stem);
  const webps = assets.filter((f) => f.startsWith(stem) && f.endsWith('.webp'));
  let best = null;
  for (const f of webps) {
    const size = (await stat(join(DIST, '_astro', f))).size;
    if (!best || Math.abs(size - TARGET) < Math.abs(best.size - TARGET)) best = { f, size };
  }
  const picked = best ? join(DIST, '_astro', best.f) : fallback;
  renditionCache.set(stem, picked);
  return picked;
}

const images = []; // index -> data URI, shared across every page
const imageIndex = new Map(); // disk path -> index
async function imageRef(diskPath) {
  if (!imageIndex.has(diskPath)) {
    imageIndex.set(diskPath, images.length);
    images.push(await dataUri(diskPath));
  }
  return imageIndex.get(diskPath);
}

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

const styles = new Map(); // href -> css, deduped across pages
const bodies = [];
let title = site.name;

for (const page of await routes()) {
  let html = await readFile(join(DIST, page.file), 'utf8');

  if (page.path === '/') title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] ?? title;

  // Stylesheets, with font files folded in as data URIs.
  for (const m of [...html.matchAll(/<link rel="stylesheet" href="(\/_astro\/[^"]+\.css)">/g)]) {
    if (!styles.has(m[1])) {
      let css = await readFile(join(DIST, m[1]), 'utf8');
      for (const f of [...css.matchAll(/url\((\/fonts\/[^)]+\.woff2)\)/g)]) {
        css = css.replace(f[0], `url(${await dataUri(join(DIST, f[1]))})`);
      }
      styles.set(m[1], css);
    }
    html = html.replace(m[0], '');
  }

  // One rendition per image, referenced by index and assigned by script.
  html = html.replace(/<source[^>]*>/g, '');
  for (const m of [...html.matchAll(/<img[^>]*?src="(\/_astro\/([^"]+))"[^>]*>/g)]) {
    const stem = basename(m[2]).split('.')[0];
    const idx = await imageRef(await rendition(stem, join(DIST, m[1])));
    const tag = m[0]
      .replace(m[1], BLANK)
      .replace(/\ssrcset="[^"]*"/g, '')
      .replace(/\sloading="lazy"/g, '')
      .replace('<img', `<img data-pv-img="${idx}"`);
    html = html.replace(m[0], tag);
  }

  // Astro's module scripts cannot resolve without real URLs.
  html = html.replace(/<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/g, '');
  html = html.replace(/<script type="module">[\s\S]*?<\/script>/g, '');
  // Astro's inline island runtime and client:* loaders would chase those same
  // URLs and log CORS failures. They are esbuild output and all start `(()=>{`;
  // our own hand-written page scripts do not, so they survive.
  html = html.replace(/<script>\(\(\)=>\{[\s\S]*?<\/script>/g, '');
  // Structured data is meaningless in a preview and only bloats the file.
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');

  // Astro's scoped <style> blocks live in the body/head of each page.
  for (const m of [...html.matchAll(/<style>[\s\S]*?<\/style>/g)]) {
    styles.set(m[0].slice(0, 60) + styles.size, m[0].replace(/<\/?style>/g, ''));
    html = html.replace(m[0], '');
  }

  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [])[1] ?? '';
  bodies.push({ ...page, body });
}

/* ---------- 4. compose --------------------------------------------------- */

const cityOptions = bodies
  .filter((p) => p.group === 'city')
  .map((p) => `<option value="${p.path}">${p.label}</option>`)
  .join('');

const switcher = `
<nav class="pv-bar" aria-label="Preview pages">
  <span class="pv-tag">PREVIEW</span>
  ${bodies.filter((p) => p.group === 'main').map((p) => `<button type="button" data-go="${p.path}">${p.label}</button>`).join('')}
  <label class="pv-sel"><span class="visually-hidden">City page</span>
    <select id="pv-city"><option value="">City…</option>${cityOptions}</select>
  </label>
  ${bodies.filter((p) => p.group === 'more').map((p) => `<button type="button" data-go="${p.path}">${p.label}</button>`).join('')}
  <span class="pv-note">form does not send</span>
</nav>`;

const previewCss = `
[data-page][hidden]{display:none!important}
.pv-bar{position:fixed;left:0;right:0;bottom:0;z-index:200;display:flex;align-items:center;gap:6px;
 flex-wrap:wrap;padding:7px 10px calc(7px + env(safe-area-inset-bottom,0px));background:#12283C;
 font:600 12px/1 ui-sans-serif,system-ui,sans-serif;max-height:38vh;overflow-y:auto}
.pv-tag{color:#E08A00;letter-spacing:.08em}
.pv-bar button,.pv-bar select{min-height:32px;padding:0 10px;border-radius:4px;
 border:1px solid rgba(244,246,248,.35);background:transparent;color:#F4F6F8;font:inherit;cursor:pointer}
.pv-bar select option{color:#12283C}
.pv-bar button[aria-current="true"],.pv-bar select[data-on="true"]{background:#F4F6F8;color:#12283C;border-color:#F4F6F8}
.pv-note{color:rgba(244,246,248,.6);font-weight:400;margin-left:auto}
/* The switcher sits above the site's own sticky bar. */
body{padding-bottom:104px!important}
.actionbar,.calc__sticky{bottom:54px!important}
`;

const routerJs = `
(function(){
  var imgs=JSON.parse(document.getElementById('preview-images').textContent);
  [].forEach.call(document.querySelectorAll('img[data-pv-img]'),function(el){
    var u=imgs[+el.getAttribute('data-pv-img')]; if(u) el.src=u;
  });
  var pages=[].slice.call(document.querySelectorAll('[data-page]'));
  var btns=[].slice.call(document.querySelectorAll('.pv-bar [data-go]'));
  var city=document.getElementById('pv-city');
  function show(path){
    // The phone menu locks the body while it is open. A page switch here is
    // not a real navigation, so clear the lock or the preview freezes.
    var b=document.body;
    if(b.style.position==='fixed'){
      b.style.position=''; b.style.top=''; b.style.left=''; b.style.right=''; b.style.overflow='';
    }
    var found=false;
    pages.forEach(function(el){
      var on=el.getAttribute('data-page')===path;
      el.hidden=!on; if(on) found=true;
    });
    if(!found){ pages[0].hidden=false; path=pages[0].getAttribute('data-page'); }
    btns.forEach(function(b){ b.setAttribute('aria-current', String(b.getAttribute('data-go')===path)); });
    var isCity=path.indexOf('/service-areas/')===0;
    city.value=isCity?path:'';
    city.setAttribute('data-on',String(isCity));
    window.scrollTo(0,0);
    try{ history.replaceState(null,'',location.pathname+location.search+'#page='+path); }catch(e){}
  }
  btns.forEach(function(b){ b.addEventListener('click',function(){ show(b.getAttribute('data-go')); }); });
  city.addEventListener('change',function(){ if(city.value) show(city.value); });
  // Real links inside the pages route too, so the site navigates like the site.
  document.addEventListener('click',function(e){
    var a=e.target.closest && e.target.closest('a[href^="/"]');
    if(!a) return;
    var raw=a.getAttribute('href');
    var hash=raw.indexOf('#'); var frag=hash>-1?raw.slice(hash):'';
    var href=(hash>-1?raw.slice(0,hash):raw).replace(/\\/$/,'')||'/';
    if(!document.querySelector('[data-page="'+href+'"]')) return;
    e.preventDefault(); show(href);
    if(frag.length>1){
      var t=document.querySelector('[data-page="'+href+'"] '+frag);
      if(t) t.scrollIntoView();
    }
  });
  var m=(location.hash||'').match(/page=([^&]+)/);
  show(m?decodeURIComponent(m[1]):'/');
})();`;

const allStyles = [...styles.values()].join('\n');
const pageDivs = bodies
  .map((p, i) => `<div data-page="${p.path}"${i ? ' hidden' : ''}>${p.body}</div>`)
  .join('\n');
const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
const tail =
  `<script id="preview-images" type="application/json">${json(images)}</script>` +
  `<script id="preview-props" type="application/json">${json(props)}</script>` +
  `<script>${islandJs}</script>${switcher}<script>${routerJs}</script>`;

await mkdir('preview', { recursive: true });

// Artifact variant: the host supplies doctype/html/head/body.
await writeFile(
  'preview/artifact.html',
  `<title>Assembleo</title>\n<style>${allStyles}\n${previewCss}</style>\n${pageDivs}\n${tail}\n`,
);

// Standalone variant: a complete document that opens from disk.
await writeFile(
  'preview/index.html',
  `<!doctype html><html lang="en-CA"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">` +
    `<title>${title}</title><style>${allStyles}\n${previewCss}</style></head>` +
    `<body>${pageDivs}${tail}</body></html>`,
);

for (const f of ['preview/index.html', 'preview/artifact.html']) {
  const kb = (Buffer.byteLength(await readFile(f)) / 1024).toFixed(0);
  console.log(`${f} — ${kb} KB, ${bodies.length} pages, ${images.length} images`);
}
