/**
 * /privacy — Pages Function. იხ. functions/terms.js-ის თავსართი კომენტარი
 * იმისთვის, თუ რატომ Function და არა static /privacy/index.html.
 *
 * ⚠️ 2026-08-26: George-ის აუდიტით — ინგლისური ვერსია დამატებულია
 * (?lang=en), იგივე მიდგომით, რასაც terms.js იყენებს.
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
a{color:#0F6B4F}
.back{display:inline-block;margin-top:26px;color:#0F6B4F;font-weight:600;text-decoration:none}`;

function page({ lang, title, desc, h1, lead, sections, backLabel }) {
  const langsw = lang === 'en'
    ? `<span class="langsw"><a href="/privacy">KA</a><span>·</span><a class="on" href="/privacy?lang=en">EN</a></span>`
    : `<span class="langsw"><a class="on" href="/privacy">KA</a><span>·</span><a href="/privacy?lang=en">EN</a></span>`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://mymamuli.ge/privacy${lang === 'en' ? '?lang=en' : ''}">
<link rel="alternate" hreflang="ka" href="https://mymamuli.ge/privacy">
<link rel="alternate" hreflang="en" href="https://mymamuli.ge/privacy?lang=en">
<link rel="alternate" hreflang="x-default" href="https://mymamuli.ge/privacy">
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
    <h4>რას ვინახავთ</h4>
    <ul>
     <li><b>განცხადებისთვის:</b> საკადასტრო კოდი, ფასი, ფოტო და ტელეფონი, რომელსაც შენ თვითონ გვაწვდი.</li>
     <li><b>ანონიმური სტატისტიკა:</b> რომელი რეგიონი და კატეგორია იხსნება ხშირად. კონკრეტულ ადამიანს არ უკავშირდება.</li>
    </ul>

    <h4>წაშლა</h4>
    <p>ერთი წერილი <a href="mailto:info@mymamuli.ge">info@mymamuli.ge</a>-ზე და შენს განცხადებასა და მონაცემს ვშლით.</p>`;

const EN_SECTIONS = `
    <h4>What we store</h4>
    <ul>
     <li><b>For a listing:</b> the cadastral code, price, photo and phone number that you provide yourself.</li>
     <li><b>Anonymous statistics:</b> which region and category get opened most often. Not tied to a specific person.</li>
    </ul>

    <h4>Deletion</h4>
    <p>One email to <a href="mailto:info@mymamuli.ge">info@mymamuli.ge</a> and we delete your listing and data.</p>`;

const html_ka = page({
  lang: 'ka',
  title: 'კონფიდენციალურობა — MyMamuli.ge',
  desc: 'MyMamuli.ge-ის კონფიდენციალურობის პოლიტიკა — რა მონაცემს ვინახავთ და როგორ შეგიძლია მისი წაშლა.',
  h1: 'კონფიდენციალურობა',
  lead: 'რაც ნაკლები მონაცემი გვაქვს, მით ნაკლებია დასაკარგი. ამ პრინციპით ვმუშაობთ.',
  sections: KA_SECTIONS,
  backLabel: '← მთავარ გვერდზე დაბრუნება'
});

const html_en = page({
  lang: 'en',
  title: 'Privacy — MyMamuli.ge',
  desc: "MyMamuli.ge's privacy policy — what data we store and how you can have it deleted.",
  h1: 'Privacy',
  lead: 'The less data we hold, the less there is to lose. That is the principle we work by.',
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
