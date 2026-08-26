/**
 * საერთო დამხმარე ფუნქციები — ყველა endpoint აქედან იღებს.
 * ------------------------------------------------------------------
 * აქ არის ის, რაც უსაფრთხოებას ეხება:
 *   • ID და კოდი — crypto.getRandomValues (არა Math.random)
 *   • ადმინის შემოწმება — მხოლოდ header/cookie, არასდროს URL
 *   • დროზე-მუდმივი შედარება — გასაღების გამოცნობის წინააღმდეგ
 */

/* ---------- პასუხები ---------- */
export const J = (o, s = 200, extra = {}) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...extra }
  });

export const now = () => Date.now();

/* ---------- შემთხვევითობა ---------- */
/* Math.random() პროგნოზირებადია — დადასტურების კოდისთვის არ ვარგა. */
const B32 = 'abcdefghijkmnpqrstuvwxyz23456789';   /* l,o,0,1 ამოღებულია — რომ არ აგვერიოს */

export function randId(prefix = '', len = 10) {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  let s = '';
  for (const x of a) s += B32[x % 32];
  return prefix + s;
}

/* 6-ნიშნა კოდი — თანაბარი განაწილებით, modulo-ს დახრის გარეშე */
export function randCode(digits = 6) {
  const max = 10 ** digits;
  const lim = Math.floor(0xFFFFFFFF / max) * max;   /* უარვყოფთ კიდეს — თორემ პატარა ციფრები უფრო ხშირია */
  const a = new Uint32Array(1);
  let v;
  do { crypto.getRandomValues(a); v = a[0] } while (v >= lim);
  return String(v % max).padStart(digits, '0');
}

/* ---------- ჰეშები ---------- */
export async function sha(t) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(t)));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/* ტელეფონის ნორმალიზება: მხოლოდ ციფრები, წამყვანი ნულების გარეშე.
   +995 555 12 34 56 · 995555123456 · 555123456 → ერთი და იგივე ჰეში. */
export function normPhone(t) {
  let d = String(t || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('995') && d.length > 9) d = d.slice(3);   /* ქართული — კოდის გარეშე */
  return d.replace(/^0+/, '');
}

export const normEmail = e => String(e || '').trim().toLowerCase();

/* ---------- დროზე-მუდმივი შედარება ---------- */
/* ჩვეულებრივი === პირველ განსხვავებულ სიმბოლოზე ჩერდება; დროის გაზომვით
   გასაღების ასო-ასო გამოცნობა შესაძლებელია. აქ ყოველთვის ბოლომდე მიდის. */
export function safeEq(a, b) {
  const x = String(a || ''), y = String(b || '');
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return d === 0;
}

/* ---------- ადმინის ავტორიზაცია ---------- */
/* ⚠️ გასაღები URL-ში აღარ მიიღება. მიზეზი:
   query string რჩება ბრაუზერის ისტორიაში, Referer-ში, სერვერის ლოგებში,
   Cloudflare-ის ანალიტიკაში და გაზიარებულ ბმულში. */
function cookies(request) {
  const out = {};
  for (const p of (request.headers.get('cookie') || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  }
  return out;
}

/* პირდაპირი გასაღები header-ში — ღამის Worker და სკრიპტები ამას იყენებენ */
export function adminOk(request, env) {
  if (!env.ADMIN_KEY) return false;
  return safeEq(request.headers.get('x-admin-key') || '', env.ADMIN_KEY);
}

/* სესიის cookie — ბრაუზერიდან ადმინკა ამით შედის.
   ტოკენი შემთხვევითია და ბაზაშია; თვითონ ADMIN_KEY cookie-ში არ ხვდება. */
export async function sessionOk(request, env) {
  const s = cookies(request).mm_sid;
  if (!s || !env.DB) return false;
  try {
    const row = await env.DB.prepare(
      `SELECT expires, used FROM token WHERE id=?1 AND kind='admin'`
    ).bind(await sha('sid:' + s)).first();
    return !!row && !row.used && row.expires > now();
  } catch (_) { return false }
}

/* ყველა ადმინ-endpoint ამას იძახის */
export async function authed(request, env) {
  return adminOk(request, env) || await sessionOk(request, env);
}

/* ერთი ხაზი, რომ ყველა ადმინ-endpoint ერთნაირად პასუხობდეს */
export const denied = () => J({ error: 'unauthorized' }, 401);

/* ---------- ლიმიტები ---------- */
export async function limited(env, key, max, windowMs) {
  const t = now();
  const row = await env.DB.prepare(`SELECT n, reset FROM rl WHERE k=?1`).bind(key).first();
  if (!row || row.reset < t) {
    await env.DB.prepare(
      `INSERT INTO rl (k,n,reset) VALUES (?1,1,?2)
       ON CONFLICT(k) DO UPDATE SET n=1, reset=?2`
    ).bind(key, t + windowMs).run();
    return false;
  }
  if (row.n >= max) return true;
  await env.DB.prepare(`UPDATE rl SET n=n+1 WHERE k=?1`).bind(key).run();
  return false;
}

/* ---------- შემომავალი მონაცემის გაწმენდა ---------- */
/* საკონტროლო სიმბოლოები ამოდის — ტექსტში არ ჩანს, მაგრამ
   ლოგებსა და წერილებში პრობლემას ქმნის. */
export const str = (v, max = 200) =>
  String(v == null ? '' : v)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);

export const int = (v, lo, hi) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.max(lo, Math.min(hi, n));
};

/* კოორდინატი საქართველოს საზღვრებში — სხვაგან პინი აზრს კარგავს */
export const GE = { s: 41.0, n: 43.6, w: 39.9, e: 46.8 };
export function geoOk(lat, lng) {
  const a = Number(lat), b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) &&
         a >= GE.s && a <= GE.n && b >= GE.w && b <= GE.e;
}

/* მანძილი მეტრებში — მცირე მანძილზე საკმარისად ზუსტი */
export function distM(a, b, c, d) {
  const M = 111320;
  const x = (c - a) * M, y = (d - b) * M * Math.cos(a * Math.PI / 180);
  return Math.hypot(x, y);
}
