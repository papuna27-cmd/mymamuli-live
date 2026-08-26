/**
 * ელფოსტის რენდერი და გაგზავნა
 * ------------------------------------------------------------------
 * HTML შაბლონები _templates.js-შია, დიზაინიდან მიღებული სახით.
 * აქ მხოლოდ ცვლადების ჩასმა და Resend-ით გაგზავნა ხდება.
 */
import * as T from './_templates.js';
import { trackedLink } from './r.js';

const SITE = 'https://mymamuli.ge';
const num = n => new Intl.NumberFormat('ka-GE').format(Math.round(Number(n) || 0));
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ცვლადების ჩასმა — უცნობი {{x}} იშლება, რომ წერილში არ გამოჩნდეს */
function fill(html, vars) {
  return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) =>
    vars[k] == null ? '' : String(vars[k]));
}

/* digest — ITEM_START…ITEM_END ბლოკი მეორდება ყოველ განცხადებაზე.
   ⚠️ ბმული გამტარზე გადის (/api/r) — ასე ვიგებთ, მაძიებელმა მართლა
   ნახა თუ არა შეთავაზება. იხ. _engage.js. */
function repeatItems(html, items) {
  const m = html.match(/<!--\s*ITEM_START\s*-->([\s\S]*?)<!--\s*ITEM_END\s*-->/);
  if (!m) return html;
  const block = m[1];
  const rows = (items || []).map(i => fill(block, {
    item_title: esc(i.title),
    item_location: esc(i.loc),
    item_price: '$' + num(i.price),
    item_area: num(i.area) + ' მ²',
    item_image_url: i.photo || `${SITE}/img/land-1.jpg`,
    item_url: i.link || SITE
  })).join('');
  return html.replace(m[0], rows);
}

const SUBJ = {
  verify:   'MyMamuli.ge — დადასტურების კოდი',
  approved: '✓ შენი განცხადება გამოქვეყნდა',
  rejected: 'შენი განცხადება საჭიროებს გასწორებას',
  digest:   d => `${(d.items || []).length} ახალი შეთავაზება შენს არეალში`,
  expiring: 'შენი განცხადება 3 დღეში იხურება',
  review:   'როგორ იყო შენი გამოცდილება?',
  admin_new: d => `🆕 ახალი ${d.kind === 'req' ? 'მოთხოვნა' : 'განცხადება'} — MyMamuli.ge`
};

/**
 * render(kind, data) → {subject, html}
 * kind: verify | approved | rejected | digest | expiring | review
 */
export function render(kind, d = {}) {
  const tpl = T[kind];
  if (!tpl) return null;

  const unsub = `${SITE}/unsub?e=${encodeURIComponent(d.email || '')}`;
  const link  = d.link || SITE;

  /* საერთო ცვლადები */
  const vars = {
    site_url: SITE,
    unsubscribe_url: unsub,

    /* კოდი */
    verification_code: esc(d.code),

    /* განცხადება */
    listing_title:     esc(d.title),
    listing_location:  esc(d.loc),
    listing_price:     d.price != null ? '$' + num(d.price) : '',
    listing_image_url: d.photo || `${SITE}/img/land-1.jpg`,
    listing_url:       link,
    close_listing_url: d.closeLink  || `${SITE}/close/${d.id || ''}`,
    renew_listing_url: d.renewLink  || `${SITE}/renew/${d.id || ''}`,
    edit_listing_url:  d.editLink   || `${SITE}/#post`,
    expiration_date:   esc(d.expDate),
    rejection_reason:  esc(d.reason),

    /* გაზიარება */
    share_facebook_url: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link),
    share_whatsapp_url: 'https://wa.me/?text=' + encodeURIComponent((d.title || '') + ' ' + link),

    /* დამთხვევები */
    matches_count:   (d.items || []).length,
    search_summary:  esc(d.summary),
    all_matches_url: d.allLink   || `${SITE}/?req=${d.reqId || ''}`,
    pause_search_url: d.pauseLink || `${SITE}/req/${d.reqId || ''}/pause`,

    /* შეფასება */
    google_review_url:   d.googleReview   || 'https://g.page/r/mymamuli/review',
    facebook_review_url: d.facebookReview || 'https://www.facebook.com/mymamuli.ge/reviews',

    /* ადმინის შიდა ცნობა ახალ ჩანაწერზე */
    admin_kind_label: d.kind === 'req' ? 'მოთხოვნა' : 'განცხადება',
    admin_summary:    esc(d.summary),
    admin_user_email: esc(d.userEmail),
    admin_mod_url:    d.modLink || `${SITE}/mod.html`,
    /* ღილაკი მხოლოდ მაშინ, თუ ტოკენი გენერირდა (ADMIN_KEY დაყენებულია) —
       თორემ დაუდასტურებელი ბმული უფრო აზიანებს, ვიდრე არაფერი */
    admin_approve_button: d.approveUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#0F6B4F" style="border-radius:12px;"><a href="${esc(d.approveUrl)}" style="display:inline-block;padding:15px 24px;color:#FFFFFF;text-decoration:none;font-size:16px;line-height:20px;font-weight:700;">✓ დადასტურება ერთი კლიკით →</a></td></tr></table>`
      : ''
  };

  let html = tpl;
  if (kind === 'digest') html = repeatItems(html, d.items);
  html = fill(html, vars);

  const s = SUBJ[kind];
  return { subject: typeof s === 'function' ? s(d) : s, html };
}

