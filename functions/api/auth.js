/**
 * /api/auth — მომხმარებლის რეგისტრაცია და შესვლა
 *
 *   POST /api/auth {mode:'register', name, email, tel, pass}
 *        → ქმნის ანგარიშს (email_ok=0), აგზავნის დადასტურების კოდს
 *          ელფოსტაზე. სესია ჯერ არ იხსნება — საჭიროა mode:'verify'.
 *   POST /api/auth {mode:'verify', email, code}
 *        → კოდის დადასტურება → email_ok=1 → სესია იხსნება.
 *   POST /api/auth {mode:'login', email|tel, pass}
 *   POST /api/auth {mode:'out'}
 *   GET  /api/auth                       → ვინ არის შესული
 *
 * ------------------------------------------------------------------
 * ⚠️ პაროლი ღიად არასდროს ინახება. PBKDF2-SHA256, 100 000 იტერაცია
 *    (Cloudflare Workers-ის crypto.subtle-ს ზედა ზღვარია — მეტს არ უჭერს),
 *    თითოეულს საკუთარი მარილი. ეს იმას ნიშნავს, რომ ბაზის გაჟონვის
 *    შემთხვევაშიც პაროლების აღდგენა პრაქტიკულად შეუძლებელია.
 *
 * ⚠️ სესია HttpOnly cookie-შია — JavaScript მას ვერ კითხულობს,
 *    ე.ი. XSS-ითაც ვერ მოიპარება.
 *
 * ⚠️ რეგისტრაციისას ელფოსტაც და ტელეფონიც აუცილებელია — ორივე
 *    ველი სავალდებულოა (ეს გადაწყვეტილება განზრახაა). ტელეფონის
 *    კოდი დამატებით არ დასტურდება (ეტაპი 2) — მხოლოდ ინახება.
 */
import {
  J, randId, randCode, sha, safeEq, now, limited, str, normEmail, normPhone
} from './_util.js';
import { flushMailQueue } from './_mail.js';

const TTL = 30 * 86400e3;          /* 30 დღე — ხელახლა შესვლა იშვიათად */
const COOKIE = 'mm_u';
const ITER = 100000;
const MAX_TRIES = 5;
const RE_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

const setCookie = (v, maxAge) =>
  `${COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

/* ---------- პაროლის ჰეში ---------- */
async function hash(pass, salt) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: ITER, hash: 'SHA-256' },
    key, 256);
  return [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function cookie(request) {
  for (const p of (request.headers.get('cookie') || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0 && p.slice(0, i).trim() === COOKIE) return p.slice(i + 1).trim();
  }
  return '';
}

/* სხვა endpoint-ებიც ამას იძახიან */
export async function whoami(request, env) {
  const c = cookie(request);
  if (!c || !env.DB) return null;
  const row = await env.DB.prepare(
    `SELECT t.user_id, t.expires, t.used, u.email, u.name, u.phone_full, u.status
       FROM token t JOIN users u ON u.id = t.user_id
      WHERE t.id = ?1 AND t.kind = 'user'`
  ).bind(await sha('u:' + c)).first();
  if (!row || row.used || row.expires < now()) return null;
  if (row.status === 'blocked') return null;
  /* ⚠️ 2026-08-26: George-ის მოთხოვნით — ტელეფონიც (არა მხოლოდ
     სახელი/ელფოსტა) უნდა შეივსოს ავტომატურად ფორმაში, თუ მომხმარებელი
     უკვე შესულია. phone_full საკუთარ თავზეა და ესაა ერთადერთი ადგილი,
     სადაც ის ჩვეულებრივ (არა-ადმინ) endpoint-იდან ბრუნდება — ესეც
     უსაფრთხოა, რადგან მხოლოდ საკუთარ, cookie-ით დამტკიცებულ ანგარიშზე
     ვაბრუნებთ, არავის სხვისზე. */
  return { id: row.user_id, email: row.email, name: row.name, tel: row.phone_full || '' };
}

export async function onRequestGet({ request, env }) {
  const u = await whoami(request, env);
  return J({ ok: !!u, user: u });
}

/* სესიის cookie — login-ისა და email-ის დადასტურების შემდეგ ორივემ ამას იძახის */
async function issueSession(env, u) {
  const s = randId('', 32);
  const t = now();
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM token WHERE kind='user' AND expires < ?1`).bind(t),
    env.DB.prepare(
      `INSERT INTO token (id,user_id,kind,hash,expires,created)
       VALUES (?1,?2,'user','-',?3,?4)`
    ).bind(await sha('u:' + s), u.id, t + TTL, t),
    env.DB.prepare(`UPDATE users SET last_login=?2 WHERE id=?1`).bind(u.id, t)
  ]);
  return J({ ok: true }, 200, { 'set-cookie': setCookie(s, TTL / 1000) });
}

