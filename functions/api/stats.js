/**
 * /api/stats — ადმინის სტატისტიკა
 *
 *   GET /api/stats?days=30
 *
 * ⚠️ დაცვა: x-admin-key header ან mm_sid სესიის cookie.
 *
 * ------------------------------------------------------------------
 * მთავარი ციფრი აქ არის `match` — დამთხვევის მაჩვენებელი:
 * აქტიური მოთხოვნების რა წილმა მიიღო მინიმუმ ერთი შეთავაზება 7 დღეში.
 *
 * ვიზიტორები და ნახვები ამაოებაა — ისინი მაშინაც იზრდება, როცა
 * პლატფორმა ვერავის ვერაფერს პოულობს. დამთხვევის მაჩვენებელი კი
 * პირდაპირ პასუხობს კითხვას: მუშაობს თუ არა ეს იდეა.
 */
import { J, authed, denied } from './_util.js';
import { RULES } from './_engage.js';

const TZ = 4 * 3600e3;
const dayKey = (shift = 0) =>
  new Date(Date.now() + TZ - shift * 86400e3).toISOString().slice(0, 10);

const pct = (part, whole) => whole ? +(part / whole * 100).toFixed(1) : 0;

/* რეგიონის სახელი განცხადებიდან: `reg` ველი, თუ არა — `loc` */
const REG_UNKNOWN = 'უცნობი';

