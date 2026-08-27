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
  const clean = String(pem || '')
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
async function getAccessToken(env, scopes) {
  if (!env.GOOGLE_SA_EMAIL || !env.GOOGLE_SA_PRIVATE_KEY) return null;
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
  catch (_) { return null }
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)
  );
  const jwt = unsigned + '.' + b64url(sig);

  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') +
          '&assertion=' + jwt
  });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  return j && j.access_token ? j.access_token : null;
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
