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
import { nearestCity } from '../_geocity.js';

function safeJson(t, dflt) {
  try { const v = JSON.parse(t); return v == null ? dflt : v } catch (_) { return dflt }
}

/* ცარიელი მდებარეობის შემვსები — მხოლოდ კოორდინატიდან. */
function autoCity(l) {
  const C = nearestCity(l.lat, l.lng);
  return C ? C[1] : null;
}

function days(created) {
  return Math.max(0, Math.floor((now() - created) / 86400e3));
}

/* ⚠️ 2026-09-10 — edge-ქეში, D1-ის დღიური rows_read ლიმიტის დასაცავად.
   index.html ყოველ 5 წამში ეკითხება ამ endpoint-ს (რომ დადასტურებული
   განცხადება მაქსიმუმ 5 წამში გამოჩნდეს). აქამდე ყოველი ასეთი ზარი
   ცალკე კითხულობდა D1-ს — ანუ 10 ერთდროული ვიზიტორი = 10 წაკითხვა
   ყოველ 5 წამში. ორჯერ სწორედ ამან ამოწურა free-tier-ის 5M rows_read
   და მთელი საიტი ჩააქრო.
   ახლა პასუხი Cloudflare-ის edge-ქეშში 5 წამით ინახება: ერთი კოლოს
   ყველა ვიზიტორი ერთსა და იმავე პასუხს იღებს და D1-მდე 5 წამში
   მხოლოდ ერთი მოთხოვნა აღწევს. 5 წამი განზრახ ემთხვევა კლიენტის
   პოლინგის ინტერვალს — ანუ „მაქსიმუმ 5 წამში გამოჩნდება" წესი
   უცვლელი რჩება (უარეს შემთხვევაში 5-ის ნაცვლად ~10 წამი).
   ქეშის ნებისმიერი შეცდომა უვნებელია — try/catch-ში ვართ და
   ჩვეულებრივ, პირდაპირ D1-იდან წაკითხვაზე ვბრუნდებით. */
const EDGE_TTL = 5;

export async function onRequestGet(ctx) {
  const { env, request, waitUntil } = ctx;
  let cache = null, cacheKey = null;
  try {
    cache = caches.default;
    /* query string მნიშვნელობა არ აქვს — feed ყველასთვის ერთია.
       ქეშის გასაღები ნორმალიზებულია, რომ `?x=1`-ით ქეში არ აიცილონ. */
    cacheKey = new Request(new URL(request.url).origin + '/api/geo', { method: 'GET' });
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  } catch (_) { cache = null }

  const res = await buildFeed(env);

  if (cache && cacheKey && res.status === 200) {
    try { waitUntil(cache.put(cacheKey, res.clone())) } catch (_) {}
  }
  return res;
}

