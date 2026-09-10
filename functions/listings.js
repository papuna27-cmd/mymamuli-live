/**
 * /listings — ყველა აქტიური განცხადებისა და მოთხოვნის crawlable კატალოგი.
 * ==================================================================
 * ⚠️ 2026-09-10, George-ის მოთხოვნით (Search Console: 46/49 URL არ
 * ინდექსირდება, აქედან 40 „Discovered – currently not indexed").
 *
 * ROOT CAUSE, რის გამოც ეს გვერდი გაჩნდა: განცხადებების გვერდებზე
 * (`/g/l_xxx/`) **საიტიდან არც ერთი ბმული არ მიდიოდა**. გადამოწმებულია:
 * მთავარი გვერდის HTML-ში `href="/g/..."` — 0 ცალი. მიზეზი ისაა, რომ
 * მთავარი გვერდი SPA-ა: ბარათები რუკაზე JS-ით იხატება და მათი გახსნა
 * `<a href>`-ით კი არა, JS-ის მოვლენით ხდება. ანუ Google-ისთვის ეს
 * URL-ები მხოლოდ sitemap-ში არსებობდნენ, საიტზე კი — ვერსად.
 *
 * ასეთ გვერდებს Google „ობოლს" (orphan) ეძახის: sitemap ეუბნება, რომ
 * URL არსებობს, მაგრამ არც ერთი შიდა ბმული არ მიუთითებს მასზე, ანუ
 * არაფერი ადასტურებს, რომ საიტისთვის ეს გვერდი მნიშვნელოვანია.
 * ასეთს crawl-budget-ის ბოლოში აყენებს და ხშირად წლობით არ კითხულობს.
 * სწორედ ესაა „Discovered – currently not indexed"-ის სტანდარტული
 * მიზეზი — და ხელით „Request Indexing" მას ვერ მოაგვარებს, რადგან
 * პრობლემა თვითონ საიტის ბმულების სტრუქტურაშია.
 *
 * ეს გვერდი აძლევს Google-ს ნამდვილ, ტექსტურ გზას ყოველ განცხადებამდე:
 * ჩვეულებრივი `<a href="/g/…">` ბმულები, აღწერითი ტექსტით (კატეგორია,
 * ფასი, ფართობი, ქალაქი), სერვერზე დარენდერებული — JS-ის გარეშეც ჩანს.
 * მასზე ბმული მთავარი გვერდის ფუტერშია, ანუ თვითონ კატალოგი
 * ერთ დაწკაპუნებაზეა მთავარი გვერდიდან.
 *
 * ასევე: ქალაქების/კატეგორიების ლენდინგებზე ბმულები (`/land-for-sale/
 * tbilisi` და ა.შ.) — ისინი ფუტერშიც იყო, მაგრამ მხოლოდ 4 ცალი; აქ
 * ყველა ის კომბინაცია ჩნდება, სადაც რეალურად რაღაც არის.
 *
 * ⚠️ D1-ის ხარჯი: ეს გვერდი ბოტებისთვისაა, ანუ ხშირად და ავტომატურად
 * იკითხება. ამიტომ პასუხი Cloudflare-ის edge-ქეშში 10 წუთით ინახება
 * (იგივე ხერხი, რაც /api/geo-ზე) — მიუხედავად იმისა, რამდენი crawler
 * მოვა, D1-ს 10 წუთში ერთხელ ვეკითხებით.
 *
 * კონვენცია (?lang=en, canonical, hreflang, og:) იგივეა, რაც
 * terms.js/sell.js/how-it-works.js-ში.
 */
import { CITY_SLUGS } from './_cities.js';
import { cityLocative } from './_city_locative.js';
import { nearestCity, nearestCitySlug, placeLabel } from './_geocity.js';