/* რიგში ახალი წერილი რომ ჩავარდეს, აღარ ველოდებით cron-ს — პასუხის
   დაბრუნებამდე პირდაპირ ველოდებით (await).
   ⚠️ ორი წინა მცდელობა (self-fetch, მერე waitUntil+ფონური გამოძახება)
   ორივე არასტაბილური აღმოჩნდა — Cloudflare-ის waitUntil-ს არ ცხადდება
   საკმარისი დრო ფონური დავალების დასასრულებლად. ახლა await-ით ველოდებით,
   ~0.5-1წმ დამატებითი დაყოვნების ფასად — სამაგიეროდ გარანტირებულია. */
async function kickMail(env) {
  await flushMailQueue(env).catch(() => {});
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return J({ error: 'no-db' }, 500);
  let b = {};
  try { b = await request.json() } catch (_) {}

  /* --- გამოსვლა --- */
  if (b.mode === 'out') {
    const c = cookie(request);
    if (c) await env.DB.prepare(`UPDATE token SET used=1 WHERE id=?1`)
      .bind(await sha('u:' + c)).run();
    return J({ ok: true }, 200, { 'set-cookie': setCookie('', 0) });
  }

  const ip = request.headers.get('cf-connecting-ip') || '0';

  /* --- ელფოსტის კოდის დადასტურება (რეგისტრაციის მე-2 ნაბიჯი) --- */
  if (b.mode === 'verify') return verifyEmail(env, b, ip);

  /* --- კოდის ხელახლა გაგზავნა — პაროლი აღარ სჭირდება, მხოლოდ ელფოსტა --- */
  if (b.mode === 'resend') return resendCode(env, b, ip, () => kickMail(env));

  if (await limited(env, 'auth:' + ip, 20, 3600e3)) return J({ error: 'too-many' }, 429);

  const email = normEmail(b.email);
  const tel = normPhone(b.tel);
  const pass = String(b.pass || '');

  const byMail = RE_EMAIL.test(email);
  const byTel = tel.length >= 6;

  /* ═══ რეგისტრაცია — ელფოსტა და ტელეფონი ორივე სავალდებულოა ═══ */
  if (b.mode === 'register') {
    const name = str(b.name, 90);
    if (!name) return J({ error: 'bad-name' }, 400);
    if (!byMail) return J({ error: 'bad-id' }, 400);
    if (!byTel) return J({ error: 'bad-phone' }, 400);
    if (pass.length < 8) return J({ error: 'weak-pass' }, 400);

    const telHash = await sha('tel:' + tel);
    let u = await env.DB.prepare(`SELECT * FROM users WHERE email_norm=?1`).bind(email).first();

    /* დადასტურებული ანგარიში უკვე არსებობს — ხელახლა არ იქმნება */
    if (u && u.pass && u.email_ok) return J({ error: 'exists' }, 409);

    /* ტელეფონი სხვას ეკუთვნის (გარდა თვითონ ამ, ჯერ დაუდასტურებელი, ანგარიშისა) */
    const dupPhone = await env.DB.prepare(
      `SELECT id FROM users WHERE phone_hash=?1 AND email_norm<>?2`
    ).bind(telHash, email).first();
    if (dupPhone) return J({ error: 'phone-taken' }, 409);

    const salt = randId('', 16);
    const h = await hash(pass, salt);
    const t = now();

    /* სრული ნომერი — მხოლოდ ადმინის ხედვისთვის (users.html), არსად
       საჯაროდ არ ჩანს. `phone` სვეტი დაფარული (••1234) რჩება ისე,
       როგორც აქამდე იყო. */
    const telFull = str(b.tel, 32);

    if (u) {
      /* ადრე დაწყებული, მაგრამ დაუდასტურებელი რეგისტრაცია — თავიდან ვწერთ */
      await env.DB.prepare(
        `UPDATE users SET pass=?2, salt=?3, name=?4, phone=?5, phone_hash=?6, phone_full=?7 WHERE id=?1`
      ).bind(u.id, h, salt, name, '••' + tel.slice(-4), telHash, telFull).run();
    } else {
      const id = randId('u_');
      await env.DB.prepare(
        `INSERT INTO users (id,email,email_norm,name,phone,phone_hash,phone_full,pass,salt,created)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`
      ).bind(
        id, str(b.email, 190), email, name,
        '••' + tel.slice(-4), telHash, telFull, h, salt, t
      ).run();
      u = { id };
    }

    /* --- დადასტურების კოდი ელფოსტაზე --- */
    const code = randCode(6);
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM token WHERE user_id=?1 AND kind='verify_email'`).bind(u.id),
      env.DB.prepare(
        `INSERT INTO token (id,user_id,kind,hash,expires,created)
         VALUES (?1,?2,'verify_email',?3,?4,?5)`
      ).bind(randId('t_'), u.id, await sha(code + ':' + u.id), t + 15 * 60e3, t),
      env.DB.prepare(
        `INSERT INTO mailq (user_id,to_addr,kind,payload,created) VALUES (?1,?2,'verify',?3,?4)`
      ).bind(u.id, email, JSON.stringify({ code }), t)
    ]);
    await kickMail(env);

    return J({
      ok: true, needVerify: true, email,
      /* ⚠️ სატესტო რეჟიმი. ლაივზე SHOW_CODE ცვლადი უნდა წაიშალოს. */
      devCode: env.SHOW_CODE === '1' ? code : undefined
    });
  }

  /* ═══ შესვლა — ელფოსტა ან ტელეფონი ═══ */
  if (!byMail && !byTel) return J({ error: 'bad-id' }, 400);
  if (pass.length < 8) return J({ error: 'weak-pass' }, 400);

  const find = byMail
    ? env.DB.prepare(`SELECT * FROM users WHERE email_norm=?1`).bind(email)
    : env.DB.prepare(`SELECT * FROM users WHERE phone_hash=?1`).bind(await sha('tel:' + tel));
  const u = await find.first();

  /* ⚠️ ერთი და იგივე პასუხი — რომ არ გაირკვეს, ანგარიში არსებობს თუ არა */
  if (!u || !u.pass) return J({ error: 'wrong' }, 401);
  if (u.status === 'blocked') return J({ error: 'blocked' }, 403);
  const h = await hash(pass, u.salt || '');
  if (!safeEq(h, u.pass)) return J({ error: 'wrong' }, 401);

  /* დაუდასტურებელი ელფოსტით სესია არ იხსნება — კოდის გვერდზე ვაბრუნებთ */
  if (!u.email_ok) return J({ error: 'unverified', email: u.email }, 403);

  return issueSession(env, u);
}

/* ================= ელფოსტის კოდის დადასტურება ================= */
async function verifyEmail(env, b, ip) {
  if (await limited(env, 'vf:' + ip, 30, 3600e3)) return J({ error: 'too-many' }, 429);

  const email = normEmail(b.email);
  const code = String(b.code || '').trim();
  if (!email || !/^\d{6}$/.test(code)) return J({ error: 'bad-code' }, 400);

  const u = await env.DB.prepare(`SELECT * FROM users WHERE email_norm=?1`).bind(email).first();
  if (!u) return J({ error: 'wrong-code' }, 400);   /* არ ვამხელთ, არსებობს თუ არა */

  const tk = await env.DB.prepare(
    `SELECT id, hash, expires, tries, used FROM token
      WHERE user_id=?1 AND kind='verify_email'
      ORDER BY created DESC LIMIT 1`
  ).bind(u.id).first();

  if (!tk || tk.used) return J({ error: 'wrong-code' }, 400);
  if (tk.expires < now()) return J({ error: 'expired' }, 400);
  if (tk.tries >= MAX_TRIES) {
    await env.DB.prepare(`UPDATE token SET used=1 WHERE id=?1`).bind(tk.id).run();
    return J({ error: 'too-many-tries' }, 429);
  }

  const h = await sha(code + ':' + u.id);
  if (!safeEq(h, tk.hash)) {
    await env.DB.prepare(`UPDATE token SET tries=tries+1 WHERE id=?1`).bind(tk.id).run();
    return J({ error: 'wrong-code', left: MAX_TRIES - tk.tries - 1 }, 400);
  }

  await env.DB.batch([
    env.DB.prepare(`UPDATE token SET used=1 WHERE id=?1`).bind(tk.id),
    env.DB.prepare(`UPDATE users SET email_ok=1 WHERE id=?1`).bind(u.id)
  ]);

  if (u.status === 'blocked') return J({ error: 'blocked' }, 403);
  return issueSession(env, u);
}

/* ================= კოდის ხელახლა გაგზავნა ================= */
/* პაროლი აქ არ სჭირდება — მხოლოდ დაუდასტურებელ ანგარიშს ეხმარება.
   პასუხი ერთნაირია არსებობს თუ არა ანგარიში — რომ არ გაირკვეს. */
async function resendCode(env, b, ip, kick) {
  if (await limited(env, 'rs:' + ip, 10, 3600e3)) return J({ error: 'too-many' }, 429);

  const email = normEmail(b.email);
  if (!email) return J({ ok: true });

  if (await limited(env, 'rs:' + email, 5, 3600e3)) return J({ ok: true });

  const u = await env.DB.prepare(`SELECT * FROM users WHERE email_norm=?1`).bind(email).first();
  if (!u || u.email_ok || !u.pass) return J({ ok: true });   /* ან არ არსებობს, ან უკვე დადასტურებულია */

  const code = randCode(6);
  const t = now();
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM token WHERE user_id=?1 AND kind='verify_email'`).bind(u.id),
    env.DB.prepare(
      `INSERT INTO token (id,user_id,kind,hash,expires,created)
       VALUES (?1,?2,'verify_email',?3,?4,?5)`
    ).bind(randId('t_'), u.id, await sha(code + ':' + u.id), t + 15 * 60e3, t),
    env.DB.prepare(
      `INSERT INTO mailq (user_id,to_addr,kind,payload,created) VALUES (?1,?2,'verify',?3,?4)`
    ).bind(u.id, email, JSON.stringify({ code }), t)
  ]);
  if (kick) await kick();

  return J({ ok: true, devCode: env.SHOW_CODE === '1' ? code : undefined });
}
