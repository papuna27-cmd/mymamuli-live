/**
 * /api/oglisting/<l_id> — გასაყიდი/გასაქირავებელი განცხადების დინამიური OG სურათი
 * ==================================================================
 * ⚠️ 2026-09-01, George-ის მოთხოვნით ("დიზაინი ა"): Facebook-ზე
 * გაზიარებისას ახლა ჩვეულებრივი, "შიშველი" ფოტოს ნაცვლად ქვედა
 * ბრენდირებული ზოლი ჩნდება ფასით + MyMamuli.ge ლოგოთი — ზუსტად
 * ისე, როგორც მაძიებლის მოთხოვნების (r_) OG სურათს უკვე აქვს
 * (functions/api/reqmap/[id].js — task #207), მხოლოდ რუკის ნაცვლად
 * აქ თვითონ განცხადების ატვირთული ქავერ-ფოტოა საბაზო ფენა.
 *
 * აწყობა Cloudflare Image Transformations draw()-ით:
 *   1) images/mymamuli-listing-bar-1200x630.png — სტატიკური მწვანე
 *      ზოლი (ქვედა 112px) + "MyMamuli.ge" ლოგო (მარჯვნივ).
 *   2) ფასის ციფრები — თითო სიმბოლო ცალკე, წინასწარ დახატული PNG
 *      "გლიფი" (images/og-glyphs/{0-9,comma,dollar,permo,peryr}.png),
 *      გვერდიგვერდ დალაგებული ზოლის მარცხენა მხარეს.
 *
 * ⚠️ 2026-09-01 (2): პირველი ვერსია ცდილობდა ფასის ტექსტს on-the-fly
 * SVG-ით დაეხატა (/api/ogbadge?t=...), მაგრამ ლაივზე გადამოწმებისას
 * (?debug=1) აღმოჩნდა, რომ Cloudflare Image Transformations-ის draw()
 * საერთოდ არ იღებს SVG-ს ფენის წყაროდ — კომპოზიცია 415-ით ("Unsupported
 * Media Type") ეცემოდა. ამის ნაცვლად თითოეული შესაძლო სიმბოლო (0-9,
 * ",", "$", "/mo", "/yr") წინასწარაა დახატული ცალკე PNG-დ (PIL-ით,
 * Liberation Sans Bold, გამჭვირვალე ფონი) — draw()-ს მხოლოდ უკვე
 * არსებული რასტრული სურათების კომპოზიცია სჭირდება, ტექსტი კი აღარსად
 * გენერირდება request-ის დროს. ეს ზუსტად იგივე, დადასტურებულად მუშა
 * მიდგომაა, რასაც reqmap.js იყენებს (მხოლოდ წინასწარ დამზადებული
 * PNG ფენები draw()-ში).
 *
 * ⚠️ განზრახ მხოლოდ ASCII/ციფრები ბეჯში — ქართული სიტყვები (მ²,
 * წელი/თვე და ა.შ.) მხოლოდ og:title/og:description-შია, არა pixel-ებში.
 *
 * ⚠️ Safety: თუ D1-ში განცხადება ვერ მოიძებნა, ფასი არ არის, ან
 * compositing ვერ შესრულდა — ყოველთვის ბრუნდება უბრალო, დაუმუშავებელი
 * ქავერ-ფოტო (redirect), რომ FB/WhatsApp გაზიარება არასდროს გატყდეს.
 *
 * ?debug=1 — ადმინისთვის: JSON დიაგნოსტიკა.
 * ?debug=1&preview=1 — საბოლოო კომპოზიტური სურათი პირდაპირ ბრაუზერში.
 */
const SITE = 'https://mymamuli.ge';
const W = 1200, H = 630, BAR_H = 112;
const BAR_ASSET = `${SITE}/images/mymamuli-listing-bar-1200x630.png?v1`;
const FALLBACK_COVER = `${SITE}/img/land-1.jpg`;

/* წინასწარ დახატული სიმბოლოების ზომები (px) — იხ. ზემოთ კომენტარი.
   ციფრები და "$" ერთნაირი სიგანისაა (Liberation Sans Bold-ის
   მონოსპეისური ციფრები), "," ვიწროა, სუფიქსები ("/mo","/yr") კი
   ცალკე, მთლიან ერთეულადაა დახატული (არა სიმბოლო-სიმბოლო). */
const GLYPH_H = 56;
const COMMA_W = 21, DOLLAR_W = 38, MO_W = 94, YR_W = 68;
const GLYPH_DIR = `${SITE}/images/og-glyphs`;
const BADGE_LEFT = 32;                      /* ზოლის მარცხენა კიდიდან, ლოგოსთან შორს (ლოგო იწყება ~x930) */
const BADGE_TOP = (H - BAR_H) + Math.round((BAR_H - GLYPH_H) / 2);

const num = n => Number(n || 0).toLocaleString('en-US');

