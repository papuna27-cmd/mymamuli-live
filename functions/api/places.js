/**
 * /api/places — დასახლებული პუნქტების ძებნა (ქალაქი/დაბა/სოფელი)
 *
 *   GET /api/places?q=<ტექსტი> → { places:[[name,lat,lng,name_en,admin1], ...] }
 *
 * George-ის მოთხოვნით (2026-08-27) — ფორმაში ადგილმდებარეობის ძებნა
 * აქამდე მხოლოდ 84 ხელით შერჩეულ ქალაქს/დაბას ეძებდა (index.html/form.html-ის
 * CITIES მასივი). ეს endpoint დამატებით მოძებნის GeoNames-ის საჯარო
 * მონაცემებიდან აშენებულ `place` ცხრილს (5373 ჩანაწერი — პრაქტიკულად
 * ყველა საქართველოს დასახლებული პუნქტი, სოფლების ჩათვლით), რომელიც
 * ცალკე იმპორტირდა D1-ში (იხ. schema.sql-ის კომენტარი `place` ცხრილთან).
 *
 * ავტორიზაცია არ სჭირდება — საჯარო საცნობარო მონაცემია.
 */
import { J, str } from './_util.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return J({ places: [] });

  const q = str(new URL(request.url).searchParams.get('q'), 60).trim();
  if (q.length < 2) return J({ places: [] });

  const like = '%' + q.replace(/[%_]/g, '') + '%';
  try {
    const rows = await env.DB.prepare(
      `SELECT name, name_en, lat, lng, admin1 FROM place
         WHERE name LIKE ?1 OR name_en LIKE ?1
         ORDER BY pop DESC LIMIT 12`
    ).bind(like).all();
    const places = (rows.results || []).map(r => [r.name, r.lat, r.lng, r.name_en, r.admin1]);
    /* 10 წუთი ქეშირდება — მონაცემი სტატიკურია, ცვლილება არ ხდება
       ხშირად, ეს ამცირებს D1 კითხვების რაოდენობას ტიპური ერთი-ორი
       სიმბოლოს ცვლილებაზე. */
    return J({ places }, 200, { 'cache-control': 'public, max-age=600' });
  } catch (_) {
    return J({ places: [] });
  }
}
