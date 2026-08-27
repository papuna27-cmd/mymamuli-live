/**
 * საკადასტრო კოდის შემოწმება — მხოლოდ სერვერზე
 * ==================================================================
 *
 * ⚠️ რატომ არსებობს ეს ფაილი
 * ადრე შემოწმება ბრაუზერში ხდებოდა და სერვერი კლიენტს ენდობოდა:
 * თუ ფორმა `addr`-ს გამოგზავნიდა, ჩანაწერი „დადასტურებულად" ინიშნებოდა.
 * ე.ი. ნებისმიერს შეეძლო ხელით გამოეგზავნა თხოვნა და ნიშანი მიეღო.
 * ნიშანი ჩვენი მთავარი უპირატესობაა — გაყალბებადი ვერ იქნება.
 * ახლა კლიენტის `addr` და `cad_ok` **სრულად იგნორირდება**.
 *
 * ------------------------------------------------------------------
 * ⚠️ რეესტრის ხაფანგი
 * naprweb არასწორ კოდზე „ვერ ვიპოვე"-ს არ ამბობს — ფილტრს უბრალოდ
 * უგულებელყოფს და მთელ ბაზას აბრუნებს. შემოწმებული:
 *   01.10.06.010.030.01.01.9999 → total: 5 356 404
 * ამიტომ „პასუხი მოვიდა" ვერასდროს ჩაითვლება დადასტურებად.
 * გადის მხოლოდ: total მცირეა + მისამართი არსებობს + ადგილი ემთხვევა.
 *
 * ------------------------------------------------------------------
 * დადასტურების სამი დონე (ბაზაში lst.cad_ok):
 *   2 — გეომეტრია დადასტურდა: პინი ნაკვეთის საზღვრებშია. ყველაზე ძლიერი.
 *   1 — რეესტრში კოდი მოიძებნა, მისამართი ადგილს ეთანხმება. საშუალო.
 *   0 — არ დადასტურდა. მოდერატორი წყვეტს.
 */
import { distM, geoOk } from './_util.js';

const UA = 'MyMamuli.ge/1.0 (+https://mymamuli.ge)';
const TIMEOUT = 9000;
const CACHE_MS = 30 * 86400e3;          /* ნაკვეთის საზღვარი წლობით არ იცვლება */
const MAX_ROWS = 40;                    /* ამაზე მეტი = ფილტრი იგნორირდა */
const TOL_M = 200;                      /* პინი ხელით ისმება — 200 მ დაშვება */

/* ---------- კოდის ფორმატი ---------- */
/* 01.10.06.010.030 · 72.07.05.816 · 01.10.06.010.030.01.01.1006 */
/* ბინის კოდის ბოლო ნაწილი 4-ნიშნაცაა (…01.01.1006) — ამიტომ {2,4} */
const RE_CAD = /^\d{2}(\.\d{2,4}){2,7}$/;

export const cadValid = c => RE_CAD.test(String(c || '').trim());

/* ბინის სრული კოდი → კორპუსის ნაკვეთი (გეომეტრია მხოლოდ ნაკვეთს აქვს) */
export const parcelOf = c => String(c || '').trim().split('.').slice(0, 5).join('.');

/* ================= ადგილების ცნობარი ================= */
/* გეომეტრიის გარეშე მისამართს ტექსტით ვადარებთ ადგილს.
   ეს მიახლოებაა — ამიტომ მხოლოდ დონე 1-ს იძლევა, არა 2-ს. */
