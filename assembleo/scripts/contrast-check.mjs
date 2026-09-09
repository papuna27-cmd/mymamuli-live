/**
 * Fails the build if any visible text falls under WCAG AA against the ground
 * it actually sits on.
 *
 * Written after a whole section shipped with slate body copy on the navy
 * ground at 1.9:1. Reviewing screenshots did not catch it; the text looked
 * "quiet" rather than broken. A number catches it.
 *
 * Backgrounds are resolved by walking up until an opaque one is found, which
 * is what the eye does. Text over a photo is skipped and listed instead —
 * that needs a human judging the scrim, not a ratio against a flat colour.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROUTES = [
  '/', '/services/home-furniture', '/services/gyms', '/commercial',
  '/service-areas', '/service-areas/toronto', '/privacy', '/thank-you', '/404',
];
const PORT = 4393;
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  let p = join('dist', decodeURIComponent(req.url.split('?')[0]));
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); } catch { p += '.html'; }
  try {
    res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(''); }
}).listen(PORT);

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

const findings = [];
const overPhoto = [];

for (const width of [390, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const route of ROUTES) {
    await page.goto(`http://localhost:${PORT}${route}`);
    await page.waitForTimeout(500);
    // Islands hydrate on visibility, so walk the page first.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const results = await page.evaluate(() => {
      const parse = (c) => {
        const m = c.match(/[\d.]+/g);
        if (!m) return null;
        return { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] };
      };
      const lum = ({ r, g, b }) => {
        const f = (v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const ratio = (a, b) => {
        const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
        return (x + 0.05) / (y + 0.05);
      };
      const over = (fg, bg) => ({
        r: fg.a * fg.r + (1 - fg.a) * bg.r,
        g: fg.a * fg.g + (1 - fg.a) * bg.g,
        b: fg.a * fg.b + (1 - fg.a) * bg.b,
        a: 1,
      });

      const out = [];
      const photo = [];
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set();
      let node;
      while ((node = walk.nextNode())) {
        const text = node.textContent.trim();
        if (text.length < 2) continue;
        const el = node.parentElement;
        if (!el || seen.has(el)) continue;
        seen.add(el);
        if (el.closest('svg, .visually-hidden, [hidden], template, script, style, noscript')) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
        const box = el.getBoundingClientRect();
        if (!box.width || !box.height) continue;

        const fg = parse(cs.color);
        if (!fg || fg.a === 0) continue;

        // Walk up for the ground the text actually sits on.
        let bg = null;
        let onPhoto = false;
        for (let n = el; n; n = n.parentElement) {
          const s = getComputedStyle(n);
          if (s.backgroundImage !== 'none' && !s.backgroundImage.startsWith('url("data:image/svg')) {
            onPhoto = true;
            break;
          }
          const c = parse(s.backgroundColor);
          if (c && c.a === 1) { bg = c; break; }
          if (c && c.a > 0) { bg = bg ? over(c, bg) : null; }
        }
        // A photo behind the block (hero) means the ratio is not a flat number.
        if (!onPhoto && el.closest('.hero, .phero2')) onPhoto = true;
        const label = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`;
        if (onPhoto || !bg) { photo.push({ label, text: text.slice(0, 40) }); continue; }

        const flat = fg.a < 1 ? over(fg, bg) : fg;
        const size = parseFloat(cs.fontSize);
        const bold = +cs.fontWeight >= 700;
        const large = size >= 24 || (size >= 18.66 && bold);
        const need = large ? 3 : 4.5;
        const r = ratio(flat, bg);
        if (r < need) {
          out.push({
            label, text: text.slice(0, 46), ratio: +r.toFixed(2), need,
            color: cs.color, bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
            size: Math.round(size),
          });
        }
      }
      return { out, photo };
    });

    for (const f of results.out) findings.push({ route, width, ...f });
    for (const f of results.photo) overPhoto.push({ route, ...f });
  }
  await page.close();
}

await browser.close();
server.close();

const seen = new Set();
const unique = findings.filter((f) => {
  const k = `${f.label}|${f.text}|${f.ratio}`;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

for (const f of unique) {
  console.log(
    `${f.route} @${f.width}  ${f.ratio}:1 (needs ${f.need})  ${f.size}px  ${f.label}\n` +
    `    "${f.text}"  ${f.color} on ${f.bg}`,
  );
}

console.log(
  `\nChecked ${ROUTES.length} routes x 2 widths. ` +
  `${overPhoto.length} text nodes sit over photography and were skipped.`,
);

if (unique.length) {
  console.log(`FAIL — ${unique.length} contrast issue(s) under WCAG AA.`);
  process.exit(1);
}
console.log('PASS — all flat-ground text meets WCAG AA.');
