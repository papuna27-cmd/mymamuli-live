/**
 * /api/geocode — მისამართით ძებნა (OpenStreetMap Nominatim), საქართველოს ფარგლებში
 *
 *   GET /api/geocode?q=<მისამართი> → { results: [{label, lat, lng}, ...] }
 *
 * 2026-08-27, George-ის მოთხოვნით — გამყიდველის ფორმაში „სად მდებარეობს?"
 * ბიჯზე საკადასტრო კოდი აღარ არის სავალდებულო (იხ. form.html-ის
 * paneMap()/paneObj()/validate() კომენტარები). ალტერნატივად ემატება
 * არჩევითი „სრული მისამართი" ველი, რომელიც ამ endpoint-ის საშუალებით
 * ავტომატურად სვამს ნიშნულს რუკაზე (placePin()) — ხელით მონიშვნაც კვლავ
 * მუშაობს, სამივე გზა (კოდი / მისამართი / ხელით) სრულიად თანაბრად
 * არჩევითია. ცრუ/არასწორი განცხადებები მოდერაციაზე ისახება — ეს
 * ავტომატური ვალიდაციის ნაცვლად George-ის ხელით შემოწმების საქმეა.
 *
 * Nominatim (OpenStreetMap)-ის უფასო საჯარო API გამოიყენება. მათი
 * გამოყენების პირობები მოითხოვს ამომცნობ User-Agent-ს და გონივრულ
 * სიხშირეს; ბრაუზერიდან პირდაპირი მოთხოვნა არც CORS-ის მხრივაა
 * საიმედო და არც წესებთანაა შესაბამისობაში, ამიტომ სერვერი აპროქსირებს.
 */
import { J, str } from './_util.js';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

export async function onRequestGet({ request }) {
  const q = str(new URL(request.url).searchParams.get('q'), 120).trim();
  if (q.length < 4) return J({ results: [] });

  const url = NOMINATIM +
    '?format=jsonv2&addressdetails=0&limit=6&countrycodes=ge&accept-language=ka' +
    '&q=' + encodeURIComponent(q);

  try {
    const r = await fetch(url, {
      headers: {
        'user-agent': 'MyMamuli.ge property form (+https://mymamuli.ge)'
      },
      cf: { cacheTtl: 300, cacheEverything: true }
    });
    if (!r.ok) return J({ results: [] });
    const rows = await r.json().catch(() => []);
    const results = (Array.isArray(rows) ? rows : []).map(x => ({
      label: x.display_name,
      lat: parseFloat(x.lat),
      lng: parseFloat(x.lon)
    })).filter(x => Number.isFinite(x.lat) && Number.isFinite(x.lng));
    return J({ results }, 200, { 'cache-control': 'public, max-age=300' });
  } catch (_) {
    return J({ results: [] });
  }
}
