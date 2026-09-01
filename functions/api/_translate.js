/**
 * _translate.js — ავტომატური თარგმანი (ქართული ↔ ინგლისური)
 * ==================================================================
 *
 * 2026-09-01, George-ის მოთხოვნით: განცხადებების (lst) სათაური+აღწერა+
 * საკონტაქტო სახელი, და მაძიებლის მოთხოვნის (req) შენიშვნა ავტომატურად
 * ითარგმნება საწინააღმდეგო ენაზე, რომ ვიზიტორმა ნახოს კონტენტი მისი
 * მიმდინარე საიტის ენაზე (LANG), მიუხედავად იმისა, თუ რა ენაზე დაწერა
 * ორიგინალი ავტორმა.
 *
 * ძრავი: Cloudflare Workers AI (`env.AI`) — უფასო/ჩაშენებული, საჭიროებს
 * მხოლოდ ერთ "AI" ბაინდინგს Cloudflare Pages პროექტის Settings→Functions-ში
 * (დეშბორდიდან ემატება ხელით, კოდში/wrangler.toml-ში არაფერია საჭირო).
 *
 * მოდელი: @cf/meta/llama-3.3-70b-instruct-fp8-fast — ინსტრუქციაზე
 * მორგებული, დიდი მრავალენოვანი მოდელი. განზრახ არჩეულია სპეციალიზებული
 * NMT მოდელების (მაგ. m2m100) ნაცვლად — ინსტრუქციური მოდელი გაცილებით
 * ზუსტად იცავს კონტექსტს (უძრავი ქონების ტერმინები, რიცხვები, მისამართები)
 * და გამოვთხოვთ სტრუქტურირებულ (JSON) პასუხს ერთდროულად რამდენიმე
 * ველისთვის — ეს ერთ API-გამოძახებაში აერთიანებს სათაურს+აღწერას+სახელს,
 * რაც submit.js-ის მოთხოვნის დროს ლატენტობას ამცირებს.
 *
 * ვერ ვთარგმნით საკუთარ სახელს "მნიშვნელობით" (Giorgi → George არასწორია) —
 * მხოლოდ ფონეტიკურად ვტრანსლიტერირებთ ლათინურ/ქართულ დამწერლობაზე,
 * რასაც პრომფთში ცალკე ვუსვამთ ხაზს.
 */

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const KA_RX = /[Ⴀ-ჿᲐ-Ჿ]/; // ქართული + მთავრული ბლოკები

/** ტექსტში ქართული ასოების არსებობით ვსაზღვრავთ ორიგინალის ენას. */
export function detectLang(text) {
  return KA_RX.test(String(text || '')) ? 'ka' : 'en';
}

function stripFence(s) {
  return String(s || '')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
}

function firstJsonObject(s) {
  const i = s.indexOf('{'), j = s.lastIndexOf('}');
  if (i === -1 || j === -1 || j <= i) throw new Error('no-json');
  return JSON.parse(s.slice(i, j + 1));
}

const ANON_NAMES = new Set(['ვიზიტორი', 'Visitor']);

/**
 * თარგმნის lst-ის ttl+dsc+contact_name-ს ერთდროულად, ერთი AI-გამოძახებით.
 * @param {*} env      Pages Function env (env.AI საჭიროა)
 * @param {object} f   { ttl, dsc, name } — ორიგინალი ველები
 * @param {string} origLang  'ka'|'en' — ორიგინალის ენა (detectLang-ით)
 * @returns {Promise<{ok:boolean, ttl_tr?:string, dsc_tr?:string, name_tr?:string|null, reason?:string}>}
 */
