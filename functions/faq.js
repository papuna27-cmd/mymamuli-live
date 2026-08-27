/**
 * /faq — Pages Function. იხ. functions/terms.js-ის თავსართი კომენტარი
 * იმისთვის, თუ რატომ Function და არა static /faq/index.html.
 *
 * ⚠️ 2026-08-26, George-ის მოთხოვნით — საიტის საინფორმაციო გვერდების
 * ("წესები", "კონფიდენციალურობა", "როგორ მუშაობს", "სელ/ბაი") გვერდით,
 * FAQ დაემატა იმავე პატერნით: საკუთარი URL, title, description, canonical,
 * hreflang. კითხვა-პასუხები <details>/<summary>-ითაა აწყობილი — იშლება
 * JS-ის გარეშეც (Function-ი, არა SPA), მარტივი და crawler-ისთვისაც
 * წაკითხვადი (Google-ს ხშირად FAQ-სთვის სპეციალური snippet გამოაქვს).
 */
const CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{font:400 16px/1.7 "Noto Sans Georgian",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
 color:#0E1A16;background:#F5F4F0}
.wr{max-width:720px;margin:0 auto;padding:28px 20px 80px}
.lg{font-weight:700;font-size:19px;color:#0E1A16;text-decoration:none;letter-spacing:-.3px;display:inline-block;margin-bottom:28px}
.lg b{color:#0F6B4F}
.langsw{float:right;font-size:13px;font-weight:600}
.langsw a{color:#93A09B;text-decoration:none}
.langsw a.on{color:#0F6B4F}
.langsw span{color:#C8CFCB;margin:0 5px}
.card{background:#fff;border:1px solid #E3E1D9;border-radius:16px;padding:28px 26px}
h1{font-size:24px;margin-bottom:8px}
.lead{color:#5B6B64;margin-bottom:22px;font-size:15px}
p{color:#31413B}
b{color:#0E1A16}
a{color:#0F6B4F}
.qa{border-bottom:1px solid #EEECE6}
.qa:last-child{border-bottom:none}
.qa summary{cursor:pointer;list-style:none;padding:15px 0;font-weight:600;font-size:14.5px;color:#0E1A16;
 display:flex;justify-content:space-between;align-items:center;gap:10px}
.qa summary::-webkit-details-marker{display:none}
.qa summary::after{content:'+';color:#0F6B4F;font-size:19px;font-weight:400;flex:0 0 auto}
.qa[open] summary::after{content:'–'}
.qa .a{padding:0 0 16px;color:#4A5A54;font-size:14px;line-height:1.65}
.qa .a b{color:#0E1A16}
.back{display:inline-block;margin-top:26px;color:#0F6B4F;font-weight:600;text-decoration:none}`;

function page({ lang, title, desc, h1, lead, body, backLabel }) {
  const langsw = lang === 'en'
    ? `<span class="langsw"><a href="/faq">KA</a><span>·</span><a class="on" href="/faq?lang=en">EN</a></span>`
    : `<span class="langsw"><a class="on" href="/faq">KA</a><span>·</span><a href="/faq?lang=en">EN</a></span>`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://mymamuli.ge/faq${lang === 'en' ? '?lang=en' : ''}">
<link rel="alternate" hreflang="ka" href="https://mymamuli.ge/faq">
<link rel="alternate" hreflang="en" href="https://mymamuli.ge/faq?lang=en">
<link rel="alternate" hreflang="x-default" href="https://mymamuli.ge/faq">
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

const qa = (q, a) => `    <details class="qa"><summary>${q}</summary><div class="a">${a}</div></details>\n`;

const KA_BODY =
  qa('რა ღირს განცხადების განთავსება?',
    'ეს <b>უფასოა</b> — არც ერთჯერადი გადასახადია, არც თვიური. საკომისიოს არც გაყიდვისას ვიღებთ.') +
  qa('რატომ მჭირდება საკადასტრო კოდი?',
    'კოდით ვადასტურებთ, რომ ობიექტი საჯარო რეესტრში მართლა არსებობს, ვიღებთ ზუსტ საზღვარს, ფართობსა და დანიშნულებას — და ნიშნულიც რუკაზე ავტომატურად დაისმის, ხელით მონიშვნის გარეშე. იხილეთ <a href="/sell">როგორ განვათავსო განცხადება</a>.') +
  qa('რამდენ ხანში ქვეყნდება განცხადება?',
    'გადამოწმების შემდეგ, ჩვეულებრივ <b>24 საათში</b>.') +
  qa('ჩანს ჩემი ტელეფონის ნომერი ყველასთვის?',
    'გამყიდველის ბარათზე ტელეფონი ჩანს — ასე მყიდველი პირდაპირ გირეკავს, შუამავლის გარეშე. მაგრამ „ვეძებ"-ის მოთხოვნებში პირიქითაა: მაძიებლის საკონტაქტო მონაცემები დაცულია და არავის უჩანს, სანამ თვითონ არ გადაწყვეტს პასუხის გაცემას.') +
  qa('როგორ ვშლი ან ვასწორებ ჩემს განცხადებას?',
    'პირად კაბინეტში ("ჩემი განცხადებები") შეგიძლია ნახო სტატუსი, შეასწორო ან წაშალო განთავსებული განცხადება.') +
  qa('რა ხდება, თუ ობიექტი უკვე გავყიდე?',
    'მოგვწერე ერთი წერილით ან წაშალე კაბინეტიდან — განცხადებას ვხურავთ, რომ აღარავის შეაწუხოს.') +
  qa('რამდენად სანდოა საკადასტრო მონაცემი?',
    'მონაცემი მოწოდებულია სსიპ საჯარო რეესტრის ეროვნული სააგენტოს ღია მონაცემებიდან და საცნობარო დანიშნულებისაა. იურიდიული ძალა მხოლოდ ოფიციალურ ამონაწერს აქვს — გარიგებამდე მისი აღება მაინც სასურველია.') +
  qa('როგორ მუშაობს „ვეძებ"?',
    'რუკაზე მონიშნავ არეალს, ბიუჯეტსა და ფართობს — შესაბამისი განცხადება ავტომატურად მოგივა, ჯერ ყველა დანარჩენზე ადრე, ხელახლა ძებნის გარეშე. დაწვრილებით: <a href="/buy">როგორ ვიყიდო უძრავი ქონება</a>.') +
  qa('ვინ არის MyMamuli.ge — შუამავალი ხართ?',
    'არა. ჩვენ ვართ საინფორმაციო პლატფორმა — გარიგება პირდაპირ ხდება მყიდველსა და გამყიდველს შორის, საკომისიოს გარეშე. დაწვრილებით: <a href="/terms">გამოყენების წესები</a>.');

const EN_BODY =
  qa('How much does it cost to post a listing?',
    "It's <b>free</b> — no one-time fee, no monthly fee. We take no commission on a sale either.") +
  qa('Why do I need a cadastral code?',
    'The code lets us confirm the property really exists in the Public Registry, and get its exact boundary, area and designation — the pin is also placed on the map automatically, without you having to mark it by hand. See <a href="/sell">How to post a listing</a>.') +
  qa('How long until my listing goes live?',
    'After verification, usually within <b>24 hours</b>.') +
  qa('Is my phone number visible to everyone?',
    "A seller's phone number appears on the listing card, so a buyer can call directly with no middleman. It's the opposite for \"search requests\": a buyer's contact details stay protected and hidden until they decide to respond themselves.") +
  qa('How do I edit or delete my listing?',
    'In your account ("My listings") you can see the status, edit, or delete a published listing.') +
  qa('What if I already sold the property?',
    "Send us a quick note or delete it from your account — we'll close the listing so it doesn't bother anyone else.") +
  qa('How reliable is the cadastral data?',
    "The data comes from the open data of the LEPL National Agency of Public Registry and is for reference only. Only an official extract carries legal force — getting one before closing a deal is still recommended.") +
  qa('How does the "search request" feature work?',
    'You mark an area, budget and size on the map — a matching listing comes to you automatically, before anyone else sees it, with no need to search again. Details: <a href="/buy">How to buy property</a>.') +
  qa('Who is MyMamuli.ge — are you a broker?',
    'No. We are an information platform — the deal happens directly between buyer and seller, with no commission. Details: <a href="/terms">Terms of Use</a>.');

const html_ka = page({
  lang: 'ka',
  title: 'ხშირად დასმული კითხვები — MyMamuli.ge',
  desc: 'პასუხები ხშირად დასმულ კითხვებზე MyMamuli.ge-ის შესახებ — განთავსების ღირებულება, საკადასტრო კოდი, ვადები, კონფიდენციალურობა და საკომისიო.',
  h1: 'ხშირად დასმული კითხვები',
  lead: 'ყველაზე ხშირი კითხვები ერთ ადგილას. თუ პასუხს ვერ პოულობ — მოგვწერე: info@mymamuli.ge',
  body: KA_BODY,
  backLabel: '← მთავარ გვერდზე დაბრუნება'
});

const html_en = page({
  lang: 'en',
  title: 'Frequently Asked Questions — MyMamuli.ge',
  desc: 'Answers to frequently asked questions about MyMamuli.ge — listing cost, cadastral codes, timelines, privacy and commission.',
  h1: 'Frequently Asked Questions',
  lead: "The most common questions, in one place. Can't find an answer — write to us: info@mymamuli.ge",
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
