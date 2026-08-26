/**
 * /api/views — ნახვების მთვლელი და ანალიტიკა
 * Cloudflare Pages Function · D1 ბაზა „mymamuli"
 *
 * ─── საიტი ───
 * POST /api/views                 {ids:[...], hit:"l-…"|null}
 *   hit → ერთით ზრდის ჯამურ და დღიურ მთვლელს
 *   პასუხი: {views:{id:{total,today}}, day:"YYYY-MM-DD"}
 *
 * ─── ადმინი ───
 * GET  /api/views?days=30   სრული ანალიტიკა
 *   ⚠️ დაცვა: x-admin-key header ან mm_sid სესიის cookie.
 *   პასუხი: {range, totals:[{id,total,today,week,month}], daily:[{day,n}], events:[…]}
 *
 * დღე ითვლება თბილისის დროით (UTC+4), რომ „დღეს" ქართულ დღეს ნიშნავდეს.
 */

import { authed } from './_util.js';

const TZ = 4 * 3600 * 1000;
const dayKey = (shift = 0) =>
  new Date(Date.now() + TZ - shift * 86400000).toISOString().slice(0, 10);

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*'
    }
  });

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type'
    }
  });
}

/* ─────────────── საიტი: ნახვის დაფიქსირება ─────────────── */
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ views: {}, error: 'no-db' });

  let body = {};
  try { body = await request.json(); } catch (_) {}
  const ids = Array.isArray(body.ids) ? body.ids.slice(0, 300) : [];
  const hit = typeof body.hit === 'string' ? body.hit.slice(0, 64) : null;
  const today = dayKey();

  if (hit) {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO view_total (id, total, first_seen, last_seen) VALUES (?1, 1, ?2, ?2)
         ON CONFLICT(id) DO UPDATE SET total = total + 1, last_seen = ?2`
      ).bind(hit, today),
      env.DB.prepare(
        `INSERT INTO view_day (id, day, n) VALUES (?1, ?2, 1)
         ON CONFLICT(id, day) DO UPDATE SET n = n + 1`
      ).bind(hit, today)
    ]);
  }

  const views = {};
  if (ids.length) {
    const marks = ids.map((_, i) => '?' + (i + 1)).join(',');
    const [tot, dayRows] = await Promise.all([
      env.DB.prepare(`SELECT id, total FROM view_total WHERE id IN (${marks})`).bind(...ids).all(),
      env.DB.prepare(
        `SELECT id, n FROM view_day WHERE day = ?${ids.length + 1} AND id IN (${marks})`
      ).bind(...ids, today).all()
    ]);
    const dmap = {};
    for (const r of dayRows.results || []) dmap[r.id] = r.n;
    for (const r of tot.results || []) views[r.id] = { total: r.total, today: dmap[r.id] || 0 };
    for (const id of ids) if (!views[id]) views[id] = { total: 0, today: dmap[id] || 0 };
  }
  return json({ views, day: today });
}

/* ─────────────── ადმინი: ანალიტიკა ─────────────── */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!await authed(request, env)) return json({ error: 'unauthorized' }, 401);
  if (!env.DB) return json({ error: 'no-db' }, 500);

  const days = Math.min(180, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10)));
  const from = dayKey(days - 1);
  const today = dayKey();
  const week = dayKey(6);
  const month = dayKey(29);

  const [totals, daily, top, events] = await Promise.all([
    env.DB.prepare(
      `SELECT t.id, t.total, t.first_seen, t.last_seen,
              COALESCE((SELECT n FROM view_day d WHERE d.id = t.id AND d.day = ?1), 0)               AS today,
              COALESCE((SELECT SUM(n) FROM view_day d WHERE d.id = t.id AND d.day >= ?2), 0)         AS week,
              COALESCE((SELECT SUM(n) FROM view_day d WHERE d.id = t.id AND d.day >= ?3), 0)         AS month
       FROM view_total t ORDER BY t.total DESC LIMIT 100`
    ).bind(today, week, month).all(),
    env.DB.prepare(
      `SELECT day, SUM(n) AS n FROM view_day WHERE day >= ?1 GROUP BY day ORDER BY day`
    ).bind(from).all(),
    env.DB.prepare(
      `SELECT id, SUM(n) AS n FROM view_day WHERE day >= ?1 GROUP BY id ORDER BY n DESC LIMIT 20`
    ).bind(from).all(),
    env.DB.prepare(
      `SELECT name, k, SUM(n) AS n FROM ev WHERE day >= ?1 GROUP BY name, k ORDER BY n DESC LIMIT 60`
    ).bind(from).all()
  ]);

  return json({
    range: { from, to: today, days },
    totals: totals.results || [],
    daily: daily.results || [],
    top: top.results || [],
    events: events.results || []
  });
}
