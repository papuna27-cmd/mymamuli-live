/**
 * /api/reqmap/<r_id> — მაძიებლის (r_) მოთხოვნის დინამიური OG სურათი
 * ==================================================================
 * ⚠️ 2026-08-29, George-ის მოთხოვნით — ძველი ერთიანი სტატიკური
 * "ვეძებ/მყიდველი" ქავერის ნაცვლად თითოეულ მოთხოვნას თავისი, რეალური
 * რუკა + საძიებო წრე უნდა ჰქონდეს, თან მხოლოდ საკუთარი პინით (სხვა
 * განცხადება/მოთხოვნის ბუშტები არ უნდა გამოჩნდეს) — ეს ავტომატურად
 * სრულდება, რადგან რუკა ყოველ ჯერზე ნულიდან გენერირდება მხოლოდ ამ
 * ერთი წრით/პინით, არა ჩვენი ცოცხალი რუკის screenshot-ით.
 *
 * აწყობა ხდება ორი ფენით, გარე compositing-სერვისის გარეშე:
 *   1) Geoapify Static Maps API — რუკის სურათი მოთხოვნის lat/lng-ზე,
 *      + დახატული წრე (geometry) ზუსტად radius-ის მიხედვით + პინი.
 *   2) Cloudflare-ის ჩაშენებული Image Transformations draw() —
 *      ჩვენი ბრენდირებული ჩარჩო (header/footer, y:106–493
 *      გამჭვირვალეა) ეხატება ამ რუკის თავზე ერთ საბოლოო PNG-ად.
 *
 * ⚠️ 2026-08-29 (2): თავდაპირველად MapTiler-ის Static Maps API
 * ვცადეთ (env.MAPTILER_KEY უკვე არსებობდა — ცოცხალი ინტერაქტიული
 * რუკისთვის), მაგრამ ყოველთვის 429 აბრუნებდა. გავარკვიეთ: MapTiler-ის
 * Static Maps API საერთოდ არ შედის მათ Free გეგმაში (მხოლოდ ფასიან
 * გეგმებზეა ხელმისაწვდომი) — ეს ცნობილი ფაქტია (იხ. ძველი შენიშვნა
 * task #110-ში: "MapTiler არ გამოდგა"). ამიტომ Geoapify-ზე გადავედით,
 * რომლის Free tier-იც სპეციალურად სწორედ ამ სცენარს ფარავს.
 *
 * ზუმი ისე გამოითვლება, რომ წრე ყოველთვის ჩარჩოს ხილული ფანჯრის
 * (1200×388) ~62%-ს იკავებდეს — ანუ კიდეებს არ ეხება, მარგინალი
 * თანაბრადაა ორივე მხარეს (George-ის მოთხოვნა).
 *
 * თუ რამე ვერ მოხერხდა (Geoapify-ის ხარვეზი, გასაღები არ არის,
 * მოთხოვნა ვერ მოიძებნა) — ვბრუნდებით უბრალო ბრენდირებულ ჩარჩოზე
 * (რუკის გარეშე), რომ FB/WhatsApp-ისთვის სურათი არასდროს გატყდეს.
 *
 * ?debug=1 — ადმინისთვის: აბრუნებს JSON-ს (mapUrl გასაღების გარეშე,
 * ორივე ფენის HTTP სტატუსი) დიაგნოსტიკისთვის, სურათის ნაცვლად.
 */
const SITE = 'https://mymamuli.ge';

/* ბრენდირებული ჩარჩოები — header/footer სურათები, შუათანა y:106–493
   გამჭვირვალეა (ალფა=0). ka ვერსია George-ის დიზაინია (2026-08-29
   ატვირთული); en იგივე სტილში ჩვენ თვითონ ავაწყეთ (PIL). */
const FRAME = {
  buy: { ka: '/images/mymamuli-social-share-buy-1200x630.png', en: '/images/mymamuli-social-share-buy-en-1200x630.png' },
  rent: { ka: '/images/mymamuli-social-share-rent-1200x630.png', en: '/images/mymamuli-social-share-rent-en-1200x630.png' }
};

const W = 1200, H = 630;
/* ჩარჩოს გამჭვირვალე ფანჯრის სიმაღლე (იხ. images/*-charjo.png ალფა-
   არხის გაზომვა: y=106-დან 493-მდე გამჭვირვალეა → 388px). წრის
   დიამეტრს ამის მიმართ ვზომავთ, რომ კიდეებს არ ეხებოდეს. */