const PLACES = [
  ['თბილის', 41.716, 44.783, 25], ['რუსთავ', 41.545, 45.036, 12],
  ['ბათუმ', 41.645, 41.640, 15], ['ქუთაის', 42.270, 42.696, 12],
  ['ფოთ', 42.146, 41.673, 10], ['ზუგდიდ', 42.508, 41.870, 12],
  ['გორ', 41.984, 44.113, 12], ['თელავ', 41.919, 45.473, 12],
  ['ახალციხ', 41.639, 42.983, 12], ['ოზურგეთ', 41.925, 42.005, 12],
  ['ამბროლაურ', 42.521, 43.155, 12], ['მცხეთ', 41.845, 44.720, 12],
  ['დუშეთ', 42.086, 44.696, 20], ['მჭადიჯვარ', 42.083, 44.617, 12],
  ['ყაზბეგ', 42.657, 44.641, 20], ['სტეფანწმინდ', 42.657, 44.641, 20],
  ['ბორჯომ', 41.840, 43.386, 15], ['ბაკურიან', 41.749, 43.531, 10],
  ['გუდაურ', 42.478, 44.480, 10], ['სიღნაღ', 41.618, 45.921, 12],
  ['ყვარელ', 41.951, 45.815, 15], ['გურჯაან', 41.744, 45.801, 12],
  ['მარნეულ', 41.475, 44.809, 15], ['ბოლნის', 41.447, 44.538, 15],
  ['კასპ', 41.926, 44.425, 12], ['ხაშურ', 41.994, 43.601, 12],
  ['ზესტაფონ', 42.111, 43.051, 12], ['სამტრედი', 42.157, 42.336, 12],
  ['სენაკ', 42.271, 42.067, 12], ['ხობ', 42.316, 41.899, 12],
  ['მარტვილ', 42.414, 42.379, 12], ['წყალტუბ', 42.342, 42.598, 12],
  ['ჭიათურ', 42.294, 43.288, 15], ['საჩხერ', 42.343, 43.409, 15],
  ['ტყიბულ', 42.351, 42.995, 12], ['ლანჩხუთ', 42.090, 42.033, 12],
  ['ქობულეთ', 41.821, 41.779, 12], ['ხელვაჩაურ', 41.596, 41.680, 12],
  ['ქედ', 41.599, 41.940, 15], ['შუახევ', 41.630, 42.190, 15],
  ['ხულო', 41.646, 42.309, 18], ['მესტი', 43.045, 42.728, 30],
  ['ახალქალაქ', 41.404, 43.486, 18], ['ნინოწმინდ', 41.397, 43.588, 18],
  ['ადიგენ', 41.694, 42.700, 15], ['ასპინძ', 41.510, 43.251, 15],
  ['ვალ', 41.622, 42.596, 15], ['თიანეთ', 42.113, 44.968, 18],
  ['ახმეტ', 42.032, 45.208, 25], ['დედოფლისწყარო', 41.464, 46.104, 25],
  ['ლაგოდეხ', 41.824, 46.275, 18], ['საგარეჯო', 41.735, 45.334, 20],
  ['თეთრიწყარო', 41.545, 44.457, 20], ['დმანის', 41.330, 44.204, 20],
  ['წალკ', 41.594, 44.087, 22], ['გარდაბან', 41.463, 45.096, 18],
  ['ონ', 42.581, 43.446, 22], ['ცაგერ', 42.647, 42.762, 22],
  ['ლენტეხ', 42.789, 42.723, 25], ['აბაშ', 42.204, 42.201, 12],
  ['ჩხოროწყუ', 42.517, 42.114, 15], ['წალენჯიხ', 42.596, 42.070, 20],
  ['ვან', 42.084, 42.518, 15], ['ბაღდათ', 41.999, 42.827, 15],
  ['ხარაგაულ', 42.019, 43.196, 20], ['თერჯოლ', 42.181, 42.998, 12],
  ['ჩოხატაურ', 41.996, 42.244, 15], ['ყულევ', 42.183, 41.729, 10]
];

/* რეგიონები — ბოლო საშველი, დიდი დაშვებით */
const REGIONS = [
  ['მცხეთა-მთიანეთ', 42.15, 44.60, 70], ['კახეთ', 41.80, 45.70, 80],
  ['ქვემო ქართლ', 41.45, 44.60, 60], ['შიდა ქართლ', 42.00, 43.90, 60],
  ['სამცხე', 41.55, 43.10, 60], ['ჯავახეთ', 41.45, 43.50, 50],
  ['იმერეთ', 42.20, 42.90, 70], ['გურია', 42.00, 42.10, 40],
  ['აჭარ', 41.65, 41.90, 50], ['სამეგრელო', 42.40, 42.00, 70],
  ['ზემო სვანეთ', 43.00, 42.70, 60], ['რაჭა', 42.55, 43.20, 55],
  ['ლეჩხუმ', 42.65, 42.80, 45], ['სვანეთ', 42.95, 42.60, 70]
];

