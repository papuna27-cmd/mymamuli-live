/**
 * /api/track — მოვლენების აგრეგირებული მთვლელი
 * ინახავს მხოლოდ დღე + მოვლენა + გასაღები + რაოდენობა.
 * პერსონალური მონაცემი არ იწერება.
 */
import { authed, denied } from './_util.js';

const TZ = 4 * 3600 * 1000;
const dayKey = () => new Date(Date.now() + TZ).toISOString().slice(0, 10);

export async function onRequestPost({ request, env }) {
  if (!env.DB) return new Response('{}', { headers: { 'content-type': 'application/json' } });
  let rows = [];
  try {
    const body = await request.json();
    rows = Array.isArray(body) ? body : (body && body.events) || [];
  } catch (_) {}
  const day = dayKey();
  const stmts = rows.slice(0, 60).map(e => {
    /* კლიენტი აგზავნის {e:'სახელი', …} — ძველი ვარიანტებიც მიიღება */
    const name = String((e && (e.e || e.ev || e.name)) || 'x').slice(0, 32);
    const k = String((e && (e.reg || e.loc || e.t || e.l || e.k)) || '').slice(0, 48);
    return env.DB.prepare(
      `INSERT INTO ev (day, name, k, n) VALUES (?1, ?2, ?3, 1)
       ON CONFLICT(day, name, k) DO UPDATE SET n = n + 1`
    ).bind(day, name, k);
  });
  if (stmts.length) await env.DB.batch(stmts);
  return new Response('{"ok":true}', {
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }
  });
}

/**
 * GET /api/track?days=30  — მოვლენების ჭრილი ადმინისთვის.
 * ⚠️ დაცვა: x-admin-key header ან mm_sid სესიის cookie. ?key= აღარაა.
 */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!await authed(request, env)) return denied();
  if (!env.DB) return new Response('{"events":[]}', {
    headers: { 'content-type': 'application/json' } });

  const days = Math.max(1, Math.min(365, +url.searchParams.get('days') || 30));
  const from = new Date(Date.now() + TZ - days * 86400000).toISOString().slice(0, 10);
  const { results } = await env.DB.prepare(
    `SELECT name, SUM(n) AS n FROM ev WHERE day >= ?1
     GROUP BY name ORDER BY n DESC LIMIT 40`
  ).bind(from).all();
  return new Response(JSON.stringify({ days, events: results || [] }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}
