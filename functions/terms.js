/**
 * /terms — Pages Function (არა static ფაილი დირექტორია+index.html სახით)
 * ==========================================================================
 * რატომ Function და არა static /terms/index.html: Cloudflare Pages-ის
 * default static-asset routing დირექტორია+index.html კომბინაციისთვის
 * ავტომატურად აკეთებდა 308 redirect-ს /terms → /terms/-ზე (Cloudflare-ის
 * ჩაშენებული ქცევა, არ იმართება _headers/_redirects-იდან), რაც canonical-სა
 * (/terms, slash-ის გარეშე) და ნამდვილად სერვირებულ URL-ს (/terms/) შორის
 * მისმატებას ქმნიდა და sitemap-ის URL-ებს redirect chain-ს ატარებინებდა.
 * Pages Function ზუსტ, უცვლელ /terms მისამართზე პასუხობს პირდაპირ 200-ით,
 * რაიმე redirect-ის გარეშე — იგივე მიდგომაა, რასაც [type]/[city].js იყენებს.
 *
 * ⚠️ 2026-08-26: George-ის აუდიტით — გვერდს ინგლისური ვერსია საერთოდ არ
 * ჰქონდა (LANG=en-ზეც ქართული ჩანდა). ეს Function-ია, არა კლიენტის JS,
 * ამიტომ i18n.js/trNode-ს ვერ ვეყრდნობით — ენა სერვერზე, ?lang=en
 * query-პარამეტრით ვირჩევთ (იგივე კონვენცია, რასაც index.html/form.html
 * იყენებს), და შესაბამის ენაზე ვაბრუნებთ სრულ HTML-ს.
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
h4{font-size:15px;margin:22px 0 8px;color:#0F6B4F}
p{color:#31413B;margin-bottom:10px}
ul{margin:0 0 12px 20px;color:#31413B}
li{margin-bottom:6px}
b{color:#0E1A16}
.note{background:#F5F4F0;border-radius:10px;padding:12px 14px;font-size:14px;color:#4A5A54;margin:14px 0;display:flex;gap:8px}
a{color:#0F6B4F}
.back{display:inline-block;margin-top:26px;color:#0F6B4F;font-weight:600;text-decoration:none}`;

function page({ lang, title, desc, h1, lead, sections, backLabel }) {
  const langsw = lang === 'en'
    ? `<span class="langsw"><a href="/terms">KA</a><span>·</span><a class="on" href="/terms?lang=en">EN</a></span>`
    : `<span class="langsw"><a class="on" href="/terms">KA</a><span>·</span><a href="/terms?lang=en">EN</a></span>`;
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
<link rel="canonical" href="https://mymamuli.ge/terms${lang === 'en' ? '?lang=en' : ''}">
<link rel="alternate" hreflang="ka" href="https://mymamuli.ge/terms">
<link rel="alternate" hreflang="en" href="https://mymamuli.ge/terms?lang=en">
<link rel="alternate" hreflang="x-default" href="https://mymamuli.ge/terms">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MyMamuli.ge">
<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'ka_GE'}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="https://mymamuli.ge/terms${lang === 'en' ? '?lang=en' : ''}">
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
${sections}
  </div>
  <a class="back" href="/">${backLabel}</a>
</div>
</body>
</html>`;
}

const KA_SECTIONS = `
    <h4>პლატფორმის როლი</h4>
    <p>MyMamuli.ge არის საინფორმაციო პლატფორმა. ჩვენ <b>არ ვართ</b> გარიგების მხარე,
    არ ვართ ბროკერი და საკომისიოს არ ვიღებთ. გარიგება მყიდველსა და გამყიდველს შორის ხდება.</p>

    <h4>განცხადების ავტორი</h4>
    <p>განთავსებამდე ავტორი ცალკე ადასტურებს ოთხ პუნქტს — თანხმობის თარიღი
    და ვერსია ინახება:</p>
    <ul>
     <li><b>მონაცემები ზუსტია</b> — ფასი, ფართობი, საკადასტრო კოდი და აღწერა
     სინამდვილეს შეესაბამება;</li>
     <li><b>განთავსების უფლება აქვს</b> — არის მესაკუთრე ან აქვს მესაკუთრის ნებართვა;</li>
     <li><b>ფოტოები ამ ობიექტისაა</b> — რეალურია და სხვისი ობიექტიდან აღებული არ არის;</li>
     <li>ვალდებულია შეგვატყობინოს ობიექტის გაყიდვის შესახებ.</li>
    </ul>
    <p>ცრუ ინფორმაციის დადასტურების შემთხვევაში განცხადება იშლება,
    ანგარიში კი იბლოკება.</p>

    <h4>მოთხოვნის ავტორი — მაძიებელი</h4>
    <p>მოთხოვნის განთავსება უფასოა, მაგრამ ერთ პირობას შეიცავს:
    <b>გამოგზავნილ შეთავაზებებს უნდა გაეცნო.</b></p>
    <p>როცა მესაკუთრე შენს მოთხოვნას პასუხობს, ის რეალურ სამუშაოს ასრულებს —
    ობიექტს არეგისტრირებს, საკადასტრო კოდს ამოწმებს, ფოტოებს დებს.
    თუ ეს ყველაფერი გაუხსნელი რჩება, მისი შრომა ტყუილად იხარჯება.</p>
    <ul>
     <li>ვამოწმებთ მხოლოდ იმას, გახსენი თუ არა გამოგზავნილი შეთავაზება —
     <b>წერილის წაკითხვას არ ვზომავთ</b>, მხოლოდ ბმულზე გადასვლას;</li>
     <li>თუ ხანგრძლივად არცერთს არ გახსნი, ჯერ <b>გკითხავთ</b>, შეესაბამებოდა თუ არა
     შეთავაზებები — შენი პასუხი ჩვენს ძებნასაც აუმჯობესებს;</li>
     <li>თუ არც ამაზე იქნება რეაქცია, მოთხოვნა <b>შეჩერდება</b> (წაშლა არა —
     აღდგენა ერთი წერილითაა შესაძლებელი);</li>
     <li>განმეორებით შემთხვევაში ანგარიში <b>იბლოკება</b>. ბლოკვამდე
     შეტყობინებას აუცილებლად მიიღებ და პასუხის საშუალებაც გექნება.</li>
    </ul>
    <div class="note"><span>◈</span><span>ეს არ არის სასჯელი — ეს იმის დაცვაა, ვინც
    შენს მოთხოვნას რეალურად პასუხობს. სწორედ ამიტომ არ ჰგავს ეს ბაზა
    უფასო განცხადებების დაფას.</span></div>

    <h4>რას ვშლით</h4>
    <ul>
     <li>განცხადებას არარსებული ან გაუქმებული საკადასტრო კოდით;</li>
     <li>დუბლიკატს;</li>
     <li>სხვისი ფოტოს ან სხვისი ნაკვეთის განთავსებას;</li>
     <li>შეურაცხმყოფელ ან შეცდომაში შემყვან შინაარსს.</li>
    </ul>

    <h4>საკადასტრო მონაცემი</h4>
    <p>საზღვრები და ატრიბუტები მოწოდებულია საჯარო რეესტრის ღია მონაცემებიდან და
    საცნობარო დანიშნულებისაა. იურიდიული ძალა მხოლოდ ოფიციალურ ამონაწერს აქვს.</p>`;

const EN_SECTIONS = `
    <h4>The platform's role</h4>
    <p>MyMamuli.ge is an information platform. We are <b>not</b> a party to any deal,
    we are not a broker, and we take no commission. The deal happens directly between buyer and seller.</p>

    <h4>Listing author</h4>
    <p>Before posting, the author separately confirms four points — the date
    and version of that consent is stored:</p>
    <ul>
     <li><b>The data is accurate</b> — price, area, cadastral code and description
     match reality;</li>
     <li><b>They have the right to post</b> — they are the owner or have the owner's permission;</li>
     <li><b>The photos are of this property</b> — they are real and not taken from someone else's listing;</li>
     <li>They are obligated to notify us once the property is sold.</li>
    </ul>
    <p>If confirmed information turns out to be false, the listing is removed
    and the account is blocked.</p>

    <h4>Request author — buyer</h4>
    <p>Posting a request is free, with one condition:
    <b>you must review the offers you receive.</b></p>
    <p>When an owner responds to your request, they do real work —
    registering the property, verifying the cadastral code, adding photos.
    If none of that ever gets opened, their effort is wasted for nothing.</p>
    <ul>
     <li>We only check whether you opened an offer sent to you —
     <b>we don't track whether you read the message</b>, only whether you clicked the link;</li>
     <li>If you go a long time without opening any, we'll first <b>ask</b> whether the offers
     matched what you wanted — your answer also helps our matching;</li>
     <li>If there's still no response, the request will be <b>paused</b> (not deleted —
     it can be restored with a single email);</li>
     <li>On a repeat occurrence the account is <b>blocked</b>. You'll always get
     a notice before that happens, with a chance to respond.</li>
    </ul>
    <div class="note"><span>◈</span><span>This isn't a punishment — it protects the people who
    actually respond to your request. That's exactly why this isn't
    like a free classifieds board.</span></div>

    <h4>What we remove</h4>
    <ul>
     <li>Listings with a non-existent or cancelled cadastral code;</li>
     <li>Duplicates;</li>
     <li>Someone else's photos or someone else's property posted as their own;</li>
     <li>Offensive or misleading content.</li>
    </ul>

    <h4>Cadastral data</h4>
    <p>Boundaries and attributes come from the Public Registry's open data and are
    for reference only. Only the official extract carries legal force.</p>`;

const html_ka = page({
  lang: 'ka',
  title: 'გამოყენების წესები — MyMamuli.ge',
  desc: 'MyMamuli.ge-ის გამოყენების წესები — პლატფორმის როლი, განცხადების ავტორის ვალდებულებები, მოთხოვნის წესები და საკადასტრო მონაცემის სტატუსი.',
  h1: 'გამოყენების წესები',
  lead: 'მოკლედ და გასაგებად — რას ვაკეთებთ ჩვენ და რაზე ხარ პასუხისმგებელი შენ.',
  sections: KA_SECTIONS,
  backLabel: '← მთავარ გვერდზე დაბრუნება'
});

const html_en = page({
  lang: 'en',
  title: 'Terms of Use — MyMamuli.ge',
  desc: "MyMamuli.ge's terms of use — the platform's role, listing-author obligations, request rules and the status of cadastral data.",
  h1: 'Terms of Use',
  lead: "Short and clear — what we do, and what you're responsible for.",
  sections: EN_SECTIONS,
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