/* მისამართის ტექსტი ემთხვევა თუ არა პინის ადგილს */
function placeMatches(addr, lat, lng) {
  const a = String(addr || '');
  if (!a) return { ok: false, why: 'მისამართი ცარიელია' };

  for (const [name, la, ln, km] of PLACES) {
    if (!a.includes(name)) continue;
    const d = distM(lat, lng, la, ln) / 1000;
    return d <= km
      ? { ok: true, place: name, km: Math.round(d) }
      : { ok: false, why: `მისამართში „${name}" წერია, პინი კი ${Math.round(d)} კმ-ითაა დაშორებული` };
  }
  for (const [name, la, ln, km] of REGIONS) {
    if (!a.includes(name)) continue;
    const d = distM(lat, lng, la, ln) / 1000;
    return d <= km
      ? { ok: true, place: name, km: Math.round(d) }
      : { ok: false, why: `რეგიონი „${name}" პინს არ ემთხვევა (${Math.round(d)} კმ)` };
  }
  /* ადგილი ვერ ვცანით — არც დადასტურება, არც უარყოფა */
  return { ok: null, why: 'მისამართის ადგილი ვერ ამოვიცანით' };
}

/* ================= WKT ================= */
/* POLYGON((lng lat, …)) და MULTIPOLYGON(((…))) — პირველი რგოლი გვჭირდება */
export function wktRing(wkt) {
  const s = String(wkt || '');
  const m = s.match(/\(\(\s*([^()]+?)\s*\)\)/) || s.match(/\(\s*([-\d.,\s]+?)\s*\)/);
  if (!m) return null;
  const pts = [];
  for (const pair of m[1].split(',')) {
    const [a, b] = pair.trim().split(/\s+/).map(Number);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    pts.push([a, b]);
  }
  if (pts.length < 3) return null;

  /* პროექციის შემოწმება: WGS84 გრადუსებია თუ მეტრები?
     თუ რიცხვები დიდია — პროექციაა და გადაყვანას არ ვცდილობთ.
     სჯობს გეომეტრია საერთოდ არ გამოვიყენოთ, ვიდრე მცდარი დასკვნა. */
  const [x, y] = pts[0];
  if (Math.abs(x) > 180 || Math.abs(y) > 90) return null;

  /* რომელი რიცხვია გრძედი? საქართველოში lng≈40-47, lat≈41-44 —
     გადაფარვა არსებობს, ამიტომ საშუალოთი ვწყვეტთ. */
  const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const swap = my > 44.5 || (mx >= 41 && mx <= 43.7 && my > 43.7);
  return swap ? pts.map(([a, b]) => [b, a]) : pts;   /* → [lng, lat] */
}

