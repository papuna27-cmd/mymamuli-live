/**
 * /g/<id>/ — რეალური განცხადების/მოთხოვნის საჯარო გვერდი (SEO + FB/WhatsApp OG)
 * ==================================================================
 *
 * ეს ცვლის ძველ, ხელით აწყობილ სადემონსტრაციო სტატიკურ ფაილებს
 * (g/l-XXXXXXXX/index.html) — ისინი 6 ცალკე გამოგონილი განცხადებისთვის
 * იყო დაწერილი და ლაივზე აზრს კარგავს, რადგან რეალურ განცხადებას
 * ამის მსგავსი გვერდი არასდროს ჰქონდა.
 *
 * აქ გვერდი D1-დან რეალურ მონაცემს კითხულობს და ყოველ განცხადებას
 * თავისი, სწორი OG სურათითა და ტექსტით სთავაზობს — წერილებში,
 * mod.js-ის matching-ში და r.js-ის ბმულებში უკვე დაწერილი
 * `/g/${id}/` ფორმატი ახლა რეალურად მუშა გვერდზე მიდის.
 *
 * ⚠️ 2026-08-25: George-ის მოთხოვნით — მაძიებლის მოთხოვნებსაც (l_-ის
 * ნაცვლად r_ პრეფიქსი, req ცხრილი) დაემატა თავისი გვერდი. აქამდე
 * მხოლოდ განცხადებებს (lst) ჰქონდათ გასაზიარებელი ბმული — mod.js-ის
 * req-branch-ს `?req=` ფორმის ბმული ჰქონდა, რომელსაც არც OG სურათი
 * აქვს და არც ცალკე გვერდი. ახლა ორივე ერთი და იმავე `/g/{id}/`
 * მარშრუტიდან გადის, პრეფიქსის მიხედვით ცხრილი და ტექსტი გვარჩევს.
 *
 * ⚠️ 2026-08-25 (2): George-მა ინგლისურ საიტვერსიაზე გაზიარებისას
 * ქართული სათაური მიიღო — ეს გვერდი აქამდე საერთოდ არ იცნობდა
 * ინგლისურს (i18n.js-ის LANG-ისგან დამოუკიდებელი, პირდაპირ D1-დან
 * გენერირებული Function-ია). ახლა `?lang=en` query პარამეტრს
 * პატივს სცემს — index.html-იდან გაზიარებისას URL-ს ემატება
 * lang=en, თუ საიტი იმ მომენტში ინგლისურ რეჟიმშია.
 *
 * ⚠️ მხოლოდ status='active' ჩანს. დაუდასტურებელი/დახურული
 *    ჩანაწერი მთავარზე გადამისამართდება — გატეხილი ბმული
 *    უარესია, ვიდრე მშვიდი გადამისამართება.
 *
 * ⚠️ 2026-08-27, George-ის მოთხოვნით — ცოცხალი ადამიანისთვის ეს გვერდი
 *    საერთოდ აღარ ჩანს: მას პირდაპირ საიტის დეპ-ლინკზე (`/?req={id}`
 *    ან `/#/g/{id}`) ვამისამართებთ 302-ით, სადაც ბარათი/popup თავად
 *    იხსნება ავტომატურად (იხ. index.html-ის tryDeepLink()). ეს გვერდი
 *    კვლავ სრულად რჩება Facebook/WhatsApp/Telegram/Google-ის
 *    ბოტებისთვის (OG პრევიუ + SEO ინდექსაცია) — მათი User-Agent-ის
 *    მიხედვით ვარჩევთ, აჩვენოთ თუ გადავამისამართოთ. ნახვის მთვლელს
 *    ეს არ ვნებს — SPA თავადაც წერს ნახვას ბარათის გახსნისას
 *    (loadViews()/POST /api/views, index.html-ში), ამიტომ ადამიანის
 *    ვიზიტი მაინც დაითვლება, უბრალოდ ერთხელ ორის ნაცვლად. */
import { CITY_SLUGS } from '../../_cities.js';
import { CITY_LOCATIVE } from '../../_city_locative.js';

const SITE = 'https://mymamuli.ge';

/* ცნობილი ბოტები/crawler-ები, რომლებსაც სრული OG/SEO გვერდი უნდა
   დარჩეთ (redirect არ ეხებათ) — სოც. ქსელების პრევიუ-სკანერები და
   საძიებო სისტემები. ყველა დანარჩენი (ნამდვილი ბრაუზერი) პირდაპირ
   საიტის დეპ-ლინკზე გადადის. */
const BOT_UA_RE = /bot|spider|crawl|slurp|facebookexternalhit|whatsapp|skypeuripreview|vkshare|pinterest|embedly|outbrain|quora|telegram|discordbot/i;
const isBotUA = ua => BOT_UA_RE.test(ua || '');

