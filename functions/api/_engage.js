/**
 * ჩართულობის კონტროლი — მაძიებლის კეთილსინდისიერება
 * ==================================================================
 *
 * მიზანი: გავფილტროთ ის, ვინც მოთხოვნას დებს, მაგრამ გამოგზავნილ
 * შეთავაზებებს არც კი ხსნის. ასეთი ანგარიში ბაზას ანაგვიანებს და
 * მესაკუთრეს ტყუილად ამუშავებს.
 *
 * ------------------------------------------------------------------
 * ⚠️ რატომ დაწკაპუნება და არა წერილის გახსნა
 *
 * წერილის გახსნას ჩვეულებრივ უხილავი სურათით ზომავენ. ჩვენთვის ეს
 * არ გამოდგება:
 *   • Apple Mail Privacy Protection ყველა სურათს წინასწარ ჩამოტვირთავს —
 *     ყველა წერილი „გახსნილად" ჩაითვლება, მათ შორის წაუკითხავი.
 *   • Outlook და Gmail-ის ნაწილი სურათებს ბლოკავს —
 *     წაკითხულიც „გაუხსნელად" დარჩება.
 * ე.ი. ამ ციფრზე დაყრდნობით უდანაშაულო ადამიანებს დავბლოკავდით.
 *
 * ამიტომ ვზომავთ **დაწკაპუნებას**: წერილში ბმული ჩვენს გამტარზე
 * (/api/r) გადის და ჩვენ ვიწერთ, რომელი განცხადება გახსნა.
 * ეს ნამდვილი, შეგნებული მოქმედებაა.
 *
 * ------------------------------------------------------------------
 * ⚠️ და ერთი მნიშვნელოვანი დათქმა
 *
 * დაბალი ჩართულობა ორ სხვადასხვა რამეს ნიშნავს:
 *   1. მომხმარებელს მართლა არ აინტერესებს  →  ჩვენი პრობლემა არაა
 *   2. ჩვენ არასწორ ობიექტებს ვუგზავნით     →  ეს ჩვენი პრობლემაა
 *
 * თუ პირდაპირ დავბლოკავთ, მეორე შემთხვევას ვერასდროს დავინახავთ —
 * საკუთარ ხარვეზს მომხმარებლის დადანაშაულებით დავფარავთ.
 * ამიტომ პირველი ნაბიჯი ბლოკვა არაა, არამედ **კითხვა**:
 * „ეს შეთავაზებები შეესაბამებოდა?" პასუხი ორივეს გვეუბნება —
 * ვინ არის უინტერესო და სად გვაქვს ჩვენ შეცდომა.
 */
import { now } from './_util.js';

/* ---------- ზღვრები ---------- */
export const RULES = {
  /* ═══ მთავარი წესი ═══
     10 შეთავაზება გაგზავნილი, არცერთი გახსნილი → ბლოკი.
     ქართული ბაზრისა და ჩვენი რადიუსებისთვის 10 საკმარისი ნიმუშია. */
  BLOCK_OFFERS: 10,

  /* ⚠️ სამი დღე მაინც უნდა გავიდეს. ეს არ არის სირბილე —
     10 შეთავაზება ერთ დღეშიც შეიძლება დაგროვდეს, ადამიანი კი
     შაბათ-კვირას ფოსტას ხშირად არ ხსნის. სამი დღის გარეშე
     შვებულებაში მყოფ რეალურ მყიდველს დავბლოკავდით. */
  MIN_DAYS: 3,

  MIN_OFFERS: 6,          /* ამაზე ნაკლებით რბილ ზომებზეც ნაადრევია */
  OK_RATE: 0.30,          /* 10-დან 3 — ჯანსაღია */
  OK_OPENS: 3,            /* ან უბრალოდ 3 გახსნილი — თუნდაც 20-დან */
  GRACE_DAYS: 7,          /* კითხვის შემდეგ რამდენს ველოდებით */
  BAD_REQS: 2             /* რამდენი შეჩერებული მოთხოვნა → ბლოკის კანდიდატი */
};

const DAY = 86400e3;

/**
 * ერთი მოთხოვნის შეფასება.
 * → { tier, rate, offers, opens, ageDays, why, action }
 *
 * tier:  new   — ჯერ ვერ ვიმსჯელებთ
 *        good  — ჩართულია
 *        low   — სუსტი, მაგრამ სიცოცხლის ნიშნით
 *        cold  — არცერთი არ გაუხსნია
 */