async function buildFeed(env) {
  if (!env.DB) return J({ lst: [], req: [] });

  const [lstRows, reqRows] = await Promise.all([
    env.DB.prepare(
      /* ⚠️ 2026-08-26, George-ის მოთხოვნით — visibility='private' განცხადება
         საერთო რუკიდან გამორიცხულია. ის მაინც რჩება 'active' და მისი
         დამთხვევის/შეტყობინების ლოგიკა (mod.js) ამაზე არ არის დამოკიდებული —
         მხოლოდ ეს, საჯარო feed, არ აჩვენებს. */
      `SELECT id, cat, deal, period, cad, lat, lng, poly, loc, reg, area, price, ttl, dsc,
              photos, attrs, tel, contact_name, created,
              orig_lang, ttl_tr, dsc_tr, contact_name_tr
         FROM lst WHERE status='active' AND visibility != 'private' ORDER BY created DESC LIMIT 500`
    ).all(),
    env.DB.prepare(
      `SELECT id, cat, deal, lat, lng, radius, bn, bs, be, bw,
              area_min, area_max, price_min, price_max, attrs, note, sent_n, created,
              orig_lang, note_tr
         FROM req WHERE status='active' ORDER BY created DESC LIMIT 300`
    ).all()
  ]);

  const lst = (lstRows.results || []).map(l => {
    const photos = safeJson(l.photos, []);
    const attrs = safeJson(l.attrs, {});
    const poly = safeJson(l.poly, null);
    return {
      /* ⚠️ 2026-08-27, George-ის მოთხოვნით — გარიგების ტიპი (ყიდვა/ქირავნობა)
         ახლა `deal`-ის სახელითაა (და არა `kind`) — `kind` ველი ისედაც
         გამოიყენება index.html-ში მიწის დანიშნულების ფილტრისთვის
         (agri/nonagri), და ეს ორი მნიშვნელობა ერთმანეთს ეჯახებოდა:
         ბინა/სახლი "გასაქირავებელი" განცხადებებზეც კი "kind" 'buy'/'rent'-
         ს შეიცავდა, რის გამოც ბარათზე ვერც ერთი ნამდვილად ვერ ჩანდა
         სწორად (მიწის ფილტრიც აქამდე ამის გამო ვერასდროს მუშაობდა
         რეალურად — ცალკე გამოსასწორებელია). */
      id: l.id, t: l.cat, deal: l.deal, period: l.period, k: l.cad || null,
      lat: l.lat, lng: l.lng, poly,
      /* ⚠️ 2026-09-10 — `loc`/`reg` ბაზაში ყველა აქტიურ განცხადებაზე
         NULL-ია: submit.js მათ კლიენტიდან იღებდა, ფორმა კი არ აგზავნიდა
         (იხ. functions/_geocity.js-ის თავსართი). შედეგად რუკის ბარათებზე
         მდებარეობის ნაცვლად „მდებარეობა არ არის მითითებული" ეწერა, ხოლო
         გაზიარების JSON-LD-ში `addressLocality` ცარიელი მიდიოდა.
         აქ ცარიელ `loc`-ს ვავსებთ უახლოესი ქალაქის **ქართული** სახელით —
         index.html მას ისედაც `T(o.loc)`-ით ატარებს, ეს სახელები კი
         i18n.js-ის ლექსიკონში უკვე დევს (თბილისი→Tbilisi და ა.შ.),
         ამიტომ EN რეჟიმში ავტომატურად ითარგმნება და index.html-ში
         ვერცერთი ხაზის შეცვლა არ დასჭირდა.
         ნამდვილ, ბაზაში ჩაწერილ `loc`-ს არ ვცვლით — მხოლოდ ცარიელს
         ვავსებთ, ანუ არსებული ინფორმაცია არსად იკარგება. */
      loc: l.loc || autoCity(l), reg: l.reg, a: l.area, p: l.price,
      ttl: l.ttl, desc: l.dsc, photos, img: photos[0] || null,
      attrs, tel: l.tel, own: l.contact_name || null, days: days(l.created),
      /* ⚠️ 2026-09-01, ავტომატური თარგმანი — George-ის მოთხოვნით.
         `lang` = ორიგინალის ენა (ka/en), `ttl_tr`/`desc_tr`/`own_tr` =
         Workers AI-ით ნათარგმნი საპირისპირო-ენოვანი ვერსია. კლიენტი
         (index.html) გამოაჩენს თარგმანს მხოლოდ მაშინ, თუ მიმდინარე
         LANG ≠ l.orig_lang და თარგმანი საერთოდ არსებობს — თორემ
         ორიგინალი ჩანს, როგორც აქამდე. */
      lang: l.orig_lang || 'ka',
      ttl_tr: l.ttl_tr || '', desc_tr: l.dsc_tr || '', own_tr: l.contact_name_tr || null
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
      offers: r.sent_n || 0, days: days(r.created),
      /* ⚠️ 2026-09-01, ავტომატური თარგმანი — იხ. lst-ის იგივე კომენტარი ზემოთ. */
      lang: r.orig_lang || 'ka', note_tr: r.note_tr || ''
    };
  });

  /* J() ნაგულისხმევად `no-store`-ს სვამს — აქ ის განზრახ იცვლება,
     თორემ არც edge-ქეში და არც ბრაუზერი პასუხს ვერ შეინახავს. */
  return J({ lst, req }, 200, {
    'cache-control': `public, max-age=${EDGE_TTL}`
  });
}