/* photos[0] საიტზე ან სრული https URL-ია, ან ფარდობითი /img/u/... გზა
   (იხ. functions/api/submit.js-ის ვალიდაცია) — draw()-ს/fetch()-ს
   ყოველთვის აბსოლუტური URL სჭირდება. */
function absUrl(pathOrUrl) {
  if (!pathOrUrl) return FALLBACK_COVER;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return SITE + (pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl);
}

/* "$"+num(price) სტრიქონიდან ცალკეული გლიფის draw()-ფენების სია,
   გვერდიგვერდ დალაგებული — plus, ქირაზე, ბოლოში ერთი "/mo"/"/yr"
   ცალკე გლიფი. */
function priceGlyphLayers(l) {
  if (!l.price) return [];
  const chars = ('$' + num(l.price)).split('');
  const layers = [];
  let x = BADGE_LEFT;
  for (const c of chars) {
    const name = c === ',' ? 'comma' : c === '$' ? 'dollar' : c;
    const w = c === ',' ? COMMA_W : DOLLAR_W; /* დანარჩენი (ციფრები) იგივე სიგანისაა */
    layers.push({ url: `${GLYPH_DIR}/${name}.png`, top: BADGE_TOP, left: x, width: w, height: GLYPH_H });
    x += w;
  }
  if (l.deal === 'rent') {
    const suf = l.period === 'year' ? 'peryr' : 'permo';
    const w = l.period === 'year' ? YR_W : MO_W;
    layers.push({ url: `${GLYPH_DIR}/${suf}.png`, top: BADGE_TOP, left: x, width: w, height: GLYPH_H });
  }
  return layers;
}

export async function onRequestGet({ params, request, env }) {
  const id = String(params.id || '');
  const url = new URL(request.url);
  const debug = url.searchParams.get('debug') === '1';

  if (!/^l_[a-z0-9]+$/.test(id) || !env.DB) return Response.redirect(FALLBACK_COVER, 302);

  const l = await env.DB.prepare(
    `SELECT price,deal,period,photos FROM lst WHERE id=?1 AND status='active'`
  ).bind(id).first();
  if (!l) return Response.redirect(FALLBACK_COVER, 302);

  let photos = [];
  try { photos = JSON.parse(l.photos || '[]') || [] } catch (_) {}
  const coverUrl = absUrl(photos[0]);

  /* ⚠️ 2026-09-01 (3): ბარი, ისევე როგორც reqmap.js-ის ჩარჩო-ფენა,
     ცალკე width/height-ის მითითების გარეშე დაისმება (top:0,left:0) —
     images/mymamuli-listing-bar-1200x630.png თვითონაცაა ზუსტად 1200×630
     (გამჭვირვალე ყველგან, გარდა ქვედა 112px-ისა), ანუ ჯერზე
     ემთხვევა საბოლოო canvas-ს. ცალკე {width:1200,height:112}-ის
     მითითებამ (პირველი ვერსია) draw()-ს აიძულა 1200×630 წყარო
     1200×112-ში „ჩაეტია" (fit-ის ნაგულისხმევი ქცევა aspect-ratio-ს
     ინარჩუნებს, არ ჭიმავს) — შედეგად ბარი პრაქტიკულად აღარ ჩანდა
     (ლაივზე პიქსელების პირდაპირი შემოწმებით დადასტურდა: ბარის ფერი
     ბოლო ზოლში საერთოდ არ გვხვდებოდა). */
  const drawLayers = [
    { url: BAR_ASSET, top: 0, left: 0 },
    ...priceGlyphLayers(l)
  ];

  if (debug && url.searchParams.get('preview') === '1') {
    const composed = await fetch(coverUrl, {
      cf: { image: { width: W, height: H, fit: 'cover', format: 'jpeg', quality: 85, draw: drawLayers } }
    }).catch(() => null);
    if (composed && composed.ok) return new Response(composed.body, { headers: { 'content-type': 'image/jpeg' } });
    return Response.redirect(coverUrl, 302);
  }

  if (debug) {
    const composed = await fetch(coverUrl, {
      cf: { image: { width: W, height: H, fit: 'cover', format: 'jpeg', quality: 85, draw: drawLayers } }
    }).catch(e => ({ status: 'fetch-throw:' + e, ok: false, headers: new Headers() }));
    const composedBody = composed.text ? await composed.text().catch(() => '') : '';
    return new Response(JSON.stringify({
      id, coverUrl, drawLayers,
      composed: { status: composed.status, ok: composed.ok, ctype: composed.headers.get && composed.headers.get('content-type'), body: composedBody.slice(0, 300) }
    }, null, 2), { headers: { 'content-type': 'application/json' } });
  }

  try {
    const composed = await fetch(coverUrl, {
      cf: { image: { width: W, height: H, fit: 'cover', format: 'jpeg', quality: 85, draw: drawLayers } }
    });
    if (!composed.ok) return Response.redirect(coverUrl, 302);
    return new Response(composed.body, {
      headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=3600' }
    });
  } catch (_) {
    return Response.redirect(coverUrl, 302);
  }
}
