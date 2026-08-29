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
 *   1) MapTiler Static Maps API — რუკის სურათი მოთხოვნის lat/lng-ზე,
 *      + დახატული წრე (path) ზუსტად radius-ის მიხედვით + პინი.
 *   2) Cloudflare-ის ჩაშენებული Image Transformations draw() —
 *      ჩვენი ბრენდირებული ჩარჩო (header/footer, y:106–493
 *      გამჭვირვალეა) ეხატება ამ რუკის თავზე ერთ საბოლოო PNG-ად.
 *
 * ზუმი ისე გამოითვლება, რომ წრე ყოველთვის ჩარჩოს ხილული ფანჯრის
 * (1200×388) ~62%-ს იკავებდეს — ანუ კიდეებს არ ეხება, მარგინალი
 * თანაბრადაა ორივე მხარეს (George-ის მოთხოვნა).
 *
 * თუ რამე ვერ მოხერხდა (MapTiler-ის ხარვეზი, გასაღები არ არის,
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

/* წრის მრავალკუთხედი (64 წვერო) — lat/lng-ში, mercator-გარეშე
   მარტივი მიახლოებით (იგივე ფორმულა, რასაც submit.js იყენებს
   მოთხოვნის ბაუნდინგ-ბოქსისთვის). */
function circlePolygon(lat, lng, radiusM, points = 64) {
  const dLat = radiusM / 111320;
  const dLng = radiusM / (111320 * Math.cos(lat * Math.PI / 180));
  const pts = [];
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * 2 * Math.PI;
    pts.push([lat + dLat * Math.sin(a), lng + dLng * Math.cos(a)]);
  }
  return pts;
}

/* ზუმის გამოთვლა — წრის დიამეტრი (მეტრებში) ზუსტად CIRCLE_PX
   პიქსელს რომ შეესაბამებოდეს ამ განედზე (Web Mercator scale). */
function zoomForRadius(lat, radiusM) {
  const metersPerPixel = (radiusM * 2) / CIRCLE_PX;
  const z = Math.log2((156543.03392 * Math.cos(lat * Math.PI / 180)) / metersPerPixel);
  return Math.max(3, Math.min(19, z));
}

function buildMapUrl(env, lat, lng, radiusM) {
  const zoom = zoomForRadius(lat, radiusM).toFixed(2);
  const poly = circlePolygon(lat, lng, radiusM);
  /* Google/MapTiler-ტიპის path სინტაქსი: fill/color/weight + lat,lng წერტილები */
  const path = 'fill:0xC8873A33|color:0xC8873AFF|weight:3|' +
    poly.map(p => p[0].toFixed(6) + ',' + p[1].toFixed(6)).join('|');
  const marker = 'color:0xC8873AFF|' + lat.toFixed(6) + ',' + lng.toFixed(6);
  const params = new URLSearchParams({ key: env.MAPTILER_KEY, path, markers: marker });
  return `https://api.maptiler.com/maps/hybrid/static/${lng.toFixed(6)},${lat.toFixed(6)},${zoom}/${W}x${H}@2x.png?${params.toString()}`;
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

  if (!env.MAPTILER_KEY) return Response.redirect(frameUrl, 302);

  const mapUrl = buildMapUrl(env, r.lat, r.lng, r.radius || 300);

  if (debug) {
    const test = await fetch(mapUrl).catch(e => ({ status: 'fetch-throw:' + e, ok: false, headers: new Headers() }));
    const composed = await fetch(mapUrl, {
      cf: { image: { width: W, height: H, fit: 'cover', draw: [{ url: frameUrl, top: 0, left: 0 }] } }
    }).catch(e => ({ status: 'fetch-throw:' + e, ok: false, headers: new Headers() }));
    return new Response(JSON.stringify({
      mapUrl: mapUrl.replace(/key=[^&]+/, 'key=***'),
      frameUrl,
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
