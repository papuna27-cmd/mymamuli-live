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
.hook{border:1px solid #E3E1D9;border-radius:14px;padding:16px 18px;margin:16px 0;background:#F5F4F0}
.hook h4{margin:0 0 8px;color:#0F6B4F}
.hook p{margin:0}
.cbox{background:#EFF6F2;border:1px solid #CFE4DA;border-radius:16px;padding:20px 22px;margin:24px 0;
 box-shadow:0 8px 22px -12px rgba(15,107,79,.3)}
.cbox b{display:block;margin-bottom:8px;font-size:16px}
.cbox p{margin:0 0 14px;line-height:1.55}
.cb{display:inline-block;margin-top:2px;background:#0F6B4F;color:#fff;text-decoration:none;font-weight:600;padding:11px 18px;border-radius:10px;font-size:14px;
 box-shadow:0 4px 12px -4px rgba(15,107,79,.5)}
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
    <div class="hook"><h4>რატომ განსხვავდება ეს საიტი დანარჩენებისგან</h4>
    <p>ქართული უძრავი ქონების ბაზარი დღემდე ორ რამეზეა აგებული — არასანდო ინფორმაცია
    (ჯგუფებში ვინ იცის რამდენად ზუსტია მისამართი და ფართობი) და შუამავალი, რომელიც პროცესის
    ორივე ბოლოში საკომისიოს იღებს. ჩვენ ორივეს ვშლით. ნაკვეთის საზღვარი რუკაზე ჩნდება არა
    როგორც მიახლოებითი წერტილი, არამედ როგორც საჯარო რეესტრიდან აღებული ნამდვილი კონტური —
    მყიდველი ხედავს ზუსტად რას ყიდულობს, ჯერ კიდევ დარეკვამდე. და შუამავალი აქ არავინ არის:
    ზარი პირდაპირ შენთან მოდის, არა ვინმე მესამესთან, ვინც ამის სანაცვლოდ საკომისიოს ითხოვს.</p></div>

    <div class="hook"><h4>მიზანი</h4>
    <p>გვინდა, გავათანაბროთ ის, რასაც ჩვეულებრივ მხოლოდ დიდი სააგენტოები ფლობენ — ნამდვილი,
    გადამოწმებული მონაცემი და მყისიერი წვდომა დაინტერესებულ მყიდველთან — და ეს გავხადოთ
    ხელმისაწვდომი ნებისმიერისთვის, თავისუფლად, ანაზღაურების გარეშე.</p></div>

    <div class="hook"><h4>რას კარგავ, თუ დღეს არ განათავსებ</h4>
    <p>ყოველ დღეს, სანამ შენი ობიექტი საიტზე არ დევს, ვიღაც ზუსტად ამ არეალში, ამ ბიუჯეტში და
    ამ ფართობში მოთხოვნას ტოვებს — და შენს ნაცვლად სხვის განცხადებას პოულობს. განთავსება
    არაფერს გიჯდება: არც ერთჯერადი გადასახადია, არც თვიური, არც საკომისიო გაყიდვისას.</p></div>

    <div class="hook"><h4>შენ განკარგავ, ვინ დაინახავს</h4>
    <p>გინდა, რომ განცხადება საერთოდ არავინ ხედავდეს გარდა შესაბამისი მყიდველისა? დამალე
    საერთო რუკიდან — ის კვლავ აქტიურია და მაინც ავტომატურად პოულობს მასზე მორგებულ მაძიებელს,
    უბრალოდ დანარჩენებისთვის უჩინარია. გინდა, არც შენი სახელი გამოჩნდეს? ბარათზე „ვიზიტორი"
    დარჩება, ტელეფონი კი ისევ პირდაპირ შენთან რეკავს. ეს არ არის უბრალო „კონფიდენციალურობის
    პარამეტრი" — ეს ნიშნავს, რომ შეგიძლია საერთოდ არავის შეატყობინო, რომ ყიდი, და მაინც იპოვო
    ის, ვინც ყიდულობს.</p></div>

    <div class="cbox">
     <b>გინდა შენი უძრავი ქონების გაყიდვა ან გაქირავება?</b>
     <p>განცხადება მაქსიმუმ <b>24 საათში</b> გააქტიურდება საიტზე — ყველა განაცხადი გადის დეტალურ შემოწმებას.</p>
     <a class="cb" href="/#post">განცხადების ფორმა →</a>
    </div>

    <div class="note"><span>ⓘ</span><span>საკადასტრო მონაცემები მოწოდებულია სსიპ საჯარო რეესტრის ეროვნული სააგენტოს ღია მონაცემებიდან.
    ფასს, ფოტოსა და საკონტაქტო ინფორმაციას განცხადების ავტორი განსაზღვრავს.</span></div>`;

const EN_BODY = `
    <div class="hook"><h4>Why this site is different</h4>
    <p>Georgia's real estate market has always run on two things — unreliable information (in a
    Facebook group, who really knows if the address and size are accurate) and a middleman who
    takes a cut on both ends of the deal. We remove both. A plot's boundary appears on the map
    not as an approximate point, but as a real outline pulled from the Public Registry — the
    buyer sees exactly what they're buying before they even call. And there's no middleman here:
    the call goes straight to you, not to some third party asking for a commission in return.</p></div>

    <div class="hook"><h4>Our mission</h4>
    <p>We want to level the playing field — giving everyone, for free, what usually only big
    agencies have: real, verified data and instant access to an interested buyer.</p></div>

    <div class="hook"><h4>What you lose by not posting today</h4>
    <p>Every day your property isn't listed, someone leaves a request for exactly this area, this
    budget, this size — and finds someone else's listing instead of yours. Posting costs you
    nothing: no one-time fee, no monthly fee, no commission on the sale.</p></div>

    <div class="hook"><h4>You decide who sees it</h4>
    <p>Want no one to see your listing except the matching buyer? Hide it from the public map —
    it stays active and still automatically finds the searcher it matches, it's just invisible
    to everyone else. Don't want your name to show either? The card will simply say "Visitor"
    instead, while your phone still rings directly. This isn't just a "privacy setting" — it
    means you can sell without telling anyone you're selling, and still find the person who's
    buying.</p></div>

    <div class="cbox">
     <b>Want to sell or rent out your property?</b>
     <p>Your listing goes live <b>within 24 hours</b> at most — every submission goes through a detailed review.</p>
     <a class="cb" href="/#post">Listing form →</a>
    </div>

    <div class="note"><span>ⓘ</span><span>Cadastral data comes from the open data of the LEPL National Agency of Public Registry.
    Price, photos and contact details are set by whoever posts the listing.</span></div>`;

const html_ka = page({
  lang: 'ka',
  title: 'როგორ მუშაობს — MyMamuli.ge',
  desc: 'MyMamuli.ge აჩვენებს გასაყიდ მიწის ნაკვეთს ზუსტად იქ, სადაც ის დგას — საჯარო რეესტრის საკადასტრო საზღვრით, ფართობით, დანიშნულებითა და სტატუსით.',
  h1: 'მაძიებელი შენ გიპოვის — არა შენ მას',
  lead: 'ეს არ არის კიდევ ერთი განცხადებების დაფა, სადაც პოსტი იკარგება ასობით სხვას შორის და მოთმინებით ელოდები, ვინმემ შემოხედოს თუ არა. MyMamuli.ge-ზე მაძიებლებს უკვე წინასწარ აქვთ დაფიქსირებული, ზუსტად რას ეძებენ — არეალი, ბიუჯეტი, ფართობი. შენ რომ მხოლოდ ერთხელ ათავსებ განცხადებას, სისტემა თვითონ პოულობს, ვისაც ეს შეესაბამება, და მას ავტომატურად ატყობინებს — მანამდე, სანამ ვინმე საერთოდ დაიწყებდა შენი განცხადების ძებნას. შენი პოსტი არ ელოდება შემთხვევით მაყურებელს — თავად მიდის იმასთან, ვისაც სჭირდება.',
  body: KA_BODY,
  backLabel: '← მთავარ გვერდზე დაბრუნება'
});

const html_en = page({
  lang: 'en',
  title: "How it works — MyMamuli.ge",
  desc: "MyMamuli.ge shows land for sale exactly where it stands — with the Public Registry's cadastral boundary, area, designation and status.",
  h1: "The buyer finds you — not the other way around",
  lead: "This isn't another listings board where your post gets buried among hundreds of others while you wait and hope someone scrolls past it. On MyMamuli.ge, searchers have already set exactly what they're looking for — the area, the budget, the size. The moment you post your listing, the system finds everyone it matches and notifies them automatically — before anyone would even start searching for it. Your post doesn't wait for a random visitor — it goes straight to whoever needs it.",
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