export function scoreReq(r, t = now()) {
  const offers = r.sent_n || 0;
  const opens = r.open_n || 0;
  const ageDays = Math.floor((t - (r.created || t)) / DAY);
  const rate = offers ? opens / offers : 0;

  const out = { offers, opens, ageDays, rate: +rate.toFixed(2) };

  /* ══ პირდაპირი წესი: 10 გაგზავნილი, 0 გახსნილი → ბლოკი ══
     რბილი საფეხურები (კითხვა → შეჩერება) აქ აღარ ეშვება.
     თუ ათჯერ არაფერი გახსნა, საკითხავი აღარაფერია. */
  if (offers >= RULES.BLOCK_OFFERS && opens === 0 && ageDays >= RULES.MIN_DAYS) {
    out.tier = 'cold';
    out.action = 'block';
    out.why = `${offers} შეთავაზება გაიგზავნა, არცერთი არ გახსნილა (${ageDays} დღე)`;
    return out;
  }

  /* საკმარისი მონაცემი არ გვაქვს — ხელს არ ვახლებთ */
  if (offers < RULES.MIN_OFFERS || ageDays < RULES.MIN_DAYS) {
    out.tier = 'new';
    out.why = `ჯერ ${offers} შეთავაზება, ${ageDays} დღე — მსჯელობა ნაადრევია`;
    out.action = 'wait';
    return out;
  }

  if (rate >= RULES.OK_RATE || opens >= RULES.OK_OPENS) {
    out.tier = 'good';
    out.why = `${opens}/${offers} გახსნილი — ჩართულია`;
    out.action = 'none';
    return out;
  }

  out.tier = opens === 0 ? 'cold' : 'low';

  /* ── ესკალაცია: ჯერ ვკითხოთ, მერე შევაჩეროთ ── */
  const sinceWarn = r.warn_at ? Math.floor((t - r.warn_at) / DAY) : null;

  if (!r.warned) {
    out.action = 'ask';
    out.why = opens === 0
      ? `${offers} შეთავაზება გავუგზავნეთ, არცერთი არ გაუხსნია`
      : `${offers}-დან მხოლოდ ${opens} გახსნა`;
    return out;
  }

  if (r.warned === 1) {
    if (sinceWarn != null && sinceWarn < RULES.GRACE_DAYS) {
      out.action = 'wait';
      out.why = `კითხვა გავუგზავნეთ ${sinceWarn} დღის წინ — ვიცდით`;
    } else {
      out.action = 'pause';
      out.why = `კითხვაზეც არ უპასუხა და არაფერი გაუხსნია — მოთხოვნა ჩერდება`;
    }
    return out;
  }

  out.action = 'none';                 /* უკვე შეჩერებულია */
  out.why = 'მოთხოვნა შეჩერებულია';
  return out;
}

/**
 * მომხმარებლის შეფასება — მისი ყველა მოთხოვნის მიხედვით.
 * ბლოკს ავტომატურად არ ვაკეთებთ: ვამზადებთ კანდიდატს ადმინისთვის.
 */
export function scoreUser(reqs, t = now()) {
  const scored = reqs.map(r => scoreReq(r, t));
  const paused = reqs.filter(r => r.status === 'paused' || r.warned === 2).length;
  const offers = scored.reduce((s, x) => s + x.offers, 0);
  const opens = scored.reduce((s, x) => s + x.opens, 0);
  const rate = offers ? opens / offers : 0;

  let verdict = 'ok', why = '';

  /* ერთი მოთხოვნაც კი, რომელმაც ბლოკის ზღვარს მიაღწია, საკმარისია */
  const hardBlock = scored.find(x => x.action === 'block');

  if (hardBlock) {
    verdict = 'block-candidate';
    why = hardBlock.why;
  } else if (scored.every(x => x.tier === 'new')) {
    verdict = 'new'; why = 'ჯერ ახალია';
  } else if (paused >= RULES.BAD_REQS && opens === 0) {
    verdict = 'block-candidate';
    why = `${paused} შეჩერებული მოთხოვნა, ${offers} შეთავაზება, არცერთი გახსნილი`;
  } else if (paused >= RULES.BAD_REQS) {
    verdict = 'watch';
    why = `${paused} შეჩერებული მოთხოვნა (${opens}/${offers} გახსნილი)`;
  } else if (rate >= RULES.OK_RATE) {
    verdict = 'ok'; why = `${opens}/${offers} გახსნილი`;
  } else {
    verdict = 'watch'; why = `${opens}/${offers} გახსნილი — დაბალია`;
  }

  return {
    verdict, why, offers, opens,
    hard: !!hardBlock,          /* ავტობლოკის უფლება აქვს */
    rate: +rate.toFixed(2), paused,
    /* rep: -100…100 — ადმინკაში ერთი ციფრით ჩანს */
    rep: offers < RULES.MIN_OFFERS ? 0 : Math.round((rate * 2 - 0.6) * 100)
  };
}