/* წერტილი მრავალკუთხედში — სხივის მეთოდი */
function inRing(ring, lat, lng) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/* უახლოესი მანძილი საზღვრამდე — დაშვების ფარგლებში ვამოწმებთ */
function ringDist(ring, lat, lng) {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const d = segDist(lat, lng, ring[j][1], ring[j][0], ring[i][1], ring[i][0]);
    if (d < best) best = d;
  }
  return best;
}
function segDist(plat, plng, alat, alng, blat, blng) {
  const k = Math.cos(plat * Math.PI / 180) * 111320, M = 111320;
  const px = plng * k, py = plat * M;
  const ax = alng * k, ay = alat * M;
  const bx = blng * k, by = blat * M;
  const dx = bx - ax, dy = by - ay;
  const len = dx * dx + dy * dy;
  let t = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/* ნაკვეთის „საშუალო" წერტილი — მარტივი არითმეტიკული ცენტროიდი.
   ზუსტი გეომეტრიული ცენტრი არ არის (ღრმად ჩაზნექილ ფორმებზე შეიძლება
   ოდნავ გადაიხაროს), მაგრამ საკმარისად კარგია ავტომატური ნიშნულისთვის —
   inRing()-ით მაინც ვამოწმებთ, ნამდვილად ნაკვეთშია თუ არა. */
function ringCentroid(ring) {
  if (!ring || !ring.length) return null;
  let sx = 0, sy = 0;
  for (const [x, y] of ring) { sx += x; sy += y; }
  return [sx / ring.length, sy / ring.length]; /* [lng, lat] */
}

/* ბოლო წერტილი პირველს ემთხვევა? — ფართობი მოსახერხებლად */
export function ringAreaM2(ring) {
  let s = 0;
  const k = Math.cos(ring[0][1] * Math.PI / 180) * 111320, M = 111320;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    s += (ring[j][0] * k) * (ring[i][1] * M) - (ring[i][0] * k) * (ring[j][1] * M);
  }
  return Math.abs(s / 2);
}

/* ================= რეესტრთან კავშირი ================= */
async function grab(url, opt = {}) {
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), TIMEOUT);
  try {
    const r = await fetch(url, {
      ...opt,
      signal: c.signal,
      headers: { 'user-agent': UA, ...(opt.headers || {}) }
    });
    if (!r.ok) return { err: 'http-' + r.status };
    return { text: await r.text() };
  } catch (e) {
    return { err: String(e.name === 'AbortError' ? 'timeout' : e).slice(0, 80) };
  } finally { clearTimeout(timer) }
}

/* --- წყარო 1: maps.gov.ge — ერთადერთი, რომელიც გეომეტრიას იძლევა --- */
const GE_BBOX = '39.9,41.0,46.8,43.6';

async function fromMaps(code) {
  /* ⚠️ body form-urlencoded უნდა იყოს. JSON-ზე „Access Denied" ბრუნდება. */
  const r = await grab('https://maps.gov.ge/map/portal/search', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'keyword=' + encodeURIComponent(code)
  });
  if (r.err) return { err: r.err };

  let j; try { j = JSON.parse(r.text) } catch (_) { return { err: 'bad-json' } }
  const list = Array.isArray(j.result) ? j.result : [];
  if (!list.length) return { err: 'not-found' };
  /* ბევრი შედეგი = კოდი ზუსტი არაა */
  if (list.length > 5) return { err: 'ambiguous' };

  const hit = list[0];
  const addr = (hit.name || hit.descript || hit.resulttext || '').trim();
  const infoLink = (hit.details && hit.details.info_link) || null;

  let ring = hit.shape_wkt ? wktRing(hit.shape_wkt) : null;
  const gl = hit.details && hit.details.geometry_link;
  let glFetch = null;
  if (!ring && gl) {
    const g = await grab(gl + (gl.includes('?') ? '&' : '?') + 'lang=ka&bbox=' + GE_BBOX);
    if (!g.err) {
      ring = wktRing(g.text);
      glFetch = { len: (g.text || '').length, sample: (g.text || '').slice(0, 220), parsed: !!ring };
    } else {
      glFetch = { err: g.err };
    }
  }
  /* ⚠️ 2026-08-26, დროებითი დიაგნოსტიკა (George-ის მოთხოვნით) — ვცდილობთ
     გავარკვიოთ, რატომ არ ბრუნდება geometry (ring) რეალურ კოდებზე, თუმცა
     მისამართი (addr) ყოველთვის სწორად მოიძებნება. ეს ველი ქეშშიც შედის
     (cachePut ამ მთელ ობიექტს ინახავს), ასე რომ D1-ის `cad` ცხრილიდან
     პირდაპირ ჩანს, hit-ს რეალურად რა ველები ჰქონდა. საჯარო API-ს
     (/api/cad) პასუხში ეს არ გადის — მხოლოდ შიდა დიაგნოსტიკისთვისაა.
     ამოსაშლელია, როცა root cause გამოირკვევა. */
  const _debug = {
    hitKeys: Object.keys(hit || {}),
    hasShapeWkt: !!hit.shape_wkt,
    shapeWktSample: hit.shape_wkt ? String(hit.shape_wkt).slice(0, 150) : null,
    detailsKeys: hit.details ? Object.keys(hit.details) : null,
    geometryLink: gl || null,
    glFetch
  };
  return { addr, ring, src: 'maps.gov.ge', infoLink, _debug };
}

