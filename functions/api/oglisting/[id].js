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
 * აწყობა Cloudflare Image Transformations draw()-ით, ორი ფენა
 * ატვირთული ფოტოს თავზე:
 *   1) images/mymamuli-listing-bar-1200x630.png — სტატიკური მწვანე
 *      ზოლი (ქვედა 112px) + "MyMamuli.ge" ლოგო (მარჯვნივ).
 *   2) /api/ogbadge — დინამიური ფასის ტექსტი (SVG, იხ. ის ფაილი),
 *      ზოლის მარცხენა მხარეს, ლოგოსთან არასდროს კვეთა (მაქს. 560px
 *      სიგანე, ლოგო იწყება ~x930-დან).
 *
 * ⚠️ განზრახ მხოლოდ ASCII ტექსტი ბეჯში (იხ. ogbadge.js-ის კომენტარი) —
 * ქართული სიტყვები (მ², წელი/თვე და ა.შ.) მხოლოდ og:title/
 * og:description-შია, არა pixel-ებში.
 *
 * ⚠️ Safety: თუ D1-ში განცხადება ვერ მოიძებნა, ფასი არ არის, ან
 * compositing ვერ შესრულდა — ყოველთვის ბრუნდება უბრალო, დაუმუშავებელი
 * ქავერ-ფოტო (redirect), რომ FB/WhatsApp გაზიარება არასდროს გატყდეს
 * (ისევე, როგორც reqmap.js-ის ფილოსოფიაა).
 *
 * ?debug=1 — ადმინისთვის: JSON დიაგნოსტიკა.
 * ?debug=1&preview=1 — საბოლოო კომპოზიტური სურათი პირდაპირ ბრაუზერში.
 */
const SITE = 'https://mymamuli.ge';
const W = 1200, H = 630, BAR_H = 112;
const BAR_ASSET = `${SITE}/images/mymamuli-listing-bar-1200x630.png?v1`;
const FALLBACK_COVER = `${SITE}/img/land-1.jpg`;

const num = n => Number(n || 0).toLocaleString('en-US');

/* photos[0] საიტზე ან სრული https URL-ია, ან ფარდობითი /img/u/... გზა
   (იხ. functions/api/submit.js-ის ვალიდაცია) — draw()-ს/fetch()-ს
   ყოველთვის აბსოლუტური URL სჭირდება. */
function absUrl(pathOrUrl) {
  if (!pathOrUrl) return FALLBACK_COVER;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return SITE + (pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl);
}

/* ASCII-ონლი ფასის ტექსტი ბეჯისთვის — საიტის ჩვეულებრივი "$"+რიცხვი
   ფორმატის იგივეა (l.price უკვე USD-ზეა აწყობილი, იხ. g/[id]/index.js),
   მხოლოდ პერიოდის სუფიქსი ("/ წელი"/"/ თვე") ჩანაცვლებულია ლათინური
   შემოკლებით ("/ yr", "/ mo"), რადგან ეს ტექსტი pixel-ებშია ჩამწერი. */
function priceBadgeText(l) {
  if (!l.price) return '';
  let t = '$' + num(l.price);
  if (l.deal === 'rent') t += l.period === 'year' ? ' / yr' : ' / mo';
  return t;
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

  const priceTxt = priceBadgeText(l);
  const drawLayers = [
    { url: BAR_ASSET, top: H - BAR_H, left: 0, width: W, height: BAR_H }
  ];
  if (priceTxt) {
    const badgeUrl = `${SITE}/api/ogbadge?t=${encodeURIComponent(priceTxt)}`;
    drawLayers.push({ url: badgeUrl, top: H - BAR_H, left: 0, width: 560, height: BAR_H });
  }

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
    return new Response(JSON.stringify({
      id, coverUrl, priceTxt, drawLayers,
      composed: { status: composed.status, ok: composed.ok, ctype: composed.headers.get && composed.headers.get('content-type') }
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