export async function onRequestGet({ request, env }) {
  if (!await authed(request, env)) return denied();
  if (!env.DB) return J({ error: 'no-db' }, 500);

  const url = new URL(request.url);
  const days = Math.min(365, Math.max(1, +url.searchParams.get('days') || 30));
  const from = dayKey(days - 1);
  const prevFrom = dayKey(days * 2 - 1);
  const t = Date.now();
  const since = t - days * 86400e3;
  const prevSince = t - days * 2 * 86400e3;

  const one = async (sql, ...b) => {
    try { return (await env.DB.prepare(sql).bind(...b).first()) || {} }
    catch (_) { return {} }
  };
  const many = async (sql, ...b) => {
    try { return (await env.DB.prepare(sql).bind(...b).all()).results || [] }
    catch (_) { return [] }
  };

  /* ---------- KPI ---------- */
  const [views, prevViews, ev, prevEv] = await Promise.all([
    one(`SELECT COALESCE(SUM(n),0) AS n FROM view_day WHERE day>=?1`, from),
    one(`SELECT COALESCE(SUM(n),0) AS n FROM view_day WHERE day>=?1 AND day<?2`, prevFrom, from),
    many(`SELECT name, SUM(n) AS n FROM ev WHERE day>=?1 GROUP BY name`, from),
    many(`SELECT name, SUM(n) AS n FROM ev WHERE day>=?1 AND day<?2 GROUP BY name`, prevFrom, from)
  ]);

  const evn = (rows, k) => (rows.find(r => r.name === k) || {}).n || 0;

  const kpi = {
    visitors: evn(ev, 'visit') || evn(ev, 'open') || 0,
    views: views.n || 0,
    cards: evn(ev, 'card'),
    phones: evn(ev, 'phone')
  };
  const prev = {
    visitors: evn(prevEv, 'visit') || evn(prevEv, 'open') || 0,
    views: prevViews.n || 0,
    cards: evn(prevEv, 'card'),
    phones: evn(prevEv, 'phone')
  };

  /* ---------- ბაზის მდგომარეობა ---------- */
  const [lstRows, reqRows, modRows] = await Promise.all([
    many(`SELECT status, COUNT(*) AS n FROM lst GROUP BY status`),
    many(`SELECT status, COUNT(*) AS n FROM req GROUP BY status`),
    many(`SELECT action, COUNT(*) AS n FROM mod_log WHERE at>=?1 GROUP BY action`, since)
  ]);
  const byStatus = rows => Object.fromEntries(rows.map(r => [r.status, r.n]));

  /* ---------- ★ დამთხვევის მაჩვენებელი ★ ---------- */
  /* მნიშვნელი: აქტიური მოთხოვნები, რომლებსაც 7 დღე უკვე გაუვიდათ —
     ახალს ჯერ შანსი არ ჰქონია, ამიტომ სტატისტიკას არ ვურევთ. */
  const WEEK = 7 * 86400e3;
  const mDen = await one(
    `SELECT COUNT(*) AS n FROM req
      WHERE status IN ('active','closed') AND created <= ?1 AND created >= ?2`,
    t - WEEK, prevSince
  );
  const mNum = await one(
    `SELECT COUNT(DISTINCT r.id) AS n FROM req r
       JOIN mt m ON m.req_id = r.id
      WHERE r.status IN ('active','closed') AND r.created <= ?1 AND r.created >= ?2
        AND m.created - r.created <= ?3`,
    t - WEEK, prevSince, WEEK
  );

  const matchRate = pct(mNum.n || 0, mDen.n || 0);

  /* საშუალო დრო პირველ დამთხვევამდე (საათებში) */
  const spd = await one(
    `SELECT AVG(x.dt) AS a FROM (
        SELECT MIN(m.created) - r.created AS dt
          FROM req r JOIN mt m ON m.req_id = r.id
         WHERE r.created >= ?1 GROUP BY r.id) x`,
    prevSince
  );

  /* ---------- რეგიონები / ქალაქები / ტიპები ---------- */
  const regRows = await many(
    `SELECT COALESCE(NULLIF(reg,''), ?2) AS k, COUNT(*) AS n
       FROM lst WHERE status='active' GROUP BY k ORDER BY n DESC LIMIT 10`,
    since, REG_UNKNOWN
  );
  const cityRows = await many(
    `SELECT COALESCE(NULLIF(loc,''), ?2) AS k, COUNT(*) AS n
       FROM lst WHERE status='active' GROUP BY k ORDER BY n DESC LIMIT 10`,
    since, REG_UNKNOWN
  );
  const typeRows = await many(
    `SELECT cat AS k, COUNT(*) AS n FROM lst WHERE status='active' GROUP BY k ORDER BY n DESC`
  );

  const share = rows => {
    const tot = rows.reduce((s, r) => s + r.n, 0);
    return rows.map(r => [r.k, pct(r.n, tot)]);
  };

  /* ---------- ქცევა ---------- */
  const LBL = {
    visit: 'ვიზიტი', card: 'ბარათის გახსნა', phone: 'ნომრის ჩვენება',
    filter: 'ფილტრის გამოყენება', seek: '„ვეძებ" ტაბი', gallery: 'გალერეა',
    compare: 'შედარება', share: 'გაზიარება', lang: 'ენის გადართვა',
    foot_min: 'ფუტერის ჩაკეცვა', foot_max: 'ფუტერის გაშლა', measure: 'გაზომვა'
  };
  const beh = ev.filter(r => r.name && r.name !== 'x')
    .sort((a, b) => b.n - a.n).slice(0, 12)
    .map(r => [LBL[r.name] || r.name, r.n]);

  /* ---------- ★ მაძიებლების ჩართულობა ★ ---------- */
  /* რამდენს ვუგზავნით და რამდენს ხსნიან — ერთი შეხედვით ჩანს,
     ვინ არის ნამდვილი მყიდველი და ვინ უბრალოდ ავსებს ბაზას. */
  const eng = await one(
    `SELECT COUNT(*) AS reqs,
            COALESCE(SUM(sent_n),0) AS offered,
            COALESCE(SUM(open_n),0) AS opened,
            SUM(CASE WHEN sent_n >= ?1 AND open_n = 0 THEN 1 ELSE 0 END) AS cold,
            SUM(CASE WHEN status='paused' THEN 1 ELSE 0 END) AS paused
       FROM req WHERE status IN ('active','paused','closed')`,
    RULES.MIN_OFFERS
  );
  const blocked = await one(
    `SELECT COUNT(*) AS n FROM users WHERE status='blocked'`
  );

  return J({
    range: { days, from, to: dayKey() },
    kpi, prev,

    engage: {
      offered: eng.offered || 0,
      opened: eng.opened || 0,
      rate: pct(eng.opened || 0, eng.offered || 0),
      cold: eng.cold || 0,          /* ვისაც არაფერი გაუხსნია */
      paused: eng.paused || 0,
      blocked: blocked.n || 0,
      note: 'გამოგზავნილი შეთავაზებებიდან რამდენი გახსნეს — დაწკაპუნებით გაზომილი'
    },


    /* ★ ჩრდილოეთის ვარსკვლავი */
    match: {
      rate: matchRate,                                   /* % */
      matched: mNum.n || 0,
      eligible: mDen.n || 0,
      hoursToFirst: spd.a ? Math.round(spd.a / 3600e3) : null,
      note: 'აქტიური მოთხოვნების წილი, რომელმაც 7 დღეში ერთი დამთხვევა მაინც მიიღო'
    },

    base: {
      lst: byStatus(lstRows),
      req: byStatus(reqRows),
      moderated: Object.fromEntries(modRows.map(r => [r.action, r.n]))
    },

    regions: share(regRows).map(([k, v]) => [k, v, null]),
    cities: share(cityRows).map(([k, v]) => [k, v, null]),
    types: share(typeRows),
    beh
  });
}