/* --- maps.gov.ge — ობიექტის „ბარათი" (getinfo.alpha) ---
   ⚠️ 2026-08-25: George-ის მოთხოვნით — search-ის პასუხი (fromMaps) მხოლოდ
   მოკლე მისამართს/გეომეტრიას იძლევა. details.info_link კი ცალკე გვერდზე
   მიგვიყვანს, სადაც ოფიციალურად ჩანს: საკადასტრო კოდი, ობიექტის/ნაკვეთის
   ტიპი (მაგ. „სასოფლო-სამეურნეო"), ზუსტი მისამართი, საკუთრების ტიპი და
   ფართობი (რეგისტრირებული, არა ჩვენი პოლიგონიდან გამოთვლილი მიახლოება).
   ეს გვაძლევს საშუალებას ფორმაში ავტომატურად შევავსოთ ფართობი/მისამართი/
   დანიშნულება — არა მხოლოდ ვაჩვენოთ, არამედ პირდაპირ ველებში ჩავწეროთ. */
async function fromMapsInfo(infoLink) {
  if (!infoLink) return null;
  const r = await grab('https://maps.gov.ge' + infoLink);
  if (r.err) return null;
  const t = r.text;

  const pairs = {};
  const reLabel = /text-sm text-gray-600">([^<]+)<\/div>\s*<div class[^>]*text-gray-800[^>]*>\s*([^<]+?)\s*<\/div>/g;
  let m;
  while ((m = reLabel.exec(t))) pairs[m[1].trim()] = m[2].trim();

  let area = null, areaUnit = null;
  const am = t.match(/text-sm text-gray-600">ფართობი<\/div>\s*<div class[^>]*>\s*([\d.,]+)\s*<span[^>]*>\s*([^<]+?)\s*<\/span>/);
  if (am) { area = parseFloat(am[1].replace(',', '.')); areaUnit = am[2].trim() }

  return {
    addr: pairs['მისამართი'] || null,
    landType: pairs['ნაკვეთის ტიპი'] || pairs['ობიექტის ტიპი'] || null,
    ownership: pairs['საკუთრების ტიპი'] || null,
    area, areaUnit
  };
}

/* --- წყარო 2: naprweb — ბინის დონემდე წვდება, გეომეტრია არ აქვს --- */
async function fromNapr(code) {
  const r = await grab('https://naprweb.reestri.gov.ge/api/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      page: 1, search: '', regno: '', datefrom: null, dateto: null,
      person: '', address: '', cadcode: code
    })
  });
  if (r.err) return { err: r.err };

  let j; try { j = JSON.parse(r.text) } catch (_) { return { err: 'bad-json' } }
  const rows = Array.isArray(j.applist) ? j.applist : [];
  const total = Number(j.total) || rows.length;

  /* ══ ხაფანგის დაცვა ══
     არასწორ კოდზე ფილტრი იგნორირდება და მთელი ბაზა ბრუნდება. */
  if (total > MAX_ROWS) return { err: 'filter-ignored', total };
  if (!rows.length) return { err: 'not-found' };

  const withAddr = rows.find(x => x && x.address && String(x.address).trim());
  if (!withAddr) return { err: 'no-address' };

  return { addr: String(withAddr.address).trim(), total, src: 'naprweb' };
}

