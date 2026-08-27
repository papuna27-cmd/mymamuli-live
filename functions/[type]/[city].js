/**
 * /{type}/{city} — ქალაქის + კატეგორიის SEO ლენდინგ-გვერდი
 * ==================================================================
 * მაგ: /land-for-sale/tbilisi, /apartments-for-sale/batumi,
 *      /commercial-property/kutaisi, /real-estate/gori
 *
 * რატომ სჭირდება: ჩვენი მთავარი გვერდი ერთი დიდი, JS-ით ამოქმედებული
 * რუკაა — "დან, "საკადასტრო რუკაზე" ტიპის ზოგადი საძიებო
 * მოთხოვნებისთვის კარგია, მაგრამ "იყიდება მიწა თბილისში" ტიპის
 * ვიწრო, კონკრეტული ძებნისთვის Google-ს ცალკე, წმინდა HTML,
 * წინასწარ-რენდერილი გვერდი სჭირდება — მაგ ერთი მძიმე JS/რუკის
 * ბუნდლის გარეშე, სწრაფი და მარტივი crawl-ისთვის.
 *
 * ცარიელი კომბინაცია (0 აქტიური განცხადება) მაინც აჩვენებს ნამდვილ
 * გვერდს (200, არა redirect/404) — უბრალოდ noindex,follow-ით, რომ
 * Google თხელ/ცარიელ გვერდებს არ დაუნდობდეს ინდექსში, მაგრამ ბმულებს
 * მაინც გაჰყვეს. sitemap.xml-ში მხოლოდ >0 შედეგიანი კომბინაცია ხვდება
 * (იხ. sitemap.xml.js).
 */
import { CITY_SLUGS } from '../_cities.js';
import { cityLocative } from '../_city_locative.js';

const SITE = 'https://mymamuli.ge';
const CATN = {
  flat: 'ბინები', house: 'სახლები', cottage: 'კოტეჯები', office: 'საოფისე ფართები',
  comm: 'კომერციული ფართები', hotel: 'სასტუმროები', resto: 'რესტორნები / ბარები',
  base: 'სარდაფები', land: 'მიწის ნაკვეთები', invest: 'საინვესტიციო მიწა',
  garage: 'ავტოფარეხები', parking: 'პარკინგები', villa: 'აგარაკები'
};

/* TYPE slug → {cat|null (ყველა), deal|null (ორივე), label ქართულად} */
const TYPE_MAP = {
  'land-for-sale':        { cat: 'land', deal: 'buy',  label: 'გასაყიდი მიწის ნაკვეთები' },
  'apartments-for-sale':  { cat: 'flat', deal: 'buy',  label: 'გასაყიდი ბინები' },
  'houses-for-sale':      { cat: 'house', deal: 'buy', label: 'გასაყიდი სახლები' },
  'commercial-property':  { cat: 'comm', deal: null,   label: 'კომერციული ფართები' },
  'real-estate':          { cat: null, deal: null,     label: 'უძრავი ქონება' }
};

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = n => Number(n || 0).toLocaleString('en-US');
const PAGE_SIZE = 20;

