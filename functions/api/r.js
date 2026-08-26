/**
 * /api/r — წერილის ბმულის გამტარი
 *
 *   GET /api/r?r=<req_id>&l=<lst_id>&s=<ხელმოწერა>
 *        → იწერს დაწკაპუნებას და გადაამისამართებს განცხადებაზე
 *
 * ------------------------------------------------------------------
 * ეს ერთადერთი სანდო წერტილია, სადაც ვიგებთ, რომ მაძიებელმა
 * შეთავაზება მართლა ნახა. წერილის „გახსნა" არ გამოდგება —
 * მიზეზები _engage.js-შია აღწერილი.
 *
 * ხელმოწერა საჭიროა იმისთვის, რომ ვინმემ სხვისი მოთხოვნის
 * სტატისტიკა ხელოვნურად ვერ გააუმჯობესოს ან გააფუჭოს.
 * ⚠️ თუ გადამისამართება ვერ მოხერხდა, მაინც ვუშვებთ განცხადებაზე —
 *    გატეხილი ბმული უარესია, ვიდრე დაკარგული სტატისტიკა.
 */
import { sha } from './_util.js';

const SITE = 'https://mymamuli.ge';

/* ხელმოწერა — მოკლე, რომ ბმული წერილში არ გაბერილიყო */
export async function sign(env, reqId, lstId) {
  const secret = env.LINK_SECRET || env.ADMIN_KEY || 'mm';
  return (await sha([reqId, lstId, secret].join('|'))).slice(0, 16);
}

export async function trackedLink(env, reqId, lstId) {
  if (!reqId || !lstId) return `${SITE}/g/${lstId || ''}/`;
  const s = await sign(env, reqId, lstId);
  return `${SITE}/api/r?r=${encodeURIComponent(reqId)}&l=${encodeURIComponent(lstId)}&s=${s}`;
}

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const reqId = u.searchParams.get('r') || '';
  const lstId = u.searchParams.get('l') || '';
  const sig = u.searchParams.get('s') || '';

  const dest = lstId && /^l_[a-z0-9]+$/.test(lstId)
    ? `${SITE}/g/${lstId}/`
    : SITE;

  const go = () => Response.redirect(dest, 302);

  if (!env.DB || !reqId || !lstId) return go();
  if (sig !== await sign(env, reqId, lstId)) return go();

  try {
    const t = Date.now();
    /* პირველი დაწკაპუნება ითვლება — განმეორებით ციფრს არ ვბერავთ */
    const row = await env.DB.prepare(
      `SELECT opened FROM mt WHERE req_id=?1 AND lst_id=?2`
    ).bind(reqId, lstId).first();

    if (row && !row.opened) {
      await env.DB.batch([
        env.DB.prepare(`UPDATE mt SET opened=?3 WHERE req_id=?1 AND lst_id=?2`)
          .bind(reqId, lstId, t),
        env.DB.prepare(
          `UPDATE req SET open_n = open_n + 1, last_open = ?2,
                          warned = 0, warn_at = NULL
             WHERE id = ?1`
        ).bind(reqId, t),
        /* ერთი დაწკაპუნებაც აჩვენებს, რომ ადამიანი ცოცხალია */
        env.DB.prepare(
          `UPDATE users SET last_seen=?2
            WHERE id = (SELECT user_id FROM req WHERE id=?1)`
        ).bind(reqId, t)
      ]);
    }
  } catch (_) { /* სტატისტიკა ბმულს ვერ გატეხავს */ }

  return go();
}