/* ================= ქეში ================= */
async function cacheGet(env, code) {
  try {
    const row = await env.DB.prepare(
      `SELECT payload, fetched FROM cad WHERE code=?1`
    ).bind(code).first();
    if (!row || row.fetched < Date.now() - CACHE_MS) return null;
    return JSON.parse(row.payload);
  } catch (_) { return null }
}
async function cachePut(env, code, data) {
  try {
    await env.DB.prepare(
      `INSERT INTO cad (code,payload,fetched) VALUES (?1,?2,?3)
       ON CONFLICT(code) DO UPDATE SET payload=?2, fetched=?3`
    ).bind(code, JSON.stringify(data), Date.now()).run();
  } catch (_) { /* ქეშის გაუმართაობა შემოწმებას არ აჩერებს */ }
}

/* ==================================================================
 * მთავარი ფუნქცია
 * ------------------------------------------------------------------
 * lookupCad(env, code, lat, lng)
 *   → { cad_ok, addr, poly, area, areaUnit, landType, src, why, cached }
 * cad_ok: 2 გეომეტრიით · 1 მისამართით · 0 არ დადასტურდა
 * area/areaUnit/landType — 2026-08-25: getinfo.alpha-დან, ფორმის
 * ავტომატური შევსებისთვის (ფართობი, დანიშნულება). შეიძლება იყოს null.
 * ================================================================== */
