/**
 * /api/submit — ფორმიდან ბაზაში
 * ==================================================================
 *
 *   POST /api/submit            {kind:'req'|'lst', …ველები}
 *        → ქმნის/პოულობს მომხმარებელს, ინახავს status='draft',
 *          აგენერირებს კოდს და წერილს რიგში აყენებს.
 *
 *   POST /api/submit?verify=1   {email, code}
 *        → კოდის დადასტურება: ეს კონკრეტული draft → pending.
 *
 * დადასტურებამდე ჩანაწერი არსად ჩანს და მოდერაციაშიც არ ხვდება.
 *
 * ------------------------------------------------------------------
 * უსაფრთხოების სამი წესი, რომელიც აქ სრულდება:
 *
 *  1. საკადასტრო ნიშანს **სერვერი** სვამს. კლიენტის `addr`/`cad_ok`
 *     იგნორირდება — თორემ ნიშანი გაყალბებადი იქნებოდა.
 *  2. კოდის მცდელობა **ითვლება**. 5-ის შემდეგ კოდი კვდება.
 *  3. ტელეფონი **ჰეშირებულად** ინახება ანგარიშზე. ღიად მხოლოდ
 *     განცხადებაშია — იქ ის საჯაროდ ჩანს განზრახ.
 */
import {
  J, now, randId, randCode, sha, safeEq,
  normEmail, normPhone, limited, str, int, geoOk
} from './_util.js';
import { lookupCad, cadValid } from './_cad.js';
import { flushMailQueue } from './_mail.js';

/* ---------- დასაშვები მნიშვნელობები ---------- */
const CATS = ['land', 'invest', 'house', 'flat', 'cottage', 'villa', 'comm', 'office',
  'hotel', 'resto', 'base', 'garage', 'parking'];
const DEALS = ['buy', 'rent'];
const PERIODS = ['day', 'month', 'year'];

/* ერთჯერადი ფოსტის დომენები */
const THROWAWAY = ['mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com',
  'yopmail.com', 'trashmail.com', 'sharklasers.com', 'temp-mail.org', 'getnada.com',
  'dispostable.com', 'maildrop.cc', 'fakeinbox.com', 'throwawaymail.com'];

const RE_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

const MAX_TRIES = 5;
const MAX_PHOTOS = 10;

/* ---------- პაროლის ჰეში ----------
   ⚠️ 2026-08-26: George-ის მოთხოვნით — მაძიებლის (kind==='req') ფორმაში
   პაროლი დაემატა, რომ „ვეძებ"-ის გაგზავნა ნამდვილ, პაროლიან ანგარიშსაც
   ქმნიდეს (და არა მხოლოდ ერთჯერად draft-ს). ზუსტად იგივე PBKDF2-SHA256,
   100 000 იტერაცია, რაც auth.js-ში — თანხვედრილი უნდა იყოს, რომ იმავე
   მომხმარებელს მერე /api/auth-ითაც შეეძლოს შესვლა. cross-import არ
   გვინდა (იხ. approveToken-ის კომენტარი ქვემოთ) — ამიტომ დუბლირებულია. */