/* ნომინატივი — გამყიდველის განცხადებებში „იყიდება/ქირავდება {კატეგორია}" */
const CATN = {
  flat: 'ბინა', house: 'სახლი / აგარაკი', cottage: 'კოტეჯი', office: 'საოფისე ფართი',
  comm: 'კომერციული ფართი', hotel: 'სასტუმრო', resto: 'რესტორანი / ბარი', base: 'სარდაფი',
  land: 'მიწის ნაკვეთი', invest: 'საინვესტიციო მიწის ნაკვეთი', garage: 'პარკინგი / ავტოფარეხი'
};
/* ⚠️ 2026-08-25: George-ის მოთხოვნით — მიმღები ბრუნვა მაძიებლის
   განცხადებებში „ვიყიდი {კატეგორია}-ს" / „ვეძებ {კატეგორია}-ს ქირით" */
const CATN_ACC = {
  flat: 'ბინას', house: 'სახლს / აგარაკს', cottage: 'კოტეჯს', office: 'საოფისე ფართს',
  comm: 'კომერციულ ფართს', hotel: 'სასტუმროს', resto: 'რესტორანს / ბარს', base: 'სარდაფს',
  land: 'მიწის ნაკვეთს', invest: 'საინვესტიციო მიწის ნაკვეთს', garage: 'პარკინგს / ავტოფარეხს'
};
/* ინგლისური კატეგორიის სახელები — ბრუნვა არ სჭირდება, იგივე ფორმა
   ორივე („იყიდება X" / „ვიყიდი X-ს") შემთხვევაში გამოიყენება. */
const CATN_EN = {
  flat: 'Apartment', house: 'House / Villa', cottage: 'Cottage', office: 'Office space',
  comm: 'Commercial space', hotel: 'Hotel', resto: 'Restaurant / Bar', base: 'Basement',
  land: 'Land plot', invest: 'Investment land', garage: 'Parking / Garage'
};

/* სტატიკური UI ტექსტების ორენოვანი ლექსიკონი. */
const T = {
  ka: {
    forSale: 'იყიდება', forRent: 'ქირავდება',
    lookBuy: 'ვიყიდი', lookRentPrefix: 'ვეძებ', lookRentSuffix: ' ქირით',
    area: 'ფართობი', purpose: 'დანიშნულება', deal: 'გარიგება', cadCode: 'საკადასტრო კოდი',
    category: 'კატეგორია', budget: 'ბიუჯეტი', location: 'მდებარეობა', radius: 'საძიებო არეალი',
    buy: 'ყიდვა', rent: 'ქირავდება',
    showPhone: 'ნომრის ჩვენება', viewMapBounds: 'რუკაზე და საზღვრები', viewMap: 'რუკაზე ნახვა',
    addListing: 'განცხადების დამატება', postListing: 'განცხადების განთავსება', home: 'მთავარი',
    sellerFine: 'გამყიდველთან პირდაპირ დაუკავშირდი — MyMamuli.ge შუამავალი არ არის და საკომისიოს არ იღებს.',
    cadFine: 'საკადასტრო საზღვარი და ფართობი: სსიპ „საჯარო რეესტრის ეროვნული სააგენტო".',
    buyerReqTag: '◎ მყიდველის მოთხოვნა',
    offerCta: 'დათვალიერება საიტზე და შეთავაზება',
    buyerFine1: 'მყიდველის ნომერი დაფარულია — შეთავაზება მას შეტყობინებით მიუვა და თვითონ გადაწყვეტს, ვის დაურეკოს.',
    buyerFine2: 'თუ შენი ნაკვეთი ან ფართი ამ პარამეტრებს ჯდება, დაამატე განცხადება MyMamuli.ge-ზე.',
    descTailReq: '. თუ შენი ნაკვეთი ან ფართი ამ პარამეტრებს ჯდება — შესთავაზე პირდაპირ, შუამავლების გარეშე. MyMamuli.ge',
    near: p => p + '-ის მიმდებარედ',
    radiusTxt: (n, km) => km ? n + ' კმ რადიუსში' : n + ' მ რადიუსში',
    upTo: v => v + '-მდე',
    perYear: ' / წელი', perMonth: ' / თვე',
    bedrooms: n => n + ' საძინებლით', rooms: n => n + ' ნომერი', m2: v => v + ' მ²'
  },
  en: {
    forSale: 'For sale', forRent: 'For rent',
    lookBuy: 'Looking to buy', lookRentPrefix: 'Looking to rent', lookRentSuffix: '',
    area: 'Area', purpose: 'Purpose', deal: 'Deal', cadCode: 'Cadastral code',
    category: 'Category', budget: 'Budget', location: 'Location', radius: 'Search radius',
    buy: 'Buy', rent: 'Rent',
    showPhone: 'Show phone number', viewMapBounds: 'View on map & boundaries', viewMap: 'View on map',
    addListing: 'Add listing', postListing: 'Post a listing', home: 'Home',
    sellerFine: 'Contact the seller directly — MyMamuli.ge is not an intermediary and takes no commission.',
    cadFine: 'Cadastral boundary and area data: National Agency of Public Registry of Georgia.',
    buyerReqTag: '◎ Buyer request',
    offerCta: 'View on site & make an offer',
    buyerFine1: "The buyer's number is hidden — your offer reaches them by message, and they decide who to call.",
    buyerFine2: 'If your property matches these criteria, add your listing on MyMamuli.ge.',
    descTailReq: '. If your property matches these criteria — offer it directly, without intermediaries. MyMamuli.ge',
    near: p => 'near ' + p,
    radiusTxt: (n, km) => km ? ('within ' + n + ' km') : ('within ' + n + ' m'),
    upTo: v => 'up to ' + v,
    perYear: ' / year', perMonth: ' / month',
    bedrooms: n => n + (n === '1' ? ' bedroom' : ' bedrooms'),
    rooms: n => n + (n === '1' ? ' room' : ' rooms'),
    m2: v => v + ' m²'
  }
};

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = n => Number(n || 0).toLocaleString('en-US');
const firstVal = v => Array.isArray(v) ? v[0] : v;
/* og:image:type / twitter:image-ისთვის — cover-ის გაფართოებიდან განისაზღვრება
   (გამყიდველის ატვირთული ქავერი jpg/png/webp შეიძლება იყოს, მაძიებლის
   საერთო სურათი კი ყოველთვის png-ია — იხ. cover ცვლადები ქვემოთ). */