/**
 * flushMailQueue(env) — რიგში მდგარი წერილების გაგზავნა.
 * ------------------------------------------------------------------
 * ⚠️ ეს მანამდე /api/mail-ის onRequestPost-ში იყო, და kickMail() ყველგან
 * (auth.js, submit.js, mod.js) საკუთარ თავზე HTTP-ით მიმართავდა
 * (self-fetch, x-admin-key header-ით). ეს მუშაობდა, მაგრამ არასტაბილურად —
 * ერთხელ დაფიქსირდა 31-წამიანი დაგვიანება ჩვეულებრივი <1წმ-ის მაგივრად,
 * სავარაუდოდ თვითონ-საკუთარ-თავზე fetch-ის queueing/race-ის გამო.
 * ახლა იგივე ლოგიკა პირდაპირ, ფუნქციის გამოძახებით სრულდება — ქსელური
 * hop საერთოდ არ სჭირდება, ამიტომ სწრაფიც არის და საიმედოც. */
export async function flushMailQueue(env, limit = 40) {
  if (!env.DB) return { sent: 0, failed: 0, left: 0, error: 'no-db' };
  if (!env.RESEND_KEY) return { sent: 0, failed: 0, left: 0, error: 'no-resend-key' };

  const rows = await env.DB.prepare(
    `SELECT * FROM mailq WHERE status='queued' ORDER BY id ASC LIMIT ?1`
  ).bind(limit).all();

  let sent = 0, failed = 0;
  for (const m of rows.results || []) {
    let data = {};
    try { data = JSON.parse(m.payload || '{}') } catch (_) {}
    data.email = m.to_addr;

    /* ── დამთხვევების წერილი: ბმულებს გამტარზე ვატარებთ ──
       ასე ვიგებთ, მაძიებელმა რომელი შეთავაზება გახსნა. ეს ერთადერთი
       სანდო სიგნალია — წერილის „გახსნა" ამას ვერ გვეუბნება. */
    if (m.kind === 'digest' && data.reqId && Array.isArray(data.items)) {
      for (const it of data.items) {
        const lid = it.id || (String(it.link || '').match(/\/g\/([^/]+)/) || [])[1];
        if (lid) it.link = await trackedLink(env, data.reqId, lid);
      }
    }

    /* დაკარგული დეტალები ბაზიდან — შაბლონს სრული ბარათი სჭირდება */
    if ((m.kind === 'approved' || m.kind === 'expiring') && data.id && data.kind === 'lst') {
      const l = await env.DB.prepare(
        `SELECT ttl,loc,reg,price,area,photos FROM lst WHERE id=?1`
      ).bind(data.id).first();
      if (l) {
        let ph = null; try { ph = (JSON.parse(l.photos || '[]') || [])[0] } catch (_) {}
        Object.assign(data, {
          title: l.ttl, loc: [l.loc, l.reg].filter(Boolean).join(', '),
          price: l.price, area: l.area, photo: ph,
          perM2: l.area ? Math.round(l.price / l.area) : null
        });
      }
    }

    const msg = render(m.kind, data);
    if (!msg) {
      await env.DB.prepare(`UPDATE mailq SET status='failed', err=?2 WHERE id=?1`)
        .bind(m.id, 'unknown-template:' + m.kind).run();
      failed++; continue;
    }

    const r = await sendMail(env, m.to_addr, msg);
    if (r.ok) {
      await env.DB.prepare(`UPDATE mailq SET status='sent', sent=?2 WHERE id=?1`)
        .bind(m.id, Date.now()).run();
      sent++;
    } else {
      await env.DB.prepare(`UPDATE mailq SET status='failed', err=?2 WHERE id=?1`)
        .bind(m.id, r.err).run();
      failed++;
    }
  }
  return { sent, failed, left: (rows.results || []).length - sent - failed };
}

/**
 * Resend-ით გაგზავნა. საჭიროა env.RESEND_KEY.
 */
export async function sendMail(env, to, msg) {
  if (!env.RESEND_KEY) return { ok: false, err: 'no-key' };
  if (!msg) return { ok: false, err: 'no-template' };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'MyMamuli.ge <info@mymamuli.ge>',
        reply_to: 'info@mymamuli.ge',
        to: [to],
        subject: msg.subject,
        html: msg.html
      })
    });
    if (!r.ok) return { ok: false, err: 'http-' + r.status + ' ' + (await r.text()).slice(0, 160) };
    const j = await r.json();
    return { ok: true, id: j.id };
  } catch (e) {
    return { ok: false, err: String(e).slice(0, 160) };
  }
}
