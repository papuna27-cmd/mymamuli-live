/**
 * /api/admin — ადმინის სესია
 *
 *   POST /api/admin  {key}      → შესვლა, cookie-ს დაყენება
 *   GET  /api/admin             → სესია ცოცხალია?
 *   POST /api/admin  {out:1}    → გამოსვლა
 *
 * ------------------------------------------------------------------
 * რატომ ასე
 * ადრე გასაღები URL-ში იგზავნებოდა: `/api/mod?key=…`. ის რჩებოდა
 * ბრაუზერის ისტორიაში, Referer-ში, სერვერის ლოგებში და ეკრანის სურათზე.
 * ერთი გაზიარებული ბმული — და მთელი ადმინკა გახსნილია.
 *
 * ახლა გასაღები ერთხელ იგზავნება POST-ის სხეულში. სანაცვლოდ გაიცემა
 * შემთხვევითი სესიის ტოკენი, რომელიც HttpOnly cookie-ში ზის —
 * JavaScript მას ვერ კითხულობს, ე.ი. XSS-ითაც ვერ მოიპარება.
 * თვითონ ADMIN_KEY cookie-ში არასდროს ხვდება.
 */
import { J, randId, sha, safeEq, now, limited, sessionOk } from './_util.js';

const TTL = 12 * 3600e3;                 /* 12 საათი — სამუშაო დღე */
const COOKIE = 'mm_sid';

const setCookie = (v, maxAge) =>
  `${COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

function sid(request) {
  for (const p of (request.headers.get('cookie') || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0 && p.slice(0, i).trim() === COOKIE) return p.slice(i + 1).trim();
  }
  return '';
}

/* ---------- სესიის შემოწმება ---------- */
export async function onRequestGet({ request, env }) {
  return J({ ok: await sessionOk(request, env) });
}

/* ---------- შესვლა / გამოსვლა ---------- */
export async function onRequestPost({ request, env }) {
  let b = {};
  try { b = await request.json() } catch (_) {}

  /* --- გამოსვლა --- */
  if (b.out) {
    const s = sid(request);
    if (s && env.DB) {
      await env.DB.prepare(`UPDATE token SET used=1 WHERE id=?1`)
        .bind(await sha('sid:' + s)).run();
    }
    return J({ ok: true }, 200, { 'set-cookie': setCookie('', 0) });
  }

  if (!env.ADMIN_KEY) return J({ error: 'ADMIN_KEY არ არის დაყენებული' }, 500);
  if (!env.DB) return J({ error: 'no-db' }, 500);

  /* გასაღების მოსინჯვა ძვირი უნდა იყოს: 8 მცდელობა საათში ერთი IP-დან */
  const ip = request.headers.get('cf-connecting-ip') || '0';
  if (await limited(env, 'adm:' + ip, 8, 3600e3)) return J({ error: 'too-many' }, 429);

  /* safeEq — თანაბარი დრო, რომ გასაღები სიმბოლო-სიმბოლო არ გამოიცნონ */
  if (!safeEq(String(b.key || ''), env.ADMIN_KEY)) return J({ error: 'wrong-key' }, 401);

  const s = randId('', 32);
  const t = now();
  await env.DB.batch([
    /* ვადაგასული სესიები ერთდროულად იწმინდება */
    env.DB.prepare(`DELETE FROM token WHERE kind='admin' AND expires < ?1`).bind(t),
    env.DB.prepare(
      `INSERT INTO token (id,user_id,kind,hash,expires,created)
       VALUES (?1,'admin','admin','-',?2,?3)`
    ).bind(await sha('sid:' + s), t + TTL, t)
  ]);

  return J({ ok: true, hours: TTL / 3600e3 }, 200,
    { 'set-cookie': setCookie(s, TTL / 1000) });
}