const WIN_H = 388;
const CIRCLE_PX = Math.round(WIN_H * 0.62); /* ~240px */

/* ზუმის გამოთვლა — წრის დიამეტრი (მეტრებში) ზუსტად CIRCLE_PX
   პიქსელს რომ შეესაბამებოდეს ამ განედზე (Web Mercator scale). */
function zoomForRadius(lat, radiusM) {
  const metersPerPixel = (radiusM * 2) / CIRCLE_PX;
  const z = Math.log2((156543.03392 * Math.cos(lat * Math.PI / 180)) / metersPerPixel);
  return Math.max(3, Math.min(19, z));
}

/* Geoapify Static Maps — წრეს (geometry=circle) და პინს (marker)
   თვითონ ხატავს სერვერზე ერთადერთ ამ ორ ობიექტს, ჩვენი მოთხოვნის
   მეზობელი განცხადებების ბუშტების გარეშე (ისინი საერთოდ არც კი
   იგზავნება). Free tier ამას სრულად ფარავს. */
function buildMapUrl(env, lat, lng, radiusM) {
  const zoom = zoomForRadius(lat, radiusM).toFixed(2);
  const geometry = `circle:${lng.toFixed(6)},${lat.toFixed(6)},${Math.round(radiusM)};linewidth:3;linecolor:#C8873A;fillcolor:#C8873A;fillopacity:0.15;linestyle:dashed`;
  const marker = `lonlat:${lng.toFixed(6)},${lat.toFixed(6)};type:awesome;color:#C8873A;size:large`;
  const params = new URLSearchParams({
    style: 'osm-bright-smooth',
    center: `lonlat:${lng.toFixed(6)},${lat.toFixed(6)}`,
    zoom,
    width: String(W),
    height: String(H),
    'scale-factor': '2',
    geometry,
    marker,
    apiKey: env.GEOAPIFY_KEY
  });
  return `https://maps.geoapify.com/v1/staticmap?${params.toString()}`;
}

export async function onRequestGet({ params, request, env }) {
  const id = String(params.id || '');
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'ka';
  const debug = url.searchParams.get('debug') === '1';

  const frameOnly = (dealKey) => Response.redirect(`${SITE}${FRAME[dealKey || 'buy'][lang]}`, 302);

  if (!/^r_[a-z0-9]+$/.test(id) || !env.DB) return frameOnly();

  const r = await env.DB.prepare(
    `SELECT lat,lng,radius,deal FROM req WHERE id=?1 AND status='active'`
  ).bind(id).first();
  if (!r || r.lat == null || r.lng == null) return frameOnly();

  const dealKey = r.deal === 'rent' ? 'rent' : 'buy';
  const frameUrl = `${SITE}${FRAME[dealKey][lang]}`;

  if (!env.GEOAPIFY_KEY) return Response.redirect(frameUrl, 302);

  const mapUrl = buildMapUrl(env, r.lat, r.lng, r.radius || 300);

  if (debug) {
    const test = await fetch(mapUrl).catch(e => ({ status: 'fetch-throw:' + e, ok: false, headers: new Headers() }));
    const testBody = test.text ? await test.text().catch(() => '') : '';
    const composed = await fetch(mapUrl, {
      cf: { image: { width: W, height: H, fit: 'cover', draw: [{ url: frameUrl, top: 0, left: 0 }] } }
    }).catch(e => ({ status: 'fetch-throw:' + e, ok: false, headers: new Headers() }));
    return new Response(JSON.stringify({
      mapUrl: mapUrl.replace(/apiKey=[^&]+/, 'apiKey=***'),
      frameUrl,
      rawMapBody: testBody.slice(0, 500),
      rawMap: { status: test.status, ok: test.ok, ctype: test.headers.get && test.headers.get('content-type') },
      composed: { status: composed.status, ok: composed.ok, ctype: composed.headers.get && composed.headers.get('content-type') }
    }, null, 2), { headers: { 'content-type': 'application/json' } });
  }

  try {
    const composed = await fetch(mapUrl, {
      cf: { image: { width: W, height: H, fit: 'cover', draw: [{ url: frameUrl, top: 0, left: 0 }] } }
    });
    if (!composed.ok) return Response.redirect(frameUrl, 302);
    return new Response(composed.body, {
      headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=2592000, immutable' }
    });
  } catch (_) {
    return Response.redirect(frameUrl, 302);
  }
}
