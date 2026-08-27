/**
 * /how-it-works — Pages Function. იხ. functions/terms.js-ის თავსართი
 * კომენტარი იმისთვის, თუ რატომ Function და არა static /how-it-works/index.html.
 *
 * ⚠️ 2026-08-26: George-ის აუდიტით — ინგლისური ვერსია დამატებულია
 * (?lang=en), იგივე მიდგომით, რასაც terms.js/privacy.js იყენებს.
 */
const CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{font:400 16px/1.7 "Noto Sans Georgian",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
 color:#0E1A16;background:#F5F4F0}
.wr{max-width:760px;margin:0 auto;padding:28px 20px 80px}
.lg{font-weight:700;font-size:19px;color:#0E1A16;text-decoration:none;letter-spacing:-.3px;display:inline-block;margin-bottom:28px}
.lg b{color:#0F6B4F}
.langsw{float:right;font-size:13px;font-weight:600}
.langsw a{color:#93A09B;text-decoration:none}
.langsw a.on{color:#0F6B4F}
.langsw span{color:#C8CFCB;margin:0 5px}
.card{background:#fff;border:1px solid #E3E1D9;border-radius:16px;padding:28px 26px}
h1{font-size:24px;margin-bottom:8px}
.lead{color:#5B6B64;margin-bottom:22px;font-size:15px}
h4{font-size:15px;margin:22px 0 12px;color:#0F6B4F}
p{color:#31413B;margin-bottom:10px}
b{color:#0E1A16}
.mgrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:8px}
@media(max-width:560px){.mgrid{grid-template-columns:1fr}}
.mc{background:#F5F4F0;border-radius:12px;padding:14px 16px}
.mc b{display:block;margin-bottom:4px;font-size:14px}
.mc span{color:#4A5A54;font-size:13.5px}
.cbox{background:#EFF6F2;border-radius:14px;padding:18px 20px;margin:22px 0}
.cbox b{display:block;margin-bottom:6px}
.cb{display:inline-block;margin-top:8px;background:#0F6B4F;color:#fff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:10px;font-size:14px}
.note{background:#F5F4F0;border-radius:10px;padding:12px 14px;font-size:14px;color:#4A5A54;margin:14px 0;display:flex;gap:8px}
a{color:#0F6B4F}
.back{display:inline-block;margin-top:26px;color:#0F6B4F;font-weight:600;text-decoration:none}`;

function page({ lang, title, desc, h1, lead, body, backLabel }) {
  const langsw = lang === 'en'
    ? `<span class="langsw"><a href="/how-it-works">KA</a><span>·</span><a class="on" href="/how-it-works?lang=en">EN</a></span>`
    : `<span class="langsw"><a class="on" href="/how-it-works">KA</a><span>·</span><a href="/how-it-works?lang=en">EN</a></span>`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://mymamuli.ge/how-it-works${lang === 'en' ? '?lang=en' : ''}">
<link rel="alternate" hreflang="ka" href="https://mymamuli.ge/how-it-works">
<link rel="alternate" hreflang="en" href="https://mymamuli.ge/how-it-works?lang=en">
<link rel="alternate" hreflang="x-default" href="https://mymamuli.ge/how-it-works">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MyMamuli.ge">
<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'ka_GE'}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="https://mymamuli.ge/how-it-works${lang === 'en' ? '?lang=en' : ''}">
<meta property="og:image" content="https://mymamuli.ge/images/mymamuli-social-share-1200x630.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="https://mymamuli.ge/images/mymamuli-social-share-1200x630.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<div class="wr">
  <a class="lg" href="/">My<b>Mamuli</b>.ge</a>
  ${langsw}
  <div class="card">
    <h1>${h1}</h1>
    <p class="lead">${lead}</p>
${body}
  </div>
  <a class="back" href="/">${backLabel}</a>
</div>
</body>
</html>`;
}

const KA_BODY = `
    <h4>როგორ მუშაობს</h4>
    <div class="mgrid">
     <div class="mc"><b>1 · რუკა, არა სია</b><span>ყველა განცხადება რუკაზეა. მ²-ის ფასი პირდაპირ ნიშნულზე წერია.</span></div>
     <div class="mc"><b>2 · ნამდვილი საზღვარი</b><span>საკადასტრო კოდზე დაჭერით ნაკვეთის კონტური რუკაზევე ჩნდება — maps.gov.ge-ზე გადასვლა აღარ სჭირდება.</span></div>
     <div class="mc"><b>3 · გაზომვა ადგილზე</b><span>ფართობისა და მანძილის საზომი ხელსაწყო — შენს ხელშია, დამატებითი აპლიკაციის გარეშე.</span></div>
     <div class="mc"><b>4 · პირდაპირი კონტაქტი</b><span>ტელეფონი ბარათზეა. საკომისიო არ არსებობს, არც გამყიდველისთვის, არც მყიდველისთვის.</span></div>
    </div>

    <h4>განცხადების განთავსება უფასოა</h4>
    <p>განცხადების განთავსებაში საფასურს არ ვიღებთ — არც ერთჯერადს, არც თვიურს.</p>

    <div class="cbox">
     <b>გინდა ნაკვეთის გაყიდვა?</b>
     <p>შეავსე ფორმა — დანარჩენს ჩვენ გავაკეთებთ. განცხადებას <b>24 საათში</b> ვდებთ საიტზე.</p>
     <a class="cb" href="/#post">განცხადების ფორმა →</a>
    </div>

    <div class="note"><span>ⓘ</span><span>საკადასტრო მონაცემები მოწოდებულია სსიპ საჯარო რეესტრის ეროვნული სააგენტოს ღია მონაცემებიდან.
    ფასს, ფოტოსა და საკონტაქტო ინფორმაციას განცხადების ავტორი განსაზღვრავს.</span></div>`;

const EN_BODY = `
    <h4>How it works</h4>
    <div class="mgrid">
     <div class="mc"><b>1 · A map, not a list</b><span>Every listing is on the map. The price per m² is right on the pin.</span></div>
     <div class="mc"><b>2 · A real boundary</b><span>Click the cadastral code and the plot's outline appears right on the map — no need to open maps.gov.ge.</span></div>
     <div class="mc"><b>3 · Measure on the spot</b><span>An area and distance measuring tool, right in your hands — no extra app needed.</span></div>
     <div class="mc"><b>4 · Direct contact</b><span>The phone number is on the card. There's no commission, for either the seller or the buyer.</span></div>
    </div>

    <h4>Posting a listing is free</h4>
    <p>We don't charge for posting a listing — not a one-time fee, not a monthly one.</p>

    <div class="cbox">
     <b>Want to sell your property?</b>
     <p>Fill out the form — we'll handle the rest. Your listing goes live in <b>24 hours</b>.</p>
     <a class="cb" href="/#post">Listing form →</a>
    </div>

    <div class="note"><span>ⓘ</span><span>Cadastral data comes from the open data of the LEPL National Agency of Public Registry.
    Price, photos and contact details are set by whoever posts the listing.</span></div>`;

const html_ka = page({
  lang: 'ka',
  title: 'როგორ მუშაობს — MyMamuli.ge',
  desc: 'MyMamuli.ge აჩვენებს გასაყიდ მიწის ნაკვეთს ზუსტად იქ, სადაც ის დგას — საჯარო რეესტრის საკადასტრო საზღვრით, ფართობით, დანიშნულებითა და სტატუსით.',
  h1: 'საქართველოს მიწის ბაზარი — ერთ რუკაზე',
  lead: 'MyMamuli.ge აჩვენებს გასაყიდ მიწის ნაკვეთს <b>ზუსტად იქ, სადაც ის დგას</b> — საჯარო რეესტრის საკადასტრო საზღვრით, ფართობით, დანიშნულებითა და სტატუსით. შუამავალი არ გვყავს: მყიდველი პირდაპირ გამყიდველს უკავშირდება.',
  body: KA_BODY,
  backLabel: '← მთავარ გვერდზე დაბრუნება'
});

const html_en = page({
  lang: 'en',
  title: "How it works — MyMamuli.ge",
  desc: "MyMamuli.ge shows land for sale exactly where it stands — with the Public Registry's cadastral boundary, area, designation and status.",
  h1: "Georgia's land market — on one map",
  lead: "MyMamuli.ge shows land for sale <b>exactly where it stands</b> — with the Public Registry's cadastral boundary, area, designation and status. There's no middleman: the buyer contacts the seller directly.",
  body: EN_BODY,
  backLabel: '← Back to homepage'
});

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const en = url.searchParams.get('lang') === 'en';
  return new Response(en ? html_en : html_ka, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' }
  });
}
