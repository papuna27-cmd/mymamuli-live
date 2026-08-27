/**
 * /sitemap.xml — რეალურ დროში გენერირებული sitemap.
 * ==================================================================
 * ⚠️ აქამდე root-ში იდო სტატიკური sitemap.xml ფაილი, რომელიც მხოლოდ
 * მთავარ გვერდს შეიცავდა — არცერთი აქტიური განცხადება არასდროს
 * ხვდებოდა Google-ის სკანერამდე sitemap-ის გზით (მხოლოდ შიდა
 * ბმულებით პოულობდა, ნელა და არასრულად). ეს ფაილი შლის სტატიკურ
 * ვერსიას (Cloudflare Pages-ზე სტატიკური ფაილი Function-ს
 * გადაფარავს იმავე მისამართზე) და ყოველ მოთხოვნაზე D1-დან ნამდვილ,
 * აქტიურ განცხადებებს კითხულობს.
 *
 * lastmod — რეალური, ბაზაში დაცული განთავსების თარიღია (created),
 * არა ხელოვნურად გამოგონილი. draft/pending/hold/rejected/closed
 * სტატუსის ჩანაწერები აქ არასდროს ხვდება — WHERE status='active'.
 */
import { CITY_SLUGS } from './_cities.js';

const SITE = 'https://mymamuli.ge';
const iso = ms => new Date(ms || Date.now()).toISOString().slice(0, 10);
const esc = s => String(s).replace(/&/g, '&amp;');

/* ⚠️ TYPE_MAP-ის ეს ასლი უნდა ემთხვეოდეს [type]/[city].js-ში არსებულს —
   ორივეს ერთდროულად ვცვლით, თუ ახალი ტიპი დაემატება. cross-import
   არ გავაკეთეთ, რადგან Cloudflare Pages routing-ს ხელს არ უშლის, მაგრამ
   ცალკე ფაილებში წაკითხვა უფრო ნათელია. */
const TYPE_MAP = {
  'land-for-sale':        { cat: 'land', deal: 'buy' },
  'apartments-for-sale':  { cat: 'flat', deal: 'buy' },
  'houses-for-sale':      { cat: 'house', deal: 'buy' },
  'commercial-property':  { cat: 'comm', deal: null },
  'real-estate':          { cat: null, deal: null }
};

export async function onRequestGet({ env }) {
  let rows = [];
  if (env.DB) {
    try {
      const r = await env.DB.prepare(
        `SELECT id, cat, deal, loc, reg, created FROM lst WHERE status='active' ORDER BY created DESC LIMIT 5000`
      ).all();
      rows = r.results || [];
    } catch (_) { /* ცარიელი sitemap ჯობია გატეხილს */ }
  }

  /* ქალაქის/კატეგორიის ლენდინგები — მხოლოდ ის კომბინაცია ხვდება
     sitemap-ში, სადაც ნამდვილად არსებობს მინიმუმ ერთი აქტიური
     განცხადება (ცარიელი გვერდის ინდექსაცია არ გვინდა). */
  const landingUrls = [];
  for (const [slug, T] of Object.entries(TYPE_MAP)) {
    for (const [citySlug, cityKa] of CITY_SLUGS) {
      const match = rows.find(l =>
        (T.cat ? l.cat === T.cat : true) &&
        (T.deal ? l.deal === T.deal : true) &&
        ((l.loc && l.loc.includes(cityKa)) || (l.reg && l.reg.includes(cityKa)))
      );
      if (match) {
        landingUrls.push(
          `<url><loc>${SITE}/${slug}/${citySlug}</loc><lastmod>${iso(Date.now())}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`
        );
      }
    }
  }

  const urls = [
    `<url><loc>${SITE}/</loc><lastmod>${iso(Date.now())}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${SITE}/terms</loc><lastmod>${iso(Date.now())}</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`,
    `<url><loc>${SITE}/privacy</loc><lastmod>${iso(Date.now())}</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`,
    `<url><loc>${SITE}/how-it-works</loc><lastmod>${iso(Date.now())}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
    `<url><loc>${SITE}/sell</loc><lastmod>${iso(Date.now())}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
    `<url><loc>${SITE}/buy</loc><lastmod>${iso(Date.now())}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
    `<url><loc>${SITE}/want</loc><lastmod>${iso(Date.now())}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
    `<url><loc>${SITE}/faq</loc><lastmod>${iso(Date.now())}</lastmod><changefreq>monthly</changefreq><priority>0.4</priority></url>`,
    ...rows.map(l =>
      `<url><loc>${SITE}/g/${esc(l.id)}/</loc><lastmod>${iso(l.created)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    ),
    ...landingUrls
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=1800' }
  });
}