export async function translateListing(env, f, origLang) {
  if (!env.AI) return { ok: false, reason: 'no-ai-binding' };

  const target = origLang === 'ka' ? 'en' : 'ka';
  const name = f.name || '';
  const anon = ANON_NAMES.has(name);

  const sys = target === 'en'
    ? 'You are a professional Georgian-to-English translator specializing in Georgian real-estate listings. ' +
      'Translate the given fields faithfully and completely — do not summarize, shorten, embellish, or omit ' +
      'any detail; keep every number, unit, measurement, and address exact. Keep place names recognizable ' +
      '(use the standard English exonym if one exists, otherwise transliterate). The "name" field is a ' +
      'person\'s given name — do NOT translate its meaning, only transliterate it phonetically into Latin ' +
      'script (e.g. "გიორგი" -> "Giorgi", not "George"). If a field is an empty string, return it as an ' +
      'empty string. Respond with ONLY a single raw JSON object, no markdown code fences, no commentary, ' +
      'in exactly this shape: {"title":"...","desc":"...","name":"..."}'
    : 'შენ ხარ პროფესიონალი ინგლისურ-ქართული მთარგმნელი, სპეციალიზებული უძრავი ქონების განცხადებებზე. ' +
      'თარგმნე მოცემული ველები ზუსტად და სრულად — არაფერი შეამოკლო, არ დაამატო და არაფერი გამოტოვო; ' +
      'ყველა რიცხვი, ერთეული, ზომა და მისამართი ზუსტად უნდა დარჩეს. ადგილის სახელები ამოიცანი ჩვეული ' +
      'ქართული ფორმით. ველი "name" არის ადამიანის სახელი — ნუ თარგმნი მის მნიშვნელობას, მხოლოდ ფონეტიკურად ' +
      'გადმოეცი ქართული დამწერლობით (მაგ. "George" -> "ჯორჯი", ან თუ ეს აშკარად ქართული სახელის ინგლისური ' +
      'ჩანაწერია, დააბრუნე ორიგინალი ქართული ფორმა). თუ ველი ცარიელი სტრიქონია, დააბრუნე ცარიელი სტრიქონი. ' +
      'უპასუხე მხოლოდ ერთი სუფთა JSON ობიექტით, მარკდაუნის ჩარჩოების ან კომენტარის გარეშე, ზუსტად ამ ფორმით: ' +
      '{"title":"...","desc":"...","name":"..."}';

  const user = JSON.stringify({
    title: f.ttl || '',
    desc: f.dsc || '',
    name: anon ? '' : name
  });

  try {
    const r = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user }
      ],
      max_tokens: 2048
    });
    const parsed = firstJsonObject(stripFence(r && r.response));
    return {
      ok: true,
      ttl_tr: String(parsed.title ?? '').trim(),
      dsc_tr: String(parsed.desc ?? '').trim(),
      name_tr: anon ? name : (String(parsed.name ?? '').trim() || null)
    };
  } catch (e) {
    return { ok: false, reason: String((e && e.message) || e) };
  }
}

/**
 * თარგმნის req-ის თავისუფალ ტექსტურ note-ს.
 * @returns {Promise<{ok:boolean, note_tr?:string, reason?:string}>}
 */
export async function translateNote(env, note, origLang) {
  const text = String(note || '').trim();
  if (!text) return { ok: true, note_tr: '' };
  if (!env.AI) return { ok: false, reason: 'no-ai-binding' };

  const target = origLang === 'ka' ? 'en' : 'ka';
  const sys = target === 'en'
    ? 'Translate the following Georgian real-estate buyer note into English, faithfully and completely, ' +
      'preserving every detail and number. Respond with ONLY the translated text — no quotes, no commentary, ' +
      'no markdown.'
    : 'თარგმნე შემდეგი ინგლისურენოვანი მყიდველის შენიშვნა ქართულად, ზუსტად და სრულად, ყველა დეტალისა და ' +
      'რიცხვის შენარჩუნებით. უპასუხე მხოლოდ თარგმნილი ტექსტით — ბრჭყალების, კომენტარის ან მარკდაუნის გარეშე.';

  try {
    const r = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: text }
      ],
      max_tokens: 1024
    });
    return { ok: true, note_tr: stripFence(String((r && r.response) || '')).trim() };
  } catch (e) {
    return { ok: false, reason: String((e && e.message) || e) };
  }
}
