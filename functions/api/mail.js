/**
 * /api/mail — წერილების რიგის დამუშავება
 *
 *   GET  /api/mail                  → რიგის მდგომარეობა (ადმინისთვის)
 *   POST /api/mail                  → რიგის გაშვება (გაგზავნა)
 *   GET  /api/mail?preview=approved → შაბლონის ნახვა ბრაუზერში
 *
 * ღამის Worker ამ endpoint-ს ეძახის — `x-admin-key` header-ით.
 * ⚠️ ?key=… აღარ მუშაობს (იხ. _util.js → authed).
 */
import { render, flushMailQueue } from './_mail.js';
import { J, authed, denied } from './_util.js';

/* დემო-მონაცემი შაბლონის სანახავად */
const SAMPLE = {
  verify: { code: '482915', email: 'test@example.com' },
  approved: {
    title: '7 400 მ² სასოფლო-სამეურნეო ნაკვეთი მჭადიჯვარში',
    loc: 'მჭადიჯვარი, დუშეთი, მცხეთა-მთიანეთი', price: 51800, perM2: 7,
    photo: 'https://mymamuli.ge/img/land-1.jpg',
    link: 'https://mymamuli.ge/g/l_demo/', email: 'test@example.com'
  },
  rejected: { reason: 'ფოტო არ შეესაბამება ობიექტს', title: '7 400 მ² ნაკვეთი', email: 'test@example.com' },
  review: { email: 'test@example.com' },
  digest: {
    reqId: 'r_demo', summary: 'ბინა · ვაკე · 100 მ · $80 000-მდე', email: 'test@example.com',
    items: [
      { title: 'ბინა ვაკეში, ინფოროვკას ქუჩაზე', loc: 'ვაკე, თბილისი', price: 78000, area: 98, link: 'https://mymamuli.ge/g/1/', photo: 'https://mymamuli.ge/img/land-2.jpg' },
      { title: 'ახალი აშენებული ბინა', loc: 'ვაკე, თბილისი', price: 72500, area: 92, link: 'https://mymamuli.ge/g/2/', photo: 'https://mymamuli.ge/img/land-3.jpg' },
      { title: 'ბინა პრემიუმ კომპლექსში', loc: 'ვაკე, თბილისი', price: 79900, area: 100, link: 'https://mymamuli.ge/g/3/', photo: 'https://mymamuli.ge/img/land-4.jpg' }
    ]
  },
  expiring: {
    title: '7 400 მ² სასოფლო-სამეურნეო ნაკვეთი მჭადიჯვარში',
    loc: 'მჭადიჯვარი, დუშეთი', price: 51800, perM2: 7,
    photo: 'https://mymamuli.ge/img/land-1.jpg', expDate: '26 ოქტომბერი',
    renewLink: 'https://mymamuli.ge/renew/l_demo', closeLink: 'https://mymamuli.ge/close/l_demo',
    email: 'test@example.com'
  },
  admin_new: {
    kind: 'lst', summary: 'საოფისე ფართი · ვაკე, თბილისი · $95 000 · 70 მ²',
    userEmail: 'test@example.com',
    approveUrl: 'https://mymamuli.ge/api/mod?approve=l_demo&kind=lst&t=demo',
    modLink: 'https://mymamuli.ge/mod.html'
  }
};

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!await authed(request, env)) return denied();

  /* შაბლონის ნახვა ბრაუზერში */
  const p = url.searchParams.get('preview');
  if (p) {
    const msg = render(p, SAMPLE[p] || {});
    if (!msg) return J({ error: 'unknown-template', have: Object.keys(SAMPLE) }, 404);
    return new Response(msg.html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  if (!env.DB) return J({ error: 'no-db' }, 500);
  const q = await env.DB.prepare(
    `SELECT status, COUNT(*) AS n FROM mailq GROUP BY status`
  ).all();
  const last = await env.DB.prepare(
    `SELECT id, kind, to_addr, status, err, created, sent
       FROM mailq ORDER BY id DESC LIMIT 20`
  ).all();
  return J({
    counts: q.results || [],
    recent: last.results || [],
    resend: env.RESEND_KEY ? 'ჩართულია' : 'RESEND_KEY არ არის'
  });
}

/* ---------- რიგის გაშვება ----------
   ლოგიკა თვითონ _mail.js-შია (flushMailQueue) — რომ იმავე ფუნქციამ
   შეძლოს პირდაპირ გამოძახება kickMail()-ებიდანაც (auth.js, submit.js,
   mod.js), ცალკე HTTP self-fetch-ის გარეშე. */
export async function onRequestPost({ request, env }) {
  if (!await authed(request, env)) return denied();
  const r = await flushMailQueue(env);
  if (r.error === 'no-db') return J({ error: 'no-db' }, 500);
  if (r.error === 'no-resend-key') return J({ error: 'no-resend-key' }, 500);
  return J({ ok: true, sent: r.sent, failed: r.failed, left: r.left });
}
