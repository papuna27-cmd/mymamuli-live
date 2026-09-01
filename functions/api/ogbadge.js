/**
 * /api/ogbadge — მოკლე ტექსტური "ბეჯის" SVG გენერატორი (Facebook OG სურათებისთვის)
 * ==================================================================
 * ⚠️ 2026-09-01, George-ის "დიზაინი ა"-ს (ფასი + ლოგო ბარი) რეალიზაცია.
 *
 * Cloudflare Image Transformations-ის draw() ფენას (იხ. functions/api/
 * oglisting/[id].js) არ შეუძლია ტექსტის თვითონ დახატვა — მხოლოდ უკვე
 * არსებული სურათების კომპოზიცია. ამიტომ ფასის ტექსტს ცალკე, პატარა
 * SVG სურათად ვხატავთ აქ, draw()-ის ერთ-ერთ ფენად რომ გამოვიყენოთ.
 *
 * ⚠️ განზრახ მხოლოდ ASCII ტექსტი: ქართული (Mkhedruli) შრიფტი არსად
 * არ არის გარანტირებული Cloudflare-ის სურათის-დამუშავების pipeline-ში
 * (განსხვავებით თვითონ გვერდის ჩვეულებრივი ტექსტისგან, სადაც
 * ბრაუზერი/Facebook-ის საკუთარი ფონტი ერევა) — ამიტომ ფასის ბეჯში
 * მხოლოდ ციფრები/$/სლეშ-შემოკლებები ("$85,000 / mo") გამოიყენება,
 * ქართული ტექსტი კი og:title/og:description-ში რჩება (ცალკე, non-
 * image ელემენტებია, Facebook-ის თავად რენდერდება).
 *
 * პარამეტრი: ?t=<url-encoded ტექსტი, მაქს. 40 სიმბოლო>
 */
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const text = (url.searchParams.get('t') || '').slice(0, 40);
  const W = 560, H = 112;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<text x="32" y="61" dominant-baseline="middle" text-anchor="start"
 font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="42" fill="#FFFFFF">${esc(text)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=86400'
    }
  });
}
