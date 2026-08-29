/**
 * /api/reqmap/<r_id> — მაძიებლის (r_) მოთხოვნის დინამიური OG სურათი
 * ==================================================================
 * ⚠️ 2026-08-29, George-ის მოთხოვნით — ძველი ერთიანი სტატიკური
 * "ვეძებ/მყიდველი" ქავერის ნაცვლად თითოეულ მოთხოვნას თავისი, რეალური
 * რუკა + საძიებო წრე უნდა ჰქონდეს, თან მხოლოდ საკუთარი პინით (სხვა
 * განცხადება/მოთხოვნის ბუშტები არ უნდა გამოჩნდეს) — ეს ავტომატურად
 * სრულდება, რადგან რუკა ყოველ ჯერზე ნულიდან გენერირდება მხოლოდ ამ
 * ერთი პინით, არა ჩვენი ცოცხალი რუკის screenshot-ით.
 *
 * აწყობა ხდება სამი ფენით, ერთადერთი Cloudflare Image Transformations
 * draw()-ის საშუალებით (გარე compositing-სერვისის გარეშე):
 *   1) Geoapify Static Maps API — მხოლოდ საბაზო რუკა + პინი მოთხოვნის
 *      lat/lng-ზე (osm-carto სტილი, იგივე რაც ჩვენი საიტის ცოცხალი
 *      რუკაზეა — index.html-ის OSM raster ფენა).
 *   2) images/radius-circle.png — ჩვენივე დახატული, ფიქსირებული ზომის
 *      დაშტრიხული წრე, ზუსტად ჩარჩოს გამჭვირვალე ფანჯარაში ჩასამატებლად
 *      (ზუსტი პიქსელური კონტროლი — Geoapify-ის geometry=circle პარამეტრს
 *      აღმოჩნდა auto-fit ბაგი: ის ზუმ/ცენტრს არ ითვალისწინებდა და წრე
 *      ყოველთვის კადრს გადასდიოდა, დაზომილი კონკრეტულად — ამის გამო
 *      გადავედით ჩვენს, სტატიკურ, ზუსტად დაკალიბრებულ წრის სურათზე).
 *   3) ჩვენი ბრენდირებული ჩარჩო (header/footer, y:106–493
 *      გამჭვირვალეა) ეხატება ყველაფრის თავზე.
 *
 * ⚠️ 2026-08-29 (2): MapTiler-ის Static Maps API ვცადეთ, 429 იძლეოდა —
 * გავარკვიეთ, Free გეგმაზე საერთოდ არ მუშაობს (task #110-ის ძველი
 * შენიშვნა). გადავედით Geoapify-ზე (Free tier მუშაობს).
 *
 * წრის ზომა ფიქსირებულია (radius-circle.png = 800×800, დახატულია
 * cf.image draw()-ით 368×368-ზე) — ჩარჩოს 388px ფანჯარაში ზუსტად
 * 10px მარგინალით ზემოთ/ქვემოთ, George-ის მოთხოვნის მიხედვით.
 * ეს არ ცვლის რეალურ radius-ის მნიშვნელობას ვიზუალურად ზუსტად
 * (Geoapify-ის auto-fit ბაგის გამო ეს ისედაც შეუძლებელი იყო ვიზუალურ
 * სიზუსტეზე დათვლა) — მაგრამ ყოველ პოსტს აქვს საკუთარი, ინდივიდუალური
 * ლოკაცია/პინი/მოხაზული ტერიტორია, არასდროს სხვისი მოთხოვნის ბუშტი.
 *
 * თუ რამე ვერ მოხერხდა (Geoapify-ის ხარვეზი, გასაღები არ არის,
 * მოთხოვნა ვერ მოიძებნა) — ვბრუნდებით უბრალო ბრენდირებულ ჩარჩოზე
 * (რუკის გარეშე), რომ FB/WhatsApp-ისთვის სურათი არასდროს გატყდეს.
 *
 * ?debug=1 — ადმინისთვის: აბრუნებს JSON-ს დიაგნოსტიკისთვის.
 * ?debug=1&preview=1 — საბოლოო კომპოზიტური სურათი პირდაპირ (ბრაუზერში სანახავად).
 * ?debug=1&rawimg=1 — მხოლოდ Geoapify-ის საბაზო რუკა, ტესტირებისთვის.
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
/* ჩარჩოს გამჭვირვალე ფანჯრის საზღვრები (იხ. images/*-charjo.png ალფა-
   არხის გაზომვა: y=106-დან 493-მდე გამჭვირვალეა → 388px). */
const WIN_TOP = 106, WIN_H = 388;
const MARGIN = 10;                         /* George: ზედა/ქვედა მარგინალი მაქს. 10px */
const CIRCLE_D = WIN_H - MARGIN * 2;        /* 368px — წრის დიამეტრი */
const CIRCLE_TOP = WIN_TOP + MARGIN;        /* 116 */
const CIRCLE_LEFT = Math.round((W - CIRCLE_D) / 2); /* ჰორიზონტალურად ცენტრში */
const CIRCLE_ASSET = `${SITE}/images/radius-circle.png`;