function notFound() {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex,follow">` +
    `<title>გვერდი ვერ მოიძებნა — MyMamuli.ge</title>` +
    `<body style="font:16px -apple-system,sans-serif;text-align:center;padding:80px 20px">` +
    `<h1>გვერდი ვერ მოიძებნა</h1><p><a href="/">← მთავარზე დაბრუნება</a></p></body>`,
    { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

export async function onRequestGet({ params, request, env }) {
  const typeSlug = String(params.type || '');
  const citySlug = String(params.city || '');
  const T = TYPE_MAP[typeSlug];
  const C = CITY_SLUGS.find(c => c[0] === citySlug);
  /* ⚠️ 2026-08-25: ROOT CAUSE ფიქსი — Cloudflare Pages-ის ფაილურ
     როუტინგში [type]/[city].js ყველა ორ-სეგმენტიან URL-ს იჭერს
     (/:type/:city), მათ შორის ისეთებსაც, რაც სულაც არ არის SEO
     ლენდინგი: /og/default.jpg (type=og, city=default.jpg),
     /icons/icon-192.png, /img/land-1.jpg და ა.შ. — ესენი ნამდვილი,
     უკვე ატვირთული სტატიკური ფაილებია, უბრალოდ ორსეგმენტიანი გზით.
     აქამდე notFound()-ს ვაბრუნებდით ამ შემთხვევაშიც, ანუ ეს ფაილები
     დეპლოიდში რეალურად არსებობდნენ (Cloudflare-ის დეშბორდზეც ჩანდნენ),
     მაგრამ URL-ზე არასდროს იტვირთებოდნენ — ეს იყო FB-ზე OG სურათის
     და PWA აიქონების გაუჩინარების ნამდვილი მიზეზი, არა deploy/cache
     პრობლემა. სწორი ქცევა: თუ ეს ნამდვილად SEO კომბინაცია არაა,
     მოთხოვნა სტატიკურ ასეტების სერვერს გადავცეთ (env.ASSETS.fetch) —
     თუ იქ ნამდვილად არაფერია, თვითონ Cloudflare დააბრუნებს საიტის
     ნამდვილ 404.html-ს, ისე რომ ნამდვილი სტატიკური ფაილები აღარ
     დაზარალდება. */
  if (!T || !C) return env.ASSETS.fetch(request);
  if (!env.DB) return notFound();

  const [, cityKa] = C;
  const cityLoc = cityLocative(citySlug, cityKa); /* "თბილისში", "ბათუმში" — არა ბრმად "+ ში" */
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  /* loc/reg თავისუფალი ტექსტია (მომხმარებელი წერს/საკადასტრო რეესტრიდან
     მოდის) — ზუსტი toString-შედარება ხშირად გამოტოვებდა ნამდვილ
     ჩანაწერებს (მაგ. "თბილისი, საბურთალო"), ამიტომ LIKE-ით ვეძებთ. */
  const like = `%${cityKa}%`;
  const clauses = [`status='active'`, `(loc LIKE ?1 OR reg LIKE ?1)`];
  const binds = [like];
  if (T.cat) { clauses.push(`cat=?${binds.length + 1}`); binds.push(T.cat); }
  if (T.deal) { clauses.push(`deal=?${binds.length + 1}`); binds.push(T.deal); }
  const where = clauses.join(' AND ');

  let total = 0, rows = [];
  try {
    const cnt = await env.DB.prepare(`SELECT COUNT(*) n FROM lst WHERE ${where}`).bind(...binds).first();
    total = cnt ? cnt.n : 0;
    if (total > 0) {
      const r = await env.DB.prepare(
        `SELECT id,cat,deal,loc,reg,area,price,ttl,photos,created FROM lst WHERE ${where}
         ORDER BY created DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`
      ).bind(...binds).all();
      rows = r.results || [];
    }
  } catch (_) { /* ცარიელი სია გატეხილ გვერდზე ჯობია */ }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const title = `${T.label} ${cityLoc} | MyMamuli.ge`;
  const desc = total > 0
    ? `${T.label.toLowerCase()} ${cityLoc} — ${total} აქტიური განცხადება საკადასტრო რუკაზე, შუამავლების გარეშე.`
    : `${T.label} ${cityLoc} — ახალი განცხადებები რეგულარულად ემატება. იხილე ყველა აქტიური განცხადება რუკაზე.`;
  const canonical = `${SITE}/${typeSlug}/${citySlug}${page > 1 ? '?page=' + page : ''}`;
  const robots = total > 0 ? 'index,follow' : 'noindex,follow';

  const cards = rows.map(l => {
    let photos = []; try { photos = JSON.parse(l.photos || '[]') || [] } catch (_) {}
    const cover = photos[0] || `${SITE}/img/land-1.jpg`;
    const priceTxt = l.price ? '$' + num(l.price) : '';
    const areaTxt = l.area ? num(l.area) + ' მ²' : '';
    return `<a class="card" href="/g/${esc(l.id)}/">
      <img src="${esc(cover)}" alt="${esc(l.ttl || cityKa)}" loading="lazy" width="320" height="200">
      <div class="cb"><b>${esc(priceTxt)}</b><span>${esc(l.ttl || (CATN[l.cat] || l.cat))}</span>
      <small>${esc([l.loc, l.reg].filter(Boolean).join(', '))}${areaTxt ? ' · ' + esc(areaTxt) : ''}</small></div>
    </a>`;
  }).join('');

  /* სხვა კატეგორიები იმავე ქალაქზე + ეს კატეგორია სხვა ქალაქებში —
     შიდა crawlable ბმულები (Audit 4.4/6). ტოპ 8 ქალაქი ტირით. */
  const otherTypes = Object.entries(TYPE_MAP).filter(([s]) => s !== typeSlug)
    .map(([s, t]) => `<a href="/${s}/${citySlug}">${esc(t.label)} ${esc(cityLoc)}</a>`).join('');
  const otherCities = CITY_SLUGS.filter(c => c[0] !== citySlug && c[5] === 1).slice(0, 10)
    .map(c => `<a href="/${typeSlug}/${c[0]}">${esc(T.label)} ${esc(cityLocative(c[0], c[1]))}</a>`).join('');

  const pager = pages > 1 ? `<div class="pager">${
    Array.from({ length: pages }, (_, i) => i + 1).map(p =>
      p === page ? `<span class="on">${p}</span>` : `<a href="/${typeSlug}/${citySlug}${p > 1 ? '?page=' + p : ''}">${p}</a>`
    ).join('')
  }</div>` : '';

  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'MyMamuli.ge', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: T.label, item: `${SITE}/${typeSlug}/${citySlug}` }
    ]
  };

  const html = `<!DOCTYPE html>
<html lang="ka">
<head>
<meta charset="utf-8">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="${robots}">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="MyMamuli.ge">
<meta property="og:locale" content="ka_GE">
<meta property="og:image" content="${SITE}/images/mymamuli-social-share-1200x630.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE}/images/mymamuli-social-share-1200x630.png">
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font:400 15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans Georgian",sans-serif;color:#0E1A16;background:#F5F4F0}
.top{background:#fff;border-bottom:1px solid #E4E8E6}
.in{max-width:960px;margin:0 auto;padding:0 18px}
.top .in{display:flex;align-items:center;gap:10px;height:58px}
.lg{font-weight:700;font-size:17px;color:#0E1A16;text-decoration:none}
.lg b{color:#0F6B4F}
.mapb{margin-left:auto;background:#0F6B4F;color:#fff;text-decoration:none;font-size:13.5px;font-weight:600;padding:9px 15px;border-radius:9px}
main{max-width:960px;margin:22px auto 40px;padding:0 18px}
h1{font-size:24px;line-height:1.3;letter-spacing:-.4px;margin-bottom:8px}
.sub{color:#4A5A54;margin-bottom:22px;max-width:640px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin-bottom:26px}
.card{display:block;background:#fff;border-radius:14px;overflow:hidden;text-decoration:none;color:#0E1A16;box-shadow:0 1px 2px rgba(14,26,22,.06),0 6px 18px rgba(14,26,22,.06)}
.card img{width:100%;height:150px;object-fit:cover;display:block;background:#DDE5E0}
.card .cb{padding:12px}
.card b{display:block;font-size:16px;margin-bottom:2px}
.card span{display:block;font-size:13px;color:#4A5A54;margin-bottom:4px}
.card small{color:#93A09B;font-size:12px}
.empty{background:#fff;border-radius:14px;padding:34px 20px;text-align:center;color:#4A5A54;margin-bottom:26px}
.pager{display:flex;gap:6px;margin-bottom:30px}
.pager a,.pager span{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;text-decoration:none;color:#0E1A16;font-size:13px;font-weight:600}
.pager a{background:#fff}
.pager span.on{background:#0F6B4F;color:#fff}
.links{background:#fff;border-radius:14px;padding:20px}
.links h2{font-size:14px;margin-bottom:10px;color:#4A5A54}
.links .row{display:flex;flex-wrap:wrap;gap:8px 14px;margin-bottom:14px}
.links a{color:#0F6B4F;text-decoration:none;font-size:13.5px}
.links a:hover{text-decoration:underline}
footer{border-top:1px solid #E4E8E6;background:#fff;padding:18px 0;margin-top:26px}
footer .in{font-size:12px;color:#93A09B}
</style>
</head>
<body>
<div class="top"><div class="in">
  <a class="lg" href="/">My<b>Mamuli</b>.ge</a>
  <a class="mapb" href="/#/">რუკაზე ნახვა</a>
</div></div>
<main>
  <h1>${esc(T.label)} ${esc(cityLoc)}</h1>
  <p class="sub">${esc(desc)}</p>
  ${rows.length ? `<div class="grid">${cards}</div>${pager}` :
    `<div class="empty">ამ კომბინაციაზე ჯერ აქტიური განცხადება არ არის — გვერდი ავტომატურად ივსება, როგორც კი გამოჩნდება.<br><br><a href="/#/" style="color:#0F6B4F;font-weight:600">← ყველა განცხადება რუკაზე</a></div>`}
  <div class="links">
    <h2>სხვა კატეგორია ${esc(cityLoc)}</h2>
    <div class="row">${otherTypes}</div>
    <h2>${esc(T.label)} სხვა ქალაქებში</h2>
    <div class="row">${otherCities}</div>
  </div>
</main>
<footer><div class="in">© 2026 MyMamuli.ge · <a href="/" style="color:#93A09B">მთავარი</a></div></footer>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' }
  });
}
