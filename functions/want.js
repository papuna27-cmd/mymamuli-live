/**
 * /want — Pages Function. იხ. functions/terms.js-ის თავსართი კომენტარი
 * იმისთვის, თუ რატომ Function და არა static /want/index.html.
 *
 * ⚠️ 2026-08-26, George-ის მოთხოვნით — "MyMamuli.ge" საინფორმაციო მოდალის
 * თითოეულ ტაბს (მთავარი/ვყიდი/ვეძებ/მყიდველს/წესები/კონფიდენციალურობა)
 * უნიკალური, გასაზიარებელი URL სჭირდებოდა — George-მა თავად ვერ იპოვა
 * "ხშირად დასმული კითხვები" გვერდი, რადგან ტაბებს შორის გადართვისას
 * მისამართების ზოლო არასოდეს იცვლებოდა. 5 ტაბიდან 5-ს (main→/how-it-works,
 * post→/sell, buy→/buy, terms→/terms, priv→/privacy) უკვე ჰქონდა
 * crawlable Function-გვერდი — მხოლოდ "ვეძებ" ტაბს (PAGES.want, index.html-ში)
 * აკლდა, რადგან ის თავად ცოცხალი ფორმის iframe-ია (არა საინფორმაციო
 * ტექსტი). აქ იმ ფორმის მოკლე, დამოუკიდებელი "როგორ მუშაობს" ახსნაა —
 * ზუსტად იმავე კონვენციით, რასაც sell.js/buy.js იყენებს. CTA ცოცხალ
 * თვითმომსახურების ფორმაზე (`/#want`) გადის.
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
.cbox{background:#EFF6F2;border-radius:14px;padding:18px 20px;margin:22px 0}
.cbox b{display:block;margin-bottom:6px}
.cb{display:inline-block;margin-top:8px;background:#0F6B4F;color:#fff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:10px;font-size:14px}
.note{background:#F5F4F0;border-radius:10px;padding:12px 14px;font-size:14px;color:#4A5A54;margin:14px 0;display:flex;gap:8px}
a{color:#0F6B4F}
.back{display:inline-block;margin-top:26px;color:#0F6B4F;font-weight:600;text-decoration:none}`;

function page({ lang, title, desc, h1, lead, body, backLabel }) {
  const langsw = lang === 'en'
    ? `<span class="langsw"><a href="/want">KA</a><span>·</span><a class="on" href="/want?lang=en">EN</a></span>`
    : `<span class="langsw"><a class="on" href="/want">KA</a><span>·</span><a href="/want?lang=en">EN</a></span>`;
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
<link rel="canonical" href="https://mymamuli.ge/want${lang === 'en' ? '?lang=en' : ''}">
<link rel="alternate" hreflang="ka" href="https://mymamuli.ge/want">
<link rel="alternate" hreflang="en" href="https://mymamuli.ge/want?lang=en">
<link rel="alternate" hreflang="x-default" href="https://mymamuli.ge/want">
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
     <div class="s"><span class="sn">1</span><span class="st"><b>მონიშნე არეალი რუკაზე</b>
      <span>დახაზე ის უბანი, სადაც ობიექტის ყიდვა გაინტერესებს — ქუჩა, უბანი ან მთელი ქალაქის ნაწილი.</span></span></div>
     <div class="s"><span class="sn">2</span><span class="st"><b>მიუთითე ბიუჯეტი და ფართობი</b>
      <span>მაქსიმალური ფასი და სასურველი ფართობი საკმარისია — დანარჩენს სისტემა თავად ითვლის.</span></span></div>
     <div class="s"><span class="sn">3</span><span class="st"><b>სისტემა თავად აწყვილებს</b>
      <span>თუ ახალი ან უკვე არსებული ობიექტი მონიშნულ არეალსა და ფასს ერგება, შეტყობინება პირდაპირ შენთან მოდის — ხელახლა ძებნის გარეშე.</span></span></div>
    </div>

    <div class="cbox">
     <b>მზად ხარ დაწყებისთვის?</b>
     <p>დახაზე არეალი და მიუთითე ბიუჯეტი — დანარჩენს სისტემა აკეთებს.</p>
     <a class="cb" href="/#want">მოთხოვნის დატოვება →</a>
    </div>

    <h4>რას ხედავენ სხვები შენს მოთხოვნაში</h4>
    <div class="stp">
     <div class="s"><span class="sn">✓</span><span class="st"><b>ჩანს მხოლოდ სამი რამ</b>
      <span>სასურველი ადგილი რუკაზე, ბიუჯეტი და ფართობი. სახელი, ტელეფონის ნომერი და ელფოსტა — არა.</span></span></div>
     <div class="s"><span class="sn">✓</span><span class="st"><b>ვერავინ დაგირეკავს</b>
      <span>მესაკუთრეს შენთან პირდაპირი კავშირი არ აქვს. თუ მისი ობიექტი შენს მოთხოვნას ემთხვევა, შეთავაზება ელფოსტაზე მოგივა.</span></span></div>
     <div class="s"><span class="sn">✓</span><span class="st"><b>არჩევანი შენია</b>
      <span>შემოსული შეთავაზებებიდან თვითონ წყვეტ, ვის დაუკავშირდე და ვის არა. მოთხოვნის წაშლა ნებისმიერ დროს შეგიძლია.</span></span></div>
    </div>

    <div class="note"><span>ⓘ</span><span>მოთხოვნის დატოვება უფასოა. დაწვრილებით იხილეთ
    <a href="/buy">როგორ ვიყიდო უძრავი ქონება</a>.</span></div>`;

const EN_BODY = `
    <div class="stp">
     <div class="s"><span class="sn">1</span><span class="st"><b>Mark an area on the map</b>
      <span>Draw the zone you're interested in — a street, a neighborhood, or a whole part of the city.</span></span></div>
     <div class="s"><span class="sn">2</span><span class="st"><b>Set a budget and area</b>
      <span>A maximum price and the size you want is enough — the system does the rest.</span></span></div>
     <div class="s"><span class="sn">3</span><span class="st"><b>The system matches it for you</b>
      <span>If a new or existing property fits your marked area and price, you're notified directly — with no need to search again.</span></span></div>
    </div>

    <div class="cbox">
     <b>Ready to start?</b>
     <p>Draw the area and set a budget — the system handles the rest.</p>
     <a class="cb" href="/#want">Leave a request →</a>
    </div>

    <h4>What others see in your request</h4>
    <div class="stp">
     <div class="s"><span class="sn">✓</span><span class="st"><b>Only three things are shown</b>
      <span>The desired location on the map, budget and size. Not your name, phone number or email.</span></span></div>
     <div class="s"><span class="sn">✓</span><span class="st"><b>No one can call you</b>
      <span>The owner has no direct way to reach you. If their property matches your request, an offer comes to your email.</span></span></div>
     <div class="s"><span class="sn">✓</span><span class="st"><b>The choice is always yours</b>
      <span>You decide which offers to respond to. You can delete your request at any time.</span></span></div>
    </div>

    <div class="note"><span>ⓘ</span><span>Leaving a request is free. Details:
    <a href="/buy?lang=en">How to buy property</a>.</span></div>`;

const html_ka = page({
  lang: 'ka',
  title: 'როგორ დავტოვო მოთხოვნა — MyMamuli.ge',
  desc: 'როგორ დავტოვო მოთხოვნა MyMamuli.ge-ზე — მონიშნე არეალი რუკაზე, მიუთითე ბიუჯეტი და ფართობი, გამყიდველები თავად გიპოვიან, საკონტაქტო მონაცემები დაცულია.',
  h1: 'დატოვე მოთხოვნა რუკაზე',
  lead: 'არ გინდა ყოველდღე რუკის შემოწმება? მონიშნე შენთვის საინტერესო არეალი და ბიუჯეტი — შესაბამისი ობიექტი თავად მოგივა.',
  body: KA_BODY,
  backLabel: '← მთავარ გვერდზე დაბრუნება'
});

const html_en = page({
  lang: 'en',
  title: 'How to leave a search request — MyMamuli.ge',
  desc: 'How to leave a search request on MyMamuli.ge — mark an area on the map, set a budget and size, sellers find you, your contact details stay protected.',
  h1: 'Leave a request on the map',
  lead: "Don't want to check the map every day? Mark the area and budget you're interested in — a matching property comes to you.",
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
