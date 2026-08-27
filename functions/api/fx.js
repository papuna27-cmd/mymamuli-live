/**
 * /api/fx — დოლარი/ლარის ოფიციალური კურსი
 *
 *   GET /api/fx → { usd: 2.6195, date: '2026-08-27' }
 *   (usd = რამდენი ლარი ღირს 1 დოლარი, ეროვნული ბანკის კურსით)
 *
 * ⚠️ 2026-08-27, George-ის მოთხოვნით — საიტზე ფასის $/₾ გადამრთველი
 * ემატება (index.html). კურსი სერვერზეა გატანილი და არა პირდაპირ
 * ბრაუზერიდან nbg.gov.ge-ზე — იმავე მიზეზით, რის გამოც საკადასტრო
 * შემოწმებაც სერვერზეა (იხ. functions/api/_cad.js-ის კომენტარი):
 * nbg.gov.ge-ს ჩვენი დომენისთვის CORS სათაურები არ აქვს, ბრაუზერიდან
 * პირდაპირი fetch() "Failed to fetch"-ს დააბრუნებდა. D1-ში ქეშირებაც
 * იმავე მიზეზით — კურსი დღეში ერთხელ იცვლება, ყოველ ვიზიტზე
 * ეროვნულ ბანკს არ ვღლით.
 *
 * წყარო: ეროვნული ბანკის ღია API (https://nbg.gov.ge/gw/api/ct/
 * monetarypolicy/currencies/en/json/) — ოფიციალური, დღიური, უფასო.
 */
import { J } from './_util.js';

const CACHE_MS = 12 * 3600e3;         /* კურსი დღეში ერთხელ იცვლება — 12სთ საკმარისზე მეტია */
const NBG_URL = 'https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/en/json/?currencies=USD';
const UA = 'MyMamuli.ge/1.0 (+https://mymamuli.ge)';
const FALLBACK = 2.7;                 /* თუ ბანკიც მიუწვდომელია და ქეშიც ცარიელია — გონივრული მიახლოება */

async function fetchNbg() {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), 8000);
  try {
    const r = await fetch(NBG_URL, { headers: { 'user-agent': UA }, signal: c.signal });
    if (!r.ok) throw new Error('http-' + r.status);
    const j = await r.json();
    const list = j && j[0] && Array.isArray(j[0].currencies) ? j[0].currencies : [];
    const row = list.find(x => x.code === 'USD');
    if (!row || !(row.rate > 0)) throw new Error('bad-payload');
    return { rate: Number(row.rate), date: String(j[0].date || '').slice(0, 10) };
  } finally { clearTimeout(timer) }
}

export async function onRequestGet({ env }) {
  if (!env.DB) return J({ usd: FALLBACK });

  /* ქეშირებული, ჯერ კიდევ ახალი კურსი */
  try {
    const row = await env.DB.prepare(`SELECT rate, fetched FROM fx WHERE code='USD'`).first();
    if (row && row.fetched > Date.now() - CACHE_MS) {
      return J({ usd: row.rate, cached: true });
    }
  } catch (_) { /* cad-ის ცხრილივით — ქეშის გაუმართაობა მოთხოვნას არ აჩერებს */ }

  /* ახალი კურსი ეროვნული ბანკიდან */
  try {
    const { rate, date } = await fetchNbg();
    try {
      await env.DB.prepare(
        `INSERT INTO fx (code,rate,fetched) VALUES ('USD',?1,?2)
         ON CONFLICT(code) DO UPDATE SET rate=?1, fetched=?2`
      ).bind(rate, Date.now()).run();
    } catch (_) {}
    return J({ usd: rate, date });
  } catch (e) {
    /* ბანკი დროებით მიუწვდომელია — ძველი ქეშიც სჯობს არაფერს */
    try {
      const row = await env.DB.prepare(`SELECT rate FROM fx WHERE code='USD'`).first();
      if (row) return J({ usd: row.rate, stale: true });
    } catch (_) {}
    return J({ usd: FALLBACK, fallback: true });
  }
}
