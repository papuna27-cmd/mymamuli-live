/**
 * /api/online — ონლაინ მომხმარებლების რეალური რიცხვი
 *
 *   POST /api/online → {online: N}
 *
 * ------------------------------------------------------------------
 * ვინაობა არსად ინახება. IP + ბრაუზერი + დღიური მარილი ერთად ჰეშირდება
 * და მხოლოდ ეს ჰეში იწერება. ხვალ იგივე ადამიანი სხვა ჰეშს მიიღებს —
 * ე.ი. თვალყურის დევნება შეუძლებელია, დათვლა კი შესაძლებელი.
 */
import { J, sha } from './_util.js';

const WINDOW = 5 * 60e3;        /* ბოლო 5 წუთი ითვლება „ონლაინად" */
const KEEP = 60 * 60e3;         /* ერთ საათზე ძველი იშლება */

export async function onRequestPost({ request, env }) {
  if (!env.DB) return J({ online: 0 });

  const t = Date.now();
  const day = Math.floor(t / 86400e3);
  const vid = await sha([
    request.headers.get('cf-connecting-ip') || '',
    request.headers.get('user-agent') || '',
    day                                       /* ← დღიური მარილი */
  ].join('|'));

  try {
    await env.DB.prepare(
      `INSERT INTO pres (vid, seen) VALUES (?1, ?2)
       ON CONFLICT(vid) DO UPDATE SET seen = ?2`
    ).bind(vid, t).run();

    /* გაწმენდა — დაახლოებით ყოველ მეოცე მოთხოვნაზე, რომ ბაზა არ დაიტვირთოს */
    if (t % 20 < 1) {
      await env.DB.prepare(`DELETE FROM pres WHERE seen < ?1`).bind(t - KEEP).run();
    }

    const r = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM pres WHERE seen > ?1`
    ).bind(t - WINDOW).first();

    return J({ online: r?.n || 1 });
  } catch (_) {
    return J({ online: 0 });
  }
}