const imgType = url => {
  const m = /\.([a-z0-9]+)(?:\?|#|$)/i.exec(String(url || ''));
  const ext = (m ? m[1] : '').toLowerCase();
  return { png: 'image/png', webp: 'image/webp', gif: 'image/gif' }[ext] || 'image/jpeg';
};

/* ქალაქის სახელი (ნომინატივი, l.loc-ის მსგავსი სტრიქონი ან CITY_SLUGS slug) →
   ლოკატივი („თბილისი" → „თბილისში"). უცნობი/თავისუფალი ტექსტისთვის —
   უცვლელად ვტოვებთ, ვიდრე საერთოდ გამოვტოვოთ. ინგლისურისთვის — CITY_SLUGS-ის
   მე-3 სვეტი (en სახელი), თუ ცნობილია. */
function cityLocative(nameOrSlug, lang) {
  if (!nameOrSlug) return '';
  const hit = CITY_SLUGS.find(c => c[0] === nameOrSlug || c[1] === nameOrSlug);
  if (lang === 'en') return hit ? hit[2] : nameOrSlug;
  if (CITY_LOCATIVE[nameOrSlug]) return CITY_LOCATIVE[nameOrSlug];
  return hit ? (CITY_LOCATIVE[hit[0]] || hit[1]) : nameOrSlug;
}

/* გამყიდველის განცხადების „X ოთახით / X მ²" ფრაგმენტი კატეგორიის მიხედვით.
   ბინა/სახლი — საძინებლების რაოდენობა (attrs.rooms); სასტუმრო — ნომრების
   რაოდენობა (attrs.fla); კოტეჯს შიდა ფართი საერთოდ არ ეთხოვება (attrs=null
   ფორმაშივე) — განზრახ ცარიელია; დანარჩენებს — ფართობი მ²-ში. */
function listingFeature(cat, area, attrsObj, lang) {
  const t = T[lang];
  if (cat === 'flat' || cat === 'house') {
    const rm = firstVal(attrsObj.rooms);
    return rm ? t.bedrooms(String(rm)) : (area ? t.m2(num(area)) : '');
  }
  if (cat === 'hotel') {
    const rn = attrsObj.fla;
    return rn ? t.rooms(String(rn)) : (area ? t.m2(num(area)) : '');
  }
  if (cat === 'cottage') return '';
  return area ? t.m2(num(area)) : '';
}

const TZ = 4 * 3600 * 1000;
const dayKey = () => new Date(Date.now() + TZ).toISOString().slice(0, 10);

/* უახლოესი ცნობილი ქალაქის slug — მოთხოვნის (req) გვერდზე ზუსტი მისამართი
   არაა, ლათიტუდ/ლონგიტუდიდან მხოლოდ მიახლოებით ვადგენთ. slug (და არა
   პირდაპირ ქართული სახელი) გვჭირდება, რომ CITY_LOCATIVE-ით ლოკატივიც
   ავიღოთ სათაურისთვის („ვიყიდი ბინას , თბილისში"). */
function nearestCitySlug(lat, lng) {
  if (lat == null || lng == null) return '';
  const R = 6371, toRad = x => x * Math.PI / 180;
  let best = '', bestKm = Infinity;
  for (const [slug, , , la, ln] of CITY_SLUGS) {
    const dLat = toRad(la - lat), dLng = toRad(ln - lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(la)) * Math.sin(dLng / 2) ** 2;
    const km = 2 * R * Math.asin(Math.sqrt(a));
    if (km < bestKm) { bestKm = km; best = slug }
  }
  return bestKm <= 60 ? best : '';
}

export async function onRequestGet({ params, request, env }) {
  const id = String(params.id || '');
  const redirectHome = () => Response.redirect(SITE, 302);
  if (!env.DB) return redirectHome();

  const lang = new URL(request.url).searchParams.get('lang') === 'en' ? 'en' : 'ka';
  const t = T[lang];
  const bot = isBotUA(request.headers.get('user-agent'));

  if (/^r_[a-z0-9]+$/.test(id)) return requestPage(id, env, lang, bot);
  if (!/^l_[a-z0-9]+$/.test(id)) return redirectHome();

  /* ⚠️ 2026-08-27: ნამდვილი ბრაუზერი პირდაპირ დეპ-ლინკზე გადადის,
     DB-ის წაკითხვის გარეშეც — id-ს ვალიდურობას tryDeepLink() თავად
     ამოწმებს (თუ id არ მოიძებნა, უბრალოდ ჩვეულებრივი რუკა რჩება). */
  if (!bot) return Response.redirect(`${SITE}/#/g/${id}${lang === 'en' ? '?lang=en' : ''}`, 302);

  const l = await env.DB.prepare(
    `SELECT id,cat,deal,period,cad,addr,lat,lng,loc,reg,area,price,ttl,dsc,photos,attrs,tel,contact_name,visibility,created,expires
       FROM lst WHERE id=?1 AND status='active'`
  ).bind(id).first();

  if (!l) return redirectHome();

  /* ნახვის მთვლელი — იგივე ცხრილები, რასაც /api/views იყენებს */
  try {
    const day = dayKey(), t0 = Date.now();
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO view_total (id, total, first_seen, last_seen) VALUES (?1, 1, ?2, ?2)
         ON CONFLICT(id) DO UPDATE SET total = total + 1, last_seen = ?2`
      ).bind(id, t0),
      env.DB.prepare(
        `INSERT INTO view_day (id, day, n) VALUES (?1, ?2, 1)
         ON CONFLICT(id, day) DO UPDATE SET n = n + 1`
      ).bind(id, day)
    ]);
  } catch (_) { /* მთვლელი გვერდს ვერ გატეხავს */ }

  let photos = [];
  try { photos = JSON.parse(l.photos || '[]') || [] } catch (_) {}
  /* ქავერი — ის ფოტო, რომელსაც განმცხადებელი ფორმაში „ქავერად" აირჩევს
     (photos[0], იხ. form.html-ის S.photos.unshift ლოგიკა), FB/WhatsApp
     გაზიარებაშიც ეს იგივე სურათი უნდა გამოჩნდეს. */
  const cover = photos[0] || `${SITE}/img/land-1.jpg`;

  let attrsObj = {};
  try { attrsObj = JSON.parse(l.attrs || '{}') || {} } catch (_) {}

  const catNomKa = CATN[l.cat] || l.cat;
  const catNom = lang === 'en' ? (CATN_EN[l.cat] || catNomKa) : catNomKa;
  const title = l.ttl || catNomKa + ' — ' + [l.loc, l.reg].filter(Boolean).join(', ');
  /* ⚠️ 2026-08-27, George-ის მოთხოვნით — ეს იგივე ბაგი იყო, რაც
     index.html-ის ბარათებზე გავასწორეთ: ქირაზე ფასის მ²-ზე დაშლას
     აზრი არა აქვს — მთლიან ფასს ვაჩვენებთ, პერიოდის აღნიშვნით. */
  const priceTxt = l.price ? '$' + num(l.price) + (l.deal === 'rent' ? (l.period === 'year' ? t.perYear : t.perMonth) : '') : '';
  const perM2 = (l.deal !== 'rent' && l.price && l.area) ? '$' + Math.round(l.price / l.area) + (lang === 'en' ? ' / m²' : ' / მ²') : '';
  const locTxt = [l.loc, l.reg].filter(Boolean).join(', ');
  const desc = lang === 'ka'
    ? ([l.dsc, locTxt, l.cad ? ('საკადასტრო კოდი ' + l.cad) : '']
        .filter(Boolean).join('. ').slice(0, 300) ||
       (title + (priceTxt ? '. ფასი ' + priceTxt : '') + (locTxt ? '. ' + locTxt : '') +
        '. ოფიციალური საზღვარი საჯარო რეესტრიდან. შუამავლების გარეშე — MyMamuli.ge'))
    : (catNom + (locTxt ? '. ' + locTxt : '') + (priceTxt ? '. Price ' + priceTxt : '') +
       '. Official boundary from the Public Registry. No intermediaries — MyMamuli.ge');
  const url = `${SITE}/g/${id}/` + (lang === 'en' ? '?lang=en' : '');

  /* ⚠️ 2026-08-25: George-ის მოთხოვნით — FB/WhatsApp გაზიარების სათაური
     (og:title/twitter:title/<title>) სტრუქტურული შაბლონით: „იყიდება/
     ქირავდება {კატეგორია} , {ოთახი ან მ²} , {ქალაქი-ში} - ${ფასი}".
     გვერდის ხილულ H1-ს (ქვემოთ `title`) არ ვცვლით — მხოლოდ სოც.
     ქსელების გასაზიარებელი სათაური იცვლება. */
  const feature = listingFeature(l.cat, l.area, attrsObj, lang);
  const cityLoc = cityLocative(l.loc, lang);
  const dealVerb = l.deal === 'rent' ? t.forRent : t.forSale;
  const fullTitle = lang === 'en'
    ? (dealVerb + ': ' + catNom +
       (feature ? ', ' + feature : '') + (cityLoc ? ', ' + cityLoc : '') +
       (priceTxt ? ' - ' + priceTxt : ''))
    : (dealVerb + ' ' + catNom +
       (feature ? ' , ' + feature : '') + (cityLoc ? ' , ' + cityLoc : '') +
       (priceTxt ? ' - ' + priceTxt : ''));

  const rows = [
    l.area ? [t.area, t.m2(num(l.area))] : null,
    catNom ? [t.purpose, catNom] : null,
    l.deal === 'rent' ? [t.deal, t.forRent] : null,
    l.cad ? [t.cadCode, l.cad] : null
  ].filter(Boolean);

  /* ტელეფონი კოდში ღიად არ დევს — base64, დაკლიკებით ჩნდება (spam-bot-ების საწინააღმდეგოდ) */
  const telB64 = l.tel ? btoa(unescape(encodeURIComponent(String(l.tel)))) : '';

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(fullTitle)} | MyMamuli.ge</title>
<meta name="description" content="${esc(desc)}">
${l.visibility === 'private' ? '<meta name="robots" content="noindex,nofollow">' : ''}
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="MyMamuli.ge">
<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'ka_GE'}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(cover)}">
<meta property="og:image:secure_url" content="${esc(cover)}">
<meta property="og:image:type" content="${imgType(cover)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(fullTitle)}">
${l.price ? `<meta property="product:price:amount" content="${l.price}">
<meta property="product:price:currency" content="USD">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(cover)}">
<meta name="theme-color" content="#0F6B4F">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'RealEstateListing', name: title, url,
  description: desc, image: cover,
  datePosted: l.created ? new Date(l.created).toISOString().slice(0, 10) : undefined,
  offers: l.price ? { '@type': 'Offer', price: l.price, priceCurrency: 'USD', availability: 'https://schema.org/InStock', url } : undefined,
  geo: (l.lat && l.lng) ? { '@type': 'GeoCoordinates', latitude: l.lat, longitude: l.lng } : undefined,
  address: { '@type': 'PostalAddress', addressLocality: l.loc || '', addressRegion: l.reg || '', addressCountry: 'GE' },
  identifier: l.cad || id,
  provider: { '@type': 'Organization', name: 'MyMamuli.ge', url: SITE + '/' }
})}</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--ink:#0E1A16;--ink2:#4A5A54;--mute:#93A09B;--line:#E4E8E6;--brand:#0F6B4F;--sand:#F7F5F1;--amber:#C8873A}
body{font:400 15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans Georgian",sans-serif;color:var(--ink);background:#F4F6F5}
.top{background:#fff;border-bottom:1px solid var(--line)}
.in{max-width:760px;margin:0 auto;padding:0 18px}
.top .in{display:flex;align-items:center;gap:10px;height:58px}
.lg{display:flex;align-items:center;gap:7px;font-weight:700;font-size:17px;color:var(--ink);text-decoration:none;letter-spacing:-.3px}
.lg b{color:var(--brand)}
.mapb{margin-left:auto;background:var(--brand);color:#fff;text-decoration:none;font-size:13.5px;font-weight:600;padding:9px 15px;border-radius:9px}
main{max-width:760px;margin:18px auto 40px;padding:0 18px}
.hero{border-radius:16px;overflow:hidden;background:#DDE5E0;box-shadow:0 2px 10px rgba(14,26,22,.07)}
.hero img{width:100%;display:block}
.card{background:#fff;border-radius:16px;padding:20px;margin-top:14px;box-shadow:0 2px 10px rgba(14,26,22,.07)}
h1{font-size:21px;line-height:1.32;letter-spacing:-.4px;margin:6px 0 10px}
.price{font-size:32px;font-weight:700;letter-spacing:-.9px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.price small{font-size:14px;font-weight:600;color:#fff;background:var(--amber);padding:4px 10px;border-radius:8px;letter-spacing:0}
.loc{color:var(--ink2);font-size:14px;display:flex;gap:6px;align-items:center}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px}
td{padding:10px 0;border-top:1px solid var(--line)}
td:first-child{color:var(--ink2)}
td:last-child{text-align:right;font-weight:600}
.cta{display:flex;gap:9px;margin-top:18px;flex-wrap:wrap}
.b1,.b2{flex:1;min-width:190px;height:50px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;
 font-size:15px;font-weight:600;text-decoration:none;cursor:pointer;border:0;font-family:inherit}
.b1{background:var(--brand);color:#fff}
.b2{background:#fff;color:var(--ink);border:1px solid var(--line)}
.fine{margin-top:16px;font-size:11.5px;line-height:1.6;color:var(--mute)}
footer{border-top:1px solid var(--line);background:#fff;padding:18px 0;margin-top:26px}
footer .in{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--mute)}
footer a{color:var(--ink2);text-decoration:none}
@media(max-width:520px){h1{font-size:19px}.price{font-size:28px}}
</style>
</head>
<body>
<div class="top"><div class="in">
  <a class="lg" href="/${lang === 'en' ? '?lang=en' : ''}">My<b>Mamuli</b>.ge</a>
  <a class="mapb" href="/#/g/${esc(id)}${lang === 'en' ? '?lang=en' : ''}">${esc(t.viewMap)}</a>
</div></div>

<main>
  <div class="hero"><img src="${esc(cover)}" alt="${esc(fullTitle)}" width="1200" height="630"></div>
  <div class="card">
    ${priceTxt ? `<div class="price">${priceTxt}${perM2 ? `<small>${esc(perM2)}</small>` : ''}</div>` : ''}
    <h1>${esc(title)}</h1>
    ${locTxt ? `<div class="loc">◉ ${esc(locTxt)}</div>` : ''}
    ${rows.length ? `<table>${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>` : ''}
    <div class="cta">
      ${l.tel ? `<button class="b1" id="tel" data-t="${esc(telB64)}">${esc(t.showPhone)}</button>` : ''}
      <a class="b2" href="/#/g/${esc(id)}${lang === 'en' ? '?lang=en' : ''}">${esc(t.viewMapBounds)}</a>
    </div>
    <div class="fine">${esc(t.sellerFine)}<br>
    ${esc(t.cadFine)}</div>
  </div>
</main>

<footer><div class="in">
  <a href="/#main${lang === 'en' ? '?lang=en' : ''}">${esc(t.home)}</a>
  <a href="/#sell${lang === 'en' ? '?lang=en' : ''}">${esc(t.postListing)}</a>
  <a href="mailto:info@mymamuli.ge">info@mymamuli.ge</a>
  <span>© 2026 MyMamuli.ge</span>
</div></footer>

<script>
var b=document.getElementById('tel');
if(b)b.onclick=function(){
 var t=decodeURIComponent(escape(atob(this.dataset.t)));
 this.outerHTML='<a class="b1" href="tel:'+t+'">'+t+'</a>';
};
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' }
  });
}

/* ==================================================================
 * /g/<r_id>/ — მყიდველის მოთხოვნის საჯარო გვერდი
 * ------------------------------------------------------------------
 * ⚠️ 2026-08-25: George-ის მოთხოვნით. მოთხოვნას არც ფოტო აქვს და არც
 * გამყიდველის ტელეფონი ჩანს (მყიდველის ნომერი ყოველთვის დაფარულია —
 * იხ. openReq()-ის fine-ტექსტი index.html-ში) — ამიტომ CTA აქ სხვაა:
 * პირდაპირ ტელეფონის ჩვენების ნაცვლად საიტზე მიგვყავს, სადაც
 * გამყიდველს შეუძლია შეთავაზების გაგზავნა. OG სურათად requests-map.jpg-ს
 * ვიყენებთ — საქართველოს რუკა მოთხოვნების ბუშტებით + ლოგო (მოთხოვნას
 * საკუთარი ფოტო არ აქვს, ამიტომ ეს არის საერთო ბრენდირებული დეფოლტი). */
async function requestPage(id, env, lang, bot) {
  const t = T[lang];
  const redirectHome = () => Response.redirect(SITE, 302);
  /* ⚠️ 2026-08-27: იხ. ფაილის თავში კომენტარი — ნამდვილი ბრაუზერი
     პირდაპირ დეპ-ლინკზე გადადის, DB-ის წაკითხვის გარეშეც. */
  if (!bot) return Response.redirect(`${SITE}/?req=${id}${lang === 'en' ? '&lang=en' : ''}`, 302);
  const r = await env.DB.prepare(
    `SELECT id,cat,deal,period,lat,lng,radius,area_min,area_max,price_min,price_max,note,sent_n,created
       FROM req WHERE id=?1 AND status='active'`
  ).bind(id).first();
  if (!r) return redirectHome();

  /* ⚠️ 2026-08-26: George-ის შენიშვნით — მოთხოვნებს (r_) ნახვის მთვლელი
     აქამდე საერთოდ არ ჰქონდათ (მხოლოდ განცხადებებს/l_-ს ჰქონდა), ამიტომ
     კაბინეტში ყოველთვის 0 ჩანდა. იგივე ცხრილები, რასაც listingPage/
     /api/views იყენებს. */
  try {
    const day = dayKey(), t0 = Date.now();
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO view_total (id, total, first_seen, last_seen) VALUES (?1, 1, ?2, ?2)
         ON CONFLICT(id) DO UPDATE SET total = total + 1, last_seen = ?2`
      ).bind(id, t0),
      env.DB.prepare(
        `INSERT INTO view_day (id, day, n) VALUES (?1, ?2, 1)
         ON CONFLICT(id, day) DO UPDATE SET n = n + 1`
      ).bind(id, day)
    ]);
  } catch (_) { /* მთვლელი გვერდს ვერ გატეხავს */ }

  const citySlug = nearestCitySlug(r.lat, r.lng);
  const cityHit = citySlug ? CITY_SLUGS.find(c => c[0] === citySlug) : null;
  const place = cityHit ? (lang === 'en' ? cityHit[2] : cityHit[1]) : '';
  const placeLoc = citySlug ? (lang === 'en' ? place : (CITY_LOCATIVE[citySlug] || place)) : '';
  const catN = (lang === 'en' ? CATN_EN[r.cat] : CATN[r.cat]) || r.cat;
  const catAcc = lang === 'en' ? catN : (CATN_ACC[r.cat] || catN);
  const dealN = r.deal === 'rent' ? t.rent : t.buy;
  const areaN = r.area_max > 0 ? r.area_max : r.area_min;
  const areaTxt = areaN > 0 ? t.m2(num(areaN)) : '';
  const periodSuf = r.deal === 'rent' ? (r.period === 'year' ? t.perYear : t.perMonth) : '';
  const budgetTxt = r.price_max > 0 ? t.upTo('$' + num(r.price_max)) + periodSuf : '';
  const radiusTxt = t.radiusTxt(r.radius >= 1000 ? (r.radius / 1000).toFixed(1) : r.radius, r.radius >= 1000);

  /* ⚠️ 2026-08-25: George-ის მოთხოვნით — მაძიებლის გაზიარების სათაური:
     ყიდვისას „ვიყიდი {კატეგორია}-ს" (და არა ზოგადი „ვეძებ"), ქირისას
     „ვეძებ {კატეგორია}-ს ქირით". H1-ზეც იგივე ვიყენებთ (ქალაქი/ბიუჯეტი
     ცალკე ველებში ისედაც ჩანს). ინგლისურად: „Looking to buy/rent X". */
  const title = r.deal === 'rent' ? (t.lookRentPrefix + ' ' + catAcc + t.lookRentSuffix) : (t.lookBuy + ' ' + catAcc);
  const fullTitle = lang === 'en'
    ? (title + (placeLoc ? ', ' + placeLoc : '') + (budgetTxt ? ' - ' + budgetTxt : '') + '.')
    : (title + (placeLoc ? ' , ' + placeLoc : '') + (budgetTxt ? ' - ' + budgetTxt : '') + '.');
  const desc = [dealN, areaTxt, budgetTxt, place ? t.near(place) + ', ' + radiusTxt : radiusTxt]
    .filter(Boolean).join(' · ') + t.descTailReq;
  const url = `${SITE}/g/${id}/` + (lang === 'en' ? '?lang=en' : '');
  /* George-ის მოთხოვნით (2026-08-25) — კანონიკური სურათის მისამართი და
     ფორმატი: /images/mymamuli-social-share-1200x630.png (PNG, 1200x630). */
  const cover = `${SITE}/images/mymamuli-social-share-1200x630.png`;

  const rows = [
    [t.category, catN],
    [t.deal, dealN],
    areaTxt ? [t.area, areaTxt] : null,
    budgetTxt ? [t.budget, budgetTxt] : null,
    place ? [t.location, place] : null,
    [t.radius, radiusTxt]
  ].filter(Boolean);

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(fullTitle)} | MyMamuli.ge</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MyMamuli.ge">
<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'ka_GE'}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(cover)}">
<meta property="og:image:secure_url" content="${esc(cover)}">
<meta property="og:image:type" content="${imgType(cover)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(fullTitle)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(cover)}">
<meta name="theme-color" content="#0F6B4F">
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'RealEstateListing', name: title, url, description: desc,
    datePosted: r.created ? new Date(r.created).toISOString().slice(0, 10) : undefined,
    geo: (r.lat && r.lng) ? { '@type': 'GeoCoordinates', latitude: r.lat, longitude: r.lng } : undefined,
    address: { '@type': 'PostalAddress', addressLocality: place || '', addressCountry: 'GE' },
    identifier: id,
    provider: { '@type': 'Organization', name: 'MyMamuli.ge', url: SITE + '/' }
  })}</script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--ink:#0E1A16;--ink2:#4A5A54;--mute:#93A09B;--line:#E4E8E6;--brand:#0F6B4F;--sand:#F7F5F1;--amber:#C8873A}
body{font:400 15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans Georgian",sans-serif;color:var(--ink);background:#F4F6F5}
.top{background:#fff;border-bottom:1px solid var(--line)}
.in{max-width:760px;margin:0 auto;padding:0 18px}
.top .in{display:flex;align-items:center;gap:10px;height:58px}
.lg{display:flex;align-items:center;gap:7px;font-weight:700;font-size:17px;color:var(--ink);text-decoration:none;letter-spacing:-.3px}
.lg b{color:var(--brand)}
.mapb{margin-left:auto;background:var(--brand);color:#fff;text-decoration:none;font-size:13.5px;font-weight:600;padding:9px 15px;border-radius:9px}
main{max-width:760px;margin:18px auto 40px;padding:0 18px}
.hero{border-radius:16px;overflow:hidden;background:linear-gradient(135deg,#F0D9BC,#DFBE93);box-shadow:0 2px 10px rgba(14,26,22,.07);
 padding:34px 26px;color:#5A3F1E}
.hero .tag{display:inline-block;background:rgba(255,255,255,.55);font-size:12.5px;font-weight:700;padding:5px 11px;border-radius:20px;margin-bottom:10px}
.hero h1{font-size:23px;line-height:1.3;letter-spacing:-.4px}
.card{background:#fff;border-radius:16px;padding:20px;margin-top:14px;box-shadow:0 2px 10px rgba(14,26,22,.07)}
.price{font-size:28px;font-weight:700;letter-spacing:-.7px}
.loc{color:var(--ink2);font-size:14px;display:flex;gap:6px;align-items:center;margin-top:8px}
table{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px}
td{padding:10px 0;border-top:1px solid var(--line)}
td:first-child{color:var(--ink2)}
td:last-child{text-align:right;font-weight:600}
.cta{display:flex;gap:9px;margin-top:18px;flex-wrap:wrap}
.b1,.b2{flex:1;min-width:190px;height:50px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;
 font-size:15px;font-weight:600;text-decoration:none;cursor:pointer;border:0;font-family:inherit}
.b1{background:var(--brand);color:#fff}
.b2{background:#fff;color:var(--ink);border:1px solid var(--line)}
.fine{margin-top:16px;font-size:11.5px;line-height:1.6;color:var(--mute)}
footer{border-top:1px solid var(--line);background:#fff;padding:18px 0;margin-top:26px}
footer .in{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--mute)}
footer a{color:var(--ink2);text-decoration:none}
@media(max-width:520px){.hero h1{font-size:20px}.price{font-size:24px}}
</style>
</head>
<body>
<div class="top"><div class="in">
  <a class="lg" href="/${lang === 'en' ? '?lang=en' : ''}">My<b>Mamuli</b>.ge</a>
  <a class="mapb" href="/#sell${lang === 'en' ? '?lang=en' : ''}">${esc(t.addListing)}</a>
</div></div>

<main>
  <div class="hero"><span class="tag">${esc(t.buyerReqTag)}</span><h1>${esc(title)}</h1></div>
  <div class="card">
    ${budgetTxt ? `<div class="price">${esc(budgetTxt)}</div>` : ''}
    ${place ? `<div class="loc">◉ ${esc(t.near(place))}</div>` : ''}
    <table>${rows.map(x => `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td></tr>`).join('')}</table>
    <div class="cta">
      <a class="b1" href="/?req=${esc(id)}${lang === 'en' ? '&lang=en' : ''}">${esc(t.offerCta)}</a>
    </div>
    <div class="fine">${esc(t.buyerFine1)}<br>
    ${esc(t.buyerFine2)}</div>
  </div>
</main>

<footer><div class="in">
  <a href="/#main${lang === 'en' ? '?lang=en' : ''}">${esc(t.home)}</a>
  <a href="/#sell${lang === 'en' ? '?lang=en' : ''}">${esc(t.postListing)}</a>
  <a href="mailto:info@mymamuli.ge">info@mymamuli.ge</a>
  <span>© 2026 MyMamuli.ge</span>
</div></footer>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' }
  });
}
