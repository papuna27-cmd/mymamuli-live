/**
 * /api/me — მომხმარებლის კაბინეტი
 *
 *   GET /api/me → მისი განცხადებები, მოთხოვნები და ნახვები
 *
 * ⚠️ მხოლოდ საკუთარი მონაცემი. user_id სესიიდან მოდის, არა მოთხოვნიდან —
 *    თორემ სხვისი ID-ის მითითებით უცხო კაბინეტი გაიხსნებოდა.
 */
import { J } from './_util.js';
import { whoami } from './auth.js';
import { CITY_SLUGS } from '../_cities.js';

const TZ = 4 * 3600e3;
const dayKey = (d = 0) => new Date(Date.now() + TZ - d * 86400e3).toISOString().slice(0, 10);

/* ⚠️ 2026-08-26: George-ის შენიშვნით — ერთი და იმავე კატეგორია+გარიგების
   მოთხოვნები ერთმანეთისგან არ განირჩეოდა (მაგ. ორივე „house · ყიდვა"
   იდენტური ჩანდა). ქალაქის დამატება (lat/lng-იდან, functions/g/[id]/
   index.js-ის იგივე ლოგიკით) გამოარჩევს. cat/deal-ის ადამიანური
   სახელი კი კლიენტს (cabinet.html) გადავეცით — LANG-ის (ka/en)
   მიხედვით სწორი ენა რომ აჩვენოს გვერდის გადატვირთვის გარეშეც. */
function nearestCityName(lat, lng) {
  if (lat == null || lng == null) return null;
  const R = 6371, toRad = x => x * Math.PI / 180;
  let best = null, bestKm = Infinity;
  for (const c of CITY_SLUGS) {
    const [, nameKa, , la, ln] = c;
    const dLat = toRad(la - lat), dLng = toRad(ln - lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(la)) * Math.sin(dLng / 2) ** 2;
    const km = 2 * R * Math.asin(Math.sqrt(a));
    if (km < bestKm) { bestKm = km; best = c }
  }
  return bestKm <= 60 && best ? { ka: best[1], en: best[2] } : null;
}

export async function onRequestGet({ request, env }) {
  const u = await whoami(request, env);
  if (!u) return J({ error: 'unauthorized' }, 401);
  if (!env.DB) return J({ error: 'no-db' }, 500);

  const today = dayKey(), week = dayKey(6), month = dayKey(29);

  const lst = await env.DB.prepare(
    `SELECT l.id, l.ttl, l.dsc, l.tel, l.contact_name, l.cat, l.deal, l.price, l.area, l.loc, l.reg,
            l.status, l.created, l.expires, l.photos, l.cad_ok, l.visibility,
            COALESCE(v.total,0) AS views,
            COALESCE((SELECT n FROM view_day d WHERE d.id=l.id AND d.day=?2),0)        AS today,
            COALESCE((SELECT SUM(n) FROM view_day d WHERE d.id=l.id AND d.day>=?3),0)  AS week,
            COALESCE((SELECT SUM(n) FROM view_day d WHERE d.id=l.id AND d.day>=?4),0)  AS month
       FROM lst l LEFT JOIN view_total v ON v.id = l.id
      WHERE l.user_id = ?1
      ORDER BY l.created DESC`
  ).bind(u.id, today, week, month).all();

  /* ⚠️ 2026-08-26: George-ის შენიშვნით — მოთხოვნებსაც (r_) ახლა აქვთ
     ნახვის მთვლელი (იხ. functions/g/[id]/index.js:requestPage). აქამდე
     req-ის query views-ს საერთოდ არ კითხულობდა, ამიტომ კაბინეტში
     ყოველთვის 0 ჩანდა — user-ს, ვისაც ძირითადად „მოთხოვნები" ჰქონდა
     (არა გასაყიდი განცხადება), მთელი აქტივობა უხილავი რჩებოდა. */
  const req = await env.DB.prepare(
    `SELECT r.id, r.cat, r.deal, r.radius, r.price_min, r.price_max, r.area_min, r.area_max,
            r.lat, r.lng, r.note, r.status, r.created, r.expires, r.sent_n, r.open_n,
            COALESCE(v.total,0) AS views,
            COALESCE((SELECT n FROM view_day d WHERE d.id=r.id AND d.day=?2),0)        AS today,
            COALESCE((SELECT SUM(n) FROM view_day d WHERE d.id=r.id AND d.day>=?3),0)  AS week
       FROM req r LEFT JOIN view_total v ON v.id = r.id
      WHERE r.user_id = ?1
      ORDER BY r.created DESC`
  ).bind(u.id, today, week).all();

  const rows = lst.results || [];
  const reqRows = (req.results || []).map(r => {
    const city = nearestCityName(r.lat, r.lng);
    return { ...r, loc_ka: city ? city.ka : null, loc_en: city ? city.en : null, lat: undefined, lng: undefined };
  });
  const pick = a => { try { return (JSON.parse(a || '[]') || [])[0] || null } catch (_) { return null } };

  /* ⚠️ 2026-08-26: George-ის შენიშვნით — hero-ს რიცხვები (განცხადება/
     აქტიური/ნახვები) მხოლოდ lst-ს (გასაყიდი განცხადებებს) ითვლიდა.
     ბევრი user-ის მთელი აქტივობა კი მოთხოვნებშია (req) — ისეთი ანგარიშისთვის
     ტოპ-ბლოკი ყოველთვის „1"-ს (ან 0-ს) აჩვენებდა, მაშინ როცა კაბინეტში
     ათობით ჩანაწერი ეწერა ქვემოთ. ახლა ჯამები ორივეს აერთიანებს. */
  return J({
    ok: true,
    user: u,
    totals: {
      listings: rows.length,
      requests: reqRows.length,
      active: rows.filter(r => r.status === 'active').length +
              reqRows.filter(r => r.status === 'active').length,
      views: rows.reduce((s, r) => s + (r.views || 0), 0) +
             reqRows.reduce((s, r) => s + (r.views || 0), 0),
      today: rows.reduce((s, r) => s + (r.today || 0), 0) +
             reqRows.reduce((s, r) => s + (r.today || 0), 0),
      week: rows.reduce((s, r) => s + (r.week || 0), 0) +
            reqRows.reduce((s, r) => s + (r.week || 0), 0)
    },
    lst: rows.map(r => ({ ...r, photo: pick(r.photos), photos: undefined })),
    req: reqRows
  });
}

