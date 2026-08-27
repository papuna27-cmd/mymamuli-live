/**
 * Google Service Account ავტორიზაცია + GA4 Data API / Search Console API-ის
 * მინიმალური კლიენტი.
 * ==================================================================
 *
 * Node-ის `googleapis` ბიბლიოთეკა Cloudflare Workers/Pages Functions
 * გარემოში ვერ მუშაობს (Node-ის crypto/http მოდულებზეა დამოკიდებული).
 * ამიტომ JWT-ს ხელმოწერა და OAuth2-ის token-გაცვლა აქ პირდაპირ, Web
 * Crypto API-ით (SubtleCrypto) ხდება — ეს Cloudflare-ის runtime-ში
 * სტანდარტულად ხელმისაწვდომია.
 *
 * საჭირო Cloudflare Pages environment secrets (George-ის მიერ უკვე
 * დაყენებული, 2026-08-27):
 *   GOOGLE_SA_EMAIL        — service account-ის ელფოსტა (client_email)
 *   GOOGLE_SA_PRIVATE_KEY  — იგივე JSON-ის private_key ველი, PEM ფორმატში
 *
 * Service account-ს წვდომა აქვს:
 *   • GA4 property 551076700 (G-N30XKZCDCT, MyMamuli.ge Web) — Viewer
 *   • Search Console property sc-domain:mymamuli.ge — Full
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function b64url(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = '';
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const b64urlStr = s => b64url(new TextEncoder().encode(s));

/* PEM (`-----BEGIN PRIVATE KEY-----...`) → CryptoKey. RS256-ისთვის
   PKCS8 ფორმატია საჭირო — service account-ის JSON-ის private_key
   ველი ზუსტად ამ ფორმატშია. */
async function importPrivateKey(pem) {
  /* ⚠️ 2026-08-27 — თუ George-მა Cloudflare-ის secret-ში PEM ჩააკოპირა
     პირდაპირ service account-ის .json ფაილიდან (ტექსტ-რედაქტორში
     ღიად), private_key ველში ხაზების გამყოფი ნამდვილი ახალი ხაზის
     ნაცვლად ლიტერალური `\n` (უკუხაზი + ასო n, ორი ცალკე სიმბოლო)
     შეიძლება აღმოჩნდეს — JSON-ის ესქეიპინგი მხოლოდ JSON.parse-ის
     დროს იშლება, უბრალო კოპირება-ჩასმისას კი ტექსტადვე რჩება.
     ეს არავითარ whitespace-სტრიპვას არ ემორჩილება და atob()-ს
     ამტვრევს, ამიტომ პირველ რიგში პირდაპირ ვცვლით ნამდვილ ხაზის
     გადატანად. */
  const clean = String(pem || '')
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const raw = atob(clean);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return crypto.subtle.importKey(
    'pkcs8', bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );
}

/* JWT Bearer flow (RFC 7523) — service account საკუთარ თავზე ხელმოწერილ
   ტოკენს უგზავნის Google-ს და სანაცვლოდ ~1 საათიანი access_token-ს
   იღებს. კეშირება განზრახ არ არის — ეს endpoint მხოლოდ ადმინკიდან,
   იშვიათად იძახება, და გამარტივება (ყოველ მოთხოვნაზე ახალი ხელმოწერა)
   მეტი საიმედოობის ღირს, ვიდრე KV-ში ტოკენის შენახვის დამატებითი
   სირთულე. */
/* ⚠️ 2026-08-27 — ცალკე ვინახავთ ბოლო წარუმატებლობის მიზეზს (secret
   არ არსებობს / PEM ვერ დაიპარსა / Google-მა token უარყო), რომ
   admin.html-ს, `error:'auth-failed'`-ის დაჭერისას, შეეძლოს ეს
   კონკრეტული, უსაფრთხო (არავითარი გასაღების მასალის გარეშე) დეტალი
   აჩვენოს — წინააღმდეგ შემთხვევაში ყოველი წარუმატებლობა ერთნაირად
   ბუნდოვანი „auth-failed"-ივით გამოიყურება და დიაგნოსტიკა ბრმა
   ცდა-შეცდომად იქცევა. */
let LAST_AUTH_ERR = null;
export function lastAuthError() { return LAST_AUTH_ERR; }

async function getAccessToken(env, scopes) {
  LAST_AUTH_ERR = null;
  if (!env.GOOGLE_SA_EMAIL || !env.GOOGLE_SA_PRIVATE_KEY) { LAST_AUTH_ERR = 'no-secrets'; return null }
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: env.GOOGLE_SA_EMAIL,
    scope: scopes.join(' '),
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now
  };
  const unsigned = b64urlStr(JSON.stringify(header)) + '.' + b64urlStr(JSON.stringify(claim));
  let key;
  try { key = await importPrivateKey(env.GOOGLE_SA_PRIVATE_KEY) }
  catch (e) { LAST_AUTH_ERR = 'key-import-failed: ' + (e && e.message ? e.message : String(e)); return null }
  let sig;
  try {
    sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  } catch (e) { LAST_AUTH_ERR = 'sign-failed: ' + (e && e.message ? e.message : String(e)); return null }
  const jwt = unsigned + '.' + b64url(sig);

  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') +
          '&assertion=' + jwt
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    LAST_AUTH_ERR = 'token-endpoint-' + r.status + ': ' + t.slice(0, 200);
    return null;
  }
  const j = await r.json().catch(() => null);
  if (!j || !j.access_token) { LAST_AUTH_ERR = 'no-access-token-in-response'; return null }
  return j.access_token;
}

/* GA4 Data API — POST properties/{id}:runReport
   https://developers.google.com/analytics/devguides/reporting/data/v1 */
export async function gaRunReport(env, propertyId, body) {
  const token = await getAccessToken(env, ['https://www.googleapis.com/auth/analytics.readonly']);
  if (!token) return null;
  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify(body)
    }
  );
  if (!r.ok) return null;
  return r.json();
}

/* Search Console API — POST sites/{siteUrl}/searchAnalytics/query
   https://developers.google.com/webmaster-tools/v1/searchanalytics/query */
export async function gscQuery(env, siteUrl, body) {
  const token = await getAccessToken(env, ['https://www.googleapis.com/auth/webmasters.readonly']);
  if (!token) return null;
  const r = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
      body: JSON.stringify(body)
    }
  );
  if (!r.ok) return null;
  return r.json();
}