const SITE = 'https://mymamuli.ge';
const EDGE_TTL = 600;              /* 10 წუთი */
/* ⚠️ 2026-09-10 — ქეშის გასაღები build stamp-ს შეიცავს.
   რატომ: edge-ქეშს დეპლოი თავისით არ წმენდს, ამიტომ ახალი კოდის
   ატვირთვის შემდეგაც ეს გვერდი 10 წუთამდე ძველ HTML-ს აბრუნებდა —
   ერთხელ უკვე დამაბნეველი აღმოჩნდა გადამოწმებისას (ქალაქების
   იარლიყები ძველი ლოგიკით ჩანდა, თუმცა ახალი უკვე დეპლოილი იყო).
   ახლა stamp-ის შეცვლა ავტომატურად ქმნის ახალ გასაღებს.
   ⚠️ ეს სტრიქონი იმავე `sed`-ით იცვლება, რაც index/form/cabinet-ს —
   იხ. CLAUDE.md → „Where the build stamp lives". */
const BUILD = '2026.09.10-0730';
const MAX_ROWS = 1000;

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
const num = n => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

/* კატეგორიების სახელები — იგივე კოდები, რაც submit.js-ის CATS-ში. */
const CATN = {
  ka: { flat:'ბინა', house:'სახლი / აგარაკი', cottage:'კოტეჯი', office:'საოფისე ფართი',
        comm:'კომერციული ფართი', hotel:'სასტუმრო', resto:'რესტორანი / ბარი', base:'სარდაფი',
        land:'მიწის ნაკვეთი', invest:'საინვესტიციო მიწის ნაკვეთი', garage:'პარკინგი / ავტოფარეხი' },
  en: { flat:'Apartment', house:'House / Villa', cottage:'Cottage', office:'Office space',
        comm:'Commercial space', hotel:'Hotel', resto:'Restaurant / Bar', base:'Basement',
        land:'Land plot', invest:'Investment land', garage:'Parking / Garage' }
};

/* TYPE_MAP — უნდა ემთხვეოდეს [type]/[city].js-სა და sitemap.xml.js-ს. */
const TYPE_MAP = {
  'land-for-sale':       { cat:'land',  deal:'buy',  ka:'გასაყიდი მიწის ნაკვეთები', en:'Land for sale' },
  'apartments-for-sale': { cat:'flat',  deal:'buy',  ka:'გასაყიდი ბინები',          en:'Apartments for sale' },
  'houses-for-sale':     { cat:'house', deal:'buy',  ka:'გასაყიდი სახლები',         en:'Houses for sale' },
  'commercial-property': { cat:'comm',  deal:null,   ka:'კომერციული ფართები',       en:'Commercial property' },
  'real-estate':         { cat:null,    deal:null,   ka:'უძრავი ქონება',            en:'Real estate' }
};

const T = {
  ka: {
    title: 'ყველა განცხადება — უძრავი ქონება საქართველოში | MyMamuli.ge',
    desc: 'ყველა აქტიური განცხადება და მყიდველის მოთხოვნა ერთ სიაში — მიწა, ბინები, სახლები და კომერციული ფართები საქართველოში, საკადასტრო რუკაზე, შუამავლის გარეშე.',
    h1: 'ყველა აქტიური განცხადება',
    lead: n => `${n} განცხადება რუკაზე — მიწა, სახლები, ბინები და კომერციული ფართები. ყველა კონტაქტი პირდაპირი, საკომისიოს გარეშე.`,
    listings: 'გასაყიდი და გასაქირავებელი',
    reqs: 'მყიდველების მოთხოვნები',
    reqsLead: 'ეს ადამიანები უკვე ეძებენ — თუ შენი ობიექტი ამ არეალშია, შეთავაზება პირდაპირ მათთან მიდის.',
    byCity: 'ქალაქების მიხედვით',
    empty: 'აქტიური განცხადება ჯერ არ არის.',
    back: '← რუკაზე დაბრუნება',
    rent: 'ქირავდება', sale: 'იყიდება',
    looking: 'ეძებს', budget: 'ბიუჯეტი',
    post: '+ განათავსე უფასოდ'
  },
  en: {
    title: 'All listings — real estate in Georgia | MyMamuli.ge',
    desc: 'Every active listing and buyer request in one place — land, apartments, houses and commercial space in Georgia, on the cadastral map, with no intermediary.',
    h1: 'All active listings',
    lead: n => `${n} listings on the map — land, houses, apartments and commercial space. Every contact is direct, with no commission.`,
    listings: 'For sale and for rent',
    reqs: 'What buyers are looking for',
    reqsLead: 'These people are already searching — if your property is in their area, your offer goes straight to them.',
    byCity: 'Browse by city',
    empty: 'No active listings yet.',
    back: '← Back to the map',
    rent: 'For rent', sale: 'For sale',
    looking: 'Looking for', budget: 'Budget',
    post: '+ Post for free'
  }
};

const CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{font:400 16px/1.7 "Noto Sans Georgian",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
 color:#0E1A16;background:#F5F4F0}
.wr{max-width:900px;margin:0 auto;padding:28px 20px 80px}
.lg{font-weight:700;font-size:19px;color:#0E1A16;text-decoration:none;letter-spacing:-.3px;display:inline-block;margin-bottom:24px}
.lg b{color:#0F6B4F}
.langsw{float:right;font-size:13px;font-weight:600}
.langsw a{color:#93A09B;text-decoration:none}
.langsw a.on{color:#0F6B4F}
.langsw span{color:#C8CFCB;margin:0 5px}
h1{font-size:25px;line-height:1.3;margin-bottom:8px}
.lead{color:#5B6B64;margin-bottom:26px;font-size:15px}
h2{font-size:16px;margin:30px 0 6px;color:#0F6B4F}
.sub{color:#5B6B64;font-size:14px;margin-bottom:14px}
ul.lst{list-style:none;display:grid;gap:9px}
ul.lst li{background:#fff;border:1px solid #E3E1D9;border-radius:12px}
ul.lst a{display:block;padding:13px 16px;text-decoration:none;color:#0E1A16}
ul.lst a:hover{background:#FAFAF7}
.tt{font-weight:600;font-size:14.5px;line-height:1.45;display:block}
.mt{display:block;font-size:13px;color:#5B6B64;margin-top:3px}
.pr{color:#0F6B4F;font-weight:700}
.cities{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.cities a{background:#fff;border:1px solid #E3E1D9;border-radius:9px;padding:7px 13px;
 font-size:13.5px;text-decoration:none;color:#31413B}
.cities a:hover{border-color:#0F6B4F;color:#0F6B4F}
.empty{background:#fff;border:1px dashed #D8D5CB;border-radius:12px;padding:30px;text-align:center;color:#5B6B64}
.cb{display:inline-block;margin-top:26px;background:#0F6B4F;color:#fff;text-decoration:none;
 font-weight:600;padding:11px 20px;border-radius:10px;font-size:14.5px;min-height:44px;line-height:22px}
.back{display:inline-block;margin:26px 14px 0 0;color:#0F6B4F;font-weight:600;text-decoration:none;
 min-height:44px;line-height:44px}
@media(max-width:480px){.wr{padding:20px 15px 60px}h1{font-size:21px}}`;

function shell({ lang, title, desc, body }) {
  const alt = lang === 'en' ? '' : '?lang=en';
  const langsw = lang === 'en'
    ? `<span class="langsw"><a href="/listings">KA</a><span>·</span><a class="on" href="/listings?lang=en">EN</a></span>`
    : `<span class="langsw"><a class="on" href="/listings">KA</a><span>·</span><a href="/listings?lang=en">EN</a></span>`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${SITE}/listings${lang === 'en' ? '?lang=en' : ''}">
<link rel="alternate" hreflang="ka" href="${SITE}/listings">
<link rel="alternate" hreflang="en" href="${SITE}/listings?lang=en">
<link rel="alternate" hreflang="x-default" href="${SITE}/listings">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MyMamuli.ge">
<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'ka_GE'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/listings${lang === 'en' ? '?lang=en' : ''}">
<meta property="og:image" content="${SITE}/images/mymamuli-social-share-1200x630.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@400;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@400;600;700&display=swap" rel="stylesheet"></noscript>
<style>${CSS}</style>
</head>
<body>
<div class="wr">
<a class="lg" href="/${alt}">My<b>Mamuli</b>.ge</a>${langsw}
${body}
</div>
</body>
</html>`;
}

/* მოთხოვნის (req) არეალის ადამიანური აღწერა — რადიუსი ან ჩარჩო. */
function reqArea(r, lang) {
  const C = nearestCity(r.lat, r.lng);
  if (!C) return '';
  return lang === 'en' ? C[2] : cityLocative(C[0], C[1]);
}

async function build(env, lang) {
  const t = T[lang];
  let lst = [], req = [];
  if (env.DB) {
    try {
      const [a, b] = await Promise.all([
        env.DB.prepare(
          `SELECT id,cat,deal,period,loc,reg,lat,lng,area,price,ttl,ttl_tr,orig_lang,created
             FROM lst WHERE status='active' AND visibility != 'private'
            ORDER BY created DESC LIMIT ${MAX_ROWS}`).all(),
        env.DB.prepare(
          `SELECT id,cat,deal,lat,lng,area_min,area_max,price_min,price_max,created
             FROM req WHERE status='active' ORDER BY created DESC LIMIT ${MAX_ROWS}`).all()
      ]);
      lst = a.results || []; req = b.results || [];
    } catch (_) { /* ცარიელი კატალოგი გატეხილს ჯობია */ }
  }

  /* ── განცხადებები ─────────────────────────────────────────────── */
  const items = lst.map(l => {
    /* სათაური მიმდინარე ენაზე, თუ თარგმანი არსებობს (იგივე წესი,
       რაც index.html-ის trPick()-ს აქვს: თარგმანს ვაჩვენებთ მხოლოდ
       მაშინ, თუ ორიგინალი სხვა ენაზეა და თარგმანი ნამდვილად არის). */
    const orig = l.orig_lang || 'ka';
    let ttl = (lang !== orig && l.ttl_tr) ? l.ttl_tr : l.ttl;
    /* ⚠️ თუ ავტომატური თარგმანი ჯერ არ გაკეთებულა (ძველი ჩანაწერები
       `_translate.js`-ის დამატებამდე), EN რეჟიმში ქართული სათაური
       დარჩებოდა — სწორედ ის, რასაც CLAUDE.md კრძალავს („EN რეჟიმში
       ქართული არ უნდა დარჩეს"). ასეთ შემთხვევაში ორიგინალის ნაცვლად
       ჩვენივე აწყობილ, აღწერით ინგლისურ სახელს ვაჩვენებთ — Google-ისთვის
       ბმულის ტექსტი ისედაც ესაა მნიშვნელოვანი, ვიზიტორისთვის კი
       გასაგები. ქართულ რეჟიმში ყველაფერი უცვლელია. */
    if (lang === 'en' && ttl && /[ა-ჰ]/.test(ttl)) ttl = '';
    const cat = CATN[lang][l.cat] || l.cat;
    const deal = l.deal === 'rent' ? t.rent : t.sale;
    const place = placeLabel(l, lang);
    const price = l.price ? '$' + num(l.price) : '';
    const area = l.area ? num(l.area) + ' m²' : '';
    /* ბმულის ტექსტი აღწერითია — Google-ისთვის სწორედ ეს ტექსტი
       ეუბნება, რაზეა სამიზნე გვერდი. */
    const label = `${deal}: ${cat}${place ? ' — ' + place : ''}`;
    const meta = [price ? `<span class="pr">${esc(price)}</span>` : '', esc(area)]
      .filter(Boolean).join(' · ');
    return `<li><a href="/g/${esc(l.id)}/${lang === 'en' ? '?lang=en' : ''}">
<span class="tt">${esc(ttl || label)}</span>
<span class="mt">${esc(label)}${meta ? ' · ' : ''}${meta}</span></a></li>`;
  }).join('\n');

  /* ── მოთხოვნები ───────────────────────────────────────────────── */
  const reqItems = req.map(r => {
    const cat = CATN[lang][r.cat] || r.cat;
    const where = reqArea(r, lang);
    const bud = r.price_max ? `${t.budget}: $${num(r.price_max)}` : '';
    const ar = (r.area_min || r.area_max)
      ? `${num(r.area_min || 0)}–${num(r.area_max || 0)} m²` : '';
    const label = `${t.looking}: ${cat}${where ? ' — ' + where : ''}`;
    const meta = [bud, ar].filter(Boolean).join(' · ');
    return `<li><a href="/g/${esc(r.id)}/${lang === 'en' ? '?lang=en' : ''}">
<span class="tt">${esc(label)}</span>
${meta ? `<span class="mt">${esc(meta)}</span>` : ''}</a></li>`;
  }).join('\n');

  /* ── ქალაქების ბმულები ────────────────────────────────────────
     მხოლოდ ის კომბინაცია, სადაც რეალურად რაღაც არის — ცარიელ
     გვერდზე ბმულის გაშვება Google-ს მხოლოდ crawl-budget-ს აჭმევს
     (და სწორედ ამიტომაა ეს იგივე პირობა sitemap.xml.js-შიც). */
  const cityLinks = [];
  for (const [slug, TY] of Object.entries(TYPE_MAP)) {
    for (const C of CITY_SLUGS) {
      const [citySlug, cityKa] = C;
      const hit = lst.some(l =>
        (TY.cat ? l.cat === TY.cat : true) &&
        (TY.deal ? l.deal === TY.deal : true) &&
        ((l.loc && l.loc.includes(cityKa)) || (l.reg && l.reg.includes(cityKa)) ||
         nearestCitySlug(l.lat, l.lng) === citySlug));
      if (hit) {
        const label = lang === 'en'
          ? `${TY.en} in ${C[2]}`
          : `${TY.ka} ${cityLocative(citySlug, cityKa)}`;
        cityLinks.push(`<a href="/${slug}/${citySlug}">${esc(label)}</a>`);
      }
    }
  }

  const body = `
<h1>${esc(t.h1)}</h1>
<p class="lead">${esc(t.lead(lst.length))}</p>

<h2>${esc(t.listings)}</h2>
${items ? `<ul class="lst">\n${items}\n</ul>` : `<div class="empty">${esc(t.empty)}</div>`}

${reqItems ? `<h2>${esc(t.reqs)}</h2>
<p class="sub">${esc(t.reqsLead)}</p>
<ul class="lst">\n${reqItems}\n</ul>` : ''}

${cityLinks.length ? `<h2>${esc(t.byCity)}</h2>
<div class="cities">${cityLinks.join('')}</div>` : ''}

<div><a class="cb" href="/#post">${esc(t.post)}</a></div>
<a class="back" href="/${lang === 'en' ? '?lang=en' : ''}">${esc(t.back)}</a>`;

  return shell({ lang, title: t.title, desc: t.desc, body });
}

export async function onRequestGet(ctx) {
  const { request, env, waitUntil } = ctx;
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'ka';

  /* edge-ქეში — იხ. ფაილის თავსართი. გასაღები ენას ითვალისწინებს. */
  let cache = null, key = null;
  try {
    cache = caches.default;
    key = new Request(`${url.origin}/listings?lang=${lang}&b=${BUILD}`, { method: 'GET' });
    const hit = await cache.match(key);
    if (hit) return hit;
  } catch (_) { cache = null }

  const html = await build(env, lang);
  const res = new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': `public, max-age=${EDGE_TTL}`
    }
  });
  if (cache && key) { try { waitUntil(cache.put(key, res.clone())) } catch (_) {} }
  return res;
}