export async function lookupCad(env, codeRaw, lat, lng) {
  const code = String(codeRaw || '').trim();
  if (!cadValid(code)) return { cad_ok: 0, why: 'კოდის ფორმატი არასწორია' };

  const parcel = parcelOf(code);

  /* ქეშში მხოლოდ რეესტრის პასუხი ინახება — ადგილთან შედარება ყოველ ჯერზე ხდება,
     რადგან პინი სხვადასხვაა. */
  let reg = await cacheGet(env, code);
  const cached = !!reg;

  if (!reg) {
    reg = await fromMaps(parcel);
    if (reg.err || !reg.addr) {
      const n = await fromNapr(code);
      if (!n.err) reg = n;
      else if (parcel !== code) {
        const n2 = await fromNapr(parcel);
        if (!n2.err) reg = n2;
      }
    }

    /* ⚠️ 2026-08-25: George-ის მოთხოვნით — დამატებითი ატრიბუტები
       (ფართობი, ზუსტი მისამართი, ნაკვეთის/ობიექტის ტიპი) getinfo.alpha
       „ბარათიდან". geometry (ring) კვლავ პარცელის (5-სეგმენტიანი) კოდით
       ვეძებთ — მხოლოდ პარცელს აქვს საზღვრის კონტური. მაგრამ თუ შეყვანილი
       კოდი პარცელზე დაწვრილებითია (მაგ. ბინის/ფართის სრული კოდი), ცალკე
       ვეძებთ ზუსტად ამ კოდით, რომ კონკრეტული ერთეულის (და არა მთელი
       კორპუსის) საკუთარი ფართობი/მისამართი ავიღოთ. */
    if (reg && !reg.err && reg.src === 'maps.gov.ge') {
      let infoLink = reg.infoLink;
      if (code !== parcel) {
        const full = await fromMaps(code);
        if (full && !full.err && full.infoLink) infoLink = full.infoLink;
      }
      if (infoLink) {
        const info = await fromMapsInfo(infoLink);
        if (info) {
          if (info.addr) reg.addr = info.addr;
          if (info.area != null) { reg.regArea = info.area; reg.regAreaUnit = info.areaUnit }
          if (info.landType) reg.landType = info.landType;
        }
      }
    }

    if (reg && !reg.err && reg.addr) await cachePut(env, code, reg);
  }

  if (!reg || reg.err || !reg.addr) {
    return {
      cad_ok: 0,
      why: reg && reg.err === 'filter-ignored'
        ? 'რეესტრმა ფილტრი უგულებელყო — ე.ი. ასეთი კოდი არ არსებობს'
        : 'რეესტრში ვერ მოიძებნა',
      err: reg && reg.err
    };
  }

  const out = {
    addr: reg.addr, src: reg.src, cached,
    poly: null,
    /* რეესტრში ოფიციალურად დაფიქსირებული ფართობი (getinfo.alpha) ყოველთვის
       წინ უსწრებს ჩვენ მიერ პოლიგონის კოორდინატებიდან გამოთვლილ მიახლოებას —
       იხ. ქვემოთ, დონე 2-ში, სადაც მხოლოდ regArea-ს არარსებობისას ვითვლით. */
    area: reg.regArea != null ? reg.regArea : null,
    areaUnit: reg.regAreaUnit || null,
    landType: reg.landType || null,
    cad_ok: 0, why: ''
  };

  /* --- დონე 2: გეომეტრია --- */
  if (reg.ring) {
    const ring = reg.ring;
    out.poly = ring;
    if (out.area == null) out.area = Math.round(ringAreaM2(ring));

    if (geoOk(lat, lng)) {
      if (inRing(ring, +lat, +lng)) {
        out.cad_ok = 2; out.why = 'პინი ნაკვეთის საზღვრებშია';
        return out;
      }
      const d = Math.round(ringDist(ring, +lat, +lng));
      if (d <= TOL_M) {
        out.cad_ok = 2; out.why = `პინი საზღვრიდან ${d} მ-შია`;
        return out;
      }
      out.cad_ok = 0;
      out.why = `პინი ნაკვეთს არ ემთხვევა — ${d > 1000 ? Math.round(d / 100) / 10 + ' კმ' : d + ' მ'} დაშორებით`;
      return out;
    }

    /* ⚠️ 2026-08-26: George-ის მოთხოვნით — თუ ნიშნული საერთოდ არ არის
       მოწოდებული (ახალი გამარტივებული ნაკადი: მომხმარებელი ჯერ კოდს
       წერს, ნიშნულს ხელით საერთოდ არ სვამს), მაგრამ გეომეტრია რეესტრიდან
       გვაქვს — ვთავაზობთ ნაკვეთის ცენტროიდს ავტომატურ ნიშნულად. ეს
       cad_ok=2-ის იგივე დონის სანდოობაა (გეომეტრიულად გარანტირებული),
       უბრალოდ წყარო ხელით დასმა კი არა, ავტომატური შემოთავაზებაა
       (`out.auto=true` — ფორმას შეუძლია ამის მიხედვით სხვა ტექსტი
       აჩვენოს). თუ კოდს გეომეტრია არ ახლავს (მხოლოდ ტექსტური მისამართი,
       იხ. ქვემოთ დონე 1), ავტომატური განთავსება ტექნიკურად შეუძლებელია —
       იქ ფორმა კვლავ ხელით დასმას ითხოვს. */
    const c = ringCentroid(ring);
    if (c && inRing(ring, c[1], c[0])) {
      out.lat = c[1]; out.lng = c[0];
      out.cad_ok = 2; out.auto = true;
      out.why = 'ნიშნული ავტომატურად დაისვა ნაკვეთის ცენტრში';
      return out;
    }
    /* ცენტროიდი ღრმად ჩაზნექილ ფორმაზე ზოგჯერ თვითონ ნაკვეთს გარეთ
       მოხვდება — ბოლო საშველად პირველივე წვეროს ვიღებთ, ის ყოველთვის
       ზუსტად საზღვარზეა. */
    if (ring[0]) {
      out.lat = ring[0][1]; out.lng = ring[0][0];
      out.cad_ok = 2; out.auto = true;
      out.why = 'ნიშნული ავტომატურად დაისვა ნაკვეთის საზღვარზე';
      return out;
    }
  }

  /* --- დონე 1: მისამართი --- */
  const p = placeMatches(reg.addr, +lat, +lng);
  if (p.ok === true) { out.cad_ok = 1; out.why = `მისამართი ადგილს ეთანხმება (${p.place})` }
  else if (p.ok === false) { out.cad_ok = 0; out.why = p.why }
  else { out.cad_ok = 0; out.why = p.why + ' — მოდერატორი შეამოწმებს' }
  return out;
}
