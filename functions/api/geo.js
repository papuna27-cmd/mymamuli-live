/**
 * /api/geo — საჯარო feed რუკისთვის
 *
 *   GET /api/geo → { lst:[...აქტიური განცხადება...], req:[...აქტიური მოთხოვნა...] }
 *
 * ავტორიზაცია არ სჭირდება — ეს არის ის მონაცემი, რასაც ნებისმიერი
 * ვიზიტორი უკვე ხედავს რუკაზე. index.html ამას ტვირთავს გვერდის
 * ჩატვირთვისას და ავსებს DATA/REQ მასივებს (რომლებიც ადრე სტატიკურად
 * ცარიელი იყო — იხ. კომენტარი index.html-ში: „რეალური მონაცემი D1
 * ბაზიდან მოვა, როცა ეს ეტაპი აშენდება").
 */
import { J, now } from './_util.js';

function safeJson(t, dflt) {
  try { const v = JSON.parse(t); return v == null ? dflt : v } catch (_) { return dflt }
}

function days(created) {
  return Math.max(0, Math.floor((now() - created) / 86400e3));
}

export async function onRequestGet({ env }) {
  if (!env.DB) return J({ lst: [], req: [] });

  const [lstRows, reqRows] = await Promise.all([
    env.DB.prepare(
      /* ⚠️ 2026-08-26, George-ის მოთხოვნით — visibility='private' განცხადება
         საერთო რუკიდან გამორიცხულია. ის მაინც რჩება 'active' და მისი
         დამთხვევის/შეტყობინების ლოგიკა (mod.js) ამაზე არ არის დამოკიდებული —
         მხოლოდ ეს, საჯარო feed, არ აჩვენებს. */
      `SELECT id, cat, deal, cad, lat, lng, poly, loc, reg, area, price, ttl, dsc,
              photos, attrs, tel, contact_name, created
         FROM lst WHERE status='active' AND visibility != 'private' ORDER BY created DESC LIMIT 500`
    ).all(),
    env.DB.prepare(
      `SELECT id, cat, deal, lat, lng, radius, bn, bs, be, bw,
              area_min, area_max, price_min, price_max, attrs, note, sent_n, created
         FROM req WHERE status='active' ORDER BY created DESC LIMIT 300`
    ).all()
  ]);

  const lst = (lstRows.results || []).map(l => {
    const photos = safeJson(l.photos, []);
    const attrs = safeJson(l.attrs, {});
    const poly = safeJson(l.poly, null);
    return {
      id: l.id, t: l.cat, kind: l.deal, k: l.cad || null,
      lat: l.lat, lng: l.lng, poly,
      loc: l.loc, reg: l.reg, a: l.area, p: l.price,
      ttl: l.ttl, desc: l.dsc, photos, img: photos[0] || null,
      attrs, tel: l.tel, own: l.contact_name || null, days: days(l.created)
    };
  });

  const req = (reqRows.results || []).map(r => {
    const attrs = safeJson(r.attrs, {});
    /* ჩარჩო — bn/bs/be/bw უკვე D1-ში დათვლილია განაცხადის დროს (submit.js) */
    const poly = [[r.bw, r.bs], [r.be, r.bs], [r.be, r.bn], [r.bw, r.bn]];
    return {
      /* rc — კატეგორია (submit.js CATS: land/house/office/…), deal — buy|rent.
         ⚠️ „purpose" (build/agri/invest/…) აქ არასდროს არსებობდა — req ცხრილს
         ასეთი სვეტი არა აქვს; ის მხოლოდ ერთი, არასდროს ჩართული UI-ის ნაშთი იყო. */
      id: r.id, rc: r.cat, deal: r.deal, poly,
      radius: r.radius || null,
      amin: r.area_min, amax: r.area_max,
      bmin: r.price_min, bmax: r.price_max,
      attrs, place: attrs.place || null,
      /* ⚠️ 2026-08-26: George-ის მოთხოვნით — მაძიებლის თავისუფალი აღწერა
         (ფორმის „რას ეძებ ზუსტად" ველი) ახლა საჯაროდ ჩანს მოთხოვნის
         ბარათზე, index.html→openReq(). ადრე note ბაზაში ინახებოდა,
         მაგრამ აქ არასდროს გამოჩნდებოდა. */
      note: r.note || '',
      offers: r.sent_n || 0, days: days(r.created)
    };
  });

  return J({ lst, req });
}