/* ზუმის გამოთვლა მხოლოდ საბაზო რუკის ვიზუალური მასშტაბისთვის (რომ
   პატარა/დიდი radius-ის მოთხოვნებს ცოტათი განსხვავებული, გონივრული
   მასშტაბის რუკა ჰქონდეთ) — არა წრის ზომის კონტროლისთვის (ის
   ფიქსირებულია radius-circle.png-ით). */
function zoomForRadius(lat, radiusM) {
  const targetPx = 700; /* სავარაუდო "საინტერესო არეალის" პიქსელური ზომა */
  const metersPerPixel = (radiusM * 2) / targetPx;
  const z = Math.log2((156543.03392 * Math.cos(lat * Math.PI / 180)) / metersPerPixel);
  return Math.max(3, Math.min(19, z));
}

/* Geoapify Static Maps — მხოლოდ საბაზო რუკა + პინი (წრეს აღარ
   ვთხოვთ Geoapify-სგან — geometry=circle-ს ჩარჩო/ზუმის auto-fit
   ბაგი ჰქონდა, წრეს ჩვენ თვითონ ვხატავთ ცალკე ფენად). */
function buildMapUrl(env, lat, lng, radiusM) {
  const zoom = zoomForRadius(lat, radiusM).toFixed(2);
  const marker = `lonlat:${lng.toFixed(6)},${lat.toFixed(6)};type:awesome;color:#c8873a;size:large`;
  const params = new URLSearchParams({
    style: 'osm-carto',
    center: `lonlat:${lng.toFixed(6)},${lat.toFixed(6)}`,
    zoom,
    width: String(W),
    height: String(H),
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

  let mapUrl = buildMapUrl(env, r.lat, r.lng, r.radius || 300);

  /* ორი ფენა რუკის თავზე: (1) ჩვენი ფიქსირებული ზომის დაშტრიხული წრე,
     ზუსტად ჩარჩოს ფანჯარაში ცენტრირებული; (2) ბრენდირებული ჩარჩო. */
  const drawLayers = [
    { url: CIRCLE_ASSET, top: CIRCLE_TOP, left: CIRCLE_LEFT, width: CIRCLE_D, height: CIRCLE_D },
    { url: frameUrl, top: 0, left: 0 }
  ];

  /* debug-ონლი override — Geoapify-ის სქემის/ზუმის სწრაფი კალიბრაციისთვის,
     George-ის ხელახალი დეპლოის გარეშე: ?debug=1&testmarker=/testgeom=/testzoom=/teststyle= */
  if (debug && (url.searchParams.get('testmarker') || url.searchParams.get('testgeom') || url.searchParams.get('testzoom') || url.searchParams.get('teststyle'))) {
    const u = new URL(mapUrl);
    if (url.searchParams.get('testmarker')) u.searchParams.set('marker', url.searchParams.get('testmarker'));
    if (url.searchParams.get('testgeom')) u.searchParams.set('geometry', url.searchParams.get('testgeom'));
    if (url.searchParams.get('testzoom')) u.searchParams.set('zoom', url.searchParams.get('testzoom'));
    if (url.searchParams.get('teststyle')) u.searchParams.set('style', url.searchParams.get('teststyle'));
    mapUrl = u.toString();
  }

  /* ?preview=1 — ადმინისთვის: პირდაპირ აბრუნებს კომპოზიტურ სურათს
     (ბრაუზერში სანახავად), test-override-ებთან ერთად, JSON-ის გარეშე. */
  if (debug && url.searchParams.get('preview') === '1') {
    const composed = await fetch(mapUrl, {
      cf: { image: { width: W, height: H, fit: 'cover', draw: drawLayers } }
    }).catch(() => null);
    if (composed && composed.ok) return new Response(composed.body, { headers: { 'content-type': 'image/png' } });
    return Response.redirect(frameUrl, 302);
  }

  /* ?rawimg=1 — ადმინისთვის: Geoapify-ის სუფთა რუკის სურათი, ჩარჩოს/
     Cloudflare-ის image-transform-ის გარეშე (ზუმის ზუსტი კალიბრაციისთვის,
     Image Transformations-ის რეიტ-ლიმიტისგან დამოუკიდებლად). */
  if (debug && url.searchParams.get('rawimg') === '1') {
    const raw = await fetch(mapUrl).catch(() => null);
    if (raw && raw.ok) return new Response(raw.body, { headers: { 'content-type': raw.headers.get('content-type') || 'image/jpeg' } });
    return new Response('raw map fetch failed: ' + (raw ? raw.status : 'exception'), { status: 502 });
  }

  if (debug) {
    const test = await fetch(mapUrl).catch(e => ({ status: 'fetch-throw:' + e, ok: false, headers: new Headers() }));
    const testBody = test.text ? await test.text().catch(() => '') : '';
    const composed = await fetch(mapUrl, {
      cf: { image: { width: W, height: H, fit: 'cover', draw: drawLayers } }
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
      cf: { image: { width: W, height: H, fit: 'cover', draw: drawLayers } }
    });
    if (!composed.ok) return Response.redirect(frameUrl, 302);
    return new Response(composed.body, {
      headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=2592000, immutable' }
    });
  } catch (_) {
    return Response.redirect(frameUrl, 302);
  }
}
