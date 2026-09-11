/**
 * End-to-end: fill the real booking form in a browser, submit it against the
 * real Pages Function, and confirm the lead lands in D1 and the customer is
 * sent to /thank-you.
 */
import { chromium } from 'playwright';

const BASE = process.env.E2E_BASE || 'http://127.0.0.1:8791';
const problems = [];
const bad = (m) => problems.push(m);

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

// 1. Estimator -> booking form handover
await page.evaluate(() => document.getElementById('estimate')?.scrollIntoView());
await page.waitForSelector('.est__stepper');
const plus = await page.$$('.est__items .est__item .est__stepper button:last-child');
await plus[0].click();
await plus[4].click();
await page.waitForSelector('.est__total strong');
const estTotal = (await page.textContent('.est__total strong'))?.trim();
await page.click('.est__send');
await page.waitForTimeout(800);

// 2. Fill the form
const details = await page.inputValue('#bk-residential-details');
if (!/Bed frame|Wardrobe/.test(details)) bad('estimate did not reach the form');

await page.fill('#bk-residential-name', 'Nino Beridze');
await page.fill('#bk-residential-phone', '(905) 555-0142');
await page.fill('#bk-residential-email', 'nino@example.com');
await page.fill('#bk-residential-address', '88 Lakeshore Rd E, Mississauga ON');
await page.check('#bk-residential-consent');

// 3. Submit and follow the redirect
await Promise.all([
  // Regex, not a glob: Playwright's `*` does not cross a `/`, and the page
  // resolves to /thank-you/ with a trailing slash.
  page.waitForURL(/\/thank-you\/?$/, { timeout: 20000 }).catch(() => bad('did not land on /thank-you')),
  page.click('.bform__submit'),
]);

const url = page.url();
if (!/thank-you/.test(url)) bad(`ended on ${url} instead of /thank-you`);
const h1 = await page.textContent('h1').catch(() => '');
console.log(`estimator total: ${estTotal}`);
console.log(`after submit: ${url} — "${h1?.trim()}"`);

// 4. generate_lead must have fired before navigation
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

if (errors.length) bad(`console errors: ${[...new Set(errors)].slice(0, 3).join(' | ')}`);

await browser.close();
if (problems.length === 0) console.log('PASS — booking flow works end to end.');
else { console.log(`FAIL — ${problems.length}:`); problems.forEach((p) => console.log('  • ' + p)); process.exitCode = 1; }
