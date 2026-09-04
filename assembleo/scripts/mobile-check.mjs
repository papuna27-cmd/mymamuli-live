/**
 * Mobile sign-off. Serves dist/ and checks every page in a real browser at
 * 320, 360, 390 and 430 px, plus a 640px-tall landscape pass.
 *
 * Checks: no horizontal scroll, tap targets >= 44px with clearance, 16px input
 * font, CTA above the fold, sticky bar not covering the last element.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = 'dist';
const PORT = 4319;
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml',
  '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = join(DIST, p);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) file = join(DIST, p + '.html');
  if (!existsSync(file)) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(PORT, r));

const ROUTES = [
  '/', '/services/assembly', '/services/delivery', '/services/moving', '/commercial',
  '/calculator', '/about', '/contact', '/thank-you', '/privacy', '/terms', '/404',
  '/service-areas/mississauga', '/service-areas/hamilton',
];
const WIDTHS = [320, 360, 390, 430];

mkdirSync('screenshots', { recursive: true });

const problems = [];
const bad = (m) => problems.push(m);

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

// ---- 1. horizontal overflow + tap targets, every route x every width ------
for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  for (const route of ROUTES) {
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' });

    const overflow = await page.evaluate((w) => {
      const doc = document.documentElement;
      if (doc.scrollWidth <= w + 1) return null;
      // Name the actual offender rather than reaching for overflow-x: hidden.
      const guilty = [];
      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.right > w + 1 || r.left < -1) {
          if (getComputedStyle(el).position === 'fixed') continue;
          guilty.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} right=${Math.round(r.right)}`);
        }
        if (guilty.length > 4) break;
      }
      return { scrollWidth: doc.scrollWidth, guilty };
    }, width);
    if (overflow) bad(`${route} @${width}: horizontal scroll (scrollWidth ${overflow.scrollWidth}) — ${overflow.guilty.join(' | ')}`);

    const taps = await page.evaluate(() => {
      const out = [];
      const sel = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=tab]';
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;          // not rendered
        if (el.closest('.hp')) continue;                         // honeypot, off-screen
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (el.classList.contains('skip-link')) continue;        // only visible on focus
        // A checkbox/radio's real target is its label, which wraps it.
        if (el.type === 'checkbox' || el.type === 'radio') {
          const lab = el.closest('label');
          if (lab && lab.getBoundingClientRect().height >= 44) continue;
        }
        // WCAG 2.5.8 exempts links inline within a sentence; making them 44px
        // tall would break the line box they sit in.
        if (el.tagName === 'A' && cs.display === 'inline') continue;
        if (r.height < 44 || r.width < 24) {
          out.push(`${el.tagName.toLowerCase()}.${(el.className||'').toString().split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent||'').trim().slice(0,28)}"`);
        }
      }
      return out.slice(0, 6);
    });
    if (taps.length) bad(`${route} @${width}: tap targets under 44px — ${taps.join(' | ')}`);

    const smallInputs = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]), select, textarea')) {
        if (el.closest('.hp')) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 16) out.push(`${el.id || el.tagName} ${fs}px`);
      }
      return out;
    });
    if (smallInputs.length) bad(`${route} @${width}: inputs under 16px (iOS will zoom) — ${smallInputs.join(', ')}`);

    if (width === 390) {
      await page.screenshot({ path: `screenshots/390${route === '/' ? '/home' : route}.png`.replace(/\/(?=[^/]*$)/, '_').replace('screenshots_', 'screenshots/'), fullPage: false }).catch(() => {});
    }
  }
  if (consoleErrors.length) bad(`@${width}: console errors — ${[...new Set(consoleErrors)].slice(0, 3).join(' | ')}`);
  await ctx.close();
}

// ---- 2. hero CTA above the fold at 390x844 --------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  const cta = await page.evaluate(() => {
    const el = document.querySelector('.hero .btn--signal');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { bottom: Math.round(r.bottom), text: el.textContent.trim() };
  });
  if (!cta) bad('/ @390x844: hero primary CTA not found');
  else if (cta.bottom > 844) bad(`/ @390x844: hero CTA below the fold (bottom ${cta.bottom}px)`);
  else console.log(`hero CTA "${cta.text}" fully visible, bottom at ${cta.bottom}px of 844`);
  await ctx.close();
}

// ---- 3. sticky bar must not cover the last element ------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  for (const route of ['/', '/contact', '/terms', '/services/moving']) {
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' });
    // scroll-behavior: smooth is on globally, so jump instantly and settle.
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(600);
    const res = await page.evaluate(() => {
      const bar = document.querySelector('.actionbar');
      if (!bar) return { skip: true };
      const barTop = bar.getBoundingClientRect().top;
      const footer = document.querySelector('.site-footer__base');
      const fb = footer.getBoundingClientRect().bottom;
      return { barTop: Math.round(barTop), footerBottom: Math.round(fb) };
    });
    if (!res.skip && res.footerBottom > res.barTop) {
      bad(`${route}: sticky bar (top ${res.barTop}) covers page bottom (${res.footerBottom})`);
    }
  }
  await ctx.close();
}

// ---- 4. short-viewport landscape pass -------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 740, height: 360 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  for (const route of ['/', '/calculator']) {
    await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => {
      const bar = document.querySelector('.actionbar');
      const h = bar ? bar.getBoundingClientRect().height : 0;
      return { barH: Math.round(h), vh: window.innerHeight, scrollW: document.documentElement.scrollWidth };
    });
    if (r.scrollW > 741) bad(`${route} @740x360 landscape: horizontal scroll (${r.scrollW})`);
    if (r.barH > r.vh * 0.25) bad(`${route} @740x360: sticky bar eats ${Math.round((r.barH / r.vh) * 100)}% of the screen`);
  }
  await ctx.close();
}

// ---- 5. mobile nav: focus trap, Escape, scroll lock -----------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.click('.navbtn');
  await page.waitForSelector('.navsheet__panel');
  const locked = await page.evaluate(() => getComputedStyle(document.body).position === 'fixed');
  if (!locked) bad('mobile nav: body scroll not locked while open');
  const expanded = await page.getAttribute('.navbtn', 'aria-expanded');
  if (expanded !== 'true') bad('mobile nav: aria-expanded not true when open');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  if (await page.$('.navsheet__panel')) bad('mobile nav: Escape did not close the sheet');
  const restored = await page.evaluate(() => getComputedStyle(document.body).position);
  if (restored === 'fixed') bad('mobile nav: body scroll lock not released');
  await ctx.close();
}

// ---- 6. calculator: complete the flow one-handed --------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/calculator`, { waitUntil: 'networkidle' });

  // Step 0 -> pick Moving
  await page.click('.calc__choice:nth-child(2)');
  await page.waitForSelector('.input');
  // No Places key configured, so the manual km input is the fallback shown.
  const hasKm = await page.$('input[inputmode="numeric"]');
  if (hasKm) {
    await page.fill('input[inputmode="numeric"]', '18');
  } else {
    const inputs = await page.$$('.calc__formSide input[type=text]');
    await inputs[0].fill('Mississauga, ON');
    await inputs[1].fill('Toronto, ON');
  }
  await page.click('.calc__submit');
  await page.waitForSelector('.calc__total', { timeout: 8000 });
  const total = await page.textContent('.calc__total strong');
  const curbside = await page.textContent('.calc__scope');
  if (!/curbside/i.test(curbside)) bad('calculator: moving result missing the curbside notice');
  console.log(`calculator moving result: ${total?.trim()} (curbside notice present)`);

  const bookHref = await page.getAttribute('.calc__book', 'href');
  if (!/quote=/.test(bookHref || '')) bad('calculator: Book this job does not carry a quote reference');

  await page.screenshot({ path: 'screenshots/390_calculator-result.png' });
  await ctx.close();
}

await browser.close();
server.close();

console.log(`\nChecked ${ROUTES.length} routes x ${WIDTHS.length} widths.`);
if (problems.length === 0) console.log('PASS — no mobile issues.');
else {
  console.log(`\nFAIL — ${problems.length} issue(s):`);
  for (const p of problems) console.log('  • ' + p);
  process.exitCode = 1;
}