/**
 * POST /api/me  {kind:'lst'|'req', id, action?}
 *
 *   action === 'edit', kind==='lst'  → სათაური/აღწერა/ფასი/საკონტაქტო ტელეფონი.
 *     გეო-მონაცემები (lat/lng/poly/cad) და ფოტოები აქედან არ იცვლება —
 *     ეს დაშვებით სცენარს არ საჭიროებს (2026-08-26, task #73 MVP).
 *   action === 'edit', kind==='req'  → ბიუჯეტი/მაქს.ფართობი/რადიუსი/შენიშვნა.
 *     კატეგორია/გარიგება/მდებარეობა აქედან არ იცვლება (2026-08-26).
 *   action არ არის მითითებული (ან 'close')  → ძველებური ქცევა: წაშლა
 *     (status='closed'), ისევე როგორც ადმინის მხრიდან (mod.js).
 *
 *   ⚠️ „აქტიური თუ არააქტიური" — George-ის მოთხოვნით რედაქტირება დაშვებულია
 *   ნებისმიერი სტატუსის (pending/active/rejected/…) ჩანაწერზე, გარდა
 *   status='closed'-ისა (უკვე წაშლილი ჩანაწერის რედაქტირება აზრს კარგავს).
 *
 * ⚠️ user_id ყოველთვის სესიიდან მოწმდება — სხვისი ჩანაწერზე წვდომა ვერ ხერხდება.
 */
export async function onRequestPost({ request, env }) {
  const u = await whoami(request, env);
  if (!u) return J({ error: 'unauthorized' }, 401);
  if (!env.DB) return J({ error: 'no-db' }, 500);

  let b = {};
  try { b = await request.json() } catch (_) {}
  const kind = b.kind === 'req' ? 'req' : (b.kind === 'lst' ? 'lst' : null);
  const id = String(b.id || '').trim();
  if (!kind || !id) return J({ error: 'bad-request' }, 400);

  const row = await env.DB.prepare(
    `SELECT id, status FROM ${kind} WHERE id=?1 AND user_id=?2`
  ).bind(id, u.id).first();
  if (!row) return J({ error: 'not-found' }, 404);

  if (b.action === 'edit') {
    if (row.status === 'closed') return J({ error: 'closed' }, 400);

    if (kind === 'lst') {
      const ttl = String(b.ttl || '').trim().slice(0, 120);
      const dsc = String(b.dsc || '').trim().slice(0, 2000);
      const price = Number(b.price) || null;
      const tel = String(b.tel || '').trim().slice(0, 40);
      const contact_name = String(b.contact_name || '').trim().slice(0, 80);
      if (!ttl) return J({ error: 'bad-title' }, 400);

      await env.DB.prepare(
        `UPDATE lst SET ttl=?1, dsc=?2, price=?3, tel=?4, contact_name=?5 WHERE id=?6 AND user_id=?7`
      ).bind(ttl, dsc, price, tel, contact_name, id, u.id).run();

      return J({ ok: true, id, edited: true });
    }

    /* kind==='req' — მოთხოვნის ბიუჯეტი/ფართობი/რადიუსი/შენიშვნა */
    const price_max = Number(b.price_max) || null;
    const area_max = Number(b.area_max) || null;
    const radius = Math.max(100, Math.min(50000, Number(b.radius) || 500));
    const note = String(b.note || '').trim().slice(0, 500);

    await env.DB.prepare(
      `UPDATE req SET price_max=?1, area_max=?2, radius=?3, note=?4 WHERE id=?5 AND user_id=?6`
    ).bind(price_max, area_max, radius, note, id, u.id).run();

    return J({ ok: true, id, edited: true });
  }

  await env.DB.prepare(
    `UPDATE ${kind} SET status='closed' WHERE id=?1 AND user_id=?2`
  ).bind(id, u.id).run();

  return J({ ok: true, id, status: 'closed' });
}
