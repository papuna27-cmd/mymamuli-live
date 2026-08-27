/**
 * /buy — Pages Function. იხ. functions/terms.js-ის თავსართი კომენტარი
 * იმისთვის, თუ რატომ Function და არა static /buy/index.html.
 *
 * ⚠️ 2026-08-26, George-ის მოთხოვნით — მოდალის "მყიდველს" (PAGES.buy)
 * ტექსტი აქამდე მხოლოდ SPA-ს JS-ში არსებობდა, საკუთარი URL-ის, title-ის
 * და meta description-ის გარეშე — ფუტერშიც კი მასზე ბმულები (`#buy`)
 * მხოლოდ hash-ს იყენებდნენ. აქ იგივე კონტენტი დამოუკიდებელ, crawlable
 * გვერდადაა გატანილი, ზუსტად იმავე კონვენციით, რასაც how-it-works.js/
 * terms.js/privacy.js/sell.js იყენებს.
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
.stp{display:flex;flex-direction:column;gap:10px;margin:14px 0 4px}
.stp .s{display:flex;gap:13px;align-items:flex-start;background:#F7F5F1;border-radius:12px;padding:13px 15px}
.stp .sn{flex:0 0 auto;width:26px;height:26px;border-radius:50%;background:#0F6B4F;color:#fff;
 font:700 13px/26px -apple-system,sans-serif;text-align:center}
.stp .st{min-width:0}
.stp .st b{display:block;font-size:13.5px;margin-bottom:2px}
.stp .st span{display:block;font-size:12.5px;line-height:1.55;color:#4A5A54}
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
    ? `<span class="langsw"><a href="/buy">KA</a><span>·</span><a class="on" href="/buy?lang=en">EN</a></span>`
    : `<span class="langsw"><a class="on" href="/buy">KA</a><span>·</span><a href="/buy?lang=en">EN</a></span>`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://mymamuli.ge/buy${lang === 'en' ? '?lang=en' : ''}">
<link rel="alternate" hreflang="ka" href="https://mymamuli.ge/buy">
<link rel="alternate" hreflang="en" href="https://mymamuli.ge/buy?lang=en">
<link rel="alternate" hreflang="x-default" href="https://mymamuli.ge/buy">
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
    <div class="stp">
     <div class="s"><span class="sn">✓</span><span class="st"><b>საკონტაქტო ინფორმაცია დაცულია</b>
      <span>შენი ტელეფონი და ელფოსტა არავის უჩანს. გამყიდველს კავშირი შენთან პირდაპირ არ აქვს.</span></span></div>
     <div class="s"><span class="sn">✓</span><span class="st"><b>ვინაობას ვერავინ გაიგებს</b>
      <span>მოთხოვნაში ჩანს მხოლოდ არეალი, ბიუჯეტი და ფართობი — არა სახელი და არა ვინაობა.</span></span></div>
     <div class="s"><span class="sn">✓</span><span class="st"><b>ახალ განცხადებას პირველი იგებ</b>
      <span>შენს არეალში შესაბამისი ობიექტის გამოჩენისთანავე შეტყობინება შენთან მოდის — ადრე, ვიდრე ის საერთო სიაში აისახება.</span></span></div>
     <div class="s"><span class="sn">✓</span><span class="st"><b>გადაწყვეტილება მხოლოდ შენია</b>
      <span>თუ ფასი და ობიექტი მოგეწონა — თვითონ დაუკავშირდები გამყიდველს. თუ არა — უბრალოდ არაფერს აკეთებ.</span></span></div>
    </div>

    <div class="cbox">
     <b>დადება 1 წუთს არ სცდება</b>
     <p>მონიშნე არეალი რუკაზე, მიუთითე ბიუჯეტი და ფართობი — დანარჩენს ჩვენ ვაკეთებთ.</p>
     <a class="cb" href="/#want">◎ დატოვე მოთხოვნა</a>
    </div>

    <h4>როგორ ვეძებო ობიექტი</h4>
    <p class="lead">ყველაფერი რუკაზეა. სია მეორეხარისხოვანია — ჯერ ადგილს ხედავ, მერე ფასს.</p>

    <div class="mgrid">
     <div class="mc"><b>ნიშნულზე მ²-ის ფასი</b><span>რუკაზევე ჩანს რამდენი ღირს კვადრატული მეტრი — სრული თანხის გახსნა არ სჭირდება.</span></div>
     <div class="mc"><b>ზუსტი საკადასტრო საზღვარი</b><span>ბარათზე საკადასტრო კოდზე დაჭერით ნაკვეთის კონტური რუკაზე დაიხატება.</span></div>
     <div class="mc"><b>ფილტრი</b><span>კატეგორია, ფასი, ფართობი, მ²-ის ფასი, განთავსების დრო.</span></div>
     <div class="mc"><b>სატელიტი და საზღვრები</b><span>ფენების ღილაკით ჩართე სატელიტური ხედი და საკადასტრო ბადე.</span></div>
     <div class="mc"><b>გაზომვა</b><span>გაზომე ფართობი ან მანძილი პირდაპირ რუკაზე — ნაკვეთის კონტური არ იშლება.</span></div>
     <div class="mc"><b>პირდაპირი ზარი</b><span>„დაკავშირება" ხსნის მესაკუთრის ნომერს. შუამავალი არ არსებობს.</span></div>
    </div>

    <h4>რას ვამოწმებთ შენს ნაცვლად</h4>
    <p>ყოველ განცხადებას საკადასტრო კოდი აქვს და საჯარო რეესტრში გადამოწმებულია:
    <b>ფართობი</b>, <b>დანიშნულება</b> და <b>რეგისტრაციის სტატუსი</b>.
    გარიგებამდე ამონაწერის აღება მაინც სასურველია.</p>

    <div class="note"><span>ⓘ</span><span>ფასი და ფოტო გამყიდველის მოწოდებულია. ჩვენ ვამოწმებთ ობიექტის არსებობასა და
    საკადასტრო მონაცემს — არა გარიგების პირობებს.</span></div>`;

const EN_BODY = `
    <div class="stp">
     <div class="s"><span class="sn">✓</span><span class="st"><b>Your contact info is protected</b>
      <span>Your phone and email are never shown. The seller has no direct way to contact you.</span></span></div>
     <div class="s"><span class="sn">✓</span><span class="st"><b>Your identity stays private</b>
      <span>A request only shows the area, budget and size — never your name or identity.</span></span></div>
     <div class="s"><span class="sn">✓</span><span class="st"><b>You hear about new listings first</b>
      <span>As soon as a matching property appears in your area, you get notified — before it appears in the general list.</span></span></div>
     <div class="s"><span class="sn">✓</span><span class="st"><b>The decision is always yours</b>
      <span>If you like the price and the property, you reach out to the seller yourself. If not, you simply do nothing.</span></span></div>
    </div>

    <div class="cbox">
     <b>Takes under a minute to set up</b>
     <p>Mark the area on the map, set a budget and size — we handle the rest.</p>
     <a class="cb" href="/#want">◎ Leave a request</a>
    </div>

    <h4>How to search for a property</h4>
    <p class="lead">Everything is on the map. The list view is secondary — you see the location first, the price second.</p>

    <div class="mgrid">
     <div class="mc"><b>Price per m² on the pin</b><span>The price per square meter is right on the map — no need to open the full listing.</span></div>
     <div class="mc"><b>Exact cadastral boundary</b><span>Click the cadastral code on the card and the parcel's outline is drawn right on the map.</span></div>
     <div class="mc"><b>Filters</b><span>Category, price, area, price per m², posting date.</span></div>
     <div class="mc"><b>Satellite view and boundaries</b><span>Turn on satellite imagery and the cadastral grid with the layers button.</span></div>
     <div class="mc"><b>Measuring tool</b><span>Measure area or distance directly on the map — the parcel outline stays visible.</span></div>
     <div class="mc"><b>Direct call</b><span>"Contact" reveals the owner's number. There is no middleman.</span></div>
    </div>

    <h4>What we verify for you</h4>
    <p>Every listing has a cadastral code that's been checked against the Public Registry:
    <b>area</b>, <b>designation</b> and <b>registration status</b>.
    Getting an official extract before closing a deal is still recommended.</p>

    <div class="note"><span>ⓘ</span><span>The price and photos are supplied by the seller. We verify that the property exists and its
    cadastral data — not the terms of the deal itself.</span></div>`;

const html_ka = page({
  lang: 'ka',
  title: 'როგორ ვიყიდო უძრავი ქონება — MyMamuli.ge',
  desc: 'როგორ იპოვო ნაკვეთი, ბინა ან სახლი MyMamuli.ge-ზე — ზუსტი საკადასტრო საზღვრები, ფილტრები, პირდაპირი კავშირი გამყიდველთან, საკომისიოს გარეშე.',
  h1: 'დადე მოთხოვნა — და გამყიდველები თავად გიპოვიან',
  lead: 'არ გინდა ყოველდღე რუკის შემოწმება? მონიშნე შენთვის საინტერესო არეალი და ფასი — შესაბამისი ობიექტი თავად მოგივა, ჯერ ყველა დანარჩენზე ადრე.',
  body: KA_BODY,
  backLabel: '← მთავარ გვერდზე დაბრუნება'
});

const html_en = page({
  lang: 'en',
  title: 'How to buy property — MyMamuli.ge',
  desc: "How to find land, an apartment or a house on MyMamuli.ge — exact cadastral boundaries, filters, direct contact with the seller, no commission.",
  h1: 'Leave a request — and sellers find you',
  lead: "Don't want to check the map every day? Mark the area and price you're interested in — a matching property comes to you first, before anyone else sees it.",
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
