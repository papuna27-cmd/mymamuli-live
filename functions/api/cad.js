/**
 * /api/cad — საკადასტრო კოდის შემოწმება
 *
 *   GET /api/cad?code=01.10.06.010.030&lat=41.716&lng=44.783
 *
 * ფორმა ამას ავსების დროს იძახის, რომ მომხმარებელმა მაშინვე დაინახოს
 * მისამართი და საზღვარი. მაგრამ ეს **მხოლოდ ჩვენებაა** — ბაზაში
 * მნიშვნელობა /api/submit-ის საკუთარი შემოწმებიდან ჩაიწერება.
 * ე.ი. ამ პასუხის გაყალბება არაფერს აძლევს.
 */
import { J, limited } from './_util.js';
import { lookupCad, cadValid } from './_cad.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || '').trim();
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');

  if (!cadValid(code)) return J({ ok: false, why: 'კოდის ფორმატი არასწორია' }, 400);
  if (!env.DB) return J({ ok: false, why: 'ბაზა არ არის მიბმული' }, 500);

  /* რეესტრი ჩვენი რესურსი არაა — ერთი IP საათში 60-ჯერ */
  const ip = request.headers.get('cf-connecting-ip') || '0';
  if (await limited(env, 'cad:' + ip, 60, 3600e3))
    return J({ ok: false, why: 'ძალიან ბევრი მოთხოვნა — სცადე ცოტა ხანში' }, 429);

  const r = await lookupCad(env, code, lat, lng);

  return J({
    ok: !!r.addr,
    cad_ok: r.cad_ok,          /* 2 გეომეტრიით · 1 მისამართით · 0 არა */
    addr: r.addr || null,
    poly: r.poly || null,      /* [[lng,lat],…] — რუკაზე დასახაზად */
    area: r.area || null,      /* მ² — რეესტრის ოფიციალური, ან პოლიგონიდან */
    areaUnit: r.areaUnit || null,
    landType: r.landType || null, /* „ნაკვეთის ტიპი" — 2026-08-25, ავტო-შევსებისთვის */
    why: r.why || '',
    src: r.src || null
  });
}