const PW_ITER = 100000;
async function hashPass(pass, salt) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: PW_ITER, hash: 'SHA-256' },
    key, 256);
  return [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2, '0')).join('');
}
const COOKIE_U = 'mm_u';
const SESSION_TTL = 30 * 86400e3;
const setUserCookie = (v, maxAge) =>
  `${COOKIE_U}=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

/* ⚠️ 2026-08-26: George-ის მოთხოვნით — თუ ფორმის შემვსებელს უკვე აქვს
   ვალიდური mm_u სესია (ანუ დალოგინებულია საიტზე), ხელახლა სახელი/
   ელფოსტა/პაროლი და ბოლოს ელფოსტის კოდი აღარ უნდა მოეთხოვოს. აქ
   ვამოწმებთ ზუსტად იმ ლოგიკით, რასაც auth.js-ის whoami() იყენებს —
   cross-import არ გვინდა (იხ. approveToken-ის კომენტარი ქვემოთ),
   ამიტომ დუბლირებულია. */
function readSessionCookie(request) {
  for (const p of (request.headers.get('cookie') || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0 && p.slice(0, i).trim() === COOKIE_U) return p.slice(i + 1).trim();
  }
  return '';
}
async function loggedInUser(request, env) {
  const c = readSessionCookie(request);
  if (!c) return null;
  const row = await env.DB.prepare(
    `SELECT t.user_id, t.expires, t.used, u.email, u.name, u.status
       FROM token t JOIN users u ON u.id = t.user_id
      WHERE t.id = ?1 AND t.kind = 'user'`
  ).bind(await sha('u:' + c)).first();
  if (!row || row.used || row.expires < now()) return null;
  if (row.status === 'blocked') return null;
  return { id: row.user_id, email: row.email, name: row.name };
}

/* წესების მოქმედი ვერსია. თუ პირობებს შეცვლი — ეს ციფრიც შეცვალე,
   მაშინ ცხადი იქნება, ვინ რომელ რედაქციას დაეთანხმა. */
export const TERMS_V = '2026-08';

/* ================= შემომავალი მონაცემის შემოწმება ================= */
/* ადრე ველები პირდაპირ ბაზაში მიდიოდა. ახლა ყველა გადის ამ ფილტრს:
   უცნობი კატეგორია, საზღვრებს გარეთ კოორდინატი, უზომო ტექსტი — ჩერდება. */
function clean(b, kind) {
  const e = [];

  const cat = str(b.cat, 20);
  if (!CATS.includes(cat)) e.push('კატეგორია');

  const deal = DEALS.includes(b.deal) ? b.deal : 'buy';
  const period = PERIODS.includes(b.period) ? b.period : null;

  const lat = Number(b.lat), lng = Number(b.lng);
  if (!geoOk(lat, lng)) e.push('კოორდინატი საქართველოს საზღვრებს გარეთაა');

  const o = { cat, deal, period, lat, lng };

  if (kind === 'req') {
    o.radius = int(b.radius, 50, 20000) ?? 300;
    o.amin = int(b.amin, 0, 1e9);
    o.amax = int(b.amax, 0, 1e9);
    o.pmin = int(b.pmin, 0, 1e9);
    o.pmax = int(b.pmax, 0, 1e9);
    if (o.amin && o.amax && o.amin > o.amax) e.push('ფართობის დიაპაზონი');
    if (o.pmin && o.pmax && o.pmin > o.pmax) e.push('ბიუჯეტის დიაპაზონი');
    o.note = str(b.note, 500);
  } else {
    o.area = int(b.area, 1, 1e9);
    o.price = int(b.price, 0, 1e9);
    o.ttl = str(b.ttl, 160);
    o.dsc = str(b.dsc, 2000);
    o.cad = str(b.cad, 40);
    if (o.cad && !cadValid(o.cad)) e.push('საკადასტრო კოდის ფორმატი');
    o.loc = str(b.loc, 120) || null;
    o.reg = str(b.reg, 80) || null;

    /* ⚠️ 2026-08-26, George-ის მოთხოვნით — გამყიდველს/გამქირავებელს
       შეუძლია განცხადება დამალოს საერთო რუკიდან და დატოვოს ხილული
       მხოლოდ იმ მაძიებლისთვის, ვისი მოთხოვნაც არეალს/ფასს/ფართობს
       ემთხვევა (mod.js-ის დამთხვევის ლოგიკა ამას ისედაც პატივს სცემს —
       lst.status='active' მაინც უნდა იყოს, visibility-ზე არ არის
       დამოკიდებული; მხოლოდ /api/geo.js-ის საჯარო feed-ი და
       sitemap.xml.js გამორიცხავს). დეფოლტად საჯაროა. */
    o.visibility = b.visibility === 'private' ? 'private' : 'public';

    /* ⚠️ 2026-08-26, George-ის მოთხოვნით — გამყიდველს შეუძლია სახელი
       განცხადებაზე დამალოს: მაშინ საჯარო ბარათზე კონკრეტული სახელის
       ნაცვლად უბრალოდ „ვიზიტორი" ჩანს. ეს მხოლოდ საჯარო ჩვენებას
       ეხება — ანგარიშზე რეალური სახელი (users.name) და დადასტურების
       ელფოსტა/ტელეფონი უცვლელად რჩება, ადმინსაც ისინი მაინც უჩანს. */
    o.anon = b.anon === true || b.anon === 1 || b.anon === 'on';

    /* ფოტოები: მხოლოდ ჩვენი R2-ის ბმულები ან საკუთარი დომენი.
       თორემ განცხადებაში სხვისი სერვერის სურათი ჩაისმება. */
    const ph = Array.isArray(b.photos) ? b.photos : [];
    if (ph.length > MAX_PHOTOS) e.push('ფოტოების რაოდენობა');
    o.photos = ph.slice(0, MAX_PHOTOS).map(x => str(x, 300))
      .filter(u => /^https:\/\/([a-z0-9-]+\.)*mymamuli\.ge\//.test(u) || /^\/img\//.test(u));

    /* გამყიდველის დახაზული საზღვარი */
    o.poly = null;
    if (Array.isArray(b.poly) && b.poly.length >= 3 && b.poly.length <= 500) {
      const p = b.poly
        .map(pt => Array.isArray(pt) ? [Number(pt[0]), Number(pt[1])] : null)
        .filter(pt => pt && geoOk(pt[1], pt[0]));
      if (p.length >= 3) o.poly = p;
    }
  }

  /* ატრიბუტები: მხოლოდ მოკლე ტექსტური წყვილები, მაქსიმუმ 30 */
  o.attrs = {};
  if (b.attrs && typeof b.attrs === 'object' && !Array.isArray(b.attrs)) {
    for (const k of Object.keys(b.attrs).slice(0, 30)) {
      const v = b.attrs[k];
      if (Array.isArray(v)) o.attrs[str(k, 30)] = v.slice(0, 20).map(x => str(x, 60));
      else if (v != null && typeof v !== 'object') o.attrs[str(k, 30)] = str(v, 60);
    }
  }

  return { o, e };
}

/* რიგში ახალი წერილი რომ ჩავარდეს, აღარ ველოდებით cron-ს — მაშინვე ვაცლით.
   ⚠️ ორი წინა მცდელობა (self-fetch, მერე waitUntil+ფონური გამოძახება)
   ორივე არასტაბილური აღმოჩნდა — Cloudflare-ის waitUntil-ს არ ცხადდება
   საკმარისი დრო ფონური დავალების დასასრულებლად, განსაკუთრებით მაშინ,
   როცა მანამდე უკვე რამდენიმე D1 მოთხოვნა შესრულდა (როგორც verify()-ში).
   ახლა პასუხის დაბრუნებამდე პირდაპირ ველოდებით (await) — ~0.5-1წმ
   დამატებითი დაყოვნება მომხმარებლისთვის, სამაგიეროდ ადმინის წერილი
   გარანტირებულად იგზავნება რიგში ჩასმისთანავე, ყოველგვარი cron-ის
   მოლოდინის გარეშე. */
async function kickMail(env) {
  await flushMailQueue(env).catch(() => {});
}

/* ================= endpoint ================= */
export async function onRequestPost({ request, env }) {
  if (!env.DB) return J({ error: 'no-db' }, 500);
  const url = new URL(request.url);
  let b = {};
  try { b = await request.json() } catch (_) { return J({ error: 'bad-json' }, 400) }

  const ip = request.headers.get('cf-connecting-ip') || '0';

  if (url.searchParams.get('verify')) return verify(env, b, ip, () => kickMail(env));
  if (url.searchParams.get('resend')) return resendCode(env, b, ip, () => kickMail(env));

  /* ⚠️ 2026-08-26: George-ის მოთხოვნით — მომხმარებელს, რომელიც უკვე
     დალოგინებულია (ვალიდური mm_u სესია), აღარ სჭირდება ხელახლა
     იდენტიფიკაცია. ამ შემთხვევაში იდენტობა cookie-დან მოდის, არა
     ფორმიდან — ფორმაში ჩაწერილი ელფოსტა/სახელი/პაროლი აქ იგნორირდება. */
  const sessUser = await loggedInUser(request, env);

  /* ================= ახალი ჩანაწერი ================= */
  const kind = b.kind === 'lst' ? 'lst' : 'req';
  const email = normEmail(sessUser ? sessUser.email : b.email);
  if (!RE_EMAIL.test(email) || email.length > 190) return J({ error: 'bad-email' }, 400);
  if (!sessUser && THROWAWAY.includes(email.split('@')[1])) return J({ error: 'throwaway-email' }, 400);

  /* ══ დეკლარაცია — სავალდებულოა ══
     ბრაუზერში ჩამრთველებია, მაგრამ გადაწყვეტილებას სერვერი იღებს:
     თანხმობის გარეშე ჩანაწერი არ იქმნება.

     გამყიდველი ოთხივე პუნქტს ცალკე ნიშნავს — მონაცემების სიზუსტე,
     განთავსების უფლება, ფოტოების ნამდვილობა, წესები. დავის დროს
     ცხადი უნდა იყოს, კონკრეტულად რას დაეთანხმა და როდის. */
  if (b.terms !== true && b.terms !== 1 && b.terms !== 'on')
    return J({ error: 'terms-required' }, 400);

  let declJson = null;
  if (kind === 'lst') {
    const d = b.decl || {};
    if (!(d.d1 && d.d2 && d.d3 && d.d4))
      return J({ error: 'declaration-required' }, 400);
    declJson = JSON.stringify({
      v: TERMS_V, at: now(),
      accurate: true, authorised: true, ownPhotos: true, terms: true
    });
  }

  const { o, e } = clean(b, kind);
  if (e.length) return J({ error: 'invalid', fields: e }, 400);

  /* ⚠️ comp_ok — ადმინის მიერ დამტკიცებული „ულიმიტო" მომხმარებელი.
     cap-ის (5 lst / 2 req) გვერდის ავლა ადრეც გვქონდა, მაგრამ ეს
     დღიური/საათური ბოროტად-გამოყენების ლიმიტები (IP-ზე 12/სთ,
     ელფოსტაზე 6/დღეში) ცალკე მექანიზმია და მასაც ბლოკავდა — ანუ
     „ულიმიტო" მომხმარებელი მაინც ჩერდებოდა მე-6 განცხადებაზე დღეში.
     ახლა comp_ok ამასაც ხსნის. */
  const compRow = await env.DB.prepare(`SELECT comp_ok FROM users WHERE email_norm=?1`).bind(email).first();
  const compOk = !!(compRow && compRow.comp_ok);

  if (!compOk && await limited(env, 'ip:' + ip, 12, 3600e3)) return J({ error: 'too-many' }, 429);
  if (!compOk && await limited(env, 'em:' + email, 6, 86400e3)) return J({ error: 'too-many' }, 429);

  /* არხის გამოწერა — ნებაყოფლობითი */
  const wantsSub = b.sub === true || b.sub === 1 || b.sub === 'on';

  /* --- ტელეფონი --- */
  const phone = normPhone(b.tel);
  const phoneHash = phone.length >= 6 ? await sha('tel:' + phone) : null;
  const telShown = phone.length >= 6 ? str(b.tel, 32) : null;   /* განცხადებაზე საჯაროდ ჩანს */

  /* --- პაროლი (მხოლოდ „ვეძებ") ---
     ⚠️ 2026-08-26: George-ის მოთხოვნით — მაძიებელს ახლა პაროლიც
     ეთხოვება, რომ ეს ფორმა ერთდროულად რეგისტრაცია/შესვლაც იყოს:
       • ახალი მეილი → ანგარიში იქმნება ამ პაროლით.
       • უკვე არსებული, პაროლიანი მეილი → პაროლი უნდა დაემთხვეს
         (ანუ ეს არის „შესვლა" ამ ფორმის საშუალებით).
       • უკვე არსებული, მაგრამ ჯერ პაროლის-გარეშე ანგარიში (მაგ. ადრე
         მხოლოდ განცხადება/ლიდი დაუტოვებია) → ეს პაროლი ახლა ეყენება. */
  const passRaw = String(b.pass || '');
  if (!sessUser && kind === 'req' && passRaw.length < 8) return J({ error: 'weak-pass' }, 400);

  /* --- მომხმარებელი --- */
  let u = await env.DB.prepare(`SELECT * FROM users WHERE email_norm=?1`).bind(email).first();
  /* ⚠️ 2026-08-27, George-ის მოთხოვნით — GA4 `sign_up` key event-ისთვის
     კლიენტმა უნდა იცოდეს, ეს ნამდვილად ახალი ანგარიშია თუ უკვე
     არსებულის მორიგი განცხადება/მოთხოვნა. `u` ქვემოთ ორივე შემთხვევაში
     დასახლდება, ამიტომ დროშა წინასწარ ვინახავთ. */
  const isNewUser = !u;

  if (!u) {
    /* ერთი ნომერი = ერთი ანგარიში. ჰეშით ვამოწმებთ, ღია ნომრით არა. */
    if (phoneHash) {
      const dup = await env.DB.prepare(`SELECT id FROM users WHERE phone_hash=?1`)
        .bind(phoneHash).first();
      if (dup) return J({ error: 'phone-taken' }, 409);
    }
    const id = randId('u_');
    let passHash = null, passSalt = null;
    if (kind === 'req') {
      passSalt = randId('', 16);
      passHash = await hashPass(passRaw, passSalt);
    }
    await env.DB.prepare(
      `INSERT INTO users (id,email,email_norm,name,who,comp,comp_id,phone,phone_hash,phone_full,
                          pass,salt,terms_v,terms_at,sub,sub_at,created)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?14,?15,?16,?17,?13)`
    ).bind(
      id, str(b.email, 190), email, str(b.name, 90),
      b.who === 'co' ? 'co' : 'ind',
      str(b.comp, 120) || null, str(b.cid, 30) || null,
      /* ⚠️ ღიად მხოლოდ ბოლო 4 ციფრი — ამოცნობისთვის საკმარისია,
         ბაზის გაჟონვისას კი სია არავის გამოადგება. სრული ნომერი
         (phone_full) მხოლოდ ადმინის ხედვისთვისაა (users.html). */
      phone ? '••' + phone.slice(-4) : null,
      phoneHash, telShown, passHash, passSalt,
      now(), TERMS_V, now(), wantsSub ? 1 : 0, wantsSub ? now() : null
    ).run();
    u = { id, email_ok: 0, comp_ok: 0 };
  } else {
    /* პაროლი — მხოლოდ „ვეძებ"-ის გაგზავნისას მოწმდება/ეყენება, და
       მხოლოდ მაშინ, თუ სესია არ არსებობს — დალოგინებულს პაროლი აღარ
       მოეთხოვება (cookie უკვე ადასტურებს, ვინც არის). */
    if (!sessUser && kind === 'req') {
      if (!u.pass) {
        const passSalt = randId('', 16);
        const passHash = await hashPass(passRaw, passSalt);
        await env.DB.prepare(`UPDATE users SET pass=?2, salt=?3 WHERE id=?1`)
          .bind(u.id, passHash, passSalt).run();
        u.pass = passHash; u.salt = passSalt;
      } else {
        /* უკვე დაფიქსირებული პაროლი — უნდა დაემთხვეს (ეს = შესვლა).
           მცდელობებს ვზღუდავთ, თორემ ეს ველი პაროლის გამოცნობის
           არხად იქცევა. */
        if (await limited(env, 'pw:' + email, 10, 3600e3)) return J({ error: 'too-many' }, 429);
        const h = await hashPass(passRaw, u.salt || '');
        if (!safeEq(h, u.pass)) return J({ error: 'wrong-pass' }, 401);
      }
    }
    /* დაბლოკილს არაფერს ვუხსნით — მიზეზი წერილში უკვე გაეგზავნა */
    if (u.status === 'blocked') return J({ error: 'blocked' }, 403);
    /* წესების ახალ რედაქციაზე თანხმობა ხელახლა ფიქსირდება */
    if (u.terms_v !== TERMS_V) {
      await env.DB.prepare(`UPDATE users SET terms_v=?2, terms_at=?3 WHERE id=?1`)
        .bind(u.id, TERMS_V, now()).run();
    }
    /* გამოწერას მხოლოდ ვრთავთ — გამორთვა ბმულით ხდება, ფორმით არა.
       თორემ ერთი უყურადღებო ავსება ძველ არჩევანს გააუქმებდა. */
    if (wantsSub && !u.sub) {
      await env.DB.prepare(`UPDATE users SET sub=1, sub_at=?2 WHERE id=?1`)
        .bind(u.id, now()).run();
    }
    /* ნომერი ჯერ არ ჰქონია — ვამატებთ, თუ სხვას არ უჭირავს */
    if (phoneHash && !u.phone_hash) {
      const dup = await env.DB.prepare(`SELECT id FROM users WHERE phone_hash=?1 AND id<>?2`)
        .bind(phoneHash, u.id).first();
      if (dup) return J({ error: 'phone-taken' }, 409);
      await env.DB.prepare(`UPDATE users SET phone=?2, phone_hash=?3, phone_full=?4 WHERE id=?1`)
        .bind(u.id, '••' + phone.slice(-4), phoneHash, telShown).run();
    /* ⚠️ ძველი ანგარიშები, რომლებზეც phone_hash უკვე დაფიქსირდა
       phone_full-ის დამატებამდე — იმავე ნომრით ხელახლა შემოსვლისას
       მაინც ვავსებთ phone_full-ს, თორემ ადმინკაში სამუდამოდ "—" დარჩებოდა. */
    } else if (phoneHash && phoneHash === u.phone_hash && !u.phone_full) {
      await env.DB.prepare(`UPDATE users SET phone_full=?2 WHERE id=?1`)
        .bind(u.id, telShown).run();
    }
  }

  /* --- ლიმიტები: 2 მოთხოვნა / 3 განცხადება ---
     ⚠️ 2026-08-26, George-ის მოთხოვნით — გაყიდვა/გაქირავების ლიმიტი
     5-დან 3-ზე დაწიეს (მოთხოვნის 2 უცვლელი რჩება). ამის ზემოთ
     გადახდა იქნება საჭირო — გადახდის მექანიზმი ჯერ არ არის აქტიური
     (task #154), ამიტომ დღეს ზღვარს მიღწეულს უბრალოდ ვბლოკავთ
     (limit) — ისევე, როგორც აქამდე. */
  const cap = kind === 'req' ? 2 : 3;
  const used = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM ${kind === 'req' ? 'req' : 'lst'}
      WHERE user_id=?1 AND status IN ('draft','pending','active','hold')`
  ).bind(u.id).first();
  /* comp_ok — ადმინის მიერ დამტკიცებული „ულიმიტო" მომხმარებელი.
     ადრე მხოლოდ განცხადებებზე (lst) ითიშებოდა ლიმიტი — მოთხოვნაზე (req)
     ბლოკავდა მაინც. ახლა comp_ok ორივეს ხსნის. */
  if ((used?.n || 0) >= cap && !u.comp_ok)
    return J({ error: 'limit', cap }, 409);

  /* ══════════ საკადასტრო შემოწმება — სერვერზე ══════════
     კლიენტმა შეიძლება ნებისმიერი `addr` გამოგზავნოს. აქ ის არ იკითხება:
     კოდს თავიდან ვამოწმებთ და მისამართსაც რეესტრიდან ვიღებთ. */
  let cadOk = 0, cadAddr = null, cadWhy = '', cadPoly = null;
  if (kind === 'lst' && o.cad) {
    const c = await lookupCad(env, o.cad, o.lat, o.lng);
    cadOk = c.cad_ok || 0;
    cadAddr = c.addr || null;
    cadWhy = c.why || '';
    if (c.poly) cadPoly = c.poly;
  }

  /* --- ჩანაწერი --- */
  const id = randId(kind === 'req' ? 'r_' : 'l_');
  const t = now();
  const exp = t + (kind === 'req' ? 30 : 60) * 86400e3;

  if (kind === 'req') {
    const R = o.radius;
    const dLat = R / 111320, dLng = R / (111320 * Math.cos(o.lat * Math.PI / 180));
    await env.DB.prepare(
      `INSERT INTO req (id,user_id,cat,deal,period,lat,lng,radius,bn,bs,be,bw,
                        area_min,area_max,price_min,price_max,attrs,note,status,created,expires)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,'draft',?19,?20)`
    ).bind(id, u.id, o.cat, o.deal, o.period, o.lat, o.lng, R,
           o.lat + dLat, o.lat - dLat, o.lng + dLng, o.lng - dLng,
           o.amin, o.amax, o.pmin, o.pmax,
           JSON.stringify(o.attrs), o.note, t, exp).run();
  } else {
    /* საზღვარი: გამყიდველის დახაზული უპირატესია, თუ არა — რეესტრის გეომეტრია */
    const poly = o.poly || cadPoly;
    await env.DB.prepare(
      `INSERT INTO lst (id,user_id,cat,deal,period,cad,addr,cad_ok,lat,lng,poly,loc,reg,
                        area,price,ttl,dsc,photos,attrs,tel,contact_name,decl,visibility,status,src_req,created,expires)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?25,?26,'draft',?22,?23,?24)`
    ).bind(id, u.id, o.cat, o.deal, o.period,
           o.cad || null,
           cadAddr,                                   /* ← რეესტრიდან, არა ფორმიდან */
           cadOk,                                     /* ← სერვერის დასკვნა */
           o.lat, o.lng,
           poly ? JSON.stringify(poly) : null,
           o.loc, o.reg, o.area, o.price, o.ttl, o.dsc,
           JSON.stringify(o.photos), JSON.stringify(o.attrs),
           telShown, o.anon ? 'ვიზიტორი' : (str(b.name, 90) || null),
           str(b.src_req, 40) || null, t, exp, declJson, o.visibility).run();
  }

  /* --- დადასტურების კოდი / ავტო-დადასტურება (comp_ok) ---
     ⚠️ ადმინის მიერ ხელით დამტკიცებულ „ულიმიტო" (comp_ok) მომხმარებელს
     კოდის ლოდინი აღარ სჭირდება — draft პირდაპირ pending-ში გადადის,
     ზუსტად ისე, როგორც verify()-ში ხდებოდა კოდის დადასტურების შემდეგ.
     ეს უსაფრთხოებას არ არღვევს — comp_ok მხოლოდ ადმინს შეაქვს ხელით
     (users.html), თვითონ მომხმარებელს ვერ დაუყენებია. admin_new
     შეტყობინებაც აქ განზრახ არ იგზავნება იმავე მიზეზით: comp_ok-ის
     პატრონი (ადმინი) თავად ხედავს, რას ამატებს — ამან დიდი მოცულობის
     დროს (მაგ. საიტის შიგთავსით შევსება) Resend-ის დღიურ ლიმიტსაც
     ზოგავს. 2026-08-25: George-ის მოთხოვნით ჩართული, საიტის
     შიგთავსით შევსების პერიოდისთვის. */
  /* ⚠️ 2026-08-26: George-ის მოთხოვნით — ეს იგივე ავტო-დადასტურების
     გზა ახლა დალოგინებულ (sessUser) ჩვეულებრივ მომხმარებელსაც ეხსნება,
     comp_ok-ის გარდა. განსხვავებით comp_ok-ისგან: sessUser-ის შემთხვევა
     რეალური, ახალი განცხადება/მოთხოვნაა (არა ადმინის ნაყოლი) — ამიტომ
     admin_new შეტყობინება მაინც იგზავნება, უბრალოდ ელფოსტის კოდის
     მოლოდინის გარეშე, რადგან ავტორი უკვე დადასტურებული ანგარიშიდან
     წერს (cookie-ით დამტკიცებული). */
  if (compOk || sessUser) {
    const table = kind === 'req' ? 'req' : 'lst';
    const stmts = [
      env.DB.prepare(`UPDATE users SET email_ok=1 WHERE id=?1`).bind(u.id),
      env.DB.prepare(`UPDATE ${table} SET status='pending' WHERE id=?1 AND user_id=?2 AND status='draft'`)
        .bind(id, u.id)
    ];
    if (sessUser && !compOk) {
      const row = await env.DB.prepare(
        table === 'lst'
          ? `SELECT cat,deal,ttl,loc,reg,price,area FROM lst WHERE id=?1`
          : `SELECT cat,deal,price_min,price_max,area_min,area_max,radius FROM req WHERE id=?1`
      ).bind(id).first();
      if (row) {
        const summary = table === 'lst'
          ? [row.ttl, [row.loc, row.reg].filter(Boolean).join(', '),
             row.price ? '$' + row.price.toLocaleString() : '', row.area ? row.area + ' მ²' : '']
              .filter(Boolean).join(' · ')
          : [row.price_max ? '$' + (row.price_min || 0).toLocaleString() + '–$' + row.price_max.toLocaleString() : '',
             (row.area_min || row.area_max) ? (row.area_min || 0) + '–' + (row.area_max || 0) + ' მ²' : '',
             row.radius ? (row.radius >= 1000 ? (row.radius / 1000).toFixed(1) + ' კმ' : row.radius + ' მ') + ' რადიუსი' : '']
              .filter(Boolean).join(' · ');
        const tok = await approveToken(env, table, id);
        stmts.push(
          env.DB.prepare(
            `INSERT INTO mailq (user_id,to_addr,kind,payload,created) VALUES (?1,?2,'admin_new',?3,?4)`
          ).bind(u.id, 'info@mymamuli.ge', JSON.stringify({
            id, kind: table,
            cat: row.cat, deal: row.deal,
            summary, userEmail: email,
            approveUrl: tok ? `https://mymamuli.ge/api/mod?approve=${id}&kind=${table}&t=${tok}` : null,
            modLink: 'https://mymamuli.ge/mod.html'
          }), now())
        );
      }
    }
    await env.DB.batch(stmts);
    if (sessUser && !compOk) await kickMail(env);
    return J({
      ok: true, id, autoVerified: true, isNewUser,
      cad: o.cad ? { ok: cadOk, addr: cadAddr, why: cadWhy } : undefined
    });
  }

  /* crypto.getRandomValues — Math.random() პროგნოზირებადია და კოდიც მასთან ერთად. */
  const code = randCode(6);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO token (id,user_id,kind,hash,ref,ref_kind,expires,created)
       VALUES (?1,?2,'verify_email',?3,?4,?5,?6,?7)`
    ).bind(randId('t_'), u.id, await sha(code + ':' + u.id), id, kind, t + 15 * 60e3, t),
    env.DB.prepare(
      `INSERT INTO mailq (user_id,to_addr,kind,payload,created) VALUES (?1,?2,'verify',?3,?4)`
    ).bind(u.id, email, JSON.stringify({ code, id, kind }), t)
  ]);
  await kickMail(env);

  return J({
    ok: true, id, isNewUser,
    cad: o.cad ? { ok: cadOk, addr: cadAddr, why: cadWhy } : undefined,
    /* ⚠️ სატესტო რეჟიმი. ლაივზე SHOW_CODE ცვლადი უნდა წაიშალოს. */
    devCode: env.SHOW_CODE === '1' ? code : undefined
  });
}

/* ადმინის დასტურის ბმული წერილში — id+kind+ADMIN_KEY-დან წარმოებული
   ტოკენი (იხ. mod.js → approveToken). აქ დუბლირებულია — cross-import
   არ გვინდა, დანარჩენ endpoint-ებშიც (auth.js, mod.js) ასეთი პატარა
   დამხმარეები თითო ფაილშია გამეორებული. */
async function approveToken(env, kind, id) {
  if (!env.ADMIN_KEY) return '';
  return (await sha(`aprv:${kind}:${id}:${env.ADMIN_KEY}`)).slice(0, 24);
}

/* ================= კოდის დადასტურება ================= */
async function verify(env, b, ip, kick) {
  const email = normEmail(b.email);
  const code = String(b.code || '').trim();
  if (!email || !/^\d{6}$/.test(code)) return J({ error: 'bad-code' }, 400);

  /* კოდის მოსინჯვა ძვირი უნდა იყოს — IP-ზეც ვზღუდავთ */
  if (await limited(env, 'vf:' + ip, 30, 3600e3)) return J({ error: 'too-many' }, 429);

  const u = await env.DB.prepare(`SELECT id FROM users WHERE email_norm=?1`).bind(email).first();
  if (!u) return J({ error: 'wrong-code' }, 400);   /* არ ვამხელთ, არსებობს თუ არა */

  /* ══════════ მცდელობების ლიმიტი ══════════
     ადრე ტოკენს ჰეშით ვეძებდით — არასწორ კოდზე სტრიქონი არ იძებნებოდა
     და `tries` არასდროს იზრდებოდა. ე.ი. მილიონი მცდელობა უფასო იყო.
     ახლა ჯერ მომხმარებლის ბოლო ტოკენს ვპოულობთ, მერე ვადარებთ. */
  const tk = await env.DB.prepare(
    `SELECT id, hash, ref, ref_kind, expires, tries, used FROM token
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

  /* ══════════ მხოლოდ ეს ჩანაწერი ══════════
     ადრე ყველა draft ერთად გადადიოდა pending-ში. ე.ი. ერთი კოდი
     ყველა დაუდასტურებელ ჩანაწერს ხსნიდა. ახლა ტოკენს ახსოვს, რომელი. */
  const stmts = [
    env.DB.prepare(`UPDATE token SET used=1 WHERE id=?1`).bind(tk.id),
    env.DB.prepare(`UPDATE users SET email_ok=1 WHERE id=?1`).bind(u.id)
  ];
  if (tk.ref && (tk.ref_kind === 'req' || tk.ref_kind === 'lst')) {
    const table = tk.ref_kind === 'req' ? 'req' : 'lst';
    stmts.push(
      env.DB.prepare(
        `UPDATE ${table} SET status='pending' WHERE id=?1 AND user_id=?2 AND status='draft'`
      ).bind(tk.ref, u.id)
    );

    /* ═══ ადმინს ცნობა — ყოველ ახალ, დადასტურებულ (draft→pending)
       განცხადებაზე/მოთხოვნაზე. ადრე მოდერაციის რიგის შემოწმება
       მხოლოდ ხელით, პანელში შესვლით ხდებოდა — ახლა ელფოსტაც მოდის,
       ღილაკით პირდაპირ დასადასტურებლადაც (ADMIN_KEY-დან წარმოებული
       ტოკენით — ადმინის სესია არ სჭირდება). */
    const row = await env.DB.prepare(
      table === 'lst'
        ? `SELECT cat,deal,ttl,loc,reg,price,area FROM lst WHERE id=?1`
        : `SELECT cat,deal,price_min,price_max,area_min,area_max,radius FROM req WHERE id=?1`
    ).bind(tk.ref).first();
    if (row) {
      const summary = table === 'lst'
        ? [row.ttl, [row.loc, row.reg].filter(Boolean).join(', '),
           row.price ? '$' + row.price.toLocaleString() : '', row.area ? row.area + ' მ²' : '']
            .filter(Boolean).join(' · ')
        : [row.price_max ? '$' + (row.price_min || 0).toLocaleString() + '–$' + row.price_max.toLocaleString() : '',
           (row.area_min || row.area_max) ? (row.area_min || 0) + '–' + (row.area_max || 0) + ' მ²' : '',
           row.radius ? (row.radius >= 1000 ? (row.radius / 1000).toFixed(1) + ' კმ' : row.radius + ' მ') + ' რადიუსი' : '']
            .filter(Boolean).join(' · ');
      const tok = await approveToken(env, table, tk.ref);
      stmts.push(
        env.DB.prepare(
          `INSERT INTO mailq (user_id,to_addr,kind,payload,created) VALUES (?1,?2,'admin_new',?3,?4)`
        ).bind(u.id, 'info@mymamuli.ge', JSON.stringify({
          id: tk.ref, kind: table,
          cat: row.cat, deal: row.deal,
          summary, userEmail: email,
          approveUrl: tok ? `https://mymamuli.ge/api/mod?approve=${tk.ref}&kind=${table}&t=${tok}` : null,
          modLink: 'https://mymamuli.ge/mod.html'
        }), now())
      );
    }
  }
  await env.DB.batch(stmts);
  if (kick) await kick();

  /* ⚠️ 2026-08-26: George-ის მოთხოვნით — „ვეძებ"-ის დადასტურების შემდეგ
     მაძიებელი პირდაპირ შესულ მდგომარეობაში რჩება (იგივე mm_u სესია,
     რასაც /api/auth იძლევა), რომ იქვე კაბინეტში აღმოჩნდეს. lst-ზე ეს
     არ ეხება — გამყიდველს პაროლი ჯერ არ ეთხოვება. */
  let extraHeaders = {};
  if (tk.ref_kind === 'req') {
    const s = randId('', 32);
    const t2 = now();
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM token WHERE kind='user' AND expires < ?1`).bind(t2),
      env.DB.prepare(
        `INSERT INTO token (id,user_id,kind,hash,expires,created)
         VALUES (?1,?2,'user','-',?3,?4)`
      ).bind(await sha('u:' + s), u.id, t2 + SESSION_TTL, t2)
    ]);
    extraHeaders = { 'set-cookie': setUserCookie(s, SESSION_TTL / 1000) };
  }
  return J({ ok: true, id: tk.ref || null }, 200, extraHeaders);
}

/* ================= კოდის ხელახლა გაგზავნა =================
   ⚠️ ფრონტში ("კოდის თავიდან გაგზავნა" ღილაკი, form.html → paneVerify)
   აქამდე საერთოდ არაფერს აკეთებდა — მხოლოდ ღილაკის ტექსტი იცვლებოდა
   "გაიგზავნა ✓"-ზე, სერვერს არაფერი გაეგზავნებოდა. მომხმარებელს
   ეგონა ახალი კოდი მოვიდოდა, სინამდვილეში კი არც არაფერი გაგზავნილა.
   აქ ბოლო დაუდასტურებელ (draft) ჩანაწერს ვპოულობთ და იმავე ტოკენს
   ახალი კოდით ვაახლებთ — ახალ draft-ს არ ვქმნით, რომ ლიმიტს (5/2)
   ტყუილად არ მოვცილოთ. */
async function resendCode(env, b, ip, kick) {
  if (await limited(env, 'rs:' + ip, 10, 3600e3)) return J({ error: 'too-many' }, 429);
  const email = normEmail(b.email);
  if (!RE_EMAIL.test(email)) return J({ error: 'bad-email' }, 400);

  const u = await env.DB.prepare(`SELECT id FROM users WHERE email_norm=?1`).bind(email).first();
  if (!u) return J({ ok: true });   /* არ ვამხელთ, არსებობს თუ არა ანგარიში */

  const tk = await env.DB.prepare(
    `SELECT id, ref, ref_kind FROM token
      WHERE user_id=?1 AND kind='verify_email' AND used=0 AND ref IS NOT NULL
      ORDER BY created DESC LIMIT 1`
  ).bind(u.id).first();
  if (!tk || !tk.ref) return J({ ok: true });

  const code = randCode(6);
  const t = now();
  await env.DB.batch([
    env.DB.prepare(`UPDATE token SET hash=?2, tries=0, expires=?3 WHERE id=?1`)
      .bind(tk.id, await sha(code + ':' + u.id), t + 15 * 60e3),
    env.DB.prepare(
      `INSERT INTO mailq (user_id,to_addr,kind,payload,created) VALUES (?1,?2,'verify',?3,?4)`
    ).bind(u.id, email, JSON.stringify({ code, id: tk.ref, kind: tk.ref_kind }), t)
  ]);
  if (kick) await kick();

  return J({ ok: true, devCode: env.SHOW_CODE === '1' ? code : undefined });
}
