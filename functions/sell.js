/**
 * /sell — Pages Function. იხ. functions/terms.js-ის თავსართი კომენტარი
 * იმისთვის, თუ რატომ Function და არა static /sell/index.html.
 *
 * ⚠️ 2026-08-26, George-ის მოთხოვნით — მოდალის "გამყიდველს" (PAGES.sell)
 * ტექსტი აქამდე მხოლოდ SPA-ს JS-ში არსებობდა (index.html-ის openModal()
 * გამოძახებით), საკუთარი URL-ის, title-ის და meta description-ის გარეშე.
 * ანუ ვერავინ გააზიარებდა პირდაპირ ბმულს "როგორ გავყიდო" გვერდზე — ყველა
 * ბმული მთავარ გვერდზე ჩამოვარდებოდა. აქ იგივე კონტენტი დამოუკიდებელ,
 * crawlable გვერდადაა გატანილი — ზუსტად იმავე კონვენციით, რასაც
 * how-it-works.js/terms.js/privacy.js იყენებს (?lang=en, canonical,
 * hreflang). ძველი, აღარ-გამოყენებადი ხელით შევსების ფორმის ბლოკი
 * (#lform, id="lf-k" და ა.შ. — SPA-ს PAGES.sell-შიც უკვე მკვდარი კოდია,
 * ნამდვილი განცხადება form.html-ის საშუალებით იგზავნება) აქ საერთოდ არ
 * გამეორებულა — მის მაგივრად პირდაპირ ცოცხალ ფორმაზე (`/#post`) გადის CTA.
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
ul{margin:0 0 12px 20px;color:#31413B}
li{margin-bottom:6px}
b{color:#0E1A16}
.stp{display:flex;flex-direction:column;gap:10px;margin:14px 0 4px}
.stp .s{display:flex;gap:13px;align-items:flex-start;background:#F7F5F1;border-radius:12px;padding:13px 15px}
.stp .sn{flex:0 0 auto;width:26px;height:26px;border-radius:50%;background:#0F6B4F;color:#fff;
 font:700 13px/26px -apple-system,sans-serif;text-align:center}
.stp .st{min-width:0}
.stp .st b{display:block;font-size:13.5px;margin-bottom:2px}
.stp .st span{display:block;font-size:12.5px;line-height:1.55;color:#4A5A54}
.stp .s.acc{background:#FBF4E8}
.stp .s.acc .sn{background:#C8873A}
.cbox{background:#EFF6F2;border-radius:14px;padding:18px 20px;margin:22px 0}
.cbox b{display:block;margin-bottom:6px}
.cb{display:inline-block;margin-top:8px;background:#0F6B4F;color:#fff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:10px;font-size:14px}
.note{background:#F5F4F0;border-radius:10px;padding:12px 14px;font-size:14px;color:#4A5A54;margin:14px 0;display:flex;gap:8px}
a{color:#0F6B4F}
.back{display:inline-block;margin-top:26px;color:#0F6B4F;font-weight:600;text-decoration:none}`;

function page({ lang, title, desc, h1, lead, body, backLabel }) {
  const langsw = lang === 'en'
    ? `<span class="langsw"><a href="/sell">KA</a><span>·</span><a class="on" href="/sell?lang=en">EN</a></span>`
    : `<span class="langsw"><a class="on" href="/sell">KA</a><span>·</span><a href="/sell?lang=en">EN</a></span>`;
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
<link rel="canonical" href="https://mymamuli.ge/sell${lang === 'en' ? '?lang=en' : ''}">
<link rel="alternate" hreflang="ka" href="https://mymamuli.ge/sell">
<link rel="alternate" hreflang="en" href="https://mymamuli.ge/sell?lang=en">
<link rel="alternate" hreflang="x-default" href="https://mymamuli.ge/sell">
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
     <div class="s"><span class="sn">1</span><span class="st"><b>შეავსე ფორმა</b>
      <span>საკადასტრო კოდი, ფასი, ფოტოები და მოკლე აღწერა — მისამართს, ფართობსა და დანიშნულებას ფორმა თავად წაიღებს საჯარო რეესტრიდან.</span></span></div>
     <div class="s"><span class="sn">2</span><span class="st"><b>ჩვენ ვამოწმებთ</b>
      <span>საკადასტრო კოდს ვადარებთ საჯარო რეესტრს — ვიღებთ ზუსტ საზღვარს, ფართობს, დანიშნულებასა და სტატუსს.</span></span></div>
     <div class="s"><span class="sn">3</span><span class="st"><b>განთავსება 24 საათში</b>
      <span>გამოქვეყნების შემდეგ ბმულს გამოგიგზავნით. თუ რამე ცდება — მოგვწერე და ვასწორებთ.</span></span></div>
     <div class="s"><span class="sn">4</span><span class="st"><b>მყიდველი პირდაპირ გირეკავს</b>
      <span>ჩვენ ზარებში არ ვერევით და საკომისიოს არ ვიღებთ. გაყიდვის შემდეგ ერთი წერილი — და განცხადებას ვხურავთ.</span></span></div>
    </div>

    <div class="cbox">
     <b>მზად ხარ დაწყებისთვის?</b>
     <p>შეავსე ფორმა — დანარჩენს ჩვენ გავაკეთებთ. განცხადებას <b>24 საათში</b> ვდებთ საიტზე.</p>
     <a class="cb" href="/#post">განცხადების ფორმა →</a>
    </div>

    <h4>რა უნდა იცოდე</h4>
    <ul>
     <li>განთავსება <b>უფასოა</b> — არც ერთჯერადი გადასახადია, არც თვიური.</li>
     <li>ფოტოებს ლოგო ავტომატურად ედება.</li>
     <li>ერთ ობიექტს ერთი განცხადება. დუბლიკატს ვშლით.</li>
    </ul>

    <div class="note"><span>⚠</span><span>განცხადებას ვდებთ მხოლოდ მაშინ, თუ საკადასტრო კოდი რეესტრში იძებნება.
    კოდის გარეშე ან გაუქმებულ ნაკვეთზე განთავსება არ ხდება.</span></div>`;

const EN_BODY = `
    <div class="stp">
     <div class="s"><span class="sn">1</span><span class="st"><b>Fill out the form</b>
      <span>Cadastral code, price, photos and a short description — the form pulls the address, area and designation from the Public Registry itself.</span></span></div>
     <div class="s"><span class="sn">2</span><span class="st"><b>We verify it</b>
      <span>We check the cadastral code against the Public Registry — getting the exact boundary, area, designation and status.</span></span></div>
     <div class="s"><span class="sn">3</span><span class="st"><b>Live within 24 hours</b>
      <span>We'll send you the link once it's published. If something's off, tell us and we'll fix it.</span></span></div>
     <div class="s"><span class="sn">4</span><span class="st"><b>The buyer calls you directly</b>
      <span>We don't get involved in calls and take no commission. One email after the sale, and we close the listing.</span></span></div>
    </div>

    <div class="cbox">
     <b>Ready to start?</b>
     <p>Fill out the form — we'll handle the rest. Your listing goes live in <b>24 hours</b>.</p>
     <a class="cb" href="/#post">Listing form →</a>
    </div>

    <h4>What to know</h4>
    <ul>
     <li>Posting is <b>free</b> — no one-time fee, no monthly fee.</li>
     <li>Our logo is added to photos automatically.</li>
     <li>One listing per property. We remove duplicates.</li>
    </ul>

    <div class="note"><span>⚠</span><span>We only publish a listing if its cadastral code can be found in the Public Registry.
    Listings without a code, or on a cancelled parcel, are not posted.</span></div>`;

const html_ka = page({
  lang: 'ka',
  title: 'როგორ გავყიდო უძრავი ქონება — MyMamuli.ge',
  desc: 'როგორ განათავსო შენი ქონება MyMamuli.ge-ზე — საკადასტრო კოდის შემოწმება საჯარო რეესტრში, უფასო განთავსება 24 საათში, პირდაპირი კონტაქტი მყიდველთან, საკომისიოს გარეშე.',
  h1: 'როგორ განვათავსო განცხადება',
  lead: 'ერთი ფორმა, ორი წუთი — დანარჩენს ჩვენ ვაკეთებთ. საკადასტრო კოდს საჯარო რეესტრს ვადარებთ, ასე ვრწმუნდებით რომ ობიექტი მართლა არსებობს და მონაცემი სწორია.',
  body: KA_BODY,
  backLabel: '← მთავარ გვერდზე დაბრუნება'
});

const html_en = page({
  lang: 'en',
  title: 'How to sell your property — MyMamuli.ge',
  desc: "How to list your property on MyMamuli.ge — cadastral code verification against the Public Registry, free posting live within 24 hours, direct contact with the buyer, no commission.",
  h1: 'How to post a listing',
  lead: "One form, two minutes — we handle the rest. We check the cadastral code against the Public Registry, so we can confirm the property really exists and the data is correct.",
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
